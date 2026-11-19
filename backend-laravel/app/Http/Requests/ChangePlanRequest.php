<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ChangePlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            'formule' => ['required', 'in:pro'],
        ];
    }

    public function messages(): array
    {
        return [
            'formule.in' => 'Seule la formule Pro peut être souscrite depuis cette page.',
        ];
    }
}
