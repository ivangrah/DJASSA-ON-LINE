<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Boutique extends Model
{
    protected $connection = 'catalog';

    use HasFactory, HasUuids;

    protected $table = 'boutiques';

    protected $fillable = [
        'utilisateur_id',
        'nom_boutique',
        'slug',
        'description',
        'logo',
        'banniere',
        'rccm_doc',
        'telephone',
        'categorie',
        'adresse',
        'ville',
        'verifie',
        'is_active',
        'accepte_troc',
        'note_moyenne',
        'nombre_avis',
        'total_ventes',
    ];

    protected function casts(): array
    {
        return [
            'verifie' => 'boolean',
            'is_active' => 'boolean',
            'accepte_troc' => 'boolean',
            'note_moyenne' => 'decimal:2',
            'nombre_avis' => 'integer',
            'total_ventes' => 'integer',
        ];
    }

    /** Route model binding par slug : /boutique/{slug} */
    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function proprietaire(): BelongsTo
    {
        return $this->belongsTo(User::class, 'utilisateur_id');
    }

    public function articles(): HasMany
    {
        return $this->hasMany(Article::class, 'boutique_id');
    }

    public function articlesEnVente(): HasMany
    {
        return $this->articles()->where('statut', 'published');
    }

    public function ventesFlash(): HasMany
    {
        return $this->articlesEnVente()->where('vente_flash', true);
    }
}
