<?php
namespace Tests\Feature;

use App\Models\Boutique;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminBoutiqueTest extends TestCase
{
    use RefreshDatabase;

    public function test_acces_refuse_sans_role_admin(): void
    {
        $this->withHeaders(['X-User-Role' => 'particulier', 'Accept' => 'application/json'])
            ->getJson('/api/v1/admin/catalog/boutiques')->assertStatus(403);
    }

    public function test_liste_boutiques_paginee(): void
    {
        Boutique::create([
            'utilisateur_id' => '22222222-2222-4222-8222-222222222222',
            'nom_boutique' => 'Test Shop', 'slug' => 'test-shop',
            'telephone' => '+2250700000000', 'categorie' => 'High-Tech', 'is_active' => true,
        ]);
        $this->withHeaders(['X-User-Role' => 'admin', 'Accept' => 'application/json'])
            ->getJson('/api/v1/admin/catalog/boutiques')
            ->assertOk()->assertJsonStructure(['data', 'meta' => ['current_page', 'total']]);
    }

    public function test_finances_aggegees(): void
    {
        $this->withHeaders(['X-User-Role' => 'admin', 'Accept' => 'application/json'])
            ->getJson('/api/v1/admin/catalog/boutiques/finances')
            ->assertOk()->assertJsonStructure(['data', 'totaux' => ['chiffre_affaires', 'fonds_held', 'fonds_released']]);
    }
}
