<?php
namespace Tests;
use App\Services\InternalApiClient;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Tests\Support\FakeInternalApiClient;
abstract class TestCase extends BaseTestCase
{
    protected FakeInternalApiClient $internal;
    protected function setUp(): void
    {
        parent::setUp();
        $this->internal = new FakeInternalApiClient();
        $this->app->instance(InternalApiClient::class, $this->internal);
    }
}
