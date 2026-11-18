<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\InitPaymentRequest;
use App\Models\Article;
use App\Models\OffreTroc;
use App\Models\Transaction;
use App\Services\BrevoNotificationService;
use App\Services\GeniusPayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * /payments — initiation de paiement GeniusPay (achat direct ou soulte de troc).
 */
class PaymentController extends Controller
{
    public function __construct(
        private readonly GeniusPayService $geniusPay,
        private readonly BrevoNotificationService $notifications,
    ) {
    }

    /**
     * POST /api/v1/payments/geniuspay/init — ouvre une session GeniusPay.
     * type=achat : montant = prix actuel (flash) de l'article (+ frais d'escrow 3%).
     * type=troc_mixte : montant = soulte effective de l'offre acceptée/contre-proposée.
     */
    public function init(InitPaymentRequest $request): JsonResponse
    {
        $type = $request->validated('type');
        $user = $request->user();

        if ($type === 'achat') {
            $article = Article::with('boutique')->findOrFail($request->validated('article_id'));

            if ($article->statut !== Article::STATUT_PUBLISHED) {
                return response()->json(['message' => 'Cet article n’est plus disponible (statut : '.$article->statut.').'], 409);
            }

            if ($article->utilisateur_id === $user->id) {
                return response()->json(['message' => 'Vous ne pouvez pas acheter votre propre article.'], 422);
            }

            $montant = (float) $article->prix_actuel;
            $frais = $this->geniusPay->fraisEscrow($montant);

            $transaction = Transaction::create([
                'acheteur_id' => $user->id,
                'vendeur_id' => $article->utilisateur_id,
                'article_id' => $article->id,
                'boutique_id' => $article->boutique_id,
                'type' => Transaction::TYPE_ACHAT,
                'montant' => $montant,
                'frais_escrow' => $frais,
                'escrow_status' => Transaction::ESCROW_INITIATED,
            ]);

            $reference = 'DJASSA-ACHAT-'.$transaction->id;
        } else { // troc_mixte
            $offre = OffreTroc::with('articleCible')->findOrFail($request->validated('offre_troc_id'));

            if ($offre->acheteur_id !== $user->id) {
                return response()->json(['message' => 'Seul l’auteur de la proposition peut régler la soulte.'], 403);
            }

            if (! in_array($offre->statut, [OffreTroc::STATUT_ACCEPTED, OffreTroc::STATUT_COUNTERED], true)) {
                return response()->json(['message' => 'La soulte n’est payable que sur une offre acceptée (statut : '.$offre->statut.').'], 409);
            }

            // Réutilise la transaction initiée à l'acceptation, sinon la crée
            $transaction = Transaction::where('offre_troc_id', $offre->id)
                ->whereIn('escrow_status', [Transaction::ESCROW_INITIATED])
                ->first();

            if (! $transaction) {
                $soulte = (float) ($offre->montant_contre_offre_fcfa ?? $offre->montant_soulte_fcfa);

                $transaction = Transaction::create([
                    'acheteur_id' => $offre->acheteur_id,
                    'vendeur_id' => $offre->vendeur_id,
                    'article_id' => $offre->article_cible_id,
                    'offre_troc_id' => $offre->id,
                    'boutique_id' => $offre->articleCible?->boutique_id,
                    'type' => Transaction::TYPE_TROC_MIXTE,
                    'montant' => $soulte,
                    'frais_escrow' => 0,
                    'escrow_status' => Transaction::ESCROW_INITIATED,
                ]);
            }

            $reference = 'DJASSA-SOULTE-'.$transaction->id;
        }

        try {
            $session = $this->geniusPay->initiate((float) $transaction->montant, $reference, [
                'type' => $type,
                'transaction_id' => $transaction->id,
                'description' => $type === 'achat' ? 'Achat article Djassa Online' : 'Soulte troc mixte Djassa Online',
                'customer' => array_filter(['name' => $user->nom, 'email' => $user->email, 'phone' => $user->telephone]),
            ]);
        } catch (RuntimeException $e) {
            $transaction->update(['escrow_status' => Transaction::ESCROW_FAILED]);

            return response()->json(['message' => $e->getMessage()], 502);
        }

        $transaction->update(['geniuspay_ref' => $session['geniuspay_ref']]);

        Log::info('[Payments] Session GeniusPay initialisée', ['transaction_id' => $transaction->id, 'ref' => $session['geniuspay_ref'], 'mock' => $session['mock']]);

        return response()->json([
            'transaction_id' => $transaction->id,
            'geniuspay_ref' => $session['geniuspay_ref'],
            'payment_url' => $session['payment_url'],
            'mock' => $session['mock'],
            'montant' => (string) $transaction->montant,
            'frais_escrow' => (string) $transaction->frais_escrow,
            'total' => (string) ((float) $transaction->montant + (float) $transaction->frais_escrow),
        ]);
    }
}
