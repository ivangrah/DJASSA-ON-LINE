<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Contrat transaction.schema.json — aucun objet cross-domaine, le PIN n'apparaît jamais. */
class TransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'montant_fcfa' => (string) $this->montant,
            'statut' => $this->escrow_status,
            'escrow_status' => $this->escrow_status,
            'geniuspay_ref' => $this->geniuspay_ref,
            'pin_attempts' => (int) $this->pin_attempts,
            'pin_visible' => false,
            'article_id' => $this->article_id,
            'offre_troc_id' => $this->offre_troc_id,
            'acheteur_id' => $this->acheteur_id,
            'vendeur_id' => $this->vendeur_id,
            'held_at' => $this->held_at?->toIso8601String(),
            'released_at' => $this->released_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
