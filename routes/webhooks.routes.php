<?php
declare(strict_types=1);
/** Webhooks signés : HMAC-SHA256 sur corps brut + hash_equals + idempotence. */
return [
    ['verb'=>'POST','path'=>'/api/v1/escrow/webhooks/geniuspay','handler'=>'escrow-payment-service@webhook','signature'=>'hmac-sha256','header'=>'X-Signature','idempotence'=>['reference','payload_hash']],
    ['verb'=>'POST','path'=>'/api/v1/webhooks/brevo','handler'=>'notification-chat-service@webhook','signature'=>'hmac-sha256'],
];
