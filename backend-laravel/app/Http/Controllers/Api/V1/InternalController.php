<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\OffreTroc;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Récepteurs /internal/* pour escrow-payment-service.
 * Chaque contrôleur n'accède qu'aux modèles de SON domaine (D2).
 */
class InternalController extends Controller
{
    public function getArticle(string $id): JsonResponse
    {
        $article = Article::query()->select([
            'id', 'utilisateur_id', 'boutique_id', 'titre', 'prix',
            'statut', 'mode_transaction', 'est_trocable', 'stock',
        ])->findOrFail($id);

        return response()->json($article->toArray());
    }

    public function setArticleStatut(Request $request, string $id): JsonResponse
    {
        $statut = $request->validate([
            'statut' => ['required', 'in:'.implode(',', [
                Article::STATUT_DRAFT, Article::STATUT_PUBLISHED,
                Article::STATUT_RESERVED, Article::STATUT_SOLD, Article::STATUT_ARCHIVED,
            ])],
        ])['statut'];

        Article::whereKey($id)->update(['statut' => $statut]);

        return response()->json(['ok' => true, 'article_id' => $id, 'statut' => $statut]);
    }

    public function getUser(string $id): JsonResponse
    {
        $user = User::query()->select(['id', 'nom', 'email', 'telephone'])->findOrFail($id);

        return response()->json($user->toArray());
    }

    public function creditWallet(Request $request, string $id): JsonResponse
    {
        $data = $request->validate(['montant' => ['required', 'numeric', 'min:0']]);
        User::whereKey($id)->increment('solde_portefeuille', (float) $data['montant']);

        return response()->json(['ok' => true, 'user_id' => $id]);
    }

    public function getOffre(string $id): JsonResponse
    {
        $offre = OffreTroc::query()->select([
            'id', 'acheteur_id', 'vendeur_id', 'article_cible_id', 'statut',
            'montant_soulte_fcfa', 'montant_contre_offre_fcfa',
        ])->findOrFail($id);

        return response()->json($offre->toArray());
    }

    public function completeOffre(string $id): JsonResponse
    {
        OffreTroc::whereKey($id)->update(['statut' => OffreTroc::STATUT_COMPLETED]);

        return response()->json(['ok' => true, 'offre_id' => $id]);
    }
}
