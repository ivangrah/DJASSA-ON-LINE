<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'expediteur_id' => $this->expediteur_id,
            'destinataire_id' => $this->destinataire_id,
            'article_id' => $this->article_id,
            'offre_troc_id' => $this->offre_troc_id,
            'type' => $this->type,
            'contenu' => $this->contenu,
            'payload' => $this->payload,
            'lu_at' => $this->lu_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
