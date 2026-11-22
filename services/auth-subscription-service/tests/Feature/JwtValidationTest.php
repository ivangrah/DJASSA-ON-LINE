<?php
namespace Tests\Feature;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
class JwtValidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_validation_jwt_renvoie_les_headers_pour_la_gateway(): void
    {
        $user = User::create([
            'nom' => 'JWT Test', 'email' => 'jwt@example.ci', 'password' => bcrypt('password123'),
            'role' => User::ROLE_VENDEUR_PRO, 'plan_abonnement' => User::PLAN_PRO,
            'abonnement_actif_jusqu_au' => now()->addMonth(),
        ]);
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withToken($token)
            ->withHeader('X-Gateway-Internal', '1')
            ->getJson('/internal/jwt/validate');

        $response->assertStatus(200)
            ->assertHeader('X-User-Id', $user->id)
            ->assertHeader('X-User-Role', User::ROLE_VENDEUR_PRO);
    }

    public function test_token_invalide_est_refuse(): void
    {
        $this->withToken('token-invalide')->withHeader('X-Gateway-Internal', '1')
            ->getJson('/internal/jwt/validate')->assertStatus(401);
    }

    public function test_appel_sans_autorisation_interne_est_refuse(): void
    {
        $this->getJson('/internal/jwt/validate')->assertStatus(401);
    }
}
