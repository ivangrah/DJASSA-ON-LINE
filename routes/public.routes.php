<?php
declare(strict_types=1);
/** Routes accessibles sans authentification. */
return [
    ['GET',  '/api/v1/catalog/articles',        'catalog-boutique-service@index'],
    ['GET',  '/api/v1/catalog/articles/{id}',   'catalog-boutique-service@show'],
    ['GET',  '/api/v1/catalog/boutiques/{slug}','catalog-boutique-service@showBoutique'],
    ['POST', '/api/v1/auth/register',           'auth-subscription-service@register', 'throttle:10,1'],
    ['POST', '/api/v1/auth/login',              'auth-subscription-service@login',    'throttle:10,1'],
    ['POST', '/api/v1/auth/google',             'auth-subscription-service@google',   'throttle:10,1'],
];
