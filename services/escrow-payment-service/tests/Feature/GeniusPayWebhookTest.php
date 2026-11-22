<?php

namespace Tests\Feature;

use App\Models\Transaction;
use App\Models\WebhookLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class GeniusPayWebhookTest extends TestCase
{
    use RefreshDatabase;

    private const SECRET = 'test-webhook-secret';

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.geniuspay.webhook_secret' => self::SECRET]);
    }

    private function callWebhook(string $body): \Illuminate\Testing\TestResponse
    {
        $signature = hash_hmac('sha256', $body, self::SECRET);

        return $this->call('POST', '/api/v1/escrow/webhooks/geniuspay', [], [], [],
            ['CONTENT_TYPE' => 'application/json', 'HTTP_X_GENIUSPAY_SIGNATURE' => $signature], $body);
    }

    public function test_signature_invalide_est_refusee(): void
    {
        $this->postJson('/api/v1/escrow/webhooks/geniuspay', ['reference' => 'X'], ['X-GeniusPay-Signature' => 'bad'])
            ->assertStatus(401);
    }

    public function test_reference_manquante_est_refusee(): void
    {
        $this->callWebhook(json_encode(['status' => 'success']))->assertStatus(422);
    }

    public function test_webhook_rejoue_est_idempotent(): void
    {
        $body = json_encode(['event_id' => 'evt-1', 'reference' => 'DJASSA-PRO-TEST', 'status' => 'success']);

        $this->callWebhook($body)->assertStatus(200)->assertJsonPath('abonnement', 'active');
        $this->callWebhook($body)->assertStatus(200)->assertJsonPath('idempotent', true);

        $this->assertSame(1, WebhookLog::count());
        $this->assertSame(1, count(array_filter($this->events->events, fn ($e) => $e['event'] === 'payment.succeeded')));
    }

    public function test_webhook_success_bascule_en_held_sans_publier_le_pin(): void
    {
        $ref = 'DJASSA-ACHAT-'.(string) Str::uuid();
        Transaction::create([
            'acheteur_id' => (string) Str::uuid(), 'vendeur_id' => (string) Str::uuid(),
            'article_id' => (string) Str::uuid(), 'montant' => 5000,
            'geniuspay_ref' => $ref, 'escrow_status' => Transaction::ESCROW_INITIATED,
        ]);

        $this->callWebhook(json_encode(['event_id' => 'evt-2', 'reference' => $ref, 'status' => 'success']))
            ->assertStatus(200)->assertJsonPath('received', true);

        $this->assertSame(Transaction::ESCROW_HELD, Transaction::first()->escrow_status);
        $this->assertContains('escrow.held', array_column($this->events->events, 'event'));
        $this->assertStringNotContainsString('pin', json_encode($this->events->events));
    }
}
