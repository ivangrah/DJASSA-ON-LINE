<?php
namespace App\Providers;
use App\Services\RedisCache;
use Illuminate\Support\ServiceProvider;
class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(RedisCache::class, fn () => new RedisCache(
            (string) config('services.redis_cache.host', '127.0.0.1'),
            (int) config('services.redis_cache.port', 6379),
            (string) config('services.redis_cache.prefix', 'djassa:catalog:'),
            (int) config('services.redis_cache.ttl', 300),
        ));
    }
    public function boot(): void
    {
        require base_path('routes/internal.php');
        \Illuminate\Database\Eloquent\Model::preventLazyLoading(! app()->isProduction());
    }
}
