<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasUuids;

    public const PLAN_GRATUIT = 'gratuit';
    public const PLAN_PRO = 'pro';
    public const ROLE_PARTICULIER = 'particulier';
    public const ROLE_VENDEUR_PRO = 'vendeur_pro';
    public const ROLE_ADMIN = 'admin';

    protected $fillable = [
        'nom', 'email', 'telephone', 'password', 'google_id', 'role', 'statut',
        'plan_abonnement', 'abonnement_actif_jusqu_au', 'verifie', 'kyc_status',
        'ville', 'quartier', 'avatar', 'solde_portefeuille', 'email_verified_at',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime', 'abonnement_actif_jusqu_au' => 'datetime',
            'password' => 'hashed', 'verifie' => 'boolean', 'solde_portefeuille' => 'decimal:2',
        ];
    }

    public function isAdmin(): bool { return $this->role === self::ROLE_ADMIN; }
    public function isProSeller(): bool { return $this->role === self::ROLE_VENDEUR_PRO; }
    public function isParticulier(): bool { return $this->role === self::ROLE_PARTICULIER; }
    public function hasChosenPlan(): bool { return $this->plan_abonnement !== null; }

    /** W2 : une date absente n'est PAS un abonnement actif. */
    public function hasActiveProPlan(): bool
    {
        return $this->plan_abonnement === self::PLAN_PRO
            && $this->abonnement_actif_jusqu_au !== null
            && $this->abonnement_actif_jusqu_au->isFuture();
    }

    public function getInitialesAttribute(): string
    {
        return collect(explode(' ', trim($this->nom)))->filter()->take(2)
            ->map(fn (string $p) => mb_strtoupper(mb_substr($p, 0, 1)))->implode('');
    }
}
