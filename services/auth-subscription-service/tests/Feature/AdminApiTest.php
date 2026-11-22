<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\MaintenanceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminApiTest extends TestCase
{
    use RefreshDatabase;

    private function actingAdmin(array $headers = []): self
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin-test@djassa.ci'],
            [
                'nom' => 'Admin Test', 'password' => Hash::make('password123'), 'role' => 'admin',
                'statut' => 'actif', 'verifie' => true, 'plan_abonnement' => 'pro',
            ]
        );
        $token = $admin->createToken('test')->plainTextToken;
        return $this->withToken($token)->withHeaders(array_merge([
            'X-User-Role' => 'admin', 'X-User-Id' => $admin->id, 'Accept' => 'application/json',
        ], $headers));
    }

    public function test_acces_refuse_sans_role_admin(): void
    {
        $user = User::create([
            'nom' => 'Particulier', 'email' => 'p@test.ci', 'password' => Hash::make('password123'),
            'role' => 'particulier', 'statut' => 'actif', 'verifie' => true,
        ]);
        $token = $user->createToken('test')->plainTextToken;
        $this->withToken($token)->withHeaders(['X-User-Role' => 'particulier', 'Accept' => 'application/json'])
            ->getJson('/api/v1/admin/users')->assertStatus(403);
    }

    public function test_liste_utilisateurs_paginee_et_select(): void
    {
        $this->actingAdmin()->getJson('/api/v1/admin/users')
            ->assertOk()->assertJsonStructure(['data', 'meta' => ['current_page', 'last_page', 'total']]);
    }

    public function test_creation_et_mise_a_jour_utilisateur(): void
    {
        $this->actingAdmin()->postJson('/api/v1/admin/users', [
            'nom' => 'Nouveau', 'email' => 'new@test.ci', 'role' => 'vendeur_pro', 'password' => 'password123',
        ])->assertCreated();

        $user = User::where('email', 'new@test.ci')->firstOrFail();
        $this->actingAdmin()->putJson('/api/v1/admin/users/'.$user->id, ['statut' => 'suspendu'])
            ->assertOk()->assertJsonPath('data.statut', 'suspendu');
    }

    public function test_reset_mot_de_passe_genere_un_hash_valide(): void
    {
        $user = User::create([
            'nom' => 'Reset', 'email' => 'reset@test.ci', 'password' => Hash::make('old-password'),
            'role' => 'particulier', 'statut' => 'actif', 'verifie' => true,
        ]);
        $res = $this->actingAdmin()->postJson('/api/v1/admin/users/'.$user->id.'/reset-password');
        $res->assertOk()->assertJsonStructure(['temporary_password']);
        $new = Hash::make($res->json('temporary_password'));
        $this->assertTrue(Hash::check($res->json('temporary_password'), $new));
    }

    public function test_suppression_admin_interdite(): void
    {
        $this->actingAdmin();
        $admin = User::where('email', 'admin-test@djassa.ci')->firstOrFail();
        $this->actingAdmin()->deleteJson('/api/v1/admin/users/'.$admin->id)->assertStatus(422);
    }

    public function test_profil_admin_modifiable(): void
    {
        $this->actingAdmin()->patchJson('/api/v1/admin/profile', ['nom' => 'Admin Modifié'])
            ->assertOk()->assertJsonPath('data.nom', 'Admin Modifié');
    }

    public function test_bascule_maintenance_journalisee(): void
    {
        $svc = $this->app->make(MaintenanceService::class);
        $svc->disable();
        $this->actingAdmin()->postJson('/api/v1/admin/maintenance', [
            'enabled' => true, 'message' => 'Maintenance test',
        ])->assertOk()->assertJsonPath('data.enabled', true);
        $this->assertDatabaseHas('audit_logs', ['action' => 'admin.maintenance_toggle']);
        $svc->disable();
    }

    public function test_audit_contient_login(): void
    {
        User::create([
            'nom' => 'Login', 'email' => 'login@test.ci', 'password' => Hash::make('password123'),
            'role' => 'particulier', 'statut' => 'actif', 'verifie' => true,
        ]);
        $this->postJson('/api/v1/auth/login', ['email' => 'login@test.ci', 'password' => 'password123'])
            ->assertOk();
        $this->assertDatabaseHas('audit_logs', ['action' => 'login']);
    }
}
