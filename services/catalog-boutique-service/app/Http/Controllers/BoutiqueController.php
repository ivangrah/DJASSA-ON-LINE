<?php
namespace App\Http\Controllers;
use App\Http\Controllers\Controller;
use App\Http\Resources\BoutiqueResource;
use App\Models\Boutique;
use App\Services\RedisCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
class BoutiqueController extends Controller
{
    public function __construct(private readonly RedisCache $cache) {}

    public function index(): JsonResponse
    {
        $data = $this->cache->remember('boutiques:index', fn () => [
            'data' => BoutiqueResource::collection(Boutique::select([
                'id','utilisateur_id','slug','nom_boutique','description','logo','ville','verifie','note_moyenne','created_at',
            ])->where('is_active', true)->latest()->paginate(20)->items())->resolve(),
        ]);
        return response()->json($data);
    }

    public function show(string $slug): BoutiqueResource
    {
        $boutique = $this->cache->remember('boutique:'.$slug,
            fn () => Boutique::where('slug', $slug)->firstOrFail()->toArray(), 600);
        return BoutiqueResource::make((new Boutique())->forceFill($boutique));
    }

    public function store(Request $request): JsonResponse
    {
        abort_if(! in_array($request->header('X-User-Role'), ['vendeur_pro','admin'], true), 403,
            'Ouvrir une Boutique Pro requiert un compte vendeur_pro.');
        $data = $request->validate([
            'nom_boutique' => ['required','string','min:3','max:150','unique:boutiques,nom_boutique'],
            'description' => ['nullable','string','max:2000'],
            'telephone' => ['required','string','regex:/^\+?[0-9 ().-]{8,20}$/'],
            'categorie' => ['required','string','max:100'],
            'adresse' => ['nullable','string','max:255'],
            'ville' => ['sometimes','string','max:100'],
            'accepte_troc' => ['sometimes','boolean'],
        ]);
        $slug = Str::slug($data['nom_boutique']);
        $boutique = Boutique::create($data + [
            'utilisateur_id' => (string) $request->header('X-User-Id'),
            'slug' => $slug, 'verifie' => false,
        ]);
        $this->cache->forget('boutiques:');
        return BoutiqueResource::make($boutique)->response()->setStatusCode(201);
    }

    public function update(Request $request, string $id): BoutiqueResource
    {
        $boutique = Boutique::findOrFail($id);
        abort_unless($boutique->utilisateur_id === (string) $request->header('X-User-Id'), 403);
        $boutique->update($request->validate([
            'nom_boutique'=>'sometimes|string|min:3|max:150','description'=>'nullable|string',
            'telephone'=>'sometimes|string','ville'=>'sometimes|string','accepte_troc'=>'sometimes|boolean',
        ]));
        $this->cache->forget('boutiques:');
        $this->cache->forget('boutique:');
        return BoutiqueResource::make($boutique->refresh());
    }
}
