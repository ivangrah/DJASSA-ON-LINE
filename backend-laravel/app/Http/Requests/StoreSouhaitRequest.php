<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSouhaitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            'titre' => ['required', 'string', 'min:8', 'max:200'],
            'description' => ['nullable', 'string', 'max:2000'],
            'budget_max' => ['nullable', 'numeric', 'min:0', 'max:99999999.99'],
            'accepte_troc' => ['sometimes', 'boolean'],
            'categorie' => ['nullable', 'string', 'max:100'],
            'ville' => ['sometimes', 'string', 'max:100'],
        ];
    }
}
