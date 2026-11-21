<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Jobs\MatchWishesJob;
use App\Models\Article;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * /products — Catalogue hybride (TRD §6).
 * Feed public : articles publiés, filtres mode/condition/catégorie/recherche/flash,
 * tri, pagination. Publication < 60 s (PRD §2.1).
 */
class ProductController extends Controller
{
    /**
     * GET /api/v1/products — catalogue filtrable.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Article::query()
            ->published()
            ->with(['boutique', 'proprietaire']);

        // TRD — ?mode=barter|sale
        if ($mode = $request->string('mode')->toString()) {
            $query->when($mode === 'barter', fn ($q) => $q->trocables())
                ->when($mode === 'sale', fn ($q) => $q->whereIn('mode_transaction', [Article::MODE_VENTE, Article::MODE_MIXTE]));
        }

        // TRD — ?condition=new|used (+ granularité PRD : comme_neuf/bon_etat/usage)
        if ($condition = $request->string('condition')->toString()) {
            $query->when($condition === 'new', fn ($q) => $q->where('condition', Article::CONDITION_NEUF))
                ->when($condition === 'used', fn ($q) => $q->whereIn('condition', [Article::CONDITION_COMME_NEUF, Article::CONDITION_BON_ETAT, Article::CONDITION_USAGE]))
                ->when(in_array($condition, [Article::CONDITION_COMME_NEUF, Article::CONDITION_BON_ETAT, Article::CONDITION_USAGE, Article::CONDITION_NEUF], true), fn ($q) => $q->where('condition', $condition));
        }

        // Marché : occ (C2C) | neuf (B2C boutiques pro)
        if ($marche = $request->string('marche')->toString()) {
            $query->when($marche === 'occ', fn ($q) => $q->secondeMain())
                ->when($marche === 'neuf', fn ($q) => $q->boutiquesPro());
        }

        if ($category = $request->string('category')->toString()) {
            $query->where('categorie', $category);
        }

        if ($q = $request->string('q')->toString()) {
            $query->recherche($q);
        }

        if ($boutiqueSlug = $request->string('boutique')->toString()) {
            $query->whereHas('boutique', fn ($b) => $b->where('slug', $boutiqueSlug));
        }

        if ($request->boolean('flash')) {
            $query->ventesFlash();
        }

        if ($minPrice = $request->input('min_price')) {
            $query->whereRaw('COALESCE(prix_flash, prix) >= ?', [(float) $minPrice]);
        }

        if ($maxPrice = $request->input('max_price')) {
            $query->whereRaw('COALESCE(prix_flash, prix) <= ?', [(float) $maxPrice]);
        }

        match ($request->string('sort')->toString()) {
            'price_asc' => $query->orderByRaw('COALESCE(prix_flash, prix) ASC'),
            'price_desc' => $query->orderByRaw('COALESCE(prix_flash, prix) DESC'),
            'popular' => $query->orderByDesc('vues'),
            default => $query->latest(),
        };

        return ProductResource::collection($query->paginate(min((int) $request->input('per_page', 20), 50)));
    }

    /**
     * GET /api/v1/products/flash — carrousel Ventes Flash Boutiques (App Flow §6).
     */
    public function flash(Request $request): AnonymousResourceCollection
    {
        $flash = Article::query()
            ->ventesFlash()
            ->whereNotNull('boutique_id')
            ->with(['boutique', 'proprietaire'])
            ->orderBy('flash_fin_at')
            ->limit(12)
            ->get();

        return ProductResource::collection($flash);
    }

    /**
     * GET /api/v1/products/{product} — fiche article (incrémente les vues).
     */
    public function show(Request $request, Article $product): ProductResource|JsonResponse
    {
        $user = $request->user();
        $visible = $product->statut === Article::STATUT_PUBLISHED
            || ($user && ($user->id === $product->utilisateur_id || $user->isAdmin()));

        if (! $visible) {
            return response()->json(['message' => 'Article introuvable.'], 404);
        }

        // Comptage asynchrone des vues — écriture directe en dev
        DB::table('articles')->where('id', $product->id)->increment('vues');
        $product->refresh();

        return ProductResource::make($product->load(['boutique', 'proprietaire']));
    }

