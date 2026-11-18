<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();
        $isParty = $user && ($user->id === $this->acheteur_id || $user->id === $this->vendeur_id || $user->isAdmin());

        return [
            'id' => $this->id,
            'type' => $this->type,
            'montant' => (string) $this->montant,
            'frais_escrow' => (string) $this->frais_escrow,
            'escrow_status' => $this->escrow_status,
            'geniuspay_ref' => $this->geniuspay_ref,
            'pin_attempts' => $this->pin_attempts,
            'est_bloquee' => $this->est_bloquee,
            'pin_bloque' => $this->pin_bloque,
            'held_at' => $this->held_at?->toIso8601String(),
            'released_at' => $this->released_at?->toIso8601String(),
            'refundable' => false,
            // Le PIN n'apparaît JAMAIS dans une réponse listée — il est envoyé une seule fois
            // par e-mail Brevo à l'acheteur au moment du passage `held`.
            'pin_visible' => false,
            'article' => ProductResource::make($this->whenLoaded('article')),
            'offre_troc_id' => $this->offre_troc_id,
            'boutique' => BoutiqueResource::make($this->whenLoaded('boutique')),
            'acheteur' => UserResource::make($this->whenLoaded('acheteur')),
            'vendeur' => UserResource::make($this->whenLoaded('vendeur')),
            'role_utilisateur' => $user ? ($user->id === $this->acheteur_id ? 'acheteur' : ($user->id === $this->vendeur_id ? 'vendeur' : null)) : null,
            'created_at' => $this->created_at?->toIso8601String(),
            'can_view_receipt' => $isParty,
        ];
    }
}
