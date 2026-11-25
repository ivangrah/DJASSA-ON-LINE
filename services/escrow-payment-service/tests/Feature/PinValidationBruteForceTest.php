<?php

namespace Tests\Feature;

use App\Models\Transaction;
use App\Services\EscrowService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
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

    public function test_pin_hache_avec_pepper_est_accepte(): void
    {
        config()->set('services.security.pin_pepper', 'pepper-de-test');

        $tx = Transaction::create([
            'acheteur_id' => (string) Str::uuid(),
            'vendeur_id' => (string) Str::uuid(),
            'article_id' => (string) Str::uuid(),
            'montant' => 10000,
            'escrow_status' => Transaction::ESCROW_HELD,
            'pin_hash' => Hash::make('1234'.'pepper-de-test'),
        ]);

        $result = app(EscrowService::class)->verifierPin($tx, $tx->vendeur_id, '1234');
        $this->assertSame(Transaction::ESCROW_RELEASED, $result->escrow_status);
    }

    public function test_pin_hache_sans_pepper_reste_accepte_en_retrocompatibilite(): void
    {
        config()->set('services.security.pin_pepper', 'pepper-de-test');

        $tx = $this->transaction(); // Hash::make('1234') sans pepper
        $result = app(EscrowService::class)->verifierPin($tx, $tx->vendeur_id, '1234');

        $this->assertSame(Transaction::ESCROW_RELEASED, $result->escrow_status);
    }

    public function test_limite_ip_bloque_apres_trop_d_echecs(): void
    {
        config()->set('services.security.pin_ip_attempts', 2);
        $ip = '203.0.113.'.random_int(1, 254);
        $key = 'pin-verify|'.hash('sha256', $ip);
        RateLimiter::clear($key);

        $tx = $this->transaction();
        for ($i = 0; $i < 2; $i++) {
            try {
                app(EscrowService::class)->verifierPin($tx, $tx->vendeur_id, '0000', $ip);
                $this->fail('Une tentative erronée devait lever une exception.');
            } catch (RuntimeException $e) {
                $this->assertNotSame(429, $e->getCode());
            }
        }

        $this->expectException(RuntimeException::class);
        $this->expectExceptionCode(429);
        app(EscrowService::class)->verifierPin($tx, $tx->vendeur_id, '0000', $ip);
    }
}
