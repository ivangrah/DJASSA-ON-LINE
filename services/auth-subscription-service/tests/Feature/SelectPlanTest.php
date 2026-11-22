<?php
namespace Tests\Feature;
use App\Models\Abonnement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
class SelectPlanTest extends TestCase
{
    use RefreshDatabase;

    private function userWithToken(array $attrs = []): array
    {
        $u = User::create(array_replace([
            'nom' => 'Plan Test', 'email' => uniqid().'@example.ci',
            'password' => bcrypt('password123'), 'role' => User::ROLE_PARTICULIER,
            'plan_abonnement' => null,
        ], $attrs));

        return [$u, $u->createToken('test')->plainTextToken];
    }

    public function test_choix_pro_ne_donne_pas_le_role_vendeur_pro(): void
    {
        [$user, $token] = $this->userWithToken();
        $this->withToken($token)->postJson('/api/v1/auth/select-plan', ['plan' => 'pro'])->assertStatus(200);

        $user->refresh();
        $this->assertSame(User::ROLE_PARTICULIER, $user->role);
        $this->assertSame(User::PLAN_GRATUIT, $user->plan_abonnement);
        $this->assertSame(1, Abonnement::where('utilisateur_id', $user->id)->where('statut', Abonnement::STATUT_PENDING)->count());
    }

    public function test_choix_n_est_pas_rejouable(): void
    {
        [$user, $token] = $this->userWithToken();
        $this->withToken($token)->postJson('/api/v1/auth/select-plan', ['plan' => 'gratuit'])->assertStatus(200);
        $this->withToken($token)->postJson('/api/v1/auth/select-plan', ['plan' => 'pro'])->assertStatus(422);
    }

    public function test_admin_exclu(): void
    {
        [$admin, $token] = $this->userWithToken(['role' => User::ROLE_ADMIN]);
        $this->withToken($token)->postJson('/api/v1/auth/select-plan', ['plan' => 'gratuit'])->assertStatus(422);
    }
}
