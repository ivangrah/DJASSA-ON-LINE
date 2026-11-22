<?php

namespace Tests\Feature;

use App\Models\Abonnement;
use App\Models\Article;
use App\Models\OffreTroc;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/** Récepteurs /internal/* signés — la gateway ne doit jamais les exposer publiquement. */
class InternalApiTest extends TestCase
{
    use RefreshDatabase;

    private const KEY = 'test-internal-key';

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.internal.signing_key' => self::KEY]);
    }

    private function signed(string $method, string $path, array $payload = [], ?string $rawBody = null): array
    {
        $body = $rawBody ?? ($payload === [] ? '' : json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));

        return [
            'X-Djassa-Signature' => hash_hmac('sha256', $method."\n".$path."\n".$body, self::KEY),
            'Content-Type' => 'application/json',
        ];
    }

    public function test_appel_sans_signature_est_refuse(): void
    {
        $this->getJson('/internal/catalog/articles/'.(string) Str::uuid())->assertStatus(401);
    }

    public function test_signature_invalide_est_refusee(): void
    {
        $this->withHeader('X-Djassa-Signature', 'mauvaise')
            ->getJson('/internal/catalog/articles/'.(string) Str::uuid())->assertStatus(401);
    }

    public function test_lecture_article_ne_selectionne_que_les_colonnes_utiles(): void
    {
        $user = User::factory()->create();
        $article = Article::create([
            'utilisateur_id' => $user->id, 'titre' => 'Article interne', 'prix' => 9000,
            'description' => 'Description sensible pour le test', 'categorie' => 'High-Tech',
        ]);
        $path = '/internal/catalog/articles/'.$article->id;

        $this->withHeaders($this->signed('GET', $path, [], ''))->getJson($path)
            ->assertStatus(200)
            ->assertJsonPath('id', $article->id)
            ->assertJsonMissing(['description' => 'Description sensible pour le test']);
    }

    public function test_mise_a_jour_statut_article(): void
    {
        $user = User::factory()->create();
        $article = Article::create([
            'utilisateur_id' => $user->id, 'titre' => 'Article statut', 'prix' => 5000, 'categorie' => 'Mode',
        ]);
        $path = '/internal/catalog/articles/'.$article->id.'/statut';

        $this->withHeaders($this->signed('POST', $path, ['statut' => Article::STATUT_RESERVED]))
            ->postJson($path, ['statut' => Article::STATUT_RESERVED])
            ->assertStatus(200);

        $this->assertSame(Article::STATUT_RESERVED, $article->fresh()->statut);
    }

    public function test_credit_portefeuille(): void
    {
        $user = User::factory()->create(['solde_portefeuille' => 1000]);
        $path = '/internal/auth/users/'.$user->id.'/wallet/credit';

        $this->withHeaders($this->signed('POST', $path, ['montant' => 2500]))
            ->postJson($path, ['montant' => 2500])
            ->assertStatus(200);

        $this->assertEquals(3500, $user->fresh()->solde_portefeuille);
    }

    public function test_cloture_offre_troc(): void
    {
        $acheteur = User::factory()->create();
        $vendeur = User::factory()->create();
        $article = Article::create([
            'utilisateur_id' => $vendeur->id, 'titre' => 'Cible troc', 'prix' => 7000, 'categorie' => 'Sport',
        ]);
        $offre = OffreTroc::create([
            'article_cible_id' => $article->id, 'acheteur_id' => $acheteur->id,
            'vendeur_id' => $vendeur->id, 'statut' => OffreTroc::STATUT_ACCEPTED,
            'montant_soulte_fcfa' => 0,
        ]);
        $path = '/internal/troc/offres/'.$offre->id.'/complete';

        $this->withHeaders($this->signed('POST', $path))->postJson($path)->assertStatus(200);

        $this->assertSame(OffreTroc::STATUT_COMPLETED, $offre->fresh()->statut);
    }
}
