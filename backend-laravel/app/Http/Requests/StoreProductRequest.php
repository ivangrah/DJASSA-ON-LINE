<?php

namespace App\Http\Requests;

use App\Models\Article;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
{
    /**
     * Règle métier B2C (TRD §7.1 RBAC) : `condition = neuf` + stock géré
     * réservés aux Boutiques Pro vérifiées. Sinon → 422 explicite.
     */
    public function authorize(): bool
    {
        if (! $this->user()) {
            return false;
        }

        if ($this->input('condition') === Article::CONDITION_NEUF) {
            // Policy = source de vérité : rôle vendeur_pro + boutique vérifiée.
            return $this->user()->can('createNeuf', Article::class);
        }

        return true;
    }

    protected function failedAuthorization()
    {
        abort(response()->json([
            'message' => 'La publication d’articles neufs est réservée aux Boutiques Pro vérifiées. Choisissez l’offre Pro, ouvrez votre boutique et faites-la vérifier pour obtenir le badge Vendeur Vérifié.',
        ], 422));
    }

    public function rules(): array
    {
        return [
            'titre' => ['required', 'string', 'min:5', 'max:180'],
            'description' => ['nullable', 'string', 'max:5000'],
            'prix' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
            'prix_negociable' => ['sometimes', 'boolean'],
            'condition' => ['required', Rule::in([Article::CONDITION_NEUF, Article::CONDITION_COMME_NEUF, Article::CONDITION_BON_ETAT, Article::CONDITION_USAGE])],
            'mode_transaction' => ['required', Rule::in([Article::MODE_VENTE, Article::MODE_TROC, Article::MODE_MIXTE])],
            'est_trocable' => ['sometimes', 'boolean'],
            'stock' => ['sometimes', 'integer', 'min:1', 'max:100000'],
            'categorie' => ['required', 'string', 'max:100'],
            'specs' => ['nullable', 'array'],
            'specs.*' => ['nullable'],
            'ville' => ['sometimes', 'string', 'max:100'],
            'quartier' => ['nullable', 'string', 'max:100'],
            // Upload fichiers : jpeg/png/webp (TRD §7.1) — compression client recommandée (< 350 Ko)
            // 4 vues du produit exigées (carrousel au survol sur les cartes)
            'images' => ['required_without:image_urls', 'array', 'min:4', 'max:6'],
            'images.*' => ['image', 'mimes:jpeg,jpg,png,webp', 'max:8192'],
            'image_urls' => ['required_without:images', 'array', 'min:4', 'max:6'],
            'image_urls.*' => ['url', 'max:2048'],
        ];
    }

    public function attributes(): array
    {
        return [
            'titre' => 'titre',
            'prix' => 'prix (FCFA)',
            'mode_transaction' => 'mode de transaction',
        ];
    }
}
