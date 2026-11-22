<?php
namespace App\Services;
use Illuminate\Support\Facades\Http;
use RuntimeException;
/** Appels internes signés (catalog + escrow) — timeouts 3s/8s (règle 18). */
class InternalApiClient
{
    public function __construct(private readonly ?string $signingKey) {}
    private function call(string $base, string $method, string $path, array $payload = []): array
    {
        if (empty($this->signingKey)) throw new RuntimeException('DJASSA_INTERNAL_SIGNING_KEY manquante.');
        $body = $payload === [] ? '' : json_encode($payload, JSON_UNESCAPED_SLASHES);
        $signature = hash_hmac('sha256', strtoupper($method)."\n".$path."\n".$body, $this->signingKey);
        $response = Http::withHeaders(['Content-Type'=>'application/json','X-Djassa-Signature'=>$signature])
            ->withBody($body, 'application/json')->connectTimeout(3)->timeout(8)
            ->{$method}(rtrim($base,'/').$path);
        if ($response->failed()) throw new RuntimeException("Appel interne $method $path échoué ({$response->status()}).");
        return $response->json() ?? [];
    }
    private function catalog(): string { return (string) config('services.internal.catalog_url', 'http://catalog-boutique-service:8080'); }
    private function escrow(): string { return (string) config('services.internal.escrow_url', 'http://escrow-payment-service:8080'); }

    public function getArticle(string $id): array { return $this->call($this->catalog(), 'get', '/internal/catalog/articles/'.$id); }
    public function setArticleStatut(string $id, string $statut): array
    { return $this->call($this->catalog(), 'post', '/internal/catalog/articles/'.$id.'/statut', ['statut'=>$statut]); }
    public function checkout(string $userId, string $reference, float $montant): array
    { return $this->call($this->escrow(), 'post', '/internal/escrow/checkout', [
        'user_id'=>$userId, 'reference'=>$reference, 'montant'=>$montant,
    ]); }
}
