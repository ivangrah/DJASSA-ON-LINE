<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Abonnement extends Model
{
    protected $connection = 'auth';

    use HasFactory, HasUuids;

    public const FORMULE_GRATUIT = 'gratuit';
    public const FORMULE_PRO = 'pro';

    public const STATUT_PENDING = 'pending';
    public const STATUT_ACTIVE = 'active';
    public const STATUT_EXPIRED = 'expired';
    public const STATUT_CANCELLED = 'cancelled';
    public const STATUT_FAILED = 'failed';

    public const PRIX_PRO = 5000;
    public const DUREE_MOIS = 1;

    protected $fillable = [
        'utilisateur_id', 'formule', 'montant_fcfa', 'statut',
        'reference', 'geniuspay_ref', 'debut_at', 'fin_at',
    ];

    protected function casts(): array
    {
        return [
            'montant_fcfa' => 'decimal:2',
            'debut_at' => 'datetime',
            'fin_at' => 'datetime',
        ];
    }

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'utilisateur_id');
    }

    public function scopeActive($query)
    {
        return $query->where('statut', self::STATUT_ACTIVE);
    }
}
