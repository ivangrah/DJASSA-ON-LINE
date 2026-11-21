<?php

namespace App\Http\Requests;

use App\Models\Article;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        $article = $this->route('product');

        $owns = $article && $this->user()
            && ($article->utilisateur_id === $this->user()->id || $this->user()->isAdmin());

        if (! $owns) {
            return false;
        }

        if ($this->input('condition') === Article::CONDITION_NEUF) {
            return $this->user()->can('createNeuf', Article::class);
        }

        return true;
    }

    public function rules(): array
    {
        return [
            'titre' => ['sometimes', 'string', 'min:5', 'max:180'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'prix' => ['sometimes', 'numeric', 'min:0', 'max:99999999.99'],
            'prix_negociable' => ['sometimes', 'boolean'],
            'condition' => ['sometimes', Rule::in([Article::CONDITION_NEUF, Article::CONDITION_COMME_NEUF, Article::CONDITION_BON_ETAT, Article::CONDITION_USAGE])],
            'mode_transaction' => ['sometimes', Rule::in([Article::MODE_VENTE, Article::MODE_TROC, Article::MODE_MIXTE])],
            'est_trocable' => ['sometimes', 'boolean'],
            'stock' => ['sometimes', 'integer', 'min:0', 'max:100000'],
            'categorie' => ['sometimes', 'string', 'max:100'],
            'specs' => ['sometimes', 'nullable', 'array'],
            'ville' => ['sometimes', 'string', 'max:100'],
            'quartier' => ['sometimes', 'nullable', 'string', 'max:100'],
            'statut' => ['sometimes', Rule::in([Article::STATUT_DRAFT, Article::STATUT_PUBLISHED, Article::STATUT_ARCHIVED])],
            'image_urls' => ['sometimes', 'array', 'max:6'],
            'image_urls.*' => ['url', 'max:2048'],
        ];
    }
}
