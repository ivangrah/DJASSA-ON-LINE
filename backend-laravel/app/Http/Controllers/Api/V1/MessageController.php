<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMessageRequest;
use App\Http\Resources\MessageResource;
use App\Http\Resources\UserResource;
use App\Models\Article;
use App\Models\Message;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Collection;

/**
 * /messages — chat lié aux annonces (PRD §3.4).
 * Cartes d'actions rapides (offre_prix, carte_troc) transportées dans `payload` JSONB.
 */
class MessageController extends Controller
{
    /**
     * GET /api/v1/messages/conversations — mes conversations (dernier message par fil, article inclus).
     */
    public function conversations(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $messages = Message::where('expediteur_id', $userId)
            ->orWhere('destinataire_id', $userId)
            ->with(['expediteur', 'destinataire', 'article'])
            ->orderByDesc('created_at')
            ->limit(400)
            ->get();

        /** @var Collection $conversations */
        $conversations = $messages
            ->groupBy(fn (Message $m) => implode('|', [
                collect([$m->expediteur_id, $m->destinataire_id])->sort()->implode(':'),
                $m->article_id ?? 'global',
            ]))
            ->map(function (Collection $group) use ($userId) {
                /** @var Message $dernier */
                $dernier = $group->first();
                $autre = $dernier->expediteur_id === $userId ? $dernier->destinataire : $dernier->expediteur;

                return [
                    'with' => UserResource::make($autre),
                    'article' => $dernier->article?->only(['id', 'titre', 'prix', 'images']),
                    'dernier_message' => MessageResource::make($dernier),
                    'non_lus' => $group->where('destinataire_id', $userId)->whereNull('lu_at')->count(),
                ];
            })
            ->values();

        return response()->json(['conversations' => $conversations]);
    }

    /**
     * GET /api/v1/messages?with={userId}&article_id={uuid?} — fil de discussion.
     */
    public function thread(Request $request): AnonymousResourceCollection
    {
        $validated = $request->validate([
            'with' => ['required', 'uuid', 'exists:users,id'],
            'article_id' => ['nullable', 'uuid', 'exists:articles,id'],
        ]);

        $messages = Message::conversation($request->user()->id, $validated['with'], $validated['article_id'] ?? null)
            ->limit(500)
            ->get();

        // Marquer comme lu les messages reçus
        Message::where('expediteur_id', $validated['with'])
            ->where('destinataire_id', $request->user()->id)
            ->when(isset($validated['article_id']), fn ($q) => $q->where('article_id', $validated['article_id']))
            ->whereNull('lu_at')
            ->update(['lu_at' => now()]);

        return MessageResource::collection($messages);
    }

    /**
     * POST /api/v1/messages — envoyer un message (texte ou carte d'action).
     */
    public function store(StoreMessageRequest $request): JsonResponse
    {
        $user = $request->user();

        if ($request->filled('article_id')) {
            $article = Article::find($request->input('article_id'));
            if (! $article) {
                return response()->json(['message' => 'Article introuvable.'], 404);
            }
        }

        $message = Message::create($request->validated() + ['expediteur_id' => $user->id]);

        return MessageResource::make($message->load(['expediteur', 'destinataire']))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * POST /api/v1/messages/{message}/read — marquer un message lu (destinataire).
     */
    public function read(Request $request, Message $message): JsonResponse
    {
        $this->authorize('markRead', $message);

        $message->update(['lu_at' => now()]);

        return response()->json(['message' => 'Message marqué comme lu.']);
    }

    /**
     * GET /api/v1/messages/unread-count — pastille de notification.
     */
    public function unreadCount(Request $request): JsonResponse
    {
        return response()->json([
            'unread' => Message::where('destinataire_id', $request->user()->id)->whereNull('lu_at')->count(),
        ]);
    }
}
