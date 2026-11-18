<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()
            && $this->user()->id !== $this->input('destinataire_id');
    }

    public function rules(): array
    {
        return [
            'destinataire_id' => ['required', 'uuid', 'exists:users,id'],
            'article_id' => ['nullable', 'uuid', 'exists:articles,id'],
            'offre_troc_id' => ['nullable', 'uuid', 'exists:offres_troc,id'],
            'type' => ['sometimes', 'in:texte,offre_prix,carte_troc,systeme'],
            'contenu' => ['required', 'string', 'max:4000'],
            'payload' => ['nullable', 'array'],
        ];
    }
}
