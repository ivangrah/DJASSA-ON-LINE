<?php
namespace Tests\Support;
use App\Services\RedisQueue;
class FakeRedisQueue extends RedisQueue
{
    public array $jobs = [];
    public function __construct() { parent::__construct('127.0.0.1',6379,'test'); }
    public function push(string $type, array $payload): bool
    { $this->jobs[] = ['type'=>$type,'payload'=>$payload]; return true; }
    public function pop(int $timeout = 1): ?array { return array_shift($this->jobs); }
}
