<?php

namespace Tests\Feature;

use App\Models\Deal;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DealTest extends TestCase
{
    use RefreshDatabase;

    private function proposer(array $extra = []): array
    {
        $conversation = \App\Models\Conversation::query()->first() ?? $this->conversation();

        return $this->withHeader('X-User-Id', self::USER)
            ->postJson('/api/v1/deals', array_merge([
                'conversation_id' => $conversation->id,
                'article_id' => $conversation->article_id,
                'montant_fcfa' => 45000,
                'lieu_remise' => 'Abidjan, Marcory',
            ], $extra))
            ->assertStatus(201)
            ->json('data');
    }

    public function test_proposition_deal_est_creee_et_notifie_l_autre_partie(): void
    {
        $data = $this->proposer();

        $this->assertSame(Deal::STATUT_PROPOSED, $data['statut']);
        $this->assertSame(self::USER, $data['propose_par']);
        $this->assertSame('45000.00', $data['montant_fcfa']);

        $this->assertDatabaseHas('notifications', [
            'user_id' => self::OTHER,
            'type' => 'deal',
            'source_reference' => $data['id'],
        ]);
    }

    public function test_liste_des_deals_est_reservee_aux_participants(): void
    {
        $conversation = $this->conversation();
        $this->proposer();

        $this->withHeader('X-User-Id', self::USER)
            ->getJson('/api/v1/deals?conversation_id='.$conversation->id)
            ->assertStatus(200)
            ->assertJsonPath('data.0.statut', Deal::STATUT_PROPOSED);

        $this->withHeader('X-User-Id', '99999999-9999-4999-8999-999999999999')
            ->getJson('/api/v1/deals?conversation_id='.$conversation->id)
            ->assertStatus(403);
    }

    public function test_contre_proposition_bascule_le_deal_en_countered(): void
    {
        $deal = $this->proposer();

        $this->withHeader('X-User-Id', self::OTHER)
            ->patchJson('/api/v1/deals/'.$deal['id'].'/respond', [
                'action' => 'counter',
                'montant_fcfa' => 40000,
                'lieu_remise' => 'Abidjan, Cocody',
            ])
            ->assertStatus(200)
            ->assertJsonPath('data.statut', Deal::STATUT_COUNTERED)
            ->assertJsonPath('data.propose_par', self::OTHER)
            ->assertJsonPath('data.montant_fcfa', '40000.00');
    }

    public function test_acceptation_par_le_proposant_est_refusee(): void
    {
        $deal = $this->proposer();

        $this->withHeader('X-User-Id', self::USER)
            ->patchJson('/api/v1/deals/'.$deal['id'].'/respond', ['action' => 'accept'])
            ->assertStatus(422);
    }

    public function test_acceptation_aboutit_au_statut_accepted(): void
    {
        $deal = $this->proposer();

        $this->withHeader('X-User-Id', self::OTHER)
            ->patchJson('/api/v1/deals/'.$deal['id'].'/respond', ['action' => 'accept'])
            ->assertStatus(200)
            ->assertJsonPath('data.statut', Deal::STATUT_ACCEPTED);
    }

    public function test_contre_proposition_sans_montant_est_rejetee(): void
    {
        $deal = $this->proposer();

        $this->withHeader('X-User-Id', self::OTHER)
            ->patchJson('/api/v1/deals/'.$deal['id'].'/respond', ['action' => 'counter'])
            ->assertStatus(422);
    }
}
