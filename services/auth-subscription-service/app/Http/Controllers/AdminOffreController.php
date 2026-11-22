<?php

namespace App\Http\Controllers;

use App\Models\OffreAbonnement;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** CRUD des offres/plans d'abonnement (admin) + catalogue public. */
class AdminOffreController extends Controller
{
    private const COLS = [
        'id', 'code', 'nom', 'role_cible', 'description', 'montant_fcfa',
        'duree_jours', 'max_articles', 'avantages', 'actif', 'is_featured', 'created_at',
    ];

    public function __construct(private readonly AuditService $audit) {}

    public function index(): JsonResponse
    {
        return response()->json(['data' => OffreAbonnement::select(self::COLS)->orderByDesc('is_featured')->orderBy('montant_fcfa')->get()]);
    }

    /** Catalogue public des offres actives (inscription/onboarding). */
    public function publicIndex(): JsonResponse
    {
        $offres = OffreAbonnement::select(self::COLS)
            ->where('actif', true)
            ->orderByDesc('is_featured')
            ->orderBy('montant_fcfa')
            ->get();
        return response()->json(['data' => $offres]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validatePayload($request, true);
        $offre = OffreAbonnement::create($data);
        $this->audit->record('admin.offre_created', (string) $request->header('X-User-Id', ''), $request, ['offre_id' => $offre->id, 'code' => $offre->code]);
        return response()->json(['data' => $offre->fresh()], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $offre = OffreAbonnement::findOrFail($id);
        $data = $this->validatePayload($request, false);
        $offre->update($data);
        $this->audit->record('admin.offre_updated', (string) $request->header('X-User-Id', ''), $request, ['offre_id' => $id]);
        return response()->json(['data' => $offre->fresh()]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $offre = OffreAbonnement::findOrFail($id);
        $code = $offre->code;
        $offre->delete();
        $this->audit->record('admin.offre_deleted', (string) $request->header('X-User-Id', ''), $request, ['offre_id' => $id, 'code' => $code]);
        return response()->json(['deleted' => true]);
    }

    private function validatePayload(Request $request, bool $creating): array
    {
        $rules = [
            'code' => [$creating ? 'required' : 'sometimes', 'string', 'max:40', 'unique:offres_abonnement,code' . ($creating ? '' : ',' . $request->route('id'))],
            'nom' => [$creating ? 'required' : 'sometimes', 'string', 'max:120'],
            'role_cible' => ['sometimes', 'string', 'in:vendeur_pro,particulier,tous'],
            'description' => ['nullable', 'string', 'max:1000'],
            'montant_fcfa' => [$creating ? 'required' : 'sometimes', 'integer', 'min:0'],
            'duree_jours' => [$creating ? 'required' : 'sometimes', 'integer', 'min:1', 'max:3650'],
            'max_articles' => ['nullable', 'integer', 'min:1'],
            'avantages' => ['nullable', 'array'],
            'avantages.*' => ['string', 'max:160'],
            'actif' => ['sometimes', 'boolean'],
            'is_featured' => ['sometimes', 'boolean'],
        ];
        $data = $request->validate($rules);
        if (array_key_exists('max_articles', $data) && ($data['max_articles'] === '' || $data['max_articles'] === 0)) {
            $data['max_articles'] = null;
        }
        return $data;
    }
}
