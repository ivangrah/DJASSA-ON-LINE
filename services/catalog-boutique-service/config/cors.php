<?php

return [

    /*
     * Djassa Online — CORS pour la SPA React (Vite :5173) et l'API mobile.
     * Sanctum stateful (cookies) requiert supports_credentials=true et origines exactes.
     */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:5173'),
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:8081',   // Metro (Expo web / dev)
        'exp://127.0.0.1:8081',
    ],

    'allowed_origins_patterns' => [
        '#^https?://(localhost|127\.0\.0\.1)(:\d+)?$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
