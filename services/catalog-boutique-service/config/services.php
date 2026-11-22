<?php
return [
    'internal' => [
        'api_url' => env('DJASSA_INTERNAL_API_URL', 'http://api-gateway:8081/internal'),
        'signing_key' => env('DJASSA_INTERNAL_SIGNING_KEY'),
        'escrow_url' => env('ESCROW_INTERNAL_URL', 'http://escrow-payment-service:8080'),
    ],
    'redis' => [
        'host' => env('REDIS_HOST','127.0.0.1'), 'port' => (int) env('REDIS_PORT',6379),
        'stream' => env('REDIS_EVENTS_STREAM','djassa.events'),
    ],
    'redis_cache' => [
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'port' => (int) env('REDIS_PORT', 6379),
        'prefix' => env('REDIS_CACHE_PREFIX', 'djassa:catalog:'),
        'ttl' => (int) env('REDIS_CACHE_TTL', 300),
    ],
];
