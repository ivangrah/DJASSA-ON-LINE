<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OffreTroc extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'offres_troc';

    protected $fillable = [
        'article_cible_id',
        'acheteur_id',
        'vendeur_id',
        'montant_soulte_fcfa',
        'montant_contre_offre_fcfa',
        'message',
        'statut',
    ];

    protected function casts(): array
    {
        return [
            'montant_soulte_fcfa' => 'decimal:2',
            'montant_contre_offre_fcfa' => 'decimal:2',
        ];
    }

    public const STATUT_PENDING = 'pending';
    public const STATUT_ACCEPTED = 'accepted';
    public const STATUT_REJECTED = 'rejected';
    public const STATUT_COUNTERED = 'countered';
    public const STATUT_COMPLETED = 'completed';
    public const STATUT_CANCELLED = 'cancelled';

    /* ------------------------------------------------------------------
     |  Accesseurs
     * ------------------------------------------------------------------ */

    /** Soulte finale retenue : contre-offre vendeur si renseignée, sinon proposition. */
    public function getSoulteEffectiveAttribute(): string
    {
        return (string) ($this->montant_contre_offre_fcfa ?? $this->montant_soulte_fcfa);
    }

    public function getEstTrocPurAttribute(): bool
    {
        return (float) $this->soulte_effective === 0.0;
    }

    /* ------------------------------------------------------------------
     |  Relations
     * ------------------------------------------------------------------ */

    public function articleCible(): BelongsTo
    {
        return $this->belongsTo(Article::class, 'article_cible_id');
    }

    /** Initiateur (celui qui propose l'échange). */
    public function acheteur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'acheteur_id');
    }

    /** Propriétaire de l'article cible. */
    public function vendeur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'vendeur_id');
    }

    /** Articles proposés en échange (pivot offres_troc_articles). */
    public function articlesOfferts(): BelongsToMany
    {
        return $this->belongsToMany(
            Article::class,
            'offres_troc_articles',
            'offre_troc_id',
            'article_offert_id'
        )->withTimestamps();
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class, 'offre_troc_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class, 'offre_troc_id');
    }
}
