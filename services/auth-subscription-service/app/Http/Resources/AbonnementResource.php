<?php
namespace App\Http\Resources;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
class AbonnementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id, 'formule' => $this->formule,
            'statut' => $this->statut, 'reference' => $this->reference,
            'montant_fcfa' => (string) $this->montant_fcfa,
            'debut_at' => $this->debut_at?->toIso8601String(),
            'fin_at' => $this->fin_at?->toIso8601String(),
        ];
    }
}
