<?php

namespace App\Services;

use App\Models\Article;
use App\Models\Message;
use App\Models\OffreTroc;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * BarterService (TRD §3.2) — moteur de Troc pur & mixte.
 *
 * État des articles : published → reserved (à l'acceptation / au paiement) → sold.
 * Soulte > 0 : l'initiateur règle le complément via GeniusPay (escrow initiated → held → released).
 * Soulte = 0 : PIN généré à l'acceptation (transaction troc_mixte, escrow held).
 *
 * Verrouillage : SELECT … FOR UPDATE (lockForUpdate) sur les articles impliqués
 * dans une transaction DB — empêche double troc / double vente concurrents.
 */
class BarterService
{
    public function __construct(
        private readonly EscrowService $escrow,
        private readonly BrevoNotificationService $notifications,
    ) {
    }

    /**
     * Crée une proposition de troc (pur ou mixte).
     *
     * @throws RuntimeException avec message utilisateur en cas de refus métier
     */
    public function proposer(User $acheteur, Article $articleCible, array $articleOffertIds, float $soulte, ?string $message): OffreTroc
    {
        if ($articleCible->utilisateur_id === $acheteur->id) {
            throw new RuntimeException('Vous ne pouvez pas proposer un troc sur votre propre article.');
        }

        if ($articleCible->statut !== Article::STATUT_PUBLISHED) {
            throw new RuntimeException('Cet article n’est plus disponible (statut : '.$articleCible->statut.').');
        }

        $estTrocable = $articleCible->est_trocable
            || in_array($articleCible->mode_transaction, [Article::MODE_TROC, Article::MODE_MIXTE], true);

        if (! $estTrocable) {
            throw new RuntimeException('Le propriétaire n’accepte pas le troc sur cet article.');
        }

        $articlesOfferts = Article::whereIn('id', $articleOffertIds)
            ->where('utilisateur_id', $acheteur->id)
            ->where('statut', Article::STATUT_PUBLISHED)
            ->get();

        if ($articlesOfferts->count() !== count(array_unique($articleOffertIds))) {
            throw new RuntimeException('Un ou plusieurs articles proposés sont invalides (appartenance / statut publié requis).');
        }

        return DB::transaction(function () use ($acheteur, $articleCible, $articlesOfferts, $soulte, $message) {
            /** @var Article $cible */
            $cible = Article::lockForUpdate()->findOrFail($articleCible->id);

            if ($cible->statut !== Article::STATUT_PUBLISHED) {
                throw new RuntimeException('Article devenu indisponible pendant la proposition.');
            }

            $offre = OffreTroc::create([
                'article_cible_id' => $cible->id,
                'acheteur_id' => $acheteur->id,
                'vendeur_id' => $cible->utilisateur_id,
                'montant_soulte_fcfa' => $soulte,
                'message' => $message,
                'statut' => OffreTroc::STATUT_PENDING,
            ]);

            $offre->articlesOfferts()->attach($articlesOfferts->pluck('id'));

            // Carte d'action rapide dans le chat (PRD §3.4)
            Message::create([
                'expediteur_id' => $acheteur->id,
                'destinataire_id' => $cible->utilisateur_id,
                'article_id' => $cible->id,
                'offre_troc_id' => $offre->id,
                'type' => Message::TYPE_CARTE_TROC,
                'contenu' => sprintf(
                    'Proposition de troc : %s%s',
                    $articlesOfferts->pluck('titre')->implode(' + '),
                    $soulte > 0 ? sprintf(' + %s FCFA de soulte', number_format($soulte, 0, ',', ' ')) : ''
                ),
                'payload' => [
                    'montant_soulte_fcfa' => $soulte,
                    'articles_offerts' => $articlesOfferts->map(fn (Article $a) => ['id' => $a->id, 'titre' => $a->titre, 'prix' => (string) $a->prix, 'image' => $a->image_principale])->values()->all(),
                    'statut_offre' => $offre->statut,
                ],
            ]);

            $this->notifications->offreTrocEmail(
                $cible->proprietaire,
                $cible->titre,
                $acheteur->nom,
                $soulte
            );

            return $offre->load(['articlesOfferts', 'articleCible', 'acheteur', 'vendeur']);
        });
    }

    /**
     * Réaction du vendeur (accept | reject | counter) ou de l'acheteur (accept_counter | decline_counter).
     */
    public function repondre(OffreTroc $offre, User $acteur, string $action, ?float $contreOffre = null, ?string $message = null): OffreTroc
    {
        $offertIds = $offre->articlesOfferts()->pluck('articles.id')->all();

        return DB::transaction(function () use ($offre, $acteur, $action, $contreOffre, $message, $offertIds) {
            /** @var OffreTroc $offreVerrouillee */
            $offreVerrouillee = OffreTroc::lockForUpdate()->findOrFail($offre->id);

            $cible = Article::lockForUpdate()->findOrFail($offreVerrouillee->article_cible_id);
            $offerts = Article::lockForUpdate()->whereIn('id', $offertIds)->get()->keyBy('id');

            return match ($action) {
                'accept' => $this->accepter($offreVerrouillee, $acteur, $cible, $offerts, $message),
                'reject' => $this->refuser($offreVerrouillee, $acteur, $message),
                'counter' => $this->contreOffrir($offreVerrouillee, $acteur, (float) $contreOffre, $message),
                'accept_counter' => $this->accepterContreOffre($offreVerrouillee, $acteur, $cible, $offerts, $message),
                'decline_counter' => $this->declinerContreOffre($offreVerrouillee, $acteur, $message),
                default => throw new RuntimeException('Action de réponse inconnue : '.$action),
            };
        });
    }

    /**
     * Acceptation directe par le vendeur : verrouillage des articles, création de la transaction.
     */
    private function accepter(OffreTroc $offre, User $vendeur, Article $cible, $offerts, ?string $message): OffreTroc
    {
        if ($offre->vendeur_id !== $vendeur->id) {
            throw new RuntimeException('Seul le propriétaire de l’article cible peut accepter cette offre.');
        }

        if ($offre->statut !== OffreTroc::STATUT_PENDING) {
            throw new RuntimeException('Cette offre n’est plus en attente (statut : '.$offre->statut.').');
        }

        $this->verifierArticlesDisponibles($cible, $offerts);

        $offre->update(['statut' => OffreTroc::STATUT_ACCEPTED]);
        $this->reserverArticles($cible, $offerts);
        $this->creerTransactionApresAcceptation($offre, $cible, $this->soulteEffective($offre));

        $this->messageSysteme($offre, $vendeur, $cible, $message ?? 'Offre acceptée — procédez à la remise avec le code PIN.');

        return $offre->refresh();
    }

    /**
     * Contre-offre du vendeur : ajuste la soulte FCFA, statut countered.
     */
    private function contreOffrir(OffreTroc $offre, User $vendeur, float $contreOffre, ?string $message): OffreTroc
    {
        if ($offre->vendeur_id !== $vendeur->id) {
            throw new RuntimeException('Seul le vendeur peut faire une contre-offre.');
        }

        if (! in_array($offre->statut, [OffreTroc::STATUT_PENDING, OffreTroc::STATUT_COUNTERED], true)) {
            throw new RuntimeException('Cette offre ne peut plus être contre-proposée (statut : '.$offre->statut.').');
        }

        $offre->update([
            'statut' => OffreTroc::STATUT_COUNTERED,
            'montant_contre_offre_fcfa' => $contreOffre,
        ]);

        Message::create([
            'expediteur_id' => $vendeur->id,
            'destinataire_id' => $offre->acheteur_id,
            'article_id' => $offre->article_cible_id,
            'offre_troc_id' => $offre->id,
            'type' => Message::TYPE_CARTE_TROC,
            'contenu' => sprintf('Contre-offre : soulte ajustée à %s FCFA', number_format($contreOffre, 0, ',', ' ')),
            'payload' => ['montant_contre_offre_fcfa' => $contreOffre, 'statut_offre' => OffreTroc::STATUT_COUNTERED],
        ]);

        return $offre->refresh();
    }

    /**
     * L'acheteur accepte la contre-offre du vendeur.
     */
    private function accepterContreOffre(OffreTroc $offre, User $acheteur, Article $cible, $offerts, ?string $message): OffreTroc
    {
        if ($offre->acheteur_id !== $acheteur->id) {
            throw new RuntimeException('Seul l’auteur de la proposition peut accepter la contre-offre.');
        }

        if ($offre->statut !== OffreTroc::STATUT_COUNTERED) {
            throw new RuntimeException('Aucune contre-offre en attente sur cette proposition.');
        }

        $this->verifierArticlesDisponibles($cible, $offerts);

        $offre->update(['statut' => OffreTroc::STATUT_ACCEPTED]);
        $this->reserverArticles($cible, $offerts);
        $this->creerTransactionApresAcceptation($offre, $cible, (float) $offre->montant_contre_offre_fcfa);

        $this->messageSysteme($offre, $acheteur, $cible, $message ?? 'Contre-offre acceptée — troc confirmé.');

        return $offre->refresh();
    }

    private function declinerContreOffre(OffreTroc $offre, User $acheteur, ?string $message): OffreTroc
    {
        if ($offre->acheteur_id !== $acheteur->id) {
            throw new RuntimeException('Seul l’auteur de la proposition peut refuser la contre-offre.');
        }

        $offre->update(['statut' => OffreTroc::STATUT_CANCELLED]);

        $this->messageSysteme($offre, $acheteur, $offre->articleCible, $message ?? 'Contre-offre déclinée — proposition annulée.');

        return $offre->refresh();
    }

    private function refuser(OffreTroc $offre, User $vendeur, ?string $message): OffreTroc
    {
        if ($offre->vendeur_id !== $vendeur->id) {
            throw new RuntimeException('Seul le vendeur peut refuser cette offre.');
        }

        if (! in_array($offre->statut, [OffreTroc::STATUT_PENDING, OffreTroc::STATUT_COUNTERED], true)) {
            throw new RuntimeException('Cette offre ne peut plus être refusée (statut : '.$offre->statut.').');
        }

        $offre->update(['statut' => OffreTroc::STATUT_REJECTED]);

        $this->messageSysteme($offre, $vendeur, $offre->articleCible, $message ?? 'Offre refusée.');

        return $offre->refresh();
    }

    /* ------------------------------------------------------------------ */

    private function verifierArticlesDisponibles(Article $cible, $offerts): void
    {
        $nonDisponibles = collect([$cible])->concat($offerts)->filter(fn (Article $a) => $a->statut !== Article::STATUT_PUBLISHED);

        if ($nonDisponibles->isNotEmpty()) {
            throw new RuntimeException('Article(s) non disponible(s) : '.$nonDisponibles->pluck('titre')->implode(', '));
        }
    }

    private function reserverArticles(Article $cible, $offerts): void
    {
        $cible->update(['statut' => Article::STATUT_RESERVED]);
        Article::whereIn('id', $offerts->pluck('id'))->update(['statut' => Article::STATUT_RESERVED]);
    }

    /**
     * Soulte effective : contre-offre vendeur si présente, sinon proposition initiale.
     */
    private function soulteEffective(OffreTroc $offre): float
    {
        return (float) ($offre->montant_contre_offre_fcfa ?? $offre->montant_soulte_fcfa);
    }

    /**
     * Soulte = 0 → PIN immédiat (remise en main propre hors paiement).
     * Soulte > 0 → transaction troc_mixte `initiated` ; le flux GeniusPay
     * (init → webhook → PIN) est enclenché par l'acheteur côté client.
     */
    private function creerTransactionApresAcceptation(OffreTroc $offre, Article $cible, float $soulte): void
    {
        $boutiqueId = $cible->boutique_id;

        if ($soulte > 0) {
            Transaction::create([
                'acheteur_id' => $offre->acheteur_id,
                'vendeur_id' => $offre->vendeur_id,
                'article_id' => $cible->id,
                'offre_troc_id' => $offre->id,
                'boutique_id' => $boutiqueId,
                'type' => Transaction::TYPE_TROC_MIXTE,
                'montant' => $soulte,
                'frais_escrow' => 0, // la soulte est un complément d'échange : pas de frais Djassa sur soulte (MVP)
                'escrow_status' => Transaction::ESCROW_INITIATED,
            ]);

            return;
        }

        $pin = $this->escrow->genererPin();

        Transaction::create([
            'acheteur_id' => $offre->acheteur_id,
            'vendeur_id' => $offre->vendeur_id,
            'article_id' => $cible->id,
            'offre_troc_id' => $offre->id,
            'boutique_id' => $boutiqueId,
            'type' => Transaction::TYPE_TROC_MIXTE,
            'montant' => 0,
            'frais_escrow' => 0,
            'escrow_status' => Transaction::ESCROW_HELD,
            'pin_hash' => Hash::make($pin),
            'held_at' => now(),
        ]);

        $acheteur = User::find($offre->acheteur_id);
        if ($acheteur) {
            $this->notifications->pinEscrowEmail($acheteur, $pin, 0, $cible->titre);
        }
    }

    private function messageSysteme(OffreTroc $offre, User $expediteur, Article $cible, string $contenu): void
    {
        Message::create([
            'expediteur_id' => $expediteur->id,
            'destinataire_id' => $expediteur->id === $offre->acheteur_id ? $offre->vendeur_id : $offre->acheteur_id,
            'article_id' => $cible->id,
            'offre_troc_id' => $offre->id,
            'type' => Message::TYPE_SYSTEME,
            'contenu' => $contenu,
            'payload' => ['statut_offre' => $offre->statut],
        ]);
    }
}
