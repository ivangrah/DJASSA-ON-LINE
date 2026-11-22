<?php
namespace Tests\Feature;
use App\Models\Article;
use App\Models\Boutique;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
class InternalApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_appel_sans_signature_est_refuse(): void
    {
        $this->getJson('/internal/catalog/articles/'.(string) \Illuminate\Support\Str::uuid())->assertStatus(401);
    }

    public function test_lecture_article_signe(): void
    {
        $article = $this->article();
        $path = '/internal/catalog/articles/'.$article->id;
        $this->withHeaders($this->signed('GET', $path))->getJson($path)
            ->assertStatus(200)->assertJsonPath('id', $article->id);
    }

    public function test_maj_statut_invalide_cache(): void
    {
        $article = $this->article();
        $path = '/internal/catalog/articles/'.$article->id.'/statut';
        $this->withHeaders($this->signed('POST', $path, ['statut' => Article::STATUT_RESERVED]))
            ->postJson($path, ['statut' => Article::STATUT_RESERVED])->assertStatus(200);
        $this->assertSame(Article::STATUT_RESERVED, $article->fresh()->statut);
    }

    public function test_boutique_par_utilisateur(): void
    {
        Boutique::create([
            'utilisateur_id' => '77777777-7777-4777-8777-777777777777',
            'nom_boutique' => 'Interne', 'slug' => 'interne', 'telephone' => '+2250700000000', 'categorie' => 'Mode',
        ]);
        $path = '/internal/catalog/boutiques/by-user/77777777-7777-4777-8777-777777777777';
        $this->withHeaders($this->signed('GET', $path))->getJson($path)
            ->assertStatus(200)->assertJsonPath('boutique.slug', 'interne');
    }
}
