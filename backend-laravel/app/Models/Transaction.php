<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transaction extends Model
{
    protected $connection = 'escrow';

    use HasFactory, HasUuids;

    protected $fillable = [
        'acheteur_id',
        'vendeur_id',
        'article_id',
        'offre_troc_id',
        'boutique_id',
        'type',
        'montant',
        'frais_escrow',
        'geniuspay_ref',
        'escrow_status',
        'pin_hash',
        'pin_attempts',
        'held_at',
        'released_at',
        'refunded_at',
    ];

    protected $hidden = [
        'pin_hash',
    ];

    protected function casts(): array
    {
        return [
            'montant' => 'decimal:2',
            'frais_escrow' => 'decimal:2',
            'pin_attempts' => 'integer',
            'held_at' => 'datetime',
            'released_at' => 'datetime',
            'refunded_at' => 'datetime',
        ];
    }

    public const TYPE_ACHAT = 'achat';
    public const TYPE_TROC_MIXTE = 'troc_mixte';

    public const ESCROW_INITIATED = 'initiated';
    public const ESCROW_HELD = 'held';
    public const ESCROW_RELEASED = 'released';
    public const ESCROW_REFUNDED = 'refunded';
    public const ESCROW_FAILED = 'failed';

    public const PIN_MAX_TENTATIVES = 5;

    /* ------------------------------------------------------------------
     |  Accesseurs
     * ------------------------------------------------------------------ */

    public function getEstBloqueeAttribute(): bool
    {
        return $this->escrow_status === self::ESCROW_HELD;
    }

    public function getPinBloqueAttribute(): bool
    {
        return $this->pin_attempts >= self::PIN_MAX_TENTATIVES;
    }

    /* ------------------------------------------------------------------
     |  Relations
     * ------------------------------------------------------------------ */

    public function acheteur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'acheteur_id');
    }

    public function vendeur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'vendeur_id');
    }

    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class, 'article_id');
    }

    public function offreTroc(): BelongsTo
    {
        return $this->belongsTo(OffreTroc::class, 'offre_troc_id');
    }

    public function boutique(): BelongsTo
    {
        return $this->belongsTo(Boutique::class, 'boutique_id');
    }
}
