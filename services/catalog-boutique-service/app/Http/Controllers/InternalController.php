<?php
namespace App\Http\Controllers;
use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\Boutique;
use App\Services\RedisCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
/** Endpoints /internal/catalog/* signés HMAC (remplacent ceux de l'orchestrateur). */
class InternalController extends Controller
{
    public function __construct(private readonly RedisCache $cache) {}

    private function verify(Request $request): void
    {
        $key = config('services.internal.signing_key');
        abort_if(empty($key), 503);
        $signature = (string) $request->header('X-Djassa-Signature');
        abort_unless($signature !== '', 401);
        $body = $request->getContent();
        foreach (array_unique([$body, '', '[]', '{}']) as $candidate) {
            $expected = hash_hmac('sha256', $request->getMethod()."\n".$request->getPathInfo()."\n".$candidate, $key);
            if (hash_equals($expected, $signature)) return;
        }
        abort(401, 'Signature invalide.');
    }

    public function getArticle(Request $request, string $id): JsonResponse
    {
        $this->verify($request);
        $article = Article::select(['id','utilisateur_id','boutique_id','titre','prix','statut','mode_transaction','est_trocable','stock'])->findOrFail($id);
        return response()->json($article->toArray());
    }

    public function setArticleStatut(Request $request, string $id): JsonResponse
    {
        $this->verify($request);
        $statut = $request->validate(['statut' => 'required|in:draft,published,reserved,sold,archived'])['statut'];
        Article::whereKey($id)->update(['statut' => $statut]);
        $this->cache->forget('feed:');
        return response()->json(['ok' => true, 'statut' => $statut]);
    }

    public function getBoutiqueByUser(Request $request, string $id): JsonResponse
    {
        $this->verify($request);
        $boutique = Boutique::select(['id','utilisateur_id','slug','nom_boutique','verifie','ville','note_moyenne'])
            ->where('utilisateur_id', $id)->first();
        return response()->json(['boutique' => $boutique?->toArray()]);
    }

    public function decrementStock(Request $request, string $id): JsonResponse
    {
        $this->verify($request);
        Article::whereKey($id)->where('stock', '>', 0)->decrement('stock');
        $this->cache->forget('feed:');
        return response()->json(['ok' => true]);
    }
}
