<?php
namespace Tests;
use App\Services\RedisQueue;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Tests\Support\FakeRedisQueue;
abstract class TestCase extends BaseTestCase
{
    protected FakeRedisQueue $queue;
    protected const USER = '11111111-1111-4111-8111-111111111111';
    protected const OTHER = '22222222-2222-4222-8222-222222222222';
    protected function setUp(): void
    {
        parent::setUp();
        $this->queue = new FakeRedisQueue();
        $this->app->instance(RedisQueue::class, $this->queue);
        config(['services.internal.signing_key' => 'test-internal-key']);
    }
    protected function signed(string $method, string $path, array $payload = []): array
    {
        $body = $payload === [] ? '' : json_encode($payload, JSON_UNESCAPED_SLASHES);
        return ['X-Djassa-Signature'=>hash_hmac('sha256',$method."\n".$path."\n".$body,'test-internal-key')];
    }
    protected function conversation(): \App\Models\Conversation
    {
        return \App\Models\Conversation::create([
            'participant_1'=>self::USER,'participant_2'=>self::OTHER,
            'article_id'=>'33333333-3333-4333-8333-333333333333','dernier_message_at'=>now(),
        ]);
    }
}
