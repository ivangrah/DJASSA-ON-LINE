<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OffreAbonnement extends Model
{
    protected $table = 'offres_abonnement';

    protected $fillable = [
        'code', 'nom', 'role_cible', 'description', 'montant_fcfa',
        'duree_jours', 'max_articles', 'avantages', 'actif', 'is_featured',
    ];

    protected $casts = [
        'avantages' => 'array',
        'actif' => 'boolean',
        'is_featured' => 'boolean',
        'montant_fcfa' => 'integer',
        'max_articles' => 'integer',
    ];
}
