<?php
// Healthcheck minimal des scaffolds de service.
header('Content-Type: application/json');
http_response_code(200);
echo json_encode([
    'service' => getenv('DJASSA_SERVICE') ?: 'generic',
    'status'  => 'scaffold',
    'note'    => 'Implémenter le domaine métier dans app/ avant mise en production.',
], JSON_UNESCAPED_UNICODE);
