<?php

namespace App\Services;

use App\Models\Article;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * EscrowService — séquestre GeniusPay & Code PIN à 4 chiffres (TRD §5.2 / §7.1).
 *
 * États : initiated → (webhook success) → held → (PIN vendeur) → released
 *                                          └→ (échec paiement) → failed
 * Règles :
 *  - PIN haché bcrypt, jamais persisté en clair ; affiché une seule fois à l'acheteur ;
 *  - 5 tentatives max (pin_attempts ≤ 5 — contrainte CHECK en base) ;
 *  - release = 1 transaction DB : released_at + crédit solde vendeur + statut article.
 */
class EscrowService
{
    public function __construct(
        private readonly GeniusPayService $geniusPay,
    ) {
    }

    public function genererPin(): string
    {
        return str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT);
    }

    /**
     * Bascule une transaction `initiated` → `held` (fonds bloqués) et génère le PIN.
     * Idempotent : si déjà `held`, ne régénère pas le PIN.
     *
     * @return string|null Le PIN en clair (à afficher/envoyer une seule fois), ou null si déjà held.
     */
    public function marquerHeld(Transaction $transaction): ?string
    {
        if ($transaction->escrow_status === Transaction::ESCROW_HELD) {
            return null;
        }

        if ($transaction->escrow_status !== Transaction::ESCROW_INITIATED) {
            throw new RuntimeException('Transaction dans un état incompatible avec la retenue des fonds ('.$transaction->escrow_status.').');
        }

        $pin = $this->genererPin();

        $transaction->update([
            'escrow_status' => Transaction::ESCROW_HELD,
            'pin_hash' => Hash::make($pin),
            'pin_attempts' => 0,
            'held_at' => now(),
        ]);

        // Article réservé pour éviter double vente / double troc
        $article = $transaction->article;
        if ($article && $article->statut === Article::STATUT_PUBLISHED) {
            $article->update(['statut' => Article::STATUT_RESERVED]);
        }

        return $pin;
    }

    /**
     * Vérification du PIN par le vendeur à la remise physique → libération des fonds.
     */
    public function verifierPin(Transaction $transaction, User $vendeur, string $pin): Transaction
    {
        return DB::transaction(function () use ($transaction, $vendeur, $pin) {
            /** @var Transaction $tx */
            $tx = Transaction::lockForUpdate()->findOrFail($transaction->id);

            if ($tx->vendeur_id !== $vendeur->id && ! $vendeur->isAdmin()) {
                throw new RuntimeException('Seul le vendeur de la transaction peut valider le code PIN.');
            }

            if ($tx->escrow_status === Transaction::ESCROW_RELEASED) {
                return $tx; // idempotent
            }

            if ($tx->escrow_status !== Transaction::ESCROW_HELD) {
                throw new RuntimeException('Les fonds ne sont pas bloqués (statut : '.$tx->escrow_status.').');
            }

            if ($tx->pin_attempts >= Transaction::PIN_MAX_TENTATIVES) {
                throw new RuntimeException('Code PIN bloqué après 5 tentatives erronées. Contactez le support Djassa.', 423);
            }

            if (! $tx->pin_hash || ! Hash::check($pin, $tx->pin_hash)) {
                $tx->increment('pin_attempts');
                $attempts = $tx->refresh()->pin_attempts;

                if ($attempts >= Transaction::PIN_MAX_TENTATIVES) {
                    Log::warning('[Escrow] PIN bloqué après 5 tentatives', ['transaction_id' => $tx->id]);
                }

                throw new RuntimeException(sprintf('Code PIN incorrect (%d/%d tentatives).', $attempts, Transaction::PIN_MAX_TENTATIVES));
            }

            // Appel de déblocage chez GeniusPay (mock en local)
            $released = $this->geniusPay->releaseFunds($tx->geniuspay_ref ?? ('LOCAL-'.$tx->id));

            if (! $released) {
                throw new RuntimeException('GeniusPay n’a pas confirmé la libération des fonds. Réessayez ou contactez le support.');
            }

            $tx->update([
                'escrow_status' => Transaction::ESCROW_RELEASED,
                'released_at' => now(),
            ]);

            // Portefeuille vendeur crédité du montant (les frais restent acquis à Djassa)
            User::whereKey($tx->vendeur_id)->increment('solde_portefeuille', (float) $tx->montant);

            // Troc mixte : articles offerts → vendus ; article cible → vendu
            $article = $tx->article;
            if ($article) {
                if ($article->boutique_id && $article->stock > 1) {
                    $article->decrement('stock');
                } else {
                    $article->update(['statut' => Article::STATUT_SOLD, 'stock' => max(0, $article->stock > 1 ? $article->stock - 1 : 0)]);
                }

                if ($article->boutique_id) {
                    $article->boutique?->increment('total_ventes');
                }
            }

            if ($tx->offre_troc_id) {
                $offre = $tx->offreTroc;
                if ($offre && $offre->statut !== \App\Models\OffreTroc::STATUT_COMPLETED) {
                    $offre->update(['statut' => \App\Models\OffreTroc::STATUT_COMPLETED]);
                }
                // Articles offerts par l'acheteur → vendus (transférés au vendeur)
                Article::whereHas('propositionsTroc', fn ($q) => $q->where('offres_troc.id', $tx->offre_troc_id))
                    ->where('statut', Article::STATUT_RESERVED)
                    ->update(['statut' => Article::STATUT_SOLD]);
            }

            return $tx->refresh();
        });
    }

    /**
     * Échec de paiement côté GeniusPay : transaction → failed, article libéré.
     */
    public function marquerEchec(Transaction $transaction): Transaction
    {
        $transaction->update(['escrow_status' => Transaction::ESCROW_FAILED]);

        $article = $transaction->article;
        if ($article && $article->statut === Article::STATUT_RESERVED) {
            $article->update(['statut' => Article::STATUT_PUBLISHED]);
        }

        return $transaction->refresh();
    }
}
