<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
class Article extends Model
{
    use HasUuids;
    public const CONDITION_NEUF = 'neuf';
    public const CONDITION_COMME_NEUF = 'comme_neuf';
    public const CONDITION_BON_ETAT = 'bon_etat';
    public const CONDITION_USAGE = 'usage';
    public const MODE_VENTE = 'vente';
    public const MODE_TROC = 'troc';
    public const MODE_MIXTE = 'mixte';
    public const STATUT_DRAFT = 'draft';
    public const STATUT_PUBLISHED = 'published';
    public const STATUT_RESERVED = 'reserved';
    public const STATUT_SOLD = 'sold';
    public const STATUT_ARCHIVED = 'archived';

    protected $fillable = [
        'utilisateur_id','boutique_id','titre','description','prix','prix_flash',
        'prix_negociable','condition','mode_transaction','est_trocable','stock',
        'categorie','specs','images','ville','quartier','statut','vente_flash',
        'flash_fin_at','vues','favoris',
    ];
    protected $casts = [
        'prix' => 'decimal:2','prix_flash' => 'decimal:2','prix_negociable' => 'boolean',
        'est_trocable' => 'boolean','specs' => 'array','images' => 'array',
        'vente_flash' => 'boolean','flash_fin_at' => 'datetime',
    ];
    public function scopePublished($q) { return $q->where('statut', self::STATUT_PUBLISHED); }
    /** Première image exploitable. Les anciennes lignes peuvent contenir des
     *  objets sérialisés (tableaux) : on ne renvoie qu'une chaîne, jamais un array. */
    public function getImagePrincipaleAttribute(): ?string
    {
        $images = $this->images;
        if (!is_array($images)) return null;
        foreach ($images as $image) {
            if (is_string($image) && $image !== '') return $image;
        }
        return null;
    }
    public function getPrixActuelAttribute(): string { return (string) ($this->prix_flash ?? $this->prix); }
    public function getEstNeufBoutiqueAttribute(): bool { return $this->condition === self::CONDITION_NEUF && $this->boutique_id !== null; }
}
