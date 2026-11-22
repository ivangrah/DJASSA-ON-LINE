<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class VerifyPinRequest extends FormRequest
{
    public function authorize(): bool
    {
        $transaction = $this->route('transaction');

        return $transaction && $transaction->vendeur_id === (string) $this->header('X-User-Id');
    }

    public function rules(): array
    {
        return ['pin' => ['required', 'string', 'regex:/^\d{4}$/']];
    }
}
