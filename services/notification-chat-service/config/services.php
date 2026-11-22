<?php
return [
    'brevo' => [
        'api_key' => env('BREVO_API_KEY'),
        'sender_email' => env('BREVO_SENDER_EMAIL', 'no-reply@djassaonline.ci'),
        'sender_name' => env('BREVO_SENDER_NAME', 'Djassa Online'),
        'connect_timeout' => (int) env('BREVO_CONNECT_TIMEOUT', 3),
        'timeout' => (int) env('BREVO_TIMEOUT', 8),
    ],
    'internal' => ['signing_key' => env('DJASSA_INTERNAL_SIGNING_KEY')],
    'redis' => [
        'host' => env('REDIS_HOST','127.0.0.1'), 'port' => (int) env('REDIS_PORT',6379),
        'stream' => env('REDIS_EVENTS_STREAM','djassa.events'),
        'queue' => env('REDIS_NOTIFICATION_QUEUE','djassa:notifications:jobs'),
    ],
];
