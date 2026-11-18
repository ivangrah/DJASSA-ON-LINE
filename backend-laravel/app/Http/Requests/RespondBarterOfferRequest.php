<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Réponse à une offre de troc :
 *  vendeur   → accept | reject | counter  (contre-offre = soulte ajustée)
 *  acheteur  → accept_counter | decline_counter
 */
class RespondBarterOfferRequest extends FormRequest
{
    public function authorize(): bool
    {
        $offre = $this->route('barterOffer');

        if (! $offre || ! $this->user()) {
            return false;
        }

        $action = $this->input('action');

        return match ($action) {
            'accept', 'reject', 'counter' => $offre->vendeur_id === $this->user()->id,
            'accept_counter', 'decline_counter' => $offre->acheteur_id === $this->user()->id,
            default => false,
        };
    }

    protected function failedAuthorization()
    {
        abort(response()->json(['message' => 'Vous n’êtes pas autorisé à répondre à cette offre.'], 403));
    }

    public function rules(): array
    {
        return [
            'action' => ['required', Rule::in(['accept', 'reject', 'counter', 'accept_counter', 'decline_counter'])],
            'montant_contre_offre_fcfa' => ['required_if:action,counter', 'nullable', 'numeric', 'min:0', 'max:99999999.99'],
            'message' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
