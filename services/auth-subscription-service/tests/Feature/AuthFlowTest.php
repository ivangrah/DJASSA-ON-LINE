<?php
namespace Tests\Feature;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
class AuthFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_inscription_cree_un_particulier_sans_plan(): void
    {
        $r = $this->postJson('/api/v1/auth/register', [
            'nom' => 'Aya Test', 'email' => 'aya-test@example.ci',
            'telephone' => '+2250700000001', 'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertStatus(200);

        $r->assertJsonPath('user.role', User::ROLE_PARTICULIER)
          ->assertJsonPath('user.plan_abonnement', null)
          ->assertJsonPath('user.needs_plan', true)
          ->assertJsonStructure(['token']);
    }

    public function test_login_valide_et_invalide(): void
    {
        $user = User::create([
            'nom' => 'Login Test', 'email' => 'login@example.ci',
            'password' => bcrypt('password123'), 'role' => User::ROLE_PARTICULIER,
        ]);

        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'password123'])
            ->assertStatus(200)->assertJsonStructure(['token']);
        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'mauvais'])
            ->assertStatus(401);
    }

    public function test_me_renvoie_le_contrat_user(): void
    {
        $user = User::create([
            'nom' => 'Me Test', 'email' => 'me@example.ci', 'password' => bcrypt('password123'),
            'role' => User::ROLE_PARTICULIER, 'plan_abonnement' => User::PLAN_GRATUIT,
        ]);
        $token = $user->createToken('test')->plainTextToken;

        $this->withToken($token)->getJson('/api/v1/auth/me')
            ->assertStatus(200)
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonPath('user.needs_plan', false);
    }
}
