<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

// Le service possède son propre vendor/ (composer.json + composer.lock).
// Ce chargeur prépend garantit que App\ et Tests\ désignent LES FICHIERS DU SERVICE,
// jamais ceux d'un autre service.
spl_autoload_register(function (string $class): void {
    foreach (['App\\' => __DIR__.'/../app/', 'Tests\\' => __DIR__.'/../tests/'] as $prefix => $base) {
        if (str_starts_with($class, $prefix)) {
            $file = $base.str_replace('\\', '/', substr($class, strlen($prefix))).'.php';
            if (is_file($file)) { require $file; return; }
        }
    }
}, true, true);

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(api: __DIR__.'/../routes/api.php', apiPrefix: '', health: '/up')
    ->withCommands([\App\Console\Commands\ConsumeAuthEvents::class])
    ->withCommands([\App\Console\Commands\ConsumeTrocEvents::class])
    ->withCommands([\App\Console\Commands\ConsumeChatEvents::class, \App\Console\Commands\WorkNotifications::class])
    ->withMiddleware(fn (Middleware $middleware) => null)
    ->withExceptions(fn (Exceptions $exceptions) => null)
    ->create();
