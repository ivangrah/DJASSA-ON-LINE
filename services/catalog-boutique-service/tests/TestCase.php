<?php
namespace Tests;
use App\Services\RedisCache;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Tests\Support\FakeRedisCache;
abstract class TestCase extends BaseTestCase
{
    protected FakeRedisCache $cache;
    protected function setUp(): void
    {
        parent::setUp();
        $this->cache = new FakeRedisCache();
        $this->app->instance(RedisCache::class, $this->cache);
        config(['services.internal.signing_key' => 'test-internal-key']);
    }
    protected function signed(string $method, string $path, array $payload = []): array
    {
        $body = $payload === [] ? '' : json_encode($payload, JSON_UNESCAPED_SLASHES);
        return ['X-Djassa-Signature' => hash_hmac('sha256', $method."\n".$path."\n".$body, 'test-internal-key')];
    }
    protected function article(array $attrs = []): \App\Models\Article
    {
        return \App\Models\Article::create(array_replace([
            'utilisateur_id' => '22222222-2222-4222-8222-222222222222',
            'titre' => 'Article test', 'prix' => 12000, 'categorie' => 'High-Tech',
            'statut' => \App\Models\Article::STATUT_PUBLISHED,
        ], $attrs));
    }
}
