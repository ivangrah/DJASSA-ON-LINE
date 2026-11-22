<?php
return [
    'internal' => [
        'api_url' => env('DJASSA_INTERNAL_API_URL', 'http://api-gateway:8081/internal'),
        'signing_key' => env('DJASSA_INTERNAL_SIGNING_KEY'),
        'catalog_url' => env('CATALOG_INTERNAL_URL', 'http://catalog-boutique-service:8080'),
        'escrow_url' => env('ESCROW_INTERNAL_URL', 'http://escrow-payment-service:8080'),
    ],
    'redis' => [
        'host' => env('REDIS_HOST', '127.0.0.1'), 'port' => (int) env('REDIS_PORT', 6379),
        'stream' => env('REDIS_EVENTS_STREAM', 'djassa.events'),
    ],
];