    /**
     * POST /api/v1/products — publication rapide (App Flow §3).
     * Auth requis ; condition=neuf → Boutique Pro vérifiée (sinon 422, cf. StoreProductRequest).
     */
    public function store(StoreProductRequest $request): JsonResponse
    {
        $user = $request->user();
        $isPro = $user->isProSeller() && $user->boutique && $user->boutique->verifie;

        $data = $request->safe()->except(['images', 'image_urls', 'specs']);

        // Rattachement automatique à la boutique pro
        if ($isPro && ($data['condition'] ?? null) === Article::CONDITION_NEUF) {
            $data['boutique_id'] = $user->boutique->id;
        }

        // Troc activable : est_trocable forcé si mode troc/mixte
        if (in_array($data['mode_transaction'] ?? Article::MODE_VENTE, [Article::MODE_TROC, Article::MODE_MIXTE], true)) {
            $data['est_trocable'] = true;
        }

        $data['utilisateur_id'] = $user->id;
        $data['statut'] = Article::STATUT_PUBLISHED;
        $data['specs'] = $request->input('specs');
        $data['images'] = $this->storeImages($request, $user->id) ?? $request->input('image_urls') ?? [];

        $article = DB::transaction(fn () => Article::create($data));

        // Scan du Mur des Souhaits (App Flow §3 étape 3) — inline en dev (QUEUE_CONNECTION=sync)
        MatchWishesJob::dispatch($article);

        return ProductResource::make($article->load(['boutique', 'proprietaire']))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * PUT /api/v1/products/{product} — édition par le propriétaire.
     */
    public function update(UpdateProductRequest $request, Article $product): ProductResource
    {
        $data = $request->validated();

        if (array_key_exists('mode_transaction', $data)
            && in_array($data['mode_transaction'], [Article::MODE_TROC, Article::MODE_MIXTE], true)) {
            $data['est_trocable'] = true;
        }

        // Passage en neuf : rattachement automatique à la boutique Pro vérifiée.
        if (($data['condition'] ?? null) === Article::CONDITION_NEUF && $request->user()->isProSeller()) {
            $data['boutique_id'] = $request->user()->boutique?->id;
        }

        if ($request->has('image_urls')) {
            $data['images'] = $request->input('image_urls');
        }

        $product->update($data);

        return ProductResource::make($product->fresh()->load(['boutique', 'proprietaire']));
    }

    /**
     * DELETE /api/v1/products/{product} — archivage (soft : statut archived), jamais de suppression physique.
     */
    public function destroy(Request $request, Article $product): JsonResponse
    {
        $this->authorize('delete', $product);

        $product->update(['statut' => Article::STATUT_ARCHIVED]);

        return response()->json(['message' => 'Article archivé.']);
    }

    /**
     * POST /api/v1/products/{product}/flash — lancer une Vente Flash (boutique pro vérifiée).
     */
    public function startFlashSale(Request $request, Article $product): ProductResource|JsonResponse
    {
        $this->authorize('manageFlashSale', $product);

        $validated = $request->validate([
            'prix_flash' => ['required', 'numeric', 'min:0', 'lt:'.$product->prix],
            'duree_heures' => ['sometimes', 'integer', 'min:1', 'max:168'],
        ]);

        $product->update([
            'vente_flash' => true,
            'prix_flash' => $validated['prix_flash'],
            'flash_fin_at' => now()->addHours($validated['duree_heures'] ?? 24),
        ]);

        return ProductResource::make($product->fresh()->load('boutique'));
    }

    /**
     * DELETE /api/v1/products/{product}/flash — arrêter la Vente Flash.
     */
    public function stopFlashSale(Request $request, Article $product): ProductResource
    {
        $this->authorize('manageFlashSale', $product);

        $product->update(['vente_flash' => false, 'prix_flash' => null, 'flash_fin_at' => null]);

        return ProductResource::make($product->fresh()->load('boutique'));
    }

    /**
     * GET /api/v1/products/mine — mes annonces (particulier ou boutique).
     */
    public function mine(Request $request): AnonymousResourceCollection
    {
        $articles = Article::where('utilisateur_id', $request->user()->id)
            ->with('boutique')
            ->latest()
            ->paginate(20);

        return ProductResource::collection($articles);
    }

    /* ------------------------------------------------------------------ */

    /**
     * Stocke les images uploadées sur le disque public (validation MIME jpeg/png/webp — TRD §7.1).
     *
     * @return array<int, string>|null
     */
    private function storeImages(Request $request, string $userId): ?array
    {
        if (! $request->hasFile('images')) {
            return null;
        }

        $urls = [];

        foreach ($request->file('images') as $image) {
            $path = $image->store('products/'.$userId, 'public');
            $urls[] = Storage::disk('public')->url($path);
        }

        return $urls;
    }
}
