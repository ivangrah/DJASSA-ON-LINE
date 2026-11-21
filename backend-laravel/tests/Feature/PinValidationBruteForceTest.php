<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Transaction;
use App\Models\User;
use App\Services\EscrowService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use RuntimeException;
use Tests\TestCase;

/** Règle : PIN 4 chiffres, haché, verrouillé après 5 tentatives, jamais exposé. */
class PinValidationBruteForceTest extends TestCase
{
    use RefreshDatabase;

    private function transaction(User $vendeur, User $acheteur, int $tentatives): Transaction
    {
        $article = Article::create([
            'utilisateur_id' => $vendeur->id,
            'titre' => 'Article escrow',
            'prix' => 10000,
            'categorie' => 'High-Tech',
            'statut' => Article::STATUT_PUBLISHED,
        ]);

        return Transaction::create([
            'acheteur_id' => $acheteur->id,
            'vendeur_id' => $vendeur->id,
            'article_id' => $article->id,
            'montant' => 10000,
            'escrow_status' => Transaction::ESCROW_HELD,
            'pin_hash' => Hash::make('1234'),
            'pin_attempts' => $tentatives,
        ]);
    }

    public function test_pin_mal_forme_est_rejete(): void
    {
        $vendeur = User::factory()->create(['role' => User::ROLE_VENDEUR_PRO]);
        $acheteur = User::factory()->create();
        $tx = $this->transaction($vendeur, $acheteur, 0);

        $this->actingAs($vendeur)
            ->postJson("/api/v1/transactions/{$tx->id}/verify-pin", ['pin' => '123'])
            ->assertStatus(422);
    }

    public function test_cinquieme_tentative_erronee_verrouille_le_pin(): void
    {
        $vendeur = User::factory()->create(['role' => User::ROLE_VENDEUR_PRO]);
        $acheteur = User::factory()->create();
        $tx = $this->transaction($vendeur, $acheteur, Transaction::PIN_MAX_TENTATIVES);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionCode(423);
        $this->expectExceptionMessage('bloqué');

        app(EscrowService::class)->verifierPin($tx, $vendeur, '0000');
    }

    public function test_pin_hash_n_est_jamais_serie_dans_la_reponse(): void
    {
        $vendeur = User::factory()->create(['role' => User::ROLE_VENDEUR_PRO]);
        $acheteur = User::factory()->create();
        $tx = $this->transaction($vendeur, $acheteur, 0);

        $this->actingAs($vendeur)
            ->postJson("/api/v1/transactions/{$tx->id}/verify-pin", ['pin' => '123'])
            ->assertStatus(422)
            ->assertJsonMissing(['pin_hash' => $tx->pin_hash]);
    }
}
