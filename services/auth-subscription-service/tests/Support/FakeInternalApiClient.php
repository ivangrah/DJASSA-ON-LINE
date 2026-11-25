<?php
namespace Tests\Support;
use App\Services\InternalApiClient;
class FakeInternalApiClient extends InternalApiClient
{
    public array $calls = [];
    public ?array $boutiqueResponse = null;
    public function __construct() { parent::__construct('http://internal', 'test'); }
    public function getBoutiqueByUser(string $userId): ?array { $this->calls[] = ['getBoutiqueByUser', $userId]; return $this->boutiqueResponse; }
    public function request(string $method, string $path, array $payload = []): array
    {
        $this->calls[] = [$method, $path, $payload];
        return ['payment_url' => 'http://fake/checkout', 'geniuspay_ref' => 'GP-FAKE-TEST', 'mock' => true];
    }
}
