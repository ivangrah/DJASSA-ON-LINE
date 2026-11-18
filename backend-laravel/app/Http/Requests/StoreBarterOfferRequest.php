<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBarterOfferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            'article_cible_id' => ['required', 'uuid', 'exists:articles,id'],
            'articles_offerts' => ['required', 'array', 'min:1', 'max:10'],
            'articles_offerts.*' => ['uuid', 'distinct', 'exists:articles,id'],
            'montant_soulte_fcfa' => ['sometimes', 'numeric', 'min:0', 'max:99999999.99'],
            'message' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
