<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Règle : aucun webhook GeniusPay n'est accepté sans signature HMAC valide. */
class GeniusPayWebhookTest extends TestCase
{
    use RefreshDatabase;

    private const SECRET = 'test-webhook-secret';

    protected function setUp(): void
    {
        parent::setUp();
        // Clés non vides => mode mock désactivé => vérification HMAC stricte.
        config([
            'services.geniuspay.api_key' => 'test-api-key',
            'services.geniuspay.webhook_secret' => self::SECRET,
        ]);
    }

    public function test_signature_invalide_est_refusee(): void
    {
        $this->postJson(
            '/api/v1/webhooks/geniuspay',
            ['reference' => 'DJASSA-ACHAT-TEST', 'status' => 'success'],
            ['X-GeniusPay-Signature' => 'signature-invalide']
        )->assertStatus(401);
    }

    public function test_signature_valide_mais_reference_manquante_est_refusee(): void
    {
        $body = json_encode(['status' => 'success'], JSON_UNESCAPED_SLASHES);
        $signature = hash_hmac('sha256', $body, self::SECRET);

        $this->call(
            'POST',
            '/api/v1/webhooks/geniuspay',
            [], [], [],
            ['CONTENT_TYPE' => 'application/json', 'HTTP_X_GENIUSPAY_SIGNATURE' => $signature],
            $body
        )->assertStatus(422);
    }

    public function test_deux_webhooks_identiques_ne_creent_pas_deux_activations(): void
    {
        $this->markTestIncomplete(
            'Idempotence assurée par webhooks_logs(reference, payload_hash) dans database/schemas/djassa_escrow_db.sql ; '
            .'à porter dans la table active backend-laravel/database/migrations/ puis à tester ici.'
        );
    }
}
