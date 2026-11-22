<?php

namespace Tests\Feature;

use App\Http\Resources\TransactionResource;
use App\Models\Transaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class ContractTest extends TestCase
{
    use RefreshDatabase;

    private function schema(string $name): array
    {
        $path = (is_dir('/repo/models/schemas') ? '/repo/models/schemas' : dirname(__DIR__, 3).'/models/schemas').'/'.$name;
        $this->assertFileExists($path);

        return json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
    }

    private function assertMatchesSchema(array $schema, mixed $value, string $path = '$'): void
    {
        $types = (array) ($schema['type'] ?? []);
        $ok = false;
        foreach ($types as $type) {
            $ok = match ($type) {
                'object' => $ok || (is_array($value) && (! array_is_list($value) || $value === [])),
                'array' => $ok || (is_array($value) && array_is_list($value)),
                'string' => $ok || is_string($value), 'boolean' => $ok || is_bool($value),
                'integer' => $ok || is_int($value), 'number' => $ok || (is_int($value) || is_float($value)),
                'null' => $ok || $value === null, default => $ok,
            };
        }
        if ($types !== []) {
            $this->assertTrue($ok, "Type invalide à $path");
        }
        if (isset($schema['enum'])) {
            $this->assertContains($value, $schema['enum'], "Enum invalide à $path");
        }
        if (isset($schema['const'])) {
            $this->assertSame($schema['const'], $value, "Const invalide à $path");
        }
        if (! is_array($value)) {
            return;
        }
        foreach ($schema['required'] ?? [] as $field) {
            $this->assertArrayHasKey($field, $value, "Champ requis absent à $path.$field");
        }
        foreach ($schema['properties'] ?? [] as $field => $sub) {
            if (array_key_exists($field, $value)) {
                $this->assertMatchesSchema($sub, $value[$field], "$path.$field");
            }
        }
    }

    public function test_checkout_respecte_le_schema(): void
    {
        $response = $this->withHeader('X-User-Id', (string) Str::uuid())
            ->postJson('/api/v1/escrow/checkout', ['type' => 'achat', 'article_id' => (string) Str::uuid()])
            ->assertStatus(200);

        $this->assertMatchesSchema($this->schema('checkout.schema.json'), $response->json());
    }

    public function test_transaction_respecte_le_schema(): void
    {
        $tx = Transaction::create([
            'acheteur_id' => (string) Str::uuid(), 'vendeur_id' => (string) Str::uuid(),
            'article_id' => (string) Str::uuid(), 'montant' => 10000,
            'type' => Transaction::TYPE_ACHAT,
            'escrow_status' => Transaction::ESCROW_HELD,
        ]);

        $data = TransactionResource::make($tx)->resolve();

        $this->assertMatchesSchema($this->schema('transaction.schema.json'), $data);
    }

    public function test_payload_webhook_respecte_le_schema(): void
    {
        $payload = ['event_id' => 'evt-contract', 'reference' => 'DJASSA-PRO-CONTRACT', 'status' => 'success'];

        $this->assertMatchesSchema($this->schema('webhook_payload.schema.json'), $payload);
    }
}
