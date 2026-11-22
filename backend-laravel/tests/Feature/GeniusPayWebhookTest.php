<?php

namespace Tests\Feature;

use App\Models\Abonnement;
use App\Models\User;
use App\Models\WebhookLog;
use App\Services\GeniusPayService;
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

    public function test_mode_mock_est_interdit_en_production(): void
    {
        config([
            'app.env' => 'production',
            'services.geniuspay.api_key' => null,
            'services.geniuspay.api_secret' => null,
            'services.geniuspay.webhook_secret' => null,
        ]);

        $service = app(GeniusPayService::class);

        $this->assertFalse($service->isMock());
        $this->assertFalse($service->verifyWebhookSignature('{}', null));
    }

    public function test_signature_est_requise_en_production_meme_sans_secret(): void
    {
        config([
            'app.env' => 'production',
            'services.geniuspay.api_key' => 'prod-key',
            'services.geniuspay.webhook_secret' => null,
        ]);

        $service = app(GeniusPayService::class);

        $this->assertFalse($service->isMock());
        $this->assertFalse($service->verifyWebhookSignature('{"reference":"X"}', null));
    }

    public function test_deux_webhooks_identiques_ne_creent_pas_deux_activations(): void
    {
        $user = User::factory()->create(['plan_abonnement' => null]);
        $abonnement = Abonnement::create([
            'utilisateur_id' => $user->id,
            'formule' => Abonnement::FORMULE_PRO,
            'montant_fcfa' => Abonnement::PRIX_PRO,
            'statut' => Abonnement::STATUT_PENDING,
            'reference' => 'DJASSA-PRO-'.strtoupper(bin2hex(random_bytes(6))),
        ]);

        $body = json_encode([
            'event_id' => 'evt-idempotence-1',
            'reference' => $abonnement->reference,
            'status' => 'success',
        ], JSON_UNESCAPED_SLASHES);
        $signature = hash_hmac('sha256', $body, self::SECRET);

        $call = fn () => $this->call(
            'POST',
            '/api/v1/webhooks/geniuspay',
            [], [], [],
            ['CONTENT_TYPE' => 'application/json', 'HTTP_X_GENIUSPAY_SIGNATURE' => $signature],
            $body
        );

        $call()->assertStatus(200)->assertJsonPath('abonnement', 'active');
        $call()->assertStatus(200)->assertJsonPath('idempotent', true);

        $this->assertSame(1, WebhookLog::count());
        $this->assertSame(1, Abonnement::where('reference', $abonnement->reference)->where('statut', Abonnement::STATUT_ACTIVE)->count());
        $this->assertSame(User::ROLE_VENDEUR_PRO, $user->refresh()->role);
    }
}
