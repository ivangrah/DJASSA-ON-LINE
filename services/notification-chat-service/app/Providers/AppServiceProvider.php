<?php
namespace App\Providers;
use App\Services\BrevoService;
use App\Services\RedisEventConsumer;
use App\Services\RedisQueue;
use Illuminate\Support\ServiceProvider;
class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(\App\Services\MaintenanceService::class, fn () => new \App\Services\MaintenanceService(
            (string) config('services.redis.host', '127.0.0.1'),
            (int) config('services.redis.port', 6379),
        ));

        $this->app->singleton(BrevoService::class);
        $this->app->singleton(RedisQueue::class, fn()=>new RedisQueue(
            (string)config('services.redis.host','127.0.0.1'),(int)config('services.redis.port',6379),
            (string)config('services.redis.queue','djassa:notifications:jobs')
        ));
        $this->app->singleton(RedisEventConsumer::class, fn()=>new RedisEventConsumer(
            (string)config('services.redis.host','127.0.0.1'),(int)config('services.redis.port',6379),
            (string)config('services.redis.stream','djassa.events')
        ));
    }
    public function boot(): void
    {
        require base_path('routes/internal.php');
        \Illuminate\Database\Eloquent\Model::preventLazyLoading(! app()->isProduction());
    }
}
