<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Abonnement extends Model
{
    use HasUuids;

    public const FORMULE_GRATUIT = 'gratuit';
    public const FORMULE_PRO = 'pro';
    public const STATUT_PENDING = 'pending';
    public const STATUT_ACTIVE = 'active';
    public const STATUT_EXPIRED = 'expired';
    public const STATUT_CANCELLED = 'cancelled';
    public const STATUT_FAILED = 'failed';
    public const PRIX_PRO = 5000;

    protected $fillable = [
        'utilisateur_id', 'formule', 'montant_fcfa', 'statut',
        'reference', 'geniuspay_ref', 'debut_at', 'fin_at',
    ];

    protected function casts(): array
    {
        return ['montant_fcfa' => 'decimal:2', 'debut_at' => 'datetime', 'fin_at' => 'datetime'];
    }
}
