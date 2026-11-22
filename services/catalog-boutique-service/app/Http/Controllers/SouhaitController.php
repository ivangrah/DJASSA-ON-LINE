<?php
namespace App\Http\Controllers;
use App\Http\Controllers\Controller;
use App\Http\Resources\SouhaitResource;
use App\Models\Souhait;
use App\Services\RedisCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class SouhaitController extends Controller
{
    public function __construct(private readonly RedisCache $cache) {}

    public function index(Request $request): JsonResponse
    {
        $key = 'souhaits:'.md5($request->getQueryString() ?? '');
        $data = $this->cache->remember($key, function () {
            $page = Souhait::select(['id','utilisateur_id','titre','description','budget_max','accepte_troc','categorie','ville','statut','vues','created_at'])
                ->actifs()->latest()->paginate(20);
            return ['data' => SouhaitResource::collection($page->items())->resolve(), 'meta' => [
                'current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'total' => $page->total(),
            ]];
        });
        return response()->json($data);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'titre' => ['required','string','max:180'],
            'description' => ['nullable','string'],
            'budget_max' => ['nullable','numeric','min:0'],
            'accepte_troc' => ['sometimes','boolean'],
            'categorie' => ['nullable','string','max:100'],
            'ville' => ['nullable','string','max:100'],
        ]);
        $souhait = Souhait::create($data + ['utilisateur_id' => (string) $request->header('X-User-Id'), 'statut' => Souhait::STATUT_ACTIVE]);
        $this->cache->forget('souhaits:');
        return SouhaitResource::make($souhait)->response()->setStatusCode(201);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $souhait = Souhait::findOrFail($id);
        abort_unless($souhait->utilisateur_id === (string) $request->header('X-User-Id'), 403);
        $souhait->update(['statut' => Souhait::STATUT_CLOSED]);
        $this->cache->forget('souhaits:');
        return response()->json(['closed' => true]);
    }
}
