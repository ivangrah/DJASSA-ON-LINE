<?php

namespace App\Services;

use App\Models\Article;
use App\Models\Message;
use App\Models\Souhait;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * WishlistMatchService — Mur des Souhaits (recherche inversée, PRD §3.5).
 *
 * Stratégie de matching déterministe (choisit la prévisibilité sur la chance) :
 *  - tokens normalisés (ASCII, minuscules, sans stopwords FR, longueur ≥ 3) ;
 *  - article retenu si ≥ 2 tokens significatifs partagés avec le souhait,
 *    ou si la catégorie correspond exactement avec ≥ 1 token partagé ;
 *  - filtre budget (prix ≤ budget_max) et auto-exclusion du vendeur.
 *
 * Le champ `souhaits.mots_cles` (tsvector + GIN) reste utilisé par la recherche
 * publique `/souhaits?q=` (correspondance exacte — côté API).
 */
class WishlistMatchService
{
    private const STOPWORDS = [
        'avec', 'sans', 'pour', 'dans', 'sous', 'sur', 'entre', 'contre', 'vers',
        'recherche', 'cherche', 'cherchons', 'veux', 'aime', 'souhaire', 'souhaite',
        'article', 'budget', 'max', 'prix', 'occasion', 'neuf', 'bon', 'etat',
        'les', 'des', 'une', 'un', 'de', 'du', 'la', 'le', 'et', 'ou', 'au', 'aux',
        'fcfa', 'franc', 'type', 'modèle', 'modele', 'reste', 'non', 'oui',
    ];

    public function __construct(
        private readonly BrevoNotificationService $notifications,
    ) {
    }

    /**
     * @return int Nombre de souhaits notifiés
     */
    public function matchEtNotifier(Article $article): int
    {
        $articleTokens = $this->tokens($article->titre.' '.$article->categorie.' '.$article->description);

        if ($articleTokens === []) {
            return 0;
        }

        $matches = Souhait::query()
            ->actifs()
            ->where('utilisateur_id', '<>', $article->utilisateur_id)
            ->where(fn ($q) => $q
                ->whereNull('budget_max')
                ->orWhere('budget_max', '>=', (float) $article->prix))
            ->with('utilisateur')
            ->get();

        $notified = 0;

        foreach ($matches as $souhait) {
            $souhaitTokens = $this->tokens($souhait->titre.' '.$souhait->description.' '.$souhait->categorie);
            $shared = array_intersect($articleTokens, $souhaitTokens);

            $categorieMatch = $souhait->categorie
                && $article->categorie
                && mb_strtolower($souhait->categorie) === mb_strtolower($article->categorie);

            $isMatch = count($shared) >= 2 || ($categorieMatch && count($shared) >= 1);

            if (! $isMatch) {
                continue;
            }

            try {
                DB::transaction(function () use ($souhait, $article, $shared) {
                    Message::create([
                        'expediteur_id' => $article->utilisateur_id,
                        'destinataire_id' => $souhait->utilisateur_id,
                        'article_id' => $article->id,
                        'type' => Message::TYPE_SYSTEME,
                        'contenu' => sprintf(
                            '« %s » a matché avec votre souhait : %s',
                            $article->titre,
                            $souhait->titre
                        ),
                        'payload' => [
                            'source' => 'mur_des_souhaits',
                            'souhait_id' => $souhait->id,
                            'article_id' => $article->id,
                            'prix' => (string) $article->prix,
                            'tokens_partages' => array_values($shared),
                        ],
                    ]);

                    $this->notifications->souhaitMatchEmail(
                        $souhait->utilisateur,
                        $souhait->titre,
                        $article->titre,
                        rtrim(config('app.url'), '/').'/article/'.$article->id
                    );
                });

                $notified++;
            } catch (\Throwable $e) {
                Log::error('[WishlistMatch] Échec notification souhait', ['souhait_id' => $souhait->id, 'error' => $e->getMessage()]);
            }
        }

        return $notified;
    }

    /**
     * @return list<string>
     */
    private function tokens(?string $text): array
    {
        if (! $text) {
            return [];
        }

        $ascii = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', mb_strtolower($text)) ?: '';
        $parts = preg_split('/[^a-z0-9]+/', $ascii) ?: [];

        return array_values(array_unique(array_filter(
            $parts,
            fn (string $t) => mb_strlen($t) >= 4 && ! in_array($t, self::STOPWORDS, true)
        )));
    }
}
