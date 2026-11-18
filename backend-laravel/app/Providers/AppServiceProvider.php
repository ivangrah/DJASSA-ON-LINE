<?php

namespace App\Providers;

use App\Services\BrevoNotificationService;
use App\Services\GeniusPayService;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
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
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // TRD §6 — limitation de débit : 60 requêtes/minute par utilisateur (ou par IP si invité)
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?? $request->ip());
        });

        // Le webhook GeniusPay doit rester disponible hors auth (signature HMAC) — pas de blocage par le rate limiter global
    }
}
