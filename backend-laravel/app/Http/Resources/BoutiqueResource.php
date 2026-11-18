<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BoutiqueResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'nom_boutique' => $this->nom_boutique,
            'description' => $this->description,
            'logo' => $this->logo,
            'banniere' => $this->banniere,
            'categorie' => $this->categorie,
            'ville' => $this->ville,
            'adresse' => $this->adresse,
            'telephone' => $this->telephone,
            'verifie' => $this->verifie,
            'accepte_troc' => $this->accepte_troc,
            'note_moyenne' => (string) $this->note_moyenne,
            'nombre_avis' => $this->nombre_avis,
            'total_ventes' => $this->total_ventes,
            'url' => '/boutique/'.$this->slug,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
