<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class VerifyPinRequest extends FormRequest
{
    public function authorize(): bool
    {
        $transaction = $this->route('transaction');

        return $transaction && $this->user()
            && ($transaction->vendeur_id === $this->user()->id || $this->user()->isAdmin());
    }

    public function rules(): array
    {
        return [
            'pin' => ['required', 'string', 'regex:/^\d{4}$/'],
        ];
    }

    public function messages(): array
    {
        return ['pin.regex' => 'Le code PIN est composé de 4 chiffres.'];
    }
}
