<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OffreAbonnement extends Model
{
    protected $table = 'offres_abonnement';

    protected $fillable = ['code', 'nom', 'description', 'montant_fcfa', 'duree_jours', 'avantages', 'actif'];

    protected $casts = ['avantages' => 'array', 'actif' => 'boolean', 'montant_fcfa' => 'integer'];
}
