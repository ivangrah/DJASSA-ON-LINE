<?php

namespace App\Providers;

use App\Services\GoogleTokenVerifier;
use App\Services\InternalApiClient;
use App\Services\RedisEventConsumer;
use App\Services\AuditService;
use App\Services\MaintenanceService;
use Illuminate\Support\ServiceProvider;
use RuntimeException;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(GoogleTokenVerifier::class);
        $this->app->singleton(InternalApiClient::class, fn () => new InternalApiClient(
            (string) config('services.internal.api_url'), config('services.internal.signing_key')
        ));
        $this->app->singleton(RedisEventConsumer::class, fn () => new RedisEventConsumer(
            (string) config('services.redis.host', '127.0.0.1'),
            (int) config('services.redis.port', 6379),
            (string) config('services.redis.stream', 'djassa.events')
        ));
        $this->app->singleton(\App\Services\MaintenanceService::class, fn () => new \App\Services\MaintenanceService(
            (string) config('services.redis.host', '127.0.0.1'),
            (int) config('services.redis.port', 6379),
        ));
        $this->app->singleton(\App\Services\AuditService::class);
    }

    public function boot(): void
    {
        \Illuminate\Database\Eloquent\Model::preventLazyLoading(! app()->isProduction());

        require base_path('routes/internal.php');

        if (config('app.env') === 'production' && empty(config('services.internal.signing_key'))) {
            throw new RuntimeException('DJASSA_INTERNAL_SIGNING_KEY obligatoire en production.');
        }
    }
}
