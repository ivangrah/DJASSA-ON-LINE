<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nom' => $this->nom,
            'email' => $this->email,
            'telephone' => $this->telephone,
            'avatar' => $this->avatar,
            'role' => $this->role,
            'plan_abonnement' => $this->plan_abonnement,
            'abonnement_actif_jusqu_au' => $this->abonnement_actif_jusqu_au?->toIso8601String(),
            'is_pro' => $this->isProSeller(),
            'is_particulier' => $this->isParticulier(),
            'has_active_pro_plan' => $this->hasActiveProPlan(),
            'needs_plan' => ! $this->hasChosenPlan(),
            'abonnement' => AbonnementResource::make($this->whenLoaded('abonnement')),
            'kyc_status' => $this->kyc_status,
            'ville' => $this->ville,
            'quartier' => $this->quartier,
            'initiales' => $this->initiales,
            'score_confiance' => $this->score_confiance,
            'solde_portefeuille' => $this->when($request->user()?->id === $this->id, fn () => (string) $this->solde_portefeuille),
            'boutique' => BoutiqueResource::make($this->whenLoaded('boutique')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
