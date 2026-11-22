<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\InitPaymentRequest;
use App\Models\Transaction;
use App\Services\GeniusPayService;
use App\Services\InternalApiClient;
use Illuminate\Http\JsonResponse;

class PaymentController extends Controller
{
    public function __construct(
        private readonly GeniusPayService $geniusPay,
        private readonly InternalApiClient $internal,
    ) {
    }

    public function init(InitPaymentRequest $request): JsonResponse
    {
        $type = $request->validated('type');
        $userId = (string) $request->header('X-User-Id');

        if ($type === Transaction::TYPE_ACHAT) {
            $article = $this->internal->getArticle((string) $request->validated('article_id'));
            if (($article['statut'] ?? 'published') !== 'published') {
                return response()->json(['message' => 'Article indisponible.'], 409);
            }
            $vendeurId = (string) ($article['utilisateur_id'] ?? '');
            if ($vendeurId !== '' && $vendeurId === $userId) {
                return response()->json(['message' => 'Vous ne pouvez pas acheter votre propre article.'], 422);
            }
            $montant = (float) ($article['prix_actuel'] ?? $article['prix'] ?? 0);
            $offreId = null;
            $articleId = (string) $request->validated('article_id');
        } else {
            $offre = $this->internal->getOffre((string) $request->validated('offre_troc_id'));
            if (($offre['acheteur_id'] ?? null) !== $userId) {
                return response()->json(['message' => 'Seul l’auteur de la proposition peut régler la soulte.'], 403);
            }
            $vendeurId = (string) ($offre['vendeur_id'] ?? '');
            $montant = (float) ($offre['montant_contre_offre_fcfa'] ?? $offre['montant_soulte_fcfa'] ?? 0);
            $offreId = (string) $request->validated('offre_troc_id');
            $articleId = (string) ($offre['article_cible_id'] ?? '');
        }

        $transaction = Transaction::create([
            'acheteur_id' => $userId,
            'vendeur_id' => $vendeurId,
            'article_id' => $articleId,
            'offre_troc_id' => $offreId,
            'type' => $type,
            'montant' => $montant,
            'frais_escrow' => $this->geniusPay->fraisEscrow($montant),
            'escrow_status' => Transaction::ESCROW_INITIATED,
        ]);

        $reference = 'DJASSA-'.strtoupper($type).'-'.$transaction->id;
        $session = $this->geniusPay->initiate($montant, $reference, [
            'description' => 'Séquestre Djassa Online',
            'metadata' => ['transaction_id' => $transaction->id],
        ]);
        $transaction->update(['geniuspay_ref' => $session['geniuspay_ref']]);

        return response()->json([
            'payment_url' => $session['payment_url'],
            'montant' => (string) $montant,
            'mock' => $session['mock'],
            'geniuspay_ref' => $session['geniuspay_ref'],
            'transaction_id' => $transaction->id,
        ]);
    }
}
