<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
class Message extends Model
{
    use HasUuids;
    public const TYPE_TEXTE = 'texte';
    public const TYPE_OFFRE_PRIX = 'offre_prix';
    public const TYPE_CARTE_TROC = 'carte_troc';
    public const TYPE_SYSTEME = 'systeme';
    protected $fillable = ['conversation_id','expediteur_id','destinataire_id','article_id','offre_troc_id','type','contenu','payload','lu_at'];
    protected $casts = ['payload'=>'array','lu_at'=>'datetime'];
}
