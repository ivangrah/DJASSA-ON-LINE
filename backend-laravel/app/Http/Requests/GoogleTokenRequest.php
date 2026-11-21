<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GoogleTokenRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Jeton d'identité Google (id_token JWT) récupéré côté Web/Mobile.
            // Le rôle est toujours `particulier` à la création : l'offre se choisit ensuite.
            'id_token' => ['required', 'string'],
        ];
    }
}
