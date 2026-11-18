<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\RespondBarterOfferRequest;
use App\Http\Requests\StoreBarterOfferRequest;
use App\Http\Resources\BarterOfferResource;
use App\Models\Article;
use App\Models\OffreTroc;
use App\Services\BarterService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use RuntimeException;

/**
 * /barter-offers — moteur de Troc pur & mixte (TRD §6, App Flow §5).
 */
class BarterOfferController extends Controller
{
    public function __construct(private readonly BarterService $barter)
    {
    }

    /**
     * GET /api/v1/barter-offers?sens=recus|envoyes — mes propositions.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $sens = $request->string('sens', 'recues')->toString();
        $query = OffreTroc::query()->with(['articleCible.boutique', 'articlesOfferts', 'acheteur', 'vendeur']);

        match ($sens) {
            'envoyees' => $query->where('acheteur_id', $request->user()->id),
            'recues' => $query->where('vendeur_id', $request->user()->id),
            default => $query->where(fn ($q) => $q->where('acheteur_id', $request->user()->id)->orWhere('vendeur_id', $request->user()->id)),
        };

        return BarterOfferResource::collection($query->latest()->paginate(20));
    }

    /**
     * GET /api/v1/barter-offers/{barterOffer} — détail (participants uniquement).
     */
    public function show(Request $request, OffreTroc $barterOffer): BarterOfferResource|JsonResponse
    {
        $this->authorize('view', $barterOffer);

        return BarterOfferResource::make(
            $barterOffer->load(['articleCible.boutique', 'articlesOfferts', 'acheteur', 'vendeur'])
        );
    }

    /**
     * POST /api/v1/barter-offers — proposer un troc pur ou mixte (+ soulte FCFA).
     */
    public function store(StoreBarterOfferRequest $request): JsonResponse
    {
        $articleCible = Article::with('proprietaire')->findOrFail($request->validated('article_cible_id'));

        try {
            $offre = $this->barter->proposer(
                $request->user(),
                $articleCible,
                $request->validated('articles_offerts'),
                (float) $request->validated('montant_soulte_fcfa', 0),
                $request->validated('message')
            );
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return BarterOfferResource::make($offre)->response()->setStatusCode(201);
    }

    /**
     * PATCH /api/v1/barter-offers/{barterOffer}/respond — accepter / refuser / contre-offrir / arbitrer.
     */
    public function respond(RespondBarterOfferRequest $request, OffreTroc $barterOffer): BarterOfferResource|JsonResponse
    {
        try {
            $offre = $this->barter->repondre(
                $barterOffer,
                $request->user(),
                $request->validated('action'),
                $request->validated('montant_contre_offre_fcfa') !== null ? (float) $request->validated('montant_contre_offre_fcfa') : null,
                $request->validated('message')
            );
        } catch (RuntimeException $e) {
            $status = $e->getCode() >= 400 ? $e->getCode() : 422;

            return response()->json(['message' => $e->getMessage()], $status);
        }

        return BarterOfferResource::make(
            $offre->load(['articleCible.boutique', 'articlesOfferts', 'acheteur', 'vendeur'])
        );
    }
}
