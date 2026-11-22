<?php
namespace App\Http\Controllers;
use App\Http\Controllers\Controller;
use App\Http\Resources\OffreTrocResource;
use App\Models\ArticleOffert;
use App\Models\OffreTroc;
use App\Models\VerrouStock;
use App\Services\InternalApiClient;
use App\Services\RedisStreamPublisher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use RuntimeException;
class TrocController extends Controller
{
    public function __construct(
        private readonly InternalApiClient $internal,
        private readonly RedisStreamPublisher $events,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $userId = $this->userId($request);
        $page = OffreTroc::select(['id','reference','article_cible_id','acheteur_id','vendeur_id','montant_soulte_fcfa','statut','created_at'])
            ->where('acheteur_id', $userId)->orWhere('vendeur_id', $userId)
            ->latest()->paginate(20);
        return response()->json([
            'data' => OffreTrocResource::collection($page->items())->resolve(),
            'meta' => ['current_page'=>$page->currentPage(),'last_page'=>$page->lastPage(),'total'=>$page->total()],
        ]);
    }

    public function show(string $id): OffreTrocResource
    {
        return OffreTrocResource::make(OffreTroc::with('articlesOfferts')->findOrFail($id));
    }

    public function store(Request $request): JsonResponse
    {
        $acheteurId = $this->userId($request);
        $data = $request->validate([
            'article_cible_id' => ['required','uuid'],
            'articles_offerts' => ['required','array','min:1','max:10'],
            'articles_offerts.*' => ['uuid','distinct'],
            'montant_soulte_fcfa' => ['sometimes','numeric','min:0','max:99999999.99'],
            'message' => ['nullable','string','max:1000'],
        ]);
        $soulte = (float) ($data['montant_soulte_fcfa'] ?? 0);

        try {
            $cible = $this->internal->getArticle($data['article_cible_id']);
        } catch (RuntimeException $e) {
            return response()->json(['message' => 'Article cible indisponible.'], 422);
        }

        // Anti-auto-troc : vérifié via les données du domaine catalogue (pas de jointure cross-base).
        abort_if(($cible['utilisateur_id'] ?? null) === $acheteurId, 422,
            'Vous ne pouvez pas proposer un troc sur votre propre article.');
        abort_if(($cible['statut'] ?? null) !== 'published', 422, 'Cet article n’est plus disponible.');
        $trocable = ! empty($cible['est_trocable'])
            || in_array($cible['mode_transaction'] ?? null, ['troc','mixte'], true);
        abort_if(! $trocable, 422, 'Le propriétaire n’accepte pas le troc sur cet article.');

        $offerts = [];
        foreach ($data['articles_offerts'] as $articleId) {
            $article = $this->internal->getArticle($articleId);
            abort_if(($article['utilisateur_id'] ?? null) !== $acheteurId, 422,
                'Un ou plusieurs articles proposés ne vous appartiennent pas.');
            abort_if(($article['statut'] ?? null) !== 'published', 422, 'Un article proposé n’est plus publié.');
            $offerts[] = $article;
        }

        $offre = DB::transaction(function () use ($data, $acheteurId, $cible, $offerts, $soulte) {
            $offre = OffreTroc::create([
                'article_cible_id' => $data['article_cible_id'],
                'acheteur_id' => $acheteurId,
                'vendeur_id' => $cible['utilisateur_id'],
                'montant_soulte_fcfa' => $soulte,
                'message' => $data['message'] ?? null,
                'statut' => OffreTroc::STATUT_PENDING,
                'reference' => 'DJASSA-TROC-'.strtoupper(bin2hex(random_bytes(6))),
            ]);
            foreach ($offerts as $article) {
                ArticleOffert::firstOrCreate(['id' => $article['id']], ['titre' => $article['titre'] ?? null]);
                $offre->articlesOfferts()->attach($article['id']);
            }
            // Verrou d'inventaire avec expiration automatique (30 minutes).
            foreach (array_merge([$data['article_cible_id']], array_column($offerts, 'id')) as $articleId) {
                VerrouStock::create([
                    'article_id' => $articleId, 'offre_id' => $offre->id,
                    'expire_le' => now()->addMinutes(30),
                ]);
            }
            return $offre;
        });

        $payment = null;
        if ($soulte > 0) {
            // Troc mixte : intention de paiement via escrow (HMAC, timeouts 3s/8s).
            $payment = $this->internal->checkout(
                $acheteurId, 'DJASSA-SOULTE-'.$offre->id, $soulte
            );
        }

        $this->events->publish('troc.offre_created', [
            'offre_id' => $offre->id,
            'reference' => $offre->reference,
            'type' => $soulte > 0 ? 'mixte' : 'pur',
            'montant_soulte_fcfa' => $soulte,
            'user_id' => $acheteurId,
            'acheteur_id' => $acheteurId,
            'vendeur_id' => $offre->vendeur_id,
        ]);

        return OffreTrocResource::make($offre->load('articlesOfferts'))
            ->response()->setStatusCode(201)
            ->header('X-Payment-Reference', $payment['geniuspay_ref'] ?? '');
    }

    public function respond(Request $request, string $id): OffreTrocResource
    {
        $offre = OffreTroc::findOrFail($id);
        abort_unless($offre->vendeur_id === $this->userId($request), 403, 'Seul le vendeur peut répondre.');
        $data = $request->validate([
            'action' => ['required','in:accepted,rejected,countered'],
            'montant_contre_offre_fcfa' => ['nullable','numeric','min:0'],
        ]);
        $updates = ['statut' => $data['action']];
        if ($data['action'] === 'countered') {
            $updates['montant_contre_offre_fcfa'] = $data['montant_contre_offre_fcfa'];
        }
        $offre->update($updates);
        $this->events->publish('troc.'.$data['action'], ['offre_id'=>$offre->id, 'reference'=>$offre->reference, 'user_id'=>$offre->vendeur_id, 'acheteur_id'=>$offre->acheteur_id, 'vendeur_id'=>$offre->vendeur_id]);

        return OffreTrocResource::make($offre->refresh());
    }

    private function userId(Request $request): string
    {
        $id = (string) $request->header('X-User-Id');
        abort_unless($id !== '', 401, 'Identité manquante.');
        return $id;
    }
}
