<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBoutiqueRequest;
use App\Http\Requests\UpdateBoutiqueRequest;
use App\Http\Resources\BoutiqueResource;
use App\Http\Resources\ProductResource;
use App\Models\Boutique;
use App\Models\Transaction;
use App\Models\Article;
use App\Services\BrevoNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

/**
 * /boutiques — vitrines B2C officielles (TRD §4, App Flow §6).
 */
class BoutiqueController extends Controller
{
    /**
     * GET /api/v1/boutiques — liste des boutiques (filtre: verifiees, categorie, q).
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Boutique::query()->where('is_active', true);

        if ($request->boolean('verifiees')) {
            $query->where('verifie', true);
        }

        if ($category = $request->string('category')->toString()) {
            $query->where('categorie', $category);
        }

        if ($q = $request->string('q')->toString()) {
            $query->where(fn ($sub) => $sub
                ->where('nom_boutique', 'ilike', '%'.$q.'%')
                ->orWhere('description', 'ilike', '%'.$q.'%'));
        }

        $query->orderByDesc('verifie')->orderByDesc('total_ventes');

        return BoutiqueResource::collection($query->paginate(min((int) $request->input('per_page', 20), 50)));
    }

    /**
     * GET /api/v1/boutiques/{boutique:slug} — vitrine publique + articles.
     */
    public function show(Request $request, Boutique $boutique): JsonResponse
    {
        $articles = $boutique->articlesEnVente()
            ->with(['proprietaire'])
            ->latest()
            ->paginate(24);

        return response()->json([
            'boutique' => BoutiqueResource::make($boutique),
            'articles' => ProductResource::collection($articles)->response()->getData(true),
        ]);
    }

    /**
     * POST /api/v1/boutiques — ouverture d'une Boutique Pro (rôle vendeur_pro).
     * Badge « Vendeur Vérifié » : attribué par l'admin après KYC rapide (App Flow §2 étape 3).
     */
    public function store(StoreBoutiqueRequest $request): JsonResponse
    {
        $user = $request->user();

        $this->authorize('create', Boutique::class);

        if ($user->boutique) {
            return response()->json(['message' => 'Vous possédez déjà une boutique.'], 409);
        }

        $boutique = DB::transaction(function () use ($request, $user): Boutique {
            $boutique = Boutique::create($request->boutiqueData() + [
                'utilisateur_id' => $user->id,
                'verifie' => false,
            ]);

            $user->update(['kyc_status' => \App\Models\User::KYC_PENDING]);

            return $boutique;
        });

        return BoutiqueResource::make($boutique)->response()->setStatusCode(201);
    }

    /**
     * PUT /api/v1/boutiques/{boutique} — édition par le propriétaire.
     */
    public function update(UpdateBoutiqueRequest $request, Boutique $boutique): BoutiqueResource
    {
        $boutique->update($request->validated());

        return BoutiqueResource::make($boutique->fresh());
    }

    /**
     * POST /api/v1/boutiques/{boutique}/verify — validation KYC par l'admin.
     */
    public function verify(Request $request, Boutique $boutique, BrevoNotificationService $notifications): BoutiqueResource
    {
        $this->authorize('verify', $boutique);

        $boutique->update(['verifie' => true]);
        $boutique->proprietaire?->update(['kyc_status' => \App\Models\User::KYC_VERIFIED]);

        if ($boutique->proprietaire) {
            $notifications->boutiqueVerifieeSms($boutique->proprietaire, $boutique->nom_boutique);
        }

        return BoutiqueResource::make($boutique->fresh());
    }

    /**
     * GET /api/v1/boutiques/me/dashboard — tableau de bord pro (App Flow §6).
     */
    public function dashboard(Request $request): JsonResponse
    {
        $boutique = $request->user()->boutique;

        if (! $boutique) {
            return response()->json(['message' => 'Vous n’avez pas de boutique pro.'], 404);
        }

        $this->authorize('dashboard', $boutique);

        $stockCritique = $boutique->articles()
            ->where('statut', Article::STATUT_PUBLISHED)
            ->where('stock', '>', 0)
            ->where('stock', '<=', 2)
            ->orderBy('stock')
            ->get(['id', 'titre', 'stock', 'prix', 'condition']);

        $chiffreAffaires = Transaction::where('boutique_id', $boutique->id)
            ->where('escrow_status', Transaction::ESCROW_RELEASED)
            ->sum('montant');

        $encaisseSecurise = Transaction::where('boutique_id', $boutique->id)
            ->where('escrow_status', Transaction::ESCROW_HELD)
            ->sum('montant');

        $ventesParJour = Transaction::where('boutique_id', $boutique->id)
            ->where('escrow_status', Transaction::ESCROW_RELEASED)
            ->select(DB::raw('DATE(released_at) as jour'), DB::raw('COUNT(*) as ventes'), DB::raw('SUM(montant) as total'))
            ->groupBy('jour')
            ->orderBy('jour', 'desc')
            ->limit(14)
            ->get();

        return response()->json([
            'boutique' => BoutiqueResource::make($boutique),
            'stats' => [
                'articles_en_ligne' => $boutique->articles()->where('statut', Article::STATUT_PUBLISHED)->count(),
                'ventes_total' => $boutique->total_ventes,
                'chiffre_affaires_fcfa' => (string) $chiffreAffaires,
                'encaisse_securise_fcfa' => (string) $encaisseSecurise,
                'note_moyenne' => (string) $boutique->note_moyenne,
                'nombre_avis' => $boutique->nombre_avis,
            ],
            'stock_critique' => $stockCritique,
            'ventes_par_jour' => $ventesParJour,
            'ventes_flash_actives' => ProductResource::collection($boutique->ventesFlash()->get()),
        ]);
    }
}
