<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Souhait extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'utilisateur_id',
        'titre',
        'description',
        'budget_max',
        'accepte_troc',
        'categorie',
        'ville',
        'statut',
        'vues',
    ];

    protected function casts(): array
    {
        return [
            'budget_max' => 'decimal:2',
            'accepte_troc' => 'boolean',
            'vues' => 'integer',
        ];
    }

    public const STATUT_ACTIVE = 'active';
    public const STATUT_FULFILLED = 'fulfilled';
    public const STATUT_CLOSED = 'closed';

    public function scopeActifs(Builder $query): Builder
    {
        return $query->where('statut', self::STATUT_ACTIVE);
    }

    public function scopeRecherche(Builder $query, string $termes): Builder
    {
        return $query->whereRaw("mots_cles @@ plainto_tsquery('french', ?)", [$termes]);
    }

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'utilisateur_id');
    }
}
