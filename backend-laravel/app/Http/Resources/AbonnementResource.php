<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AbonnementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'formule' => $this->formule,
            'montant_fcfa' => (string) $this->montant_fcfa,
            'statut' => $this->statut,
            'reference' => $this->reference,
            'geniuspay_ref' => $this->geniuspay_ref,
            'debut_at' => $this->debut_at?->toISOString(),
            'fin_at' => $this->fin_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
