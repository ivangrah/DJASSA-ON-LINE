<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BarterOfferResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'article_cible' => ProductResource::make($this->whenLoaded('articleCible')),
            'articles_offerts' => ProductResource::collection($this->whenLoaded('articlesOfferts')),
            'acheteur' => UserResource::make($this->whenLoaded('acheteur')),
            'vendeur' => UserResource::make($this->whenLoaded('vendeur')),
            'montant_soulte_fcfa' => (string) $this->montant_soulte_fcfa,
            'montant_contre_offre_fcfa' => $this->montant_contre_offre_fcfa !== null ? (string) $this->montant_contre_offre_fcfa : null,
            'soulte_effective' => $this->soulte_effective,
            'est_troc_pur' => $this->est_troc_pur,
            'message' => $this->message,
            'statut' => $this->statut,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
