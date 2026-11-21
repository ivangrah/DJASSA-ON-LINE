<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * GeniusPay — agrégateur Mobile Money (Wave, Orange Money, MTN, Moov) & cartes.
 *
 * Responsabilités (TRD §5.2) :
 *  - initialisation de session de paiement (checkout) avec référence unique ;
 *  - vérification de signature HMAC-SHA256 des webhooks (X-GeniusPay-Signature) ;
 *  - libération des fonds séquestrés vers le portefeuille vendeur (release) ;
 *  - remboursement (refund).
 *
 * Mode MOCK : si GENIUSPAY_API_KEY est absente, le service fonctionne en mode
 * démo déterministe — la référence est générée localement et le frontend simule
 * le webhook. Jamais en production.
 */
class GeniusPayService
{
    /**
     * B5 : le mode mock n'existe qu'en développement/test et jamais en production,
     * même si les clés GeniusPay sont absentes de la configuration.
     */
    public function isMock(): bool
    {
        if (! in_array(config('app.env'), ['local', 'testing'], true)) {
            return false;
        }

        return empty(config('services.geniuspay.api_key'));
    }

    /**
     * Calcule les frais Djassa (séquestre) sur un montant FCFA.
     */
    public function fraisEscrow(float $montant): float
    {
        $pct = max(0, (float) config('services.geniuspay.frais_escrow_pct', 3));

        return round($montant * $pct / 100, 2);
    }

    /**
     * Initialise une session de paiement GeniusPay.
     *
     * @return array{geniuspay_ref: string, payment_url: string, mock: bool}
     *
     * @throws RuntimeException en cas d'indisponibilité du service (clé configurée mais API KO)
     */
    public function initiate(float $montant, string $referenceLocale, array $meta = []): array
    {
        if ($this->isMock()) {
            $ref = 'GP-FAKE-'.strtoupper(bin2hex(random_bytes(4)));

            Log::info('[GeniusPay:MOCK] Session de paiement initialisée', ['reference' => $ref, 'montant' => $montant]);

            return [
                'geniuspay_ref' => $ref,
                'payment_url' => rtrim(config('app.url'), '/').'/dev/fake-checkout/'.$ref,
                'mock' => true,
            ];
        }

        try {
            $response = Http::baseUrl(config('services.geniuspay.base_url'))
                ->withToken(config('services.geniuspay.api_key'))
                ->withHeaders(['X-Api-Secret' => config('services.geniuspay.api_secret')])
                ->acceptJson()
                ->timeout(15)
                ->post('/payments', [
                    'amount' => (int) round($montant),
                    'currency' => 'XOF',
                    'reference' => $referenceLocale,
                    'description' => $meta['description'] ?? 'Paiement Djassa Online',
                    'callback_url' => rtrim(config('app.url'), '/').'/api/v1/webhooks/geniuspay',
                    'customer' => $meta['customer'] ?? [],
                    'metadata' => $meta,
                ]);
        } catch (ConnectionException $e) {
            Log::error('[GeniusPay] Indisponible', ['error' => $e->getMessage()]);

            throw new RuntimeException('Le service de paiement GeniusPay est momentanément indisponible. Réessayez dans quelques instants.');
        }

        if (! $response->successful()) {
            Log::error('[GeniusPay] Échec initialisation', ['status' => $response->status(), 'body' => $response->body()]);

            throw new RuntimeException('GeniusPay a refusé l’initialisation du paiement (HTTP '.$response->status().').');
        }

        $body = $response->json();

        return [
            'geniuspay_ref' => (string) ($body['reference'] ?? $body['id'] ?? $referenceLocale),
            'payment_url' => (string) ($body['payment_url'] ?? $body['checkout_url'] ?? ''),
            'mock' => false,
        ];
    }

    /**
     * Vérifie la signature HMAC-SHA256 d'un webhook GeniusPay.
     */
    public function verifyWebhookSignature(string $rawBody, ?string $signature): bool
    {
        $secret = config('services.geniuspay.webhook_secret');

        if (empty($secret)) {
            // B5 : toléré uniquement en mode MOCK local ; refus strict partout ailleurs.
            if ($this->isMock()) {
                Log::warning('[GeniusPay] webhook_secret non configuré — mode MOCK, signature non vérifiée');

                return true;
            }

            Log::error('[GeniusPay] webhook_secret absent — signature refusée');

            return false;
        }

        if (empty($signature)) {
            return false;
        }

        $computed = hash_hmac('sha256', $rawBody, $secret);

        return hash_equals($computed, $signature);
    }

    /**
     * Libère les fonds séquestrés vers le portefeuille du vendeur.
     * Idempotent côté GeniusPay via `reference` (déjà libéré → 200).
     */
    public function releaseFunds(string $geniuspayRef): bool
    {
        if ($this->isMock()) {
            Log::info('[GeniusPay:MOCK] Fonds libérés', ['reference' => $geniuspayRef]);

            return true;
        }

        try {
            $response = Http::baseUrl(config('services.geniuspay.base_url'))
                ->withToken(config('services.geniuspay.api_key'))
                ->withHeaders(['X-Api-Secret' => config('services.geniuspay.api_secret')])
                ->acceptJson()
                ->timeout(15)
                ->post('/payments/'.urlencode($geniuspayRef).'/release');

            return $response->successful();
        } catch (ConnectionException $e) {
            Log::error('[GeniusPay] Échec release', ['reference' => $geniuspayRef, 'error' => $e->getMessage()]);

            return false; // la transaction reste `held` — nouvelle tentative possible
        }
    }
}
