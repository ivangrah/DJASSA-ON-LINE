<?php
namespace Tests\Feature;
use App\Models\Boutique;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
class RoleIsolationTest extends TestCase
{
    use RefreshDatabase;
    private const BUYER = '55555555-5555-4555-8555-555555555555';
    private const PRO = '66666666-6666-4666-8666-666666666666';

    public function test_particulier_ne_peut_pas_ouvrir_de_boutique(): void
    {
        $this->withHeaders(['X-User-Id' => self::BUYER, 'X-User-Role' => 'particulier'])
            ->postJson('/api/v1/boutiques', [
                'nom_boutique' => 'Interdite', 'telephone' => '+2250700000000', 'categorie' => 'Mode',
            ])->assertStatus(403);
    }

    public function test_vendeur_pro_peut_ouvrir_une_boutique(): void
    {
        $this->withHeaders(['X-User-Id' => self::PRO, 'X-User-Role' => 'vendeur_pro'])
            ->postJson('/api/v1/boutiques', [
                'nom_boutique' => 'Autorisée', 'telephone' => '+2250700000000', 'categorie' => 'Mode',
            ])->assertStatus(201)->assertJsonPath('data.slug', 'autorisee');
        $this->assertSame(1, Boutique::count());
    }

    public function test_article_neuf_sans_boutique_est_refuse(): void
    {
        $this->withHeaders(['X-User-Id' => self::PRO, 'X-User-Role' => 'vendeur_pro'])
            ->postJson('/api/v1/products', [
                'titre' => 'Neuf', 'prix' => 5000, 'categorie' => 'High-Tech', 'condition' => 'neuf',
            ])->assertStatus(403);
    }
}
