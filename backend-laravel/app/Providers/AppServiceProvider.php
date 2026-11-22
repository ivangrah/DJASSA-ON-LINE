<?php

namespace App\Providers;

use App\Services\BrevoNotificationService;
use App\Services\GeniusPayService;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use RuntimeException;
use App\Services\RedisEventConsumer;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(GeniusPayService::class);
        $this->app->singleton(BrevoNotificationService::class);
        $this->app->singleton(RedisEventConsumer::class, fn () => new RedisEventConsumer(
            (string) config('services.redis.host', '127.0.0.1'),
            (int) config('services.redis.port', 6379),
            (string) config('services.redis.stream', 'djassa.events'),
        ));
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        require base_path('routes/internal.php');

        // B5 : refuser de démarrer en production avec une configuration de paiement incomplète.
        if (config('app.env') === 'production' && (
            empty(config('services.geniuspay.api_key')) ||
            empty(config('services.geniuspay.api_secret')) ||
            empty(config('services.geniuspay.webhook_secret'))
        )) {
            throw new RuntimeException(
                'GeniusPay : api_key, api_secret et webhook_secret sont obligatoires en production.'
            );
        }

        // TRD §6 — limitation de débit : 60 requêtes/minute par utilisateur (ou par IP si invité)
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?? $request->ip());
        });

        // Le webhook GeniusPay doit rester disponible hors auth (signature HMAC) — pas de blocage par le rate limiter global
    }
}
