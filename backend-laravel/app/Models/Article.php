<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Article extends Model
{
    protected $connection = 'catalog';

    use HasFactory, HasUuids;

    protected $fillable = [
        'utilisateur_id',
        'boutique_id',
        'titre',
        'description',
        'prix',
        'prix_flash',
        'prix_negociable',
        'condition',
        'mode_transaction',
        'est_trocable',
        'stock',
        'categorie',
        'specs',
        'images',
        'ville',
        'quartier',
        'statut',
        'vente_flash',
        'flash_fin_at',
        'vues',
        'favoris',
    ];

    protected $appends = ['image_principale', 'prix_actuel', 'est_neuf_boutique'];

    protected function casts(): array
    {
        return [
            'prix' => 'decimal:2',
            'prix_flash' => 'decimal:2',
            'prix_negociable' => 'boolean',
            'est_trocable' => 'boolean',
            'stock' => 'integer',
            'specs' => 'array',
            'images' => 'array',
            'vente_flash' => 'boolean',
            'flash_fin_at' => 'datetime',
            'vues' => 'integer',
            'favoris' => 'integer',
        ];
    }

    public const CONDITION_NEUF = 'neuf';
    public const CONDITION_COMME_NEUF = 'comme_neuf';
    public const CONDITION_BON_ETAT = 'bon_etat';
    public const CONDITION_USAGE = 'usage';

    public const MODE_VENTE = 'vente';
    public const MODE_TROC = 'troc';
    public const MODE_MIXTE = 'mixte';

    public const STATUT_DRAFT = 'draft';
    public const STATUT_PUBLISHED = 'published';
    public const STATUT_RESERVED = 'reserved';
    public const STATUT_SOLD = 'sold';
    public const STATUT_ARCHIVED = 'archived';

    /* ------------------------------------------------------------------
     |  Accesseurs
     * ------------------------------------------------------------------ */

    public function getImagePrincipaleAttribute(): ?string
    {
        return $this->images[0] ?? null;
    }

    public function getPrixActuelAttribute(): string
    {
        if ($this->vente_flash && $this->prix_flash !== null && $this->prix_flash < $this->prix) {
            return (string) $this->prix_flash;
        }

        return (string) $this->prix;
    }

    public function getEstNeufBoutiqueAttribute(): bool
    {
        return $this->boutique_id !== null && $this->condition === self::CONDITION_NEUF;
    }

    /* ------------------------------------------------------------------
     |  Scopes
     * ------------------------------------------------------------------ */

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('statut', self::STATUT_PUBLISHED);
    }

    public function scopeSecondeMain(Builder $query): Builder
    {
        return $query->whereNull('boutique_id')->where('condition', '<>', self::CONDITION_NEUF);
    }

    public function scopeBoutiquesPro(Builder $query): Builder
    {
        return $query->whereNotNull('boutique_id');
    }

    public function scopeTrocables(Builder $query): Builder
    {
        return $query->where(fn ($q) => $q
            ->where('est_trocable', true)
            ->orWhereIn('mode_transaction', [self::MODE_TROC, self::MODE_MIXTE]));
    }

    public function scopeVentesFlash(Builder $query): Builder
    {
        return $query->where('vente_flash', true)
            ->where(fn ($q) => $q->whereNull('flash_fin_at')->orWhere('flash_fin_at', '>', now()));
    }

    /** Recherche plein texte FR (colonne générée `recherche`). */
    public function scopeRecherche(Builder $query, string $termes): Builder
    {
        return $query->whereRaw("recherche @@ plainto_tsquery('french', ?)", [$termes]);
    }

    /* ------------------------------------------------------------------
     |  Relations
     * ------------------------------------------------------------------ */

    public function proprietaire(): BelongsTo
    {
        return $this->belongsTo(User::class, 'utilisateur_id');
    }

    public function boutique(): BelongsTo
    {
        return $this->belongsTo(Boutique::class, 'boutique_id');
    }

    public function offresTroc(): HasMany
    {
        return $this->hasMany(OffreTroc::class, 'article_cible_id');
    }

    /** Offres dans lesquelles CET article est proposé en échange. */
    public function propositionsTroc(): BelongsToMany
    {
        return $this->belongsToMany(
            OffreTroc::class,
            'offres_troc_articles',
            'article_offert_id',
            'offre_troc_id'
        );
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class, 'article_id');
    }
}
