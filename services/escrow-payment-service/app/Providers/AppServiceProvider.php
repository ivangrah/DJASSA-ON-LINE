<?php

namespace App\Providers;

use App\Services\BrevoNotificationService;
use App\Services\EscrowService;
use App\Services\GeniusPayService;
use App\Services\InternalApiClient;
use App\Services\RedisStreamPublisher;
use Illuminate\Support\ServiceProvider;
use RuntimeException;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(GeniusPayService::class);
        $this->app->singleton(BrevoNotificationService::class);
        $this->app->singleton(InternalApiClient::class, fn () => new InternalApiClient(
            (string) config('services.internal.api_url'),
            config('services.internal.signing_key'),
        ));
        $this->app->singleton(RedisStreamPublisher::class, fn () => new RedisStreamPublisher(
            (string) config('services.redis.host'),
            (int) config('services.redis.port'),
            (string) config('services.redis.stream'),
        ));
        $this->app->singleton(EscrowService::class);
    }

    public function boot(): void
    {
        \Illuminate\Database\Eloquent\Model::preventLazyLoading(! app()->isProduction());

        // B5 : échec immédiat en production si la configuration GeniusPay est incomplète.
        if (config('app.env') === 'production' && (
            empty(config('services.geniuspay.api_key')) ||
            empty(config('services.geniuspay.api_secret')) ||
            empty(config('services.geniuspay.webhook_secret')) ||
            empty(config('services.internal.signing_key'))
        )) {
            throw new RuntimeException(
                'escrow-payment-service : clés GeniusPay et DJASSA_INTERNAL_SIGNING_KEY obligatoires en production.'
            );
        }
    }
}
