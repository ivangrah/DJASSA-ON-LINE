<?php
namespace Tests\Feature;
use App\Console\Commands\ConsumeTrocEvents;
use App\Models\OffreTroc;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
class InternalApiTest extends TestCase
{
    use RefreshDatabase;

    private function offre(): OffreTroc
    {
        return OffreTroc::create([
            'article_cible_id'=>self::CIBLE,'acheteur_id'=>self::ACHETEUR,'vendeur_id'=>self::VENDEUR,
            'montant_soulte_fcfa'=>0,'statut'=>OffreTroc::STATUT_ACCEPTED,
            'reference'=>'DJASSA-TROC-E2E',
        ]);
    }

    public function test_appel_sans_signature_est_refuse(): void
    {
        $this->getJson('/internal/troc/offres/'.(string)\Illuminate\Support\Str::uuid())->assertStatus(401);
    }

    public function test_lecture_offre_signe(): void
    {
        $offre = $this->offre();
        $path = '/internal/troc/offres/'.$offre->id;
        $this->withHeaders($this->signed('GET', $path))->getJson($path)
            ->assertStatus(200)->assertJsonPath('reference', 'DJASSA-TROC-E2E');
    }

    public function test_cloture_offre_signee(): void
    {
        $offre = $this->offre();
        $path = '/internal/troc/offres/'.$offre->id.'/complete';
        $this->withHeaders($this->signed('POST', $path))->postJson($path)->assertStatus(200);
        $this->assertSame(OffreTroc::STATUT_COMPLETED, $offre->fresh()->statut);
    }

    public function test_escrow_released_cloture_loffre(): void
    {
        $offre = $this->offre();
        app(ConsumeTrocEvents::class)->handleEvent('escrow.released', ['reference'=>$offre->reference]);
        $this->assertSame(OffreTroc::STATUT_COMPLETED, $offre->fresh()->statut);
    }
}
