<?php

namespace Tests;

use App\Services\InternalApiClient;
use App\Services\RedisStreamPublisher;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Tests\Support\FakeEventPublisher;
use Tests\Support\FakeInternalApiClient;

abstract class TestCase extends BaseTestCase
{
    protected FakeEventPublisher $events;
    protected FakeInternalApiClient $internal;

    protected function setUp(): void
    {
        parent::setUp();

        $this->events = new FakeEventPublisher();
        $this->internal = new FakeInternalApiClient();
        $this->app->instance(RedisStreamPublisher::class, $this->events);
        $this->app->instance(InternalApiClient::class, $this->internal);
    }
}
