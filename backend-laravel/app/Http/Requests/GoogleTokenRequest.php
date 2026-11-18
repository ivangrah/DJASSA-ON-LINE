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
            // Jeton d'identité Google (id_token JWT) récupéré côté Web/Mobile
            'id_token' => ['required', 'string'],
            // Type de compte souhaité à la première connexion (App Flow §2)
            'wanted_role' => ['sometimes', 'in:user,pro_seller'],
        ];
    }
}
