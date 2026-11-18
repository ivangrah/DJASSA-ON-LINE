<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSouhaitRequest;
use App\Http\Resources\SouhaitResource;
use App\Models\Article;
use App\Models\Message;
use App\Models\Souhait;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * /souhaits — Mur des Souhaits, recherche inversée (PRD §3.5, App Flow §1).
 */
class SouhaitController extends Controller
{
    /**
     * GET /api/v1/souhaits — fil public des besoins actifs (filtres : categorie, q, ville).
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Souhait::query()->actifs()->with('utilisateur')->latest();

        if ($category = $request->string('category')->toString()) {
            $query->where('categorie', $category);
        }

        if ($city = $request->string('ville')->toString()) {
            $query->where('ville', $city);
        }

        if ($q = $request->string('q')->toString()) {
            $query->recherche($q);
        }

        return SouhaitResource::collection($query->paginate(min((int) $request->input('per_page', 20), 50)));
    }

    /**
     * GET /api/v1/souhaits/mine — mes souhaits.
     */
    public function mine(Request $request): AnonymousResourceCollection
    {
        return SouhaitResource::collection(
            Souhait::where('utilisateur_id', $request->user()->id)->latest()->paginate(20)
        );
    }

    /**
     * POST /api/v1/souhaits — publier un besoin.
     */
    public function store(StoreSouhaitRequest $request): JsonResponse
    {
        $souhait = Souhait::create($request->validated() + ['utilisateur_id' => $request->user()->id]);

        return SouhaitResource::make($souhait->load('utilisateur'))->response()->setStatusCode(201);
    }

    /**
     * GET /api/v1/souhaits/{souhait} — détail.
     */
    public function show(Request $request, Souhait $souhait): JsonResponse
    {
        DB::table('souhaits')->where('id', $souhait->id)->increment('vues');

        return response()->json(['souhait' => SouhaitResource::make($souhait->fresh()->load('utilisateur'))]);
    }

    /**
     * DELETE /api/v1/souhaits/{souhait} — clôturer son souhait.
     */
    public function destroy(Request $request, Souhait $souhait): JsonResponse
    {
        $this->authorize('delete', $souhait);

        $souhait->update(['statut' => Souhait::STATUT_CLOSED]);

        return response()->json(['message' => 'Souhait clôturé.']);
    }

    /**
     * POST /api/v1/souhaits/{souhait}/respond — proposer un article en réponse à un souhait.
     * Crée un message in-app vers l'auteur du souhait avec la référence de l'article.
     */
    public function respond(Request $request, Souhait $souhait): JsonResponse
    {
        $validated = $request->validate([
            'article_id' => ['required', 'uuid', 'exists:articles,id'],
            'message' => ['nullable', 'string', 'max:1000'],
        ]);

        $article = Article::findOrFail($validated['article_id']);

        if ($article->utilisateur_id !== $request->user()->id) {
            return response()->json(['message' => 'Vous ne pouvez proposer que vos propres articles.'], 403);
        }

        if ($article->statut !== Article::STATUT_PUBLISHED) {
            return response()->json(['message' => 'Cet article n’est pas publié.'], 422);
        }

        Message::create([
            'expediteur_id' => $request->user()->id,
            'destinataire_id' => $souhait->utilisateur_id,
            'article_id' => $article->id,
            'type' => Message::TYPE_TEXTE,
            'contenu' => $validated['message'] ?? 'Votre souhait « '.$souhait->titre.' » — j’ai peut-être ce que vous cherchez : '.$article->titre,
            'payload' => ['source' => 'mur_des_souhaits', 'souhait_id' => $souhait->id, 'article_id' => $article->id, 'prix' => (string) $article->prix],
        ]);

        return response()->json(['message' => 'Votre proposition a été envoyée au souhaiteur.']);
    }
}
