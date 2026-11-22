<?php
namespace App\Http\Controllers;

use App\Models\AdminCampaign;
use App\Services\CampaignTargetService;
use App\Services\RedisQueue;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/** Centre de notifications & campagnes email (admin) — file Redis asynchrone. */
class AdminCampaignController extends Controller
{
    public function __construct(private readonly RedisQueue $queue, private readonly CampaignTargetService $targets) {}

    /** Historique paginé des campagnes admin. */
    public function index(Request $request): JsonResponse
    {
        abort_unless((string) $request->header('X-User-Role', '') === 'admin', 403);
        $page = AdminCampaign::query()
            ->select(['id','titre','message','audience','target_user_id','priorite','send_email','destinataires_count','statut','created_at'])
            ->latest()->paginate(20);
        return response()->json(['data' => $page->items(), 'meta' => [
            'current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'total' => $page->total(),
        ]]);
    }

    /** Estime le nombre de destinataires avant envoi. */
    public function estimate(Request $request): JsonResponse
    {
        abort_unless((string) $request->header('X-User-Role', '') === 'admin', 403);
        $data = $request->validate([
            'audience' => ['required', 'in:all,vendeur_pro,particulier,user'],
            'user_id' => ['required_if:audience,user', 'nullable', 'string', 'max:255'],
        ]);
        $count = $this->targets->count($data['audience'], $data['user_id'] ?? null);
        return response()->json(['count' => $count]);
    }

    /** Envoi ciblé ou global via la file de jobs (règle 17) + persistance historique. */
    public function broadcast(Request $request): JsonResponse
    {
        abort_unless((string) $request->header('X-User-Role', '') === 'admin', 403);
        $data = $request->validate([
            'audience' => ['required', 'in:all,vendeur_pro,particulier,user'],
            'user_id' => ['required_if:audience,user', 'nullable', 'string', 'max:255'],
            'titre' => ['required', 'string', 'max:150'],
            'corps' => ['required', 'string', 'max:4000'],
            'email' => ['sometimes', 'boolean'],
            'priorite' => ['sometimes', 'in:info,warning,urgent'],
            'confirm_mass' => ['sometimes', 'boolean'],
        ]);

        $destinataires = $this->targets->count($data['audience'], $data['user_id'] ?? null);
        if ($data['audience'] === 'all' && !($data['confirm_mass'] ?? false)) {
            return response()->json([
                'message' => 'Confirmation requise pour un envoi à tous les utilisateurs.',
                'requires_confirmation' => true,
                'destinataires_count' => $destinataires,
            ], 422);
        }

        $campaign = AdminCampaign::create([
            'id' => (string) Str::uuid(),
            'titre' => $data['titre'],
            'message' => $data['corps'],
            'audience' => $data['audience'],
            'target_user_id' => $data['user_id'] ?? null,
            'priorite' => $data['priorite'] ?? 'info',
            'send_email' => (bool) ($data['email'] ?? false),
            'destinataires_count' => $destinataires,
            'statut' => 'queued',
            'requested_by' => (string) $request->header('X-User-Id', '') ?: null,
        ]);

        $queued = $this->queue->push('admin.campaign', [
            'campaign_id' => $campaign->id,
            'audience' => $campaign->audience,
            'user_id' => $campaign->target_user_id,
            'titre' => $campaign->titre,
            'corps' => $campaign->message,
            'email' => $campaign->send_email,
            'priorite' => $campaign->priorite,
            'requested_by' => $campaign->requested_by,
        ]);

        if (!$queued) {
            $campaign->update(['statut' => 'failed']);
            return response()->json(['queued' => false, 'message' => 'File Redis indisponible.', 'data' => $campaign], 503);
        }

        return response()->json([
            'queued' => true,
            'message' => 'Campagne mise en file d’attente.',
            'destinataires_count' => $destinataires,
            'data' => $campaign,
        ], 202);
    }
}
