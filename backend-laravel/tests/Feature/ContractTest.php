<?php

namespace Tests\Feature;

use App\Models\Abonnement;
use App\Models\Article;
use App\Models\Boutique;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Tests de contrat : les réponses JSON de l'API doivent respecter les schémas
 * de models/schemas/ (Single Source of Truth partagée avec les frontends).
 *
 * Validateur minimal (sans dépendance) : types, champs requis, enums et propriétés imbriquées.
 */
class ContractTest extends TestCase
{
    use RefreshDatabase;

    private function schema(string $name): array
    {
        $dir = is_dir('/repo/models/schemas') ? '/repo/models/schemas' : base_path('../models/schemas');
        $path = $dir.'/'.$name;

        $this->assertFileExists($path, "Schéma introuvable : $path");

        return json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
    }

    private function assertMatchesSchema(array $schema, mixed $value, string $path = '$'): void
    {
        $types = (array) ($schema['type'] ?? []);
        $ok = false;

        foreach ($types as $type) {
            $ok = match ($type) {
                'object'   => $ok || (is_array($value) && (! array_is_list($value) || $value === [])),
                'array'    => $ok || (is_array($value) && array_is_list($value)),
                'string'   => $ok || is_string($value),
                'boolean'  => $ok || is_bool($value),
                'integer'  => $ok || is_int($value),
                'number'   => $ok || (is_int($value) || is_float($value)),
                'null'     => $ok || $value === null,
                default    => $ok,
            };
        }

        if ($types !== []) {
            $this->assertTrue($ok, "Type invalide à $path (attendu : ".implode('|', $types).')');
        }

        if (isset($schema['enum'])) {
            $this->assertContains($value, $schema['enum'], "Valeur hors enum à $path");
        }

        if (! is_array($value)) {
            return;
        }

        foreach ($schema['required'] ?? [] as $field) {
            $this->assertArrayHasKey($field, $value, "Champ requis absent à $path.$field");
        }

        foreach ($schema['properties'] ?? [] as $field => $subSchema) {
            if (array_key_exists($field, $value)) {
                $this->assertMatchesSchema($subSchema, $value[$field], "$path.$field");
            }
        }

        foreach ($schema['items'] ?? [] as $subSchema) {
            foreach (array_is_list($value) ? $value : [] as $i => $item) {
                $this->assertMatchesSchema($subSchema, $item, "$path[$i]");
            }
        }
    }

    public function test_reponse_auth_me_respecte_le_schema_user(): void
    {
        $user = User::factory()->create(['role' => User::ROLE_PARTICULIER]);

        $response = $this->actingAs($user)->getJson('/api/v1/auth/me')->assertStatus(200);

        $this->assertMatchesSchema($this->schema('user.schema.json'), $response->json('user'));
    }

    public function test_reponse_products_respecte_le_schema_article(): void
    {
        $user = User::factory()->create();
        Article::create([
            'utilisateur_id' => $user->id,
            'titre' => 'Vélo de ville',
            'prix' => 25000,
            'categorie' => 'Sport',
            'statut' => Article::STATUT_PUBLISHED,
        ]);

        $response = $this->getJson('/api/v1/products')->assertStatus(200);
        $items = $response->json('data');

        $this->assertNotEmpty($items);
        foreach ($items as $item) {
            $this->assertMatchesSchema($this->schema('article.schema.json'), $item);
        }
    }

    public function test_reponse_boutique_respecte_le_schema_boutique(): void
    {
        $pro = User::factory()->create(['role' => User::ROLE_VENDEUR_PRO]);
        $boutique = Boutique::create([
            'utilisateur_id' => $pro->id,
            'nom_boutique' => 'Boutique Contrat',
            'slug' => 'boutique-contrat',
            'telephone' => '+2250700000000',
            'categorie' => 'Mode',
        ]);

        $response = $this->getJson('/api/v1/boutiques/'.$boutique->slug)->assertStatus(200);

        $this->assertMatchesSchema($this->schema('boutique.schema.json'), $response->json('boutique'));
    }

    public function test_payload_webhook_respecte_le_schema_et_la_reponse_est_conforme(): void
    {
        config(['services.geniuspay.webhook_secret' => 'test-webhook-secret']);

        $user = User::factory()->create(['plan_abonnement' => null]);
        $abonnement = Abonnement::create([
            'utilisateur_id' => $user->id,
            'formule' => Abonnement::FORMULE_PRO,
            'montant_fcfa' => Abonnement::PRIX_PRO,
            'statut' => Abonnement::STATUT_PENDING,
            'reference' => 'DJASSA-PRO-CONTRACT',
        ]);

        $payload = ['event_id' => 'evt-contract-1', 'reference' => $abonnement->reference, 'status' => 'success'];
        $this->assertMatchesSchema($this->schema('webhook_payload.schema.json'), $payload);

        $body = json_encode($payload, JSON_UNESCAPED_SLASHES);
        $signature = hash_hmac('sha256', $body, 'test-webhook-secret');

        $this->call(
            'POST',
            '/api/v1/webhooks/geniuspay',
            [], [], [],
            ['CONTENT_TYPE' => 'application/json', 'HTTP_X_GENIUSPAY_SIGNATURE' => $signature],
            $body
        )->assertStatus(200)->assertJsonStructure(['received']);
    }

    public function test_initiation_paiement_respecte_le_schema_checkout(): void
    {
        $vendeur = User::factory()->create();
        $acheteur = User::factory()->create();
        $article = Article::create([
            'utilisateur_id' => $vendeur->id,
            'titre' => 'Article checkout',
            'prix' => 12000,
            'categorie' => 'High-Tech',
            'statut' => Article::STATUT_PUBLISHED,
        ]);

        $response = $this->actingAs($acheteur)
            ->postJson('/api/v1/payments/geniuspay/init', ['type' => 'achat', 'article_id' => $article->id])
            ->assertStatus(200);

        $this->assertMatchesSchema($this->schema('checkout.schema.json'), $response->json());
    }
}
