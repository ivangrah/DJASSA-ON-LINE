<?php

namespace Tests\Feature;

use App\Models\Transaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class DisputedEscrowStatusTest extends TestCase
{
    use RefreshDatabase;

    public function test_constante_disputed_est_define(): void
    {
        $this->assertSame('disputed', Transaction::ESCROW_DISPUTED);
    }

    public function test_contrainte_check_accepte_le_statut_disputed(): void
    {
        $tx = Transaction::create([
            'acheteur_id' => (string) Str::uuid(),
            'vendeur_id' => (string) Str::uuid(),
            'article_id' => (string) Str::uuid(),
            'montant' => 10000,
            'escrow_status' => Transaction::ESCROW_DISPUTED,
        ]);

        $this->assertSame(Transaction::ESCROW_DISPUTED, $tx->fresh()->escrow_status);
    }

    public function test_contrainte_check_refuse_un_statut_inconnu(): void
    {
        $this->expectException(\Illuminate\Database\QueryException::class);

        Transaction::create([
            'acheteur_id' => (string) Str::uuid(),
            'vendeur_id' => (string) Str::uuid(),
            'article_id' => (string) Str::uuid(),
            'montant' => 10000,
            'escrow_status' => 'inconnu',
        ]);
    }
}
