<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
class OffreTrocResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id, 'reference' => $this->reference,
            'article_cible_id' => $this->article_cible_id,
            'acheteur_id' => $this->acheteur_id, 'vendeur_id' => $this->vendeur_id,
            'articles_offerts' => $this->whenLoaded('articlesOfferts', fn () => $this->articlesOfferts->pluck('id')->all()),
            'montant_soulte_fcfa' => (string) $this->montant_soulte_fcfa,
            'montant_contre_offre_fcfa' => $this->montant_contre_offre_fcfa !== null ? (string) $this->montant_contre_offre_fcfa : null,
            'message' => $this->message, 'statut' => $this->statut,
            'est_troc_pur' => (float) $this->montant_soulte_fcfa === 0.0,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
