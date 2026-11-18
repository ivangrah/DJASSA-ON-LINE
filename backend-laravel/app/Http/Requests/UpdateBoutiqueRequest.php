<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBoutiqueRequest extends FormRequest
{
    public function authorize(): bool
    {
        $boutique = $this->route('boutique');

        return $boutique && $this->user()
            && ($boutique->utilisateur_id === $this->user()->id || $this->user()->isAdmin());
    }

    public function rules(): array
    {
        return [
            'nom_boutique' => ['sometimes', 'string', 'min:3', 'max:150', 'unique:boutiques,nom_boutique,'.$this->route('boutique')?->id],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'telephone' => ['sometimes', 'string', 'regex:/^\+?[0-9 ().-]{8,20}$/'],
            'categorie' => ['sometimes', 'string', 'max:100'],
            'adresse' => ['sometimes', 'nullable', 'string', 'max:255'],
            'ville' => ['sometimes', 'string', 'max:100'],
            'logo' => ['sometimes', 'nullable', 'url', 'max:2048'],
            'banniere' => ['sometimes', 'nullable', 'url', 'max:2048'],
            'accepte_troc' => ['sometimes', 'boolean'],
        ];
    }
}
