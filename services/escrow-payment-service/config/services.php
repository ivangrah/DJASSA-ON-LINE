<?php

return [
    'geniuspay' => [
        'api_key' => env('GENIUSPAY_API_KEY'),
        'api_secret' => env('GENIUSPAY_API_SECRET'),
        'webhook_secret' => env('GENIUSPAY_WEBHOOK_SECRET'),
        'base_url' => env('GENIUSPAY_BASE_URL', 'https://api.geniuspay.ci/v1'),
        'frais_escrow_pct' => (float) env('GENIUSPAY_FRAIS_ESCROW_PCT', 3),
    ],
    'brevo' => [
        'api_key' => env('BREVO_API_KEY'),
        'sender_email' => env('BREVO_SENDER_EMAIL', 'no-reply@djassaonline.ci'),
        'sender_name' => env('BREVO_SENDER_NAME', 'Djassa Online'),
    ],
    'internal' => [
        'api_url' => env('DJASSA_INTERNAL_API_URL', 'http://api-gateway:8080/internal'),
        'signing_key' => env('DJASSA_INTERNAL_SIGNING_KEY'),
    ],
    'redis' => [
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'port' => (int) env('REDIS_PORT', 6379),
        'stream' => env('REDIS_EVENTS_STREAM', 'djassa.events'),
    ],
    'security' => [
        // Pepper serveur du PIN : jamais en clair dans le code, uniquement via l'environnement.
        // Vide en développement/tests pour rester compatible avec les PIN déjà hachés.
        'pin_pepper' => env('PIN_PEPPER', ''),
        'pin_ip_attempts' => (int) env('PIN_IP_ATTEMPTS', 5),
        'pin_ip_decay_seconds' => (int) env('PIN_IP_DECAY_SECONDS', 900),
    ],
];
