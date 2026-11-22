<?php
namespace App\Providers;
use App\Services\RedisCache;
use App\Services\RedisStreamPublisher;
use Illuminate\Support\ServiceProvider;
class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(\App\Services\MaintenanceService::class, fn () => new \App\Services\MaintenanceService(
            (string) config('services.redis.host', '127.0.0.1'),
            (int) config('services.redis.port', 6379),
        ));

        $this->app->singleton(RedisCache::class, fn () => new RedisCache(
            (string) config('services.redis_cache.host', '127.0.0.1'),
            (int) config('services.redis_cache.port', 6379),
            (string) config('services.redis_cache.prefix', 'djassa:catalog:'),
            (int) config('services.redis_cache.ttl', 300),
        ));
        $this->app->singleton(RedisStreamPublisher::class, fn () => new RedisStreamPublisher(
            (string)config('services.redis.host','127.0.0.1'),(int)config('services.redis.port',6379),
            (string)config('services.redis.stream','djassa.events')
        ));
        $this->app->singleton(\App\Services\AdminFinancialClient::class, fn () => new \App\Services\AdminFinancialClient(
            (string) config('services.internal.escrow_url', 'http://escrow-payment-service:8080'),
            (string) config('services.internal.signing_key', ''),
        ));
    }
    public function boot(): void
    {
        require base_path('routes/internal.php');
        \Illuminate\Database\Eloquent\Model::preventLazyLoading(! app()->isProduction());
    }
}
