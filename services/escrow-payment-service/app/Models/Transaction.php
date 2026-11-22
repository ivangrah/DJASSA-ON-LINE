<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/** Modèle du domaine escrow — aucune relation Eloquent vers un autre domaine (D2). */
class Transaction extends Model
{
    use HasUuids;

    protected $fillable = [
        'acheteur_id', 'vendeur_id', 'article_id', 'offre_troc_id', 'boutique_id',
        'type', 'montant', 'frais_escrow', 'geniuspay_ref', 'escrow_status',
        'pin_hash', 'pin_attempts', 'held_at', 'released_at', 'refunded_at',
        'idempotency_key',
    ];

    protected $hidden = ['pin_hash'];

    protected function casts(): array
    {
        return [
            'montant' => 'decimal:2', 'frais_escrow' => 'decimal:2',
            'pin_attempts' => 'integer', 'held_at' => 'datetime',
            'released_at' => 'datetime', 'refunded_at' => 'datetime',
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
}
