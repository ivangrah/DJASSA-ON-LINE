<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class InitPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            'type' => ['required', Rule::in(['achat', 'troc_mixte'])],
            // type = achat → article à acheter ; type = troc_mixte → offre acceptée à régler
            'article_id' => ['required_if:type,achat', 'nullable', 'uuid', 'exists:articles,id'],
            'offre_troc_id' => ['required_if:type,troc_mixte', 'nullable', 'uuid', 'exists:offres_troc,id'],
        ];
    }
}
