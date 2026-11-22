<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class InitPaymentRequest extends FormRequest
{
    public function authorize(): bool { return true; } // JWT validé en amont par le gateway

    public function rules(): array
    {
        return [
            'type' => ['required', Rule::in(['achat', 'troc_mixte'])],
            'article_id' => ['required_if:type,achat', 'nullable', 'uuid'],
            'offre_troc_id' => ['required_if:type,troc_mixte', 'nullable', 'uuid'],
        ];
    }
}
