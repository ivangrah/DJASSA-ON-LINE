<?php
namespace App\Providers;
use App\Services\InternalApiClient;
use App\Services\RedisEventConsumer;
use App\Services\RedisStreamPublisher;
use Illuminate\Support\ServiceProvider;
class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(InternalApiClient::class, fn () => new InternalApiClient(config('services.internal.signing_key')));
        $this->app->singleton(RedisStreamPublisher::class, fn () => new RedisStreamPublisher(
            (string)config('services.redis.host','127.0.0.1'), (int)config('services.redis.port',6379),
            (string)config('services.redis.stream','djassa.events')
        ));
        $this->app->singleton(RedisEventConsumer::class, fn () => new RedisEventConsumer(
            (string)config('services.redis.host','127.0.0.1'), (int)config('services.redis.port',6379),
            (string)config('services.redis.stream','djassa.events')
        ));
    }
    public function boot(): void
    {
        require base_path('routes/internal.php');
        \Illuminate\Database\Eloquent\Model::preventLazyLoading(! app()->isProduction());
    }
}
