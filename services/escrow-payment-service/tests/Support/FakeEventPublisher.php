<?php

namespace Tests\Support;

use App\Services\RedisStreamPublisher;

class FakeEventPublisher extends RedisStreamPublisher
{
    public array $events = [];

    public function __construct() { parent::__construct('127.0.0.1', 6379, 'test'); }

    public function publish(string $event, array $payload): bool
    {
        $this->events[] = ['event' => $event, 'payload' => $payload];

        return true;
    }
}
