<?php
namespace App\Http\Controllers;
use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Article;
use App\Services\RedisCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class ProductController extends Controller
{
    private const FEED_COLUMNS = [
        'id','utilisateur_id','boutique_id','titre','prix','prix_flash',
        'prix_negociable','condition','mode_transaction','est_trocable','stock','categorie',
        'specs','images','ville','quartier','statut','vente_flash','flash_fin_at','vues','favoris','created_at',
    ];

    public function __construct(private readonly RedisCache $cache) {}

    public function index(Request $request): JsonResponse
    {
        $key = 'feed:'.md5($request->getQueryString() ?? '');
        $result = $this->cache->remember($key, function () use ($request) {
            $q = Article::query()->select(self::FEED_COLUMNS)->published();
            if ($v = $request->string('q')->toString()) $q->where('titre', 'ilike', '%'.$v.'%');
            if ($v = $request->string('category')->toString()) $q->where('categorie', $v);
            if ($v = $request->string('marche')->toString()) {
                $q->when($v === 'occ', fn ($x) => $x->where('condition', '!=', Article::CONDITION_NEUF))
                  ->when($v === 'neuf', fn ($x) => $x->where('condition', Article::CONDITION_NEUF));
            }
            if ($v = $request->string('condition')->toString()) $q->where('condition', $v);
            if ($v = $request->string('mode')->toString()) {
                $q->when($v === 'barter', fn ($x) => $x->where('est_trocable', true));
            }
            if ($v = $request->string('boutique')->toString()) {
                $slugBoutique = \App\Models\Boutique::where('slug', $v)->value('id');
                $q->when($slugBoutique, fn ($x) => $x->where('boutique_id', $slugBoutique));
            }
            if ($request->boolean('flash')) $q->where('vente_flash', true);
            if ($request->filled('min_price')) $q->whereRaw('COALESCE(prix_flash, prix) >= ?', [(float) $request->input('min_price')]);
            if ($request->filled('max_price')) $q->whereRaw('COALESCE(prix_flash, prix) <= ?', [(float) $request->input('max_price')]);

            $page = $q->latest()->paginate(20);
            return ['data' => ProductResource::collection($page->items())->resolve(), 'meta' => [
                'current_page' => $page->currentPage(), 'last_page' => $page->lastPage(),
                'per_page' => $page->perPage(), 'total' => $page->total(),
            ]];
        });

        return response()->json($result);
    }

    public function show(string $id): ProductResource
    {
        return ProductResource::make(Article::findOrFail($id));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'titre' => ['required','string','max:180'],
            'description' => ['nullable','string'],
            'prix' => ['required','numeric','min:0'],
            'categorie' => ['required','string','max:100'],
            'condition' => ['sometimes','string','in:neuf,comme_neuf,bon_etat,usage'],
            'mode_transaction' => ['sometimes','string','in:vente,troc,mixte'],
            'est_trocable' => ['sometimes','boolean'],
            'stock' => ['sometimes','integer','min:0'],
            'ville' => ['sometimes','nullable','string','max:100'],
            'quartier' => ['sometimes','nullable','string','max:100'],
            'images' => ['sometimes','array'],
        ]);
        // Les fichiers uploadés sont enregistrés dans public/uploads du service
        // et exposés en URLs courtes (/uploads/<uuid>.<ext>) via le gateway.
        // Le contrat `images` reste un tableau de chaînes (src d'<img>).
        $images = [];
        \Illuminate\Support\Facades\File::ensureDirectoryExists(public_path('uploads'));
        foreach ($request->file('images', []) as $file) {
            if (count($images) >= 6 || !$file?->isValid()) continue;
            $mime = (string) $file->getMimeType();
            if (!str_starts_with($mime, 'image/') || $file->getSize() > 2 * 1024 * 1024) continue;
            $ext = match ($mime) {
                'image/webp' => 'webp', 'image/jpeg' => 'jpg', 'image/png' => 'png',
                'image/avif' => 'avif', 'image/gif' => 'gif', default => 'img',
            };
            $name = \Illuminate\Support\Str::uuid()->toString().'.'.$ext;
            $file->move(public_path('uploads'), $name);
            $images[] = '/uploads/'.$name;
        }
        $data['images'] = $images;

        $condition = $data['condition'] ?? Article::CONDITION_BON_ETAT;
        $boutiqueId = null;
        if ($condition === Article::CONDITION_NEUF) {
            abort_if(! in_array($request->header('X-User-Role'), ['vendeur_pro','admin'], true), 403,
                'La publication d’un article neuf est réservée aux vendeurs Pro.');
            $boutiqueId = \App\Models\Boutique::where('utilisateur_id', $this->userId($request))->value('id');
            abort_if(! $boutiqueId, 403, 'Une boutique Pro est requise pour vendre du neuf.');
        }
        $article = Article::create($data + [
            'utilisateur_id' => $this->userId($request),
            'boutique_id' => $boutiqueId,
            'statut' => Article::STATUT_PUBLISHED,
        ]);
        $this->cache->forget('feed:');
        return ProductResource::make($article)->response()->setStatusCode(201);
    }

    public function update(Request $request, string $id): ProductResource
    {
        $article = Article::findOrFail($id);
        abort_unless($article->utilisateur_id === $this->userId($request) || $request->header('X-User-Role') === 'admin', 403);
        $article->update($request->validate(['titre'=>'sometimes|string|max:180','prix'=>'sometimes|numeric|min:0','stock'=>'sometimes|integer|min:0','statut'=>'sometimes|string']));
        $this->cache->forget('feed:');
        return ProductResource::make($article->refresh());
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $article = Article::findOrFail($id);
        abort_unless($article->utilisateur_id === $this->userId($request), 403);
        $article->delete();
        $this->cache->forget('feed:');
        return response()->json(['deleted' => true]);
    }

    private function assertRole(Request $request): void
    {
        abort_if($request->header('X-User-Role') !== 'vendeur_pro' && $request->header('X-User-Role') !== 'admin', 403,
            'Cette action est réservée aux vendeurs Pro.');
    }

    private function userId(Request $request): string
    {
        $id = (string) $request->header('X-User-Id');
        abort_unless($id !== '', 401, 'Identité manquante.');
        return $id;
    }
}
