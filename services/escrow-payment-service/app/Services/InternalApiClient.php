<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Client des appels internes signés (D3) — réseau Docker privé + header HMAC.
 * Remplace les écritures directes dans les autres domaines (Phase 2, §4).
 */
class InternalApiClient
{
    public function __construct(
        private readonly string $baseUrl,
        private readonly ?string $signingKey,
    ) {
    }

    private function request(string $method, string $path, array $payload = []): array
    {
        if (empty($this->signingKey)) {
            throw new RuntimeException('DJASSA_INTERNAL_SIGNING_KEY manquante.');
        }

        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $signature = hash_hmac("sha256", strtoupper($method)."\n/internal".$path."\n".$body, $this->signingKey);

        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
            'X-Djassa-Signature' => $signature,
        ])->withBody($body, 'application/json')
            ->timeout(10)
            ->{$method}(rtrim($this->baseUrl, '/').$path);

        if ($response->failed()) {
            throw new RuntimeException("Appel interne $method $path échoué ({$response->status()}).");
        }

        return $response->json() ?? [];
    }

    /** Auth : profil acheteur (e-mail, nom) pour l'e-mail PIN — jamais le PIN. */
    public function getUser(string $userId): array
    {
        return $this->request('get', '/auth/users/'.$userId);
    }

    /** Troc : détails d'une offre pour une soulte mixte. */
    public function getOffre(string $offreId): array
    {
        return $this->request('get', '/troc/offres/'.$offreId);
    }

    /** Catalogue : récupère prix et vendeur d'un article sans accéder à sa base. */
    public function getArticle(string $articleId): array
    {
        return $this->request('get', '/catalog/articles/'.$articleId);
    }

    /** Catalogue : statut d'un article après libération du séquestre. */
    public function setArticleStatut(string $articleId, string $statut): array
    {
        return $this->request('post', '/catalog/articles/'.$articleId.'/statut', ['statut' => $statut]);
    }

    /** Auth : crédit du portefeuille vendeur. */
    public function creditWallet(string $userId, float $montant): array
    {
        return $this->request('post', '/auth/users/'.$userId.'/wallet/credit', ['montant' => $montant]);
    }

    /** Troc : clôture d'une offre après troc mixte payé. */
    public function completeOffre(string $offreId): array
    {
        return $this->request('post', '/troc/offres/'.$offreId.'/complete');
    }
}
