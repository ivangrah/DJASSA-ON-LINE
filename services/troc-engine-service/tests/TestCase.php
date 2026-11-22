<?php
namespace Tests;
use App\Services\InternalApiClient;
use App\Services\RedisStreamPublisher;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Tests\Support\FakeInternalApiClient;
use Tests\Support\FakeRedisStreamPublisher;
abstract class TestCase extends BaseTestCase
{
    protected FakeInternalApiClient $internal;
    protected FakeRedisStreamPublisher $events;
    protected const ACHETEUR = '11111111-1111-4111-8111-111111111111';
    protected const VENDEUR = '22222222-2222-4222-8222-222222222222';
    protected const CIBLE = '33333333-3333-4333-8333-333333333333';
    protected const OFFERT = '44444444-4444-4444-8444-444444444444';

    protected function setUp(): void
    {
        parent::setUp();
        $this->internal = new FakeInternalApiClient();
        $this->events = new FakeRedisStreamPublisher();
        $this->app->instance(InternalApiClient::class, $this->internal);
        $this->app->instance(RedisStreamPublisher::class, $this->events);
        config(['services.internal.signing_key' => 'test-internal-key']);
        $this->internal->articles = [
            self::CIBLE => ['id'=>self::CIBLE,'utilisateur_id'=>self::VENDEUR,'statut'=>'published','est_trocable'=>true,'mode_transaction'=>'troc','titre'=>'Cible'],
            self::OFFERT => ['id'=>self::OFFERT,'utilisateur_id'=>self::ACHETEUR,'statut'=>'published','est_trocable'=>true,'mode_transaction'=>'troc','titre'=>'Offert'],
        ];
    }
    protected function signed(string $method, string $path, array $payload = []): array
    {
        $body = $payload === [] ? '' : json_encode($payload, JSON_UNESCAPED_SLASHES);
        return ['X-Djassa-Signature'=>hash_hmac('sha256', $method."\n".$path."\n".$body, 'test-internal-key')];
    }
    protected function payload(array $extra = []): array
    {
        return array_replace([
            'article_cible_id'=>self::CIBLE,
            'articles_offerts'=>[self::OFFERT],
            'montant_soulte_fcfa'=>0,
        ], $extra);
    }
}
