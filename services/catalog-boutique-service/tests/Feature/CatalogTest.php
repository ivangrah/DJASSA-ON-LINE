<?php
namespace Tests\Feature;
use App\Models\Article;
use App\Models\Boutique;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
class CatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_feed_est_pagine_et_ne_selectionne_que_les_colonnes_utiles(): void
    {
        $this->article(['titre' => 'Vélo', 'description' => 'Description secrète']);
        $r = $this->getJson('/api/v1/products?q=Vélo')->assertStatus(200);
        $r->assertJsonStructure(['data', 'meta' => ['current_page','last_page','per_page','total']]);
        $this->assertSame('Vélo', $r->json('data.0.titre'));
        $r->assertJsonMissing(['description' => 'Description secrète']); // filtre foliage
    }

    public function test_cache_redis_sert_le_feed_sans_recalcul(): void
    {
        $this->article();
        $this->getJson('/api/v1/products')->assertStatus(200);
        $first = $this->cache->calls;
        $this->getJson('/api/v1/products')->assertStatus(200);
        $this->assertSame($first, $this->cache->calls);
    }

    public function test_invalidation_du_cache_a_la_creation(): void
    {
        $this->getJson('/api/v1/products')->assertStatus(200);
        $this->withHeaders(['X-User-Id' => '33333333-3333-4333-8333-333333333333', 'X-User-Role' => 'particulier'])
            ->postJson('/api/v1/products', ['titre'=>'Nouveau','prix'=>500,'categorie'=>'Mode'])
            ->assertStatus(201);
        $this->assertSame([], $this->cache->store);
    }

    public function test_boutique_publique_par_slug(): void
    {
        Boutique::create([
            'utilisateur_id' => '44444444-4444-4444-8444-444444444444',
            'nom_boutique' => 'Boutique Cache', 'slug' => 'boutique-cache', 'telephone' => '+2250700000000', 'categorie' => 'Mode',
        ]);
        $this->getJson('/api/v1/boutiques/boutique-cache')->assertStatus(200)->assertJsonPath('data.slug', 'boutique-cache');
    }
}
