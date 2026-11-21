<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Règle : l'ouverture d'une boutique est strictement réservée aux vendeurs Pro. */
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

    public function test_un_gratuit_ne_peut_pas_devenir_pro_sans_paiement_verifie(): void
    {
        $this->markTestIncomplete(
            'Finding B1 (AUDIT_APPLICATION.md) : select-plan accorde actuellement vendeur_pro sans webhook vérifié. '
            .'Ce test deviendra une assertion 403/422 après correction du finding.'
        );
    }
}
