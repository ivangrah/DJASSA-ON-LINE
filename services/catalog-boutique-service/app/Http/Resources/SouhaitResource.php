<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
class SouhaitResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id, 'titre' => $this->titre, 'description' => $this->description,
            'budget_max' => $this->budget_max !== null ? (string) $this->budget_max : null,
            'accepte_troc' => (bool) $this->accepte_troc, 'categorie' => $this->categorie,
            'ville' => $this->ville, 'statut' => $this->statut, 'vues' => (int) $this->vues,
            'utilisateur_id' => $this->utilisateur_id,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
