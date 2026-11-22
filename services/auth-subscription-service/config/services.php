<?php

return [
    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'tokeninfo_url' => env('GOOGLE_TOKENINFO_URL', 'https://oauth2.googleapis.com/tokeninfo'),
        'connect_timeout' => (int) env('OAUTH_CONNECT_TIMEOUT', 3),
        'timeout' => (int) env('OAUTH_TIMEOUT', 8),
    ],
    'internal' => [
        'api_url' => env('DJASSA_INTERNAL_API_URL', 'http://api-gateway:8081/internal'),
        'signing_key' => env('DJASSA_INTERNAL_SIGNING_KEY'),
        'escrow_url' => env('ESCROW_INTERNAL_URL', 'http://escrow-payment-service:8080'),
    ],
    'redis' => [
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'port' => (int) env('REDIS_PORT', 6379),
        'stream' => env('REDIS_EVENTS_STREAM', 'djassa.events'),
    ],
];
