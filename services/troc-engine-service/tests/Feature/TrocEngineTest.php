<?php
namespace Tests\Feature;
use App\Models\OffreTroc;
use App\Models\VerrouStock;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
class TrocEngineTest extends TestCase
{
    use RefreshDatabase;

    public function test_anti_auto_troc_est_bloque(): void
    {
        $this->internal->articles[self::CIBLE]['utilisateur_id'] = self::ACHETEUR;
        $this->withHeader('X-User-Id', self::ACHETEUR)->postJson('/api/v1/trocs', $this->payload())
            ->assertStatus(422)->assertJsonPath('message', 'Vous ne pouvez pas proposer un troc sur votre propre article.');
        $this->assertSame(0, OffreTroc::count());
    }

    public function test_article_cible_non_publie_est_refuse(): void
    {
        $this->internal->articles[self::CIBLE]['statut'] = 'sold';
        $this->withHeader('X-User-Id', self::ACHETEUR)->postJson('/api/v1/trocs', $this->payload())
            ->assertStatus(422);
    }

    public function test_troc_pur_cree_verrous_sans_checkout(): void
    {
        $r = $this->withHeader('X-User-Id', self::ACHETEUR)->postJson('/api/v1/trocs', $this->payload())
            ->assertStatus(201);
        $this->assertSame(2, VerrouStock::count());
        $this->assertSame([], $this->internal->checkoutCalls);
        $this->assertContains('troc.offre_created', array_column($this->events->events, 'event'));
        $offre = OffreTroc::first();
        $this->assertStringStartsWith('DJASSA-TROC-', $offre->reference);
        $r->assertJsonPath('data.est_troc_pur', true);
    }

    public function test_troc_mixte_cree_une_intention_checkout(): void
    {
        $this->withHeader('X-User-Id', self::ACHETEUR)
            ->postJson('/api/v1/trocs', $this->payload(['montant_soulte_fcfa'=>2500]))
            ->assertStatus(201);
        $this->assertCount(1, $this->internal->checkoutCalls);
        $this->assertSame(2500.0, $this->internal->checkoutCalls[0][2]);
        $event = collect($this->events->events)->firstWhere('event', 'troc.offre_created');
        $this->assertSame('mixte', $event['payload']['type']);
    }

    public function test_article_offert_appartenant_a_un_autre_est_refuse(): void
    {
        $this->internal->articles[self::OFFERT]['utilisateur_id'] = self::VENDEUR;
        $this->withHeader('X-User-Id', self::ACHETEUR)->postJson('/api/v1/trocs', $this->payload())
            ->assertStatus(422);
    }
}
