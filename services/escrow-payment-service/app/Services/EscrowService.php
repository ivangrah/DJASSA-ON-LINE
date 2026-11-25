<?php

namespace App\Services;

use App\Models\Transaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use RuntimeException;

/**
 * Séquestre & PIN — aucun accès direct aux modèles des autres domaines (Phase 2 §4).
 * Les effets cross-domaines passent par InternalApiClient (HTTP signé) et
 * RedisStreamPublisher (événements), avec le PIN jamais exposé hors du service.
 */
class EscrowService
{
    public function __construct(
        private readonly GeniusPayService $geniusPay,
        private readonly InternalApiClient $internal,
        private readonly RedisStreamPublisher $events,
    ) {
    }

    public function genererPin(): string
    {
        return str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT);
    }

    /** Hachage bcrypt + pepper serveur (jamais de PIN en clair en base). */
    private function hashPin(string $pin): string
    {
        $pepper = (string) config('services.security.pin_pepper', '');

        return Hash::make($pin.$pepper);
    }

    /**
     * Vérification avec pepper ; repli sur le hash historique sans pepper pour ne pas
     * invalider les transactions déjà en séquestre lors du déploiement du pepper.
     */
    private function checkPin(string $pin, string $hash): bool
    {
        $pepper = (string) config('services.security.pin_pepper', '');
        if ($pepper !== '' && Hash::check($pin.$pepper, $hash)) {
            return true;
        }

        return Hash::check($pin, $hash);
    }

    /** Clé de limitation par IP : jamais l'IP en clair dans la clé de cache. */
    private function ipThrottleKey(?string $ip): ?string
    {
        return $ip === null ? null : 'pin-verify|'.hash('sha256', $ip);
    }

    /** initiated → held ; génère le PIN haché. Retourne le PIN en clair UNE seule fois. */
    public function marquerHeld(Transaction $transaction): ?string
    {
        if ($transaction->escrow_status === Transaction::ESCROW_HELD) {
            return null;
        }
        if ($transaction->escrow_status !== Transaction::ESCROW_INITIATED) {
            throw new RuntimeException('État incompatible avec la retenue des fonds ('.$transaction->escrow_status.').');
        }

        $pin = $this->genererPin();
        $transaction->update([
            'escrow_status' => Transaction::ESCROW_HELD,
            'pin_hash' => $this->hashPin($pin),
            'pin_attempts' => 0,
            'held_at' => now(),
        ]);

        if ($transaction->article_id) {
            $this->internal->setArticleStatut($transaction->article_id, 'reserved');
        }

        // Le PIN n'est PAS publié : il reste confiné dans ce service (D4).
        $this->events->publish('escrow.held', [
            'transaction_id' => $transaction->id,
            'reference' => $transaction->geniuspay_ref,
            'montant' => (string) $transaction->montant,
            'user_id' => $transaction->acheteur_id,
            'acheteur_id' => $transaction->acheteur_id,
            'vendeur_id' => $transaction->vendeur_id,
        ]);

        return $pin;
    }

    /** Vérifie le PIN du vendeur et libère les fonds. $ip est optionnelle (appels internes signés). */
    public function verifierPin(Transaction $transaction, string $vendeurId, string $pin, ?string $ip = null): Transaction
    {
        $throttleKey = $this->ipThrottleKey($ip);
        if ($throttleKey !== null && RateLimiter::tooManyAttempts($throttleKey, (int) config('services.security.pin_ip_attempts', 5))) {
            throw new RuntimeException('Trop de tentatives de PIN depuis cette adresse. Réessayez plus tard.', 429);
        }

        return DB::transaction(function () use ($transaction, $vendeurId, $pin, $throttleKey): Transaction {
            /** @var Transaction $tx */
            $tx = Transaction::query()->lockForUpdate()->findOrFail($transaction->id);

            if ($tx->vendeur_id !== $vendeurId) {
                throw new RuntimeException('Seul le vendeur de la transaction peut valider le code PIN.');
            }
            if ($tx->escrow_status === Transaction::ESCROW_RELEASED) {
                return $tx; // idempotent
            }
            if ($tx->escrow_status !== Transaction::ESCROW_HELD) {
                throw new RuntimeException('Les fonds ne sont pas bloqués (statut : '.$tx->escrow_status.').');
            }
            if ($tx->pin_attempts >= Transaction::PIN_MAX_TENTATIVES) {
                throw new RuntimeException('Code PIN bloqué après 5 tentatives erronées.', 423);
            }
            if (! $tx->pin_hash || ! $this->checkPin($pin, $tx->pin_hash)) {
                $tx->increment('pin_attempts');
                if ($throttleKey !== null) {
                    RateLimiter::hit($throttleKey, (int) config('services.security.pin_ip_decay_seconds', 900));
                }
                $tentatives = $tx->refresh()->pin_attempts;
                throw new RuntimeException(sprintf('Code PIN incorrect (%d/%d tentatives).', $tentatives, Transaction::PIN_MAX_TENTATIVES));
            }

            if (! $this->geniusPay->releaseFunds($tx->geniuspay_ref ?? ('LOCAL-'.$tx->id))) {
                throw new RuntimeException('GeniusPay n’a pas confirmé la libération des fonds.');
            }

            $tx->update(['escrow_status' => Transaction::ESCROW_RELEASED, 'released_at' => now()]);

            // Effets cross-domaines : API interne signée + événements, jamais d'écriture directe.
            $this->internal->creditWallet($tx->vendeur_id, (float) $tx->montant);
            if ($tx->article_id) {
                $this->internal->setArticleStatut($tx->article_id, 'sold');
            }
            if ($tx->offre_troc_id) {
                $this->internal->completeOffre($tx->offre_troc_id);
            }
            $this->events->publish('escrow.released', [
                'transaction_id' => $tx->id,
                'vendeur_id' => $tx->vendeur_id,
                'montant' => (string) $tx->montant,
                'article_id' => $tx->article_id,
                'offre_troc_id' => $tx->offre_troc_id,
                'user_id' => $tx->vendeur_id,
                'acheteur_id' => $tx->acheteur_id,
                'vendeur_id' => $tx->vendeur_id,
            ]);

            return $tx->refresh();
        });
    }

    public function marquerEchec(Transaction $transaction): Transaction
    {
        $transaction->update(['escrow_status' => Transaction::ESCROW_FAILED]);
        $this->events->publish('payment.failed', [
            'transaction_id' => $transaction->id,
            'reference' => $transaction->geniuspay_ref,
            'user_id' => $transaction->acheteur_id,
            'acheteur_id' => $transaction->acheteur_id,
            'vendeur_id' => $transaction->vendeur_id,
        ]);

        return $transaction->refresh();
    }
}
