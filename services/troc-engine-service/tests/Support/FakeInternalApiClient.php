<?php
namespace Tests\Support;
use App\Services\InternalApiClient;
class FakeInternalApiClient extends InternalApiClient
{
    public array $articles = [];
    public array $checkoutCalls = [];
    public function __construct() { parent::__construct('test-key'); }
    public function getArticle(string $id): array
    {
        if (! isset($this->articles[$id])) throw new \RuntimeException('Article introuvable.');
        return $this->articles[$id];
    }
    public function setArticleStatut(string $id, string $statut): array { return ['ok'=>true]; }
    public function checkout(string $userId, string $reference, float $montant): array
    {
        $this->checkoutCalls[] = [$userId, $reference, $montant];
        return ['payment_url'=>'http://fake/checkout','geniuspay_ref'=>'GP-FAKE-TEST','mock'=>true];
    }
}
