<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;

class StoreBoutiqueRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Ouverture de boutique : rôle pro_seller requis (App Flow §2 étape 2)
        return $this->user()?->isProSeller() ?? false;
    }

    protected function failedAuthorization()
    {
        abort(response()->json([
            'message' => 'Ouvrir une Boutique Pro requiert un compte vendeur pro. Choisissez « Ouvrir une Boutique Pro » à l’inscription ou contactez le support.',
        ], 403));
    }

    public function rules(): array
    {
        return [
            'nom_boutique' => ['required', 'string', 'min:3', 'max:150', 'unique:boutiques,nom_boutique'],
            'description' => ['nullable', 'string', 'max:2000'],
            'telephone' => ['required', 'string', 'regex:/^\+?[0-9 ().-]{8,20}$/'],
            'categorie' => ['required', 'string', 'max:100'],
            'adresse' => ['nullable', 'string', 'max:255'],
            'ville' => ['sometimes', 'string', 'max:100'],
            'rccm_doc' => ['nullable', 'string', 'max:2048'],
            'accepte_troc' => ['sometimes', 'boolean'],
        ];
    }

    public function boutiqueData(): array
    {
        $validated = $this->validated();
        $validated['slug'] = $this->uniqueSlug($validated['nom_boutique']);

        return $validated;
    }

    private function uniqueSlug(string $nom): string
    {
        $base = Str::slug($nom) ?: 'boutique';
        $slug = $base;
        $i = 2;

        while (\App\Models\Boutique::where('slug', $slug)->exists()) {
            $slug = $base.'-'.$i++;
        }

        return $slug;
    }
}
