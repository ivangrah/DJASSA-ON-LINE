<?php

namespace Tests\Feature;

use App\Models\Transaction;
use App\Services\EscrowService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use RuntimeException;
use Tests\TestCase;

class PinValidationBruteForceTest extends TestCase
{
    use RefreshDatabase;

    private function transaction(int $tentatives = 0): Transaction
    {
        return Transaction::create([
            'acheteur_id' => (string) Str::uuid(),
            'vendeur_id' => $vendeur = (string) Str::uuid(),
            'article_id' => (string) Str::uuid(),
            'montant' => 10000,
            'escrow_status' => Transaction::ESCROW_HELD,
            'pin_hash' => Hash::make('1234'),
            'pin_attempts' => $tentatives,
        ]);
    }

    public function test_pin_mal_forme_est_rejete(): void
    {
        $tx = $this->transaction();

        $this->withHeader('X-User-Id', $tx->vendeur_id)
            ->postJson('/api/v1/escrow/transactions/'.$tx->id.'/verify-pin', ['pin' => '123'])
            ->assertStatus(422);
    }

    public function test_cinquieme_tentative_erronee_verrouille_le_pin(): void
    {
        $tx = $this->transaction(Transaction::PIN_MAX_TENTATIVES);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionCode(423);
        app(EscrowService::class)->verifierPin($tx, $tx->vendeur_id, '0000');
    }

    public function test_pin_hash_n_est_jamais_serie(): void
    {
        $tx = $this->transaction();

        $this->withHeader('X-User-Id', $tx->vendeur_id)
            ->postJson('/api/v1/escrow/transactions/'.$tx->id.'/verify-pin', ['pin' => '123'])
            ->assertStatus(422)
            ->assertJsonMissing(['pin_hash' => $tx->pin_hash]);
    }

    public function test_pin_valide_appelle_les_domaines_via_api_interne_et_publie_levement(): void
    {
        $tx = $this->transaction();
        $result = app(EscrowService::class)->verifierPin($tx, $tx->vendeur_id, '1234');

        $this->assertSame(Transaction::ESCROW_RELEASED, $result->escrow_status);
        $this->assertContains('creditWallet', array_column($this->internal->calls, 0));
        $this->assertContains('setArticleStatut', array_column($this->internal->calls, 0));
        $this->assertContains('escrow.released', array_column($this->events->events, 'event'));
        $this->assertStringNotContainsString('pin', json_encode($this->events->events));
    }
}
