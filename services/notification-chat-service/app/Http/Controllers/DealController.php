<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Deal;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DealController extends Controller
{
    /** Notifie l'autre partie (canal in_app, repris par la liste /notifications). */
    private function notify(string $userId, string $titre, string $corps, string $reference): void
    {
        Notification::create([
            'user_id' => $userId,
            'type' => 'deal',
            'titre' => $titre,
            'corps' => $corps,
            'canal' => 'in_app',
            'source_reference' => $reference,
        ]);
    }

    /** Liste les deals d'une conversation (participants uniquement). */
    public function index(Request $request): JsonResponse
    {
        $id = $this->userId($request);
        $conversationId = (string) $request->query('conversation_id', '');
        abort_unless($conversationId !== '', 422, 'conversation_id requis.');
        $conversation = Conversation::findOrFail($conversationId);
        abort_unless($conversation->hasParticipant($id), 403, 'Accès refusé à cette conversation.');

        $deals = Deal::query()
            ->select(['id', 'conversation_id', 'article_id', 'propose_par', 'montant_fcfa', 'lieu_remise', 'statut', 'created_at', 'updated_at'])
            ->where('conversation_id', $conversationId)
            ->latest()->paginate(20);

        return response()->json([
            'data' => $deals->items(),
            'meta' => ['current_page' => $deals->currentPage(), 'last_page' => $deals->lastPage(), 'total' => $deals->total()],
        ]);
    }

    /** Une partie propose un prix + lieu de remise. */
    public function store(Request $request): JsonResponse
    {
        $id = $this->userId($request);
        $data = $request->validate([
            'conversation_id' => ['required', 'uuid'],
            'article_id' => ['nullable', 'uuid'],
            'montant_fcfa' => ['required', 'numeric', 'min:0'],
            'lieu_remise' => ['required', 'string', 'max:255'],
        ]);
        $conversation = Conversation::findOrFail($data['conversation_id']);
        abort_unless($conversation->hasParticipant($id), 403, 'Accès refusé à cette conversation.');

        $data['propose_par'] = $id;
        $data['statut'] = Deal::STATUT_PROPOSED;
        $deal = Deal::create($data);
        $conversation->update(['dernier_message_at' => now()]);

        $destinataire = $conversation->participant_1 === $id ? $conversation->participant_2 : $conversation->participant_1;
        $this->notify($destinataire, 'Nouvelle proposition de deal', 'Prix et lieu de remise proposés.', $deal->id);

        return response()->json(['data' => $deal], 201);
    }

    /** Accepter, refuser ou contre-proposer (l'autre partie uniquement). */
    public function respond(Request $request, Deal $deal): JsonResponse
    {
        $id = $this->userId($request);
        $conversation = Conversation::findOrFail($deal->conversation_id);
        abort_unless($conversation->hasParticipant($id), 403, 'Accès refusé à cette conversation.');
        abort_unless($deal->propose_par !== $id, 422, 'Vous ne pouvez pas répondre à votre propre proposition.');
        abort_unless($deal->estActif(), 422, 'Ce deal n’est plus actif.');

        $data = $request->validate([
            'action' => ['required', 'in:accept,reject,counter'],
            'montant_fcfa' => ['required_if:action,counter', 'numeric', 'min:0'],
            'lieu_remise' => ['required_if:action,counter', 'string', 'max:255'],
        ]);

        return DB::transaction(function () use ($deal, $id, $data, $conversation): JsonResponse {
            $action = $data['action'];
            if ($action === 'counter') {
                $deal->update([
                    'montant_fcfa' => $data['montant_fcfa'],
                    'lieu_remise' => $data['lieu_remise'],
                    'propose_par' => $id,
                    'statut' => Deal::STATUT_COUNTERED,
                ]);
            } else {
                $deal->update(['statut' => $action === 'accept' ? Deal::STATUT_ACCEPTED : Deal::STATUT_REJECTED]);
            }

            $conversation->update(['dernier_message_at' => now()]);
            $destinataire = $conversation->participant_1 === $id ? $conversation->participant_2 : $conversation->participant_1;
            $titres = ['accept' => 'Deal accepté', 'reject' => 'Deal refusé', 'counter' => 'Contre-proposition de deal'];
            $this->notify($destinataire, $titres[$action], 'Le statut du deal a évolué.', $deal->id);

            return response()->json(['data' => $deal->refresh()]);
        });
    }

    private function userId(Request $request): string
    {
        $id = (string) $request->header('X-User-Id', '');
        abort_unless($id !== '', 401);

        return $id;
    }
}
