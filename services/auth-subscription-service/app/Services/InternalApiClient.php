<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

/** Appels internes signés vers les autres domaines (D3). */
class InternalApiClient
{
    public function __construct(private readonly string $baseUrl, private readonly ?string $signingKey)
    {
    }

    public function request(string $method, string $path, array $payload = []): array
    {
        if (empty($this->signingKey)) {
            throw new RuntimeException('DJASSA_INTERNAL_SIGNING_KEY manquante.');
        }
        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $signature = hash_hmac('sha256', strtoupper($method)."\n/internal".$path."\n".$body, $this->signingKey);

        $response = Http::withHeaders([
            'Content-Type' => 'application/json', 'X-Djassa-Signature' => $signature,
        ])->withBody($body, 'application/json')->connectTimeout(3)->timeout(8)
            ->{$method}(rtrim($this->baseUrl, '/').$path);

        if ($response->failed()) {
            throw new RuntimeException("Appel interne $method $path échoué ({$response->status()}).");
        }

        return $response->json() ?? [];
    }

    /** Checkout d'abonnement : appel direct au service escrow (réseau Docker + HMAC). */
    public function checkoutAbonnement(string $userId, string $reference, float $montant): array
    {
        $path = '/internal/escrow/checkout';
        $body = json_encode([
            'user_id' => $userId, 'reference' => $reference, 'montant' => $montant,
        ], JSON_UNESCAPED_SLASHES);
        $signature = hash_hmac('sha256', 'POST'."\n".$path."\n".$body, $this->signingKey);
        $base = (string) config('services.internal.escrow_url', 'http://escrow-payment-service:8080');

        $response = Http::withHeaders([
            'Content-Type' => 'application/json', 'X-Djassa-Signature' => $signature,
        ])->withBody($body, 'application/json')->connectTimeout(3)->timeout(8)
            ->post(rtrim($base, '/').$path);

        if ($response->failed()) {
            throw new RuntimeException('Checkout escrow échoué ('.$response->status().').');
        }

        return $response->json() ?? [];
    }

    /** Catalogue : boutique d'un vendeur (évite une relation Eloquent cross-base). */
    public function getBoutiqueByUser(string $userId): ?array
    {
        $data = $this->request('get', '/catalog/boutiques/by-user/'.$userId);

        return $data['boutique'] ?? null;
    }
}
