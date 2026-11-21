<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\User;
use App\Services\BarterService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use RuntimeException;
use Tests\TestCase;

/** Règle : personne ne peut proposer un troc sur son propre article. */
class AntiAutoTrocTest extends TestCase
{
    use RefreshDatabase;

    private function article(User $user): Article
    {
        return Article::create([
            'utilisateur_id' => $user->id,
            'titre' => 'Vélo de ville',
            'prix' => 25000,
            'categorie' => 'Sport',
            'mode_transaction' => Article::MODE_TROC,
            'est_trocable' => true,
            'statut' => Article::STATUT_PUBLISHED,
        ]);
    }

    public function test_proprietaire_ne_peut_pas_proposer_troc_sur_son_article(): void
    {
        $user = User::factory()->create();
        $article = $this->article($user);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('propre article');

        app(BarterService::class)->proposer($user, $article, [$article->id], 0, null);
    }

    public function test_un_article_non_trocable_est_refuse(): void
    {
        $owner = User::factory()->create();
        $autre = User::factory()->create();
        $article = $this->article($owner);
        $article->update(['est_trocable' => false, 'mode_transaction' => Article::MODE_VENTE]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('n’accepte pas le troc');

        app(BarterService::class)->proposer($autre, $article->fresh(), [], 0, null);
    }
}
