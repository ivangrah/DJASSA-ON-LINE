<?php
declare(strict_types=1);
/** Routes strictement vendeur_pro. Le gateway doit injecter X-User-Role vérifié. */
return [
    ['role' => 'vendeur_pro', 'verb' => 'POST', 'path' => '/api/v1/catalog/boutiques',      'handler' => 'catalog-boutique-service@storeBoutique'],
    ['role' => 'vendeur_pro', 'verb' => 'POST', 'path' => '/api/v1/catalog/articles',       'handler' => 'catalog-boutique-service@storeArticle', 'condition' => 'etat=new'],
    ['role' => 'vendeur_pro', 'verb' => 'GET',  'path' => '/api/v1/pro/factures',            'handler' => 'catalog-boutique-service@factures'],
    ['role' => 'vendeur_pro', 'verb' => 'GET',  'path' => '/api/v1/pro/dashboard',           'handler' => 'catalog-boutique-service@dashboard'],
];
