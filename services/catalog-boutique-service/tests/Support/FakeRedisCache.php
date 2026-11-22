<?php
namespace Tests\Support;
use App\Services\RedisCache;
class FakeRedisCache extends RedisCache
{
    public array $store = [];
    public int $calls = 0;
    public function __construct() { parent::__construct('127.0.0.1', 6379, 'test:', 300); }
    public function remember(string $key, callable $callback, ?int $ttl = null): mixed
    {
        if (array_key_exists($key, $this->store)) return $this->store[$key];
        $this->calls++;
        return $this->store[$key] = $callback();
    }
    public function forget(string $prefix): void
    {
        foreach (array_keys($this->store) as $key) {
            if ($prefix === '' || str_starts_with($key, rtrim($prefix, ':'))) unset($this->store[$key]);
        }
    }
}
