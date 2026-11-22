<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id, 'titre' => $this->titre, 'description' => $this->description,
            'prix' => (string) $this->prix, 'prix_flash' => $this->prix_flash !== null ? (string) $this->prix_flash : null,
            'prix_actuel' => $this->prix_actuel, 'prix_negociable' => (bool) $this->prix_negociable,
            'condition' => $this->condition, 'mode_transaction' => $this->mode_transaction,
            'est_trocable' => (bool) $this->est_trocable, 'stock' => (int) $this->stock,
            'categorie' => $this->categorie, 'specs' => $this->specs ?? new \stdClass(),
            'images' => $this->images ?? [], 'image_principale' => $this->image_principale,
            'ville' => $this->ville, 'quartier' => $this->quartier, 'statut' => $this->statut,
            'vente_flash' => (bool) $this->vente_flash,
            'flash_fin_at' => $this->flash_fin_at?->toIso8601String(),
            'vues' => (int) $this->vues, 'favoris' => (int) $this->favoris,
            'est_neuf_boutique' => $this->est_neuf_boutique,
            'boutique_id' => $this->boutique_id, 'utilisateur_id' => $this->utilisateur_id,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
