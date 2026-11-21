<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SelectPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'plan' => ['required', 'string', Rule::in(['gratuit', 'pro'])],
        ];
    }

    public function messages(): array
    {
        return [
            'plan.required' => 'Choisissez l’offre Gratuite ou l’offre Pro.',
            'plan.in' => 'Offre invalide. Valeurs acceptées : gratuit, pro.',
        ];
    }
}
