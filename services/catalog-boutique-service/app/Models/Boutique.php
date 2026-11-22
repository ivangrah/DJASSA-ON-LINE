<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
class Boutique extends Model
{
    use HasUuids;
    protected $fillable = [
        'utilisateur_id','nom_boutique','slug','description','logo','banniere','rccm_doc',
        'telephone','categorie','adresse','ville','is_active','verifie','accepte_troc',
        'note_moyenne','nombre_avis','total_ventes',
    ];
    protected $casts = [
        'is_active' => 'boolean','verifie' => 'boolean','accepte_troc' => 'boolean',
        'note_moyenne' => 'decimal:2',
    ];
    public function getRouteKeyName(): string { return 'slug'; }
}
