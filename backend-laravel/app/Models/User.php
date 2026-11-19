<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasUuids, Notifiable;

    protected $fillable = [
        'nom',
        'email',
        'telephone',
        'password',
        'google_id',
        'avatar',
        'role',
        'plan',
        'plan_expire_at',
        'kyc_status',
        'ville',
        'quartier',
        'solde_portefeuille',
        'score_confiance',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'telephone_verified_at' => 'datetime',
            'password' => 'hashed',
            'solde_portefeuille' => 'decimal:2',
            'score_confiance' => 'integer',
            'plan_expire_at' => 'datetime',
        ];
    }

    /* ------------------------------------------------------------------
     |  Rôles & capacités
     * ------------------------------------------------------------------ */

    public const PLAN_FREE = 'free';
    public const PLAN_PRO = 'pro';

    public const ROLE_USER = 'user';
    public const ROLE_PRO_SELLER = 'pro_seller';
    public const ROLE_ADMIN = 'admin';

    public const KYC_NONE = 'none';
    public const KYC_PENDING = 'pending';
    public const KYC_VERIFIED = 'verified';

    public function isProSeller(): bool
    {
        return $this->role === self::ROLE_PRO_SELLER
            && $this->plan === self::PLAN_PRO
            && ($this->plan_expire_at === null || $this->plan_expire_at->isFuture());
    }

    public function hasActiveProPlan(): bool
    {
        return $this->plan === self::PLAN_PRO
            && ($this->plan_expire_at === null || $this->plan_expire_at->isFuture());
    }

    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    public function getInitialesAttribute(): string
    {
        return collect(explode(' ', trim($this->nom)))
            ->filter()
            ->take(2)
            ->map(fn (string $part) => mb_strtoupper(mb_substr($part, 0, 1)))
            ->implode('');
    }

    /* ------------------------------------------------------------------
     |  Relations
     * ------------------------------------------------------------------ */

    public function boutique(): HasOne
    {
        return $this->hasOne(Boutique::class, 'utilisateur_id');
    }

    public function abonnement(): HasOne
    {
        return $this->hasOne(Abonnement::class, 'utilisateur_id');
    }

    public function articles(): HasMany
    {
        return $this->hasMany(Article::class, 'utilisateur_id');
    }

    public function souhaits(): HasMany
    {
        return $this->hasMany(Souhait::class, 'utilisateur_id');
    }

    public function messagesEnvoyes(): HasMany
    {
        return $this->hasMany(Message::class, 'expediteur_id');
    }

    public function messagesRecus(): HasMany
    {
        return $this->hasMany(Message::class, 'destinataire_id');
    }

    /** Offres de troc proposées par cet utilisateur (en tant qu'acheteur). */
    public function offresTrocProposees(): HasMany
    {
        return $this->hasMany(OffreTroc::class, 'acheteur_id');
    }

    /** Offres de troc reçues sur ses articles (en tant que vendeur). */
    public function offresTrocRecues(): HasMany
    {
        return $this->hasMany(OffreTroc::class, 'vendeur_id');
    }

    public function transactionsAchat(): HasMany
    {
        return $this->hasMany(Transaction::class, 'acheteur_id');
    }

    public function transactionsVente(): HasMany
    {
        return $this->hasMany(Transaction::class, 'vendeur_id');
    }
}
