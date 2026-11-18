<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nom' => ['required', 'string', 'min:2', 'max:150'],
            'email' => ['required', 'email:rfc', 'max:255', 'unique:users,email'],
            'telephone' => ['nullable', 'string', 'regex:/^\+?[0-9 ().-]{8,20}$/', 'unique:users,telephone'],
            'password' => ['required', 'string', 'min:8', 'max:72', 'confirmed'],
            'ville' => ['sometimes', 'string', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique' => 'Un compte existe déjà avec cet e-mail.',
            'telephone.unique' => 'Ce numéro de téléphone est déjà utilisé.',
            'password.confirmed' => 'Les mots de passe ne correspondent pas.',
        ];
    }
}
