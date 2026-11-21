<?php
declare(strict_types=1);
/** Routes protégées — rôle particulier OU vendeur_pro (le vendeur est aussi acheteur). */
return [
    ['role' => ['particulier','vendeur_pro'], 'verb' => 'GET',  'path' => '/api/v1/troc/offres',        'handler' => 'troc-engine-service@index'],
    ['role' => ['particulier','vendeur_pro'], 'verb' => 'POST', 'path' => '/api/v1/troc/offres',        'handler' => 'troc-engine-service@store'],
    ['role' => ['particulier','vendeur_pro'], 'verb' => 'GET',  'path' => '/api/v1/catalog/souhaits',   'handler' => 'catalog-boutique-service@souhaits'],
    ['role' => ['particulier','vendeur_pro'], 'verb' => 'GET',  'path' => '/api/v1/messages/conversations','handler' => 'notification-chat-service@index'],
];
