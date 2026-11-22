<?php

namespace App\Http\Controllers;

use App\Models\Boutique;
use App\Services\AdminFinancialClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

/** Super Dashboard Admin — CRUD boutiques + agrégation financière via Http::pool(). */
class AdminBoutiqueController extends Controller
{
    private const COLS = ['id', 'utilisateur_id', 'nom_boutique', 'slug', 'ville', 'verifie', 'is_active', 'total_ventes', 'created_at'];

    public function __construct(private readonly AdminFinancialClient $financial) {}

    public function index(Request $request): JsonResponse
    {
        $q = Boutique::select(self::COLS);
        if ($v = $request->string('q')->toString()) $q->where('nom_boutique', 'ilike', "%$v%");
        if ($request->has('verifie')) $q->where('verifie', $request->boolean('verifie'));
        $page = $q->latest()->paginate(20);
        return response()->json(['data' => $page->items(), 'meta' => [
            'current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'total' => $page->total(),
        ]]);
    }

    public function show(string $id): JsonResponse
    {
        $boutique = Boutique::select(self::COLS)->findOrFail($id);
        $stats = $this->financial->stats((string) $boutique->utilisateur_id);
        return response()->json(['data' => $boutique, 'finances' => $stats]);
    }

    /** Vue financière agrégée de toutes les boutiques en parallèle (règle 15 : Http::pool()). */
    public function finances(): JsonResponse
    {
        $boutiques = Boutique::select(['id', 'utilisateur_id', 'nom_boutique'])->where('is_active', true)->get();
        $responses = Http::pool(fn ($pool) => $boutiques->mapWithKeys(fn ($b) => [$b->utilisateur_id => $pool
            ->as((string) $b->utilisateur_id)
            ->withHeaders([
                'Accept' => 'application/json',
                'X-Djassa-Signature' => hash_hmac('sha256', "GET\n/internal/escrow/stats?vendeur_id=".urlencode((string) $b->utilisateur_id)."\n", (string) config('services.internal.signing_key', '')),
            ])->connectTimeout(3)->timeout(8)
            ->get(rtrim((string) config('services.internal.escrow_url', 'http://escrow-payment-service:8080'), '/').'/internal/escrow/stats?vendeur_id='.urlencode((string) $b->utilisateur_id))
        ])->all());

        $rows = $boutiques->map(function ($b) use ($responses) {
            $res = $responses[$b->utilisateur_id] ?? null;
            $stats = ($res && $res->successful()) ? $res->json() : [];
            return [
                'boutique_id' => $b->id,
                'nom_boutique' => $b->nom_boutique,
                'vendeur_id' => $b->utilisateur_id,
                'chiffre_affaires' => (float) ($stats['chiffre_affaires'] ?? 0),
                'fonds_held' => (float) ($stats['fonds_held'] ?? 0),
                'fonds_released' => (float) ($stats['fonds_released'] ?? 0),
                'volume_ventes' => (int) ($stats['volume_ventes'] ?? 0),
            ];
        })->values();

        return response()->json(['data' => $rows, 'totaux' => [
            'chiffre_affaires' => $rows->sum('chiffre_affaires'),
            'fonds_held' => $rows->sum('fonds_held'),
            'fonds_released' => $rows->sum('fonds_released'),
            'volume_ventes' => $rows->sum('volume_ventes'),
        ]]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'utilisateur_id' => ['required', 'uuid'],
            'nom_boutique' => ['required', 'string', 'min:3', 'max:150', 'unique:boutiques,nom_boutique'],
            'telephone' => ['required', 'string', 'max:20'],
            'categorie' => ['required', 'string', 'max:100'],
            'ville' => ['sometimes', 'string', 'max:100'],
        ]);
        $b = Boutique::create($data + ['slug' => Str::slug($data['nom_boutique']), 'is_active' => true]);
        return response()->json(['data' => $b], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $b = Boutique::findOrFail($id);
        $data = $request->validate([
            'nom_boutique' => ['sometimes', 'string', 'min:3', 'max:150'],
            'verifie' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'ville' => ['sometimes', 'string', 'max:100'],
        ]);
        if (isset($data['nom_boutique'])) $data['slug'] = Str::slug($data['nom_boutique']);
        $b->update($data);
        return response()->json(['data' => $b]);
    }

    public function destroy(string $id): JsonResponse
    {
        Boutique::findOrFail($id)->delete();
        return response()->json(['deleted' => true]);
    }
}
