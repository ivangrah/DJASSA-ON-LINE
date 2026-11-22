<?php
return [
    'internal' => [
        'api_url' => env('DJASSA_INTERNAL_API_URL', 'http://api-gateway:8081/internal'),
        'signing_key' => env('DJASSA_INTERNAL_SIGNING_KEY'),
    ],
    'redis_cache' => [
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'port' => (int) env('REDIS_PORT', 6379),
        'prefix' => env('REDIS_CACHE_PREFIX', 'djassa:catalog:'),
        'ttl' => (int) env('REDIS_CACHE_TTL', 300),
    ],
];
