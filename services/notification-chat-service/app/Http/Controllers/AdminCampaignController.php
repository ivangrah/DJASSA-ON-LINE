<?php
namespace App\Http\Controllers;

use App\Services\RedisQueue;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Centre de notifications & campagnes email (admin) — file Redis asynchrone. */
class AdminCampaignController extends Controller
{
    public function __construct(private readonly RedisQueue $queue) {}

    /** Envoi ciblé ou global via la file de jobs (règle 17). */
    public function broadcast(Request $request): JsonResponse
    {
        abort_unless((string) $request->header('X-User-Role', '') === 'admin', 403);
        $data = $request->validate([
            'audience' => ['required', 'in:all,vendeur_pro,particulier,user'],
            'user_id' => ['required_if:audience,user', 'nullable', 'uuid'],
            'titre' => ['required', 'string', 'max:150'],
            'corps' => ['required', 'string', 'max:4000'],
            'email' => ['sometimes', 'boolean'],
        ]);

        $payload = [
            'audience' => $data['audience'],
            'user_id' => $data['user_id'] ?? null,
            'titre' => $data['titre'],
            'corps' => $data['corps'],
            'email' => (bool) ($data['email'] ?? false),
            'requested_by' => (string) $request->header('X-User-Id', ''),
        ];
        $queued = $this->queue->push('admin.campaign', $payload);

        return response()->json([
            'queued' => $queued,
            'message' => $queued ? 'Campagne mise en file d’attente.' : 'File Redis indisponible.',
        ], $queued ? 202 : 503);
    }
}
