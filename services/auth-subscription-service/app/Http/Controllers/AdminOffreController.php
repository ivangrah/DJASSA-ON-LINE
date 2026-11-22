<?php

namespace App\Http\Controllers;

use App\Models\OffreAbonnement;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** CRUD des offres/plans d'abonnement (admin). */
class AdminOffreController extends Controller
{
    private const COLS = ['id', 'code', 'nom', 'description', 'montant_fcfa', 'duree_jours', 'avantages', 'actif', 'created_at'];

    public function __construct(private readonly AuditService $audit) {}

    public function index(): JsonResponse
    {
        return response()->json(['data' => OffreAbonnement::select(self::COLS)->latest()->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:40', 'unique:offres_abonnement,code'],
            'nom' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string'],
            'montant_fcfa' => ['required', 'integer', 'min:0'],
            'duree_jours' => ['required', 'integer', 'min:1'],
            'avantages' => ['nullable', 'array'],
            'actif' => ['sometimes', 'boolean'],
        ]);
        $offre = OffreAbonnement::create($data);
        $this->audit->record('admin.offre_created', (string) $request->header('X-User-Id', ''), $request, ['offre_id' => $offre->id]);
        return response()->json(['data' => $offre], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $offre = OffreAbonnement::findOrFail($id);
        $data = $request->validate([
            'nom' => ['sometimes', 'string', 'max:120'],
            'description' => ['nullable', 'string'],
            'montant_fcfa' => ['sometimes', 'integer', 'min:0'],
            'duree_jours' => ['sometimes', 'integer', 'min:1'],
            'avantages' => ['nullable', 'array'],
            'actif' => ['sometimes', 'boolean'],
        ]);
        $offre->update($data);
        $this->audit->record('admin.offre_updated', (string) $request->header('X-User-Id', ''), $request, ['offre_id' => $id]);
        return response()->json(['data' => $offre]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        OffreAbonnement::findOrFail($id)->delete();
        $this->audit->record('admin.offre_deleted', (string) $request->header('X-User-Id', ''), $request, ['offre_id' => $id]);
        return response()->json(['deleted' => true]);
    }
}
