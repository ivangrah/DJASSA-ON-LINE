<?php

$_ENV['APP_BASE_PATH'] = dirname(__DIR__);

require __DIR__.'/../vendor/autoload.php';

// Le service partage le vendor/ du monolithe : les namespaces App\ et Tests\ doivent
// être résolus en priorité vers les fichiers du service.
spl_autoload_register(function (string $class): void {
    foreach (['App\\' => __DIR__.'/../app/', 'Tests\\' => __DIR__.'/'] as $prefix => $base) {
        if (str_starts_with($class, $prefix)) {
            $file = $base.str_replace('\\', '/', substr($class, strlen($prefix))).'.php';
            if (is_file($file)) { require $file; return; }
        }
    }
}, true, true);
