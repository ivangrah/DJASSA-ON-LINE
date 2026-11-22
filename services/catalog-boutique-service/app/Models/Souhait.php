<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
class Souhait extends Model
{
    use HasUuids;
    public const STATUT_ACTIVE = 'active';
    public const STATUT_FULFILLED = 'fulfilled';
    public const STATUT_CLOSED = 'closed';
    protected $fillable = [
        'utilisateur_id','titre','description','budget_max','accepte_troc',
        'categorie','ville','statut','vues',
    ];
    protected $casts = ['budget_max' => 'decimal:2','accepte_troc' => 'boolean','vues' => 'integer'];
    public function scopeActifs($q) { return $q->where('statut', self::STATUT_ACTIVE); }
}
