<?php

namespace Tests\Feature;

use App\Models\Abonnement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Règles : rôles étanches, onboarding admin, expiration Pro, et aucun Pro sans paiement (B1/W1/W2). */
class RoleIsolationTest extends TestCase
{
    use RefreshDatabase;

    private function payload(): array
    {
        return [
            'nom_boutique' => 'Boutique Test Cocody',
            'telephone' => '+2250700000000',
            'categorie' => 'Mode',
            'ville' => 'Abidjan',
        ];
    }

    public function test_un_particulier_ne_peut_pas_ouvrir_une_boutique(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_PARTICULIER]);

        $this->actingAs($user)
            ->postJson('/api/v1/boutiques', $this->payload())
            ->assertStatus(403);
    }

    public function test_un_vendeur_pro_peut_ouvrir_une_boutique(): void
    {
        $user = User::factory()->create([
            'role' => User::ROLE_VENDEUR_PRO,
            'plan_abonnement' => User::PLAN_PRO,
            'abonnement_actif_jusqu_au' => now()->addMonth(),
        ]);

        $this->actingAs($user)
            ->postJson('/api/v1/boutiques', $this->payload())
            ->assertStatus(201)
            ->assertJsonFragment(['slug' => 'boutique-test-cocody']);
    }

    public function test_un_admin_est_exclu_du_choix_d_offre(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);

        $this->actingAs($admin)
            ->postJson('/api/v1/auth/select-plan', ['plan' => User::PLAN_GRATUIT])
            ->assertStatus(422);
    }

    // ------------------------------------------------------------------
    // B1 — aucun vendeur_pro sans webhook GeniusPay valide
    // ------------------------------------------------------------------

    public function test_choix_pro_ne_donne_pas_le_role_vendeur_pro(): void
    {
        $user = User::factory()->create(['plan_abonnement' => null]);

        $response = $this->actingAs($user)
            ->postJson('/api/v1/auth/select-plan', ['plan' => 'pro'])
            ->assertStatus(200);

        $user->refresh();
        $this->assertSame(User::ROLE_PARTICULIER, $user->role);
        $this->assertSame(User::PLAN_GRATUIT, $user->plan_abonnement);
        $this->assertNull($user->abonnement_actif_jusqu_au);
        $this->assertNotNull($response->json('payment_url'));

        $this->assertDatabaseHas('abonnements', [
            'utilisateur_id' => $user->id,
            'formule' => Abonnement::FORMULE_PRO,
            'statut' => Abonnement::STATUT_PENDING,
        ]);
    }

    public function test_choix_pro_n_est_pas_rejouable(): void
    {
        $user = User::factory()->create(['plan_abonnement' => null]);

        $this->actingAs($user)->postJson('/api/v1/auth/select-plan', ['plan' => 'pro'])->assertStatus(200);
        $this->actingAs($user)->postJson('/api/v1/auth/select-plan', ['plan' => 'pro'])->assertStatus(422);
    }

    public function test_webhook_valide_active_le_pro_apres_paiement(): void
    {
        // Clé API vide => mode mock (pas d'appel réseau) ; secret présent => HMAC vérifié.
        config(['services.geniuspay.webhook_secret' => 'test-webhook-secret']);

        $user = User::factory()->create(['plan_abonnement' => null]);
        $response = $this->actingAs($user)
            ->postJson('/api/v1/auth/select-plan', ['plan' => 'pro'])
            ->assertStatus(200);

        $reference = $response->json('abonnement.reference');
        $this->assertStringStartsWith('DJASSA-PRO-', $reference);
        $this->assertSame(User::ROLE_PARTICULIER, $user->refresh()->role);

        $body = json_encode(['reference' => $reference, 'status' => 'success'], JSON_UNESCAPED_SLASHES);
        $signature = hash_hmac('sha256', $body, 'test-webhook-secret');

        $this->call(
            'POST',
            '/api/v1/webhooks/geniuspay',
            [], [], [],
            ['CONTENT_TYPE' => 'application/json', 'HTTP_X_GENIUSPAY_SIGNATURE' => $signature],
            $body
        )->assertStatus(200);

        $user->refresh();
        $this->assertSame(User::ROLE_VENDEUR_PRO, $user->role);
        $this->assertSame(User::PLAN_PRO, $user->plan_abonnement);
        $this->assertTrue($user->hasActiveProPlan());
    }

    // ------------------------------------------------------------------
    // W1 — admin jamais bloqué par l'onboarding
    // ------------------------------------------------------------------

    public function test_un_admin_sans_plan_a_needs_plan_faux(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN, 'plan_abonnement' => null]);

        $this->actingAs($admin)
            ->getJson('/api/v1/auth/me')
            ->assertStatus(200)
            ->assertJsonPath('user.needs_plan', false);
    }

    // ------------------------------------------------------------------
    // W2 — expiration Pro
    // ------------------------------------------------------------------

    public function test_un_pro_expire_a_has_active_pro_plan_faux(): void
    {
        $pro = User::factory()->create([
            'role' => User::ROLE_VENDEUR_PRO,
            'plan_abonnement' => User::PLAN_PRO,
            'abonnement_actif_jusqu_au' => now()->subDay(),
        ]);

        $this->assertFalse($pro->hasActiveProPlan());

        $this->actingAs($pro)
            ->getJson('/api/v1/auth/me')
            ->assertStatus(200)
            ->assertJsonPath('user.has_active_pro_plan', false);
    }

    public function test_un_pro_expire_est_refuse_sur_une_route_vendeur(): void
    {
        $pro = User::factory()->create([
            'role' => User::ROLE_VENDEUR_PRO,
            'plan_abonnement' => User::PLAN_PRO,
            'abonnement_actif_jusqu_au' => now()->subDay(),
        ]);

        $this->actingAs($pro)
            ->postJson('/api/v1/boutiques', $this->payload())
            ->assertStatus(403)
            ->assertJsonPath('code', 'PRO_EXPIRED');
    }
}
