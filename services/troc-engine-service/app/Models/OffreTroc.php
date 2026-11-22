<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
class OffreTroc extends Model
{
    use HasUuids;

    protected $table = 'offres_troc';
    public const STATUT_PENDING = 'pending';
    public const STATUT_ACCEPTED = 'accepted';
    public const STATUT_REJECTED = 'rejected';
    public const STATUT_COUNTERED = 'countered';
    public const STATUT_COMPLETED = 'completed';
    public const STATUT_CANCELLED = 'cancelled';
    protected $fillable = [
        'article_cible_id','acheteur_id','vendeur_id','montant_soulte_fcfa',
        'montant_contre_offre_fcfa','message','statut','reference',
    ];
    protected $casts = ['montant_soulte_fcfa'=>'decimal:2','montant_contre_offre_fcfa'=>'decimal:2'];
    public function articlesOfferts()
    {
        return $this->belongsToMany(\App\Models\ArticleOffert::class, 'offres_troc_articles', 'offre_troc_id', 'article_offert_id')
            ->withTimestamps();
    }
}
