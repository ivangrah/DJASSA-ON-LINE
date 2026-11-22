<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChangePlanRequest;
use App\Http\Resources\AbonnementResource;
use App\Models\Abonnement;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AbonnementController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['formules' => [
            ['formule' => Abonnement::FORMULE_GRATUIT, 'prix_fcfa' => '0.00'],
            ['formule' => Abonnement::FORMULE_PRO, 'prix_fcfa' => (string) Abonnement::PRIX_PRO],
        ]]);
    }

    public function me(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $abonnement = Abonnement::where('utilisateur_id', $user->id)->latest()->first();

        return response()->json([
            'abonnement' => $abonnement ? AbonnementResource::make($abonnement)->resolve() : null,
            'plan' => $user->plan_abonnement,
            'needs_plan' => ! $user->hasChosenPlan(),
            'has_active_pro_plan' => $user->hasActiveProPlan(),
        ]);
    }

    /** Crée l'intention Pro et renvoie le lien de paiement escrow. */
    public function upgrade(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        if ($user->hasActiveProPlan()) {
            return response()->json(['message' => 'Votre formule Pro est déjà active.'], 422);
        }

        $abonnement = Abonnement::query()
            ->where('utilisateur_id', $user->id)
            ->where('formule', Abonnement::FORMULE_PRO)
            ->where('statut', Abonnement::STATUT_PENDING)
            ->latest()->first()
            ?? Abonnement::create([
                'utilisateur_id' => $user->id, 'formule' => Abonnement::FORMULE_PRO,
                'montant_fcfa' => Abonnement::PRIX_PRO, 'statut' => Abonnement::STATUT_PENDING,
                'reference' => 'DJASSA-PRO-'.strtoupper(bin2hex(random_bytes(6))),
            ]);

        // Le checkout est délégué au service escrow via le port interne signé.
        try {
            $session = app(\App\Services\InternalApiClient::class)->checkoutAbonnement(
                $user->id, $abonnement->reference, (float) Abonnement::PRIX_PRO
            );
        } catch (\RuntimeException) {
            return response()->json(['message' => 'Paiement indisponible pour le moment.'], 502);
        }

        $abonnement->update(['geniuspay_ref' => $session['geniuspay_ref'] ?? null]);

        return response()->json([
            'abonnement' => AbonnementResource::make($abonnement->fresh())->resolve(),
            'payment_url' => $session['payment_url'] ?? null,
            'reference' => $abonnement->reference,
        ]);
    }

    public function cancel(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        Abonnement::where('utilisateur_id', $user->id)
            ->where('statut', Abonnement::STATUT_ACTIVE)
            ->update(['statut' => Abonnement::STATUT_CANCELLED]);
        $user->forceFill([
            'plan_abonnement' => User::PLAN_GRATUIT,
            'role' => $user->isAdmin() ? User::ROLE_ADMIN : User::ROLE_PARTICULIER,
            'abonnement_actif_jusqu_au' => null,
        ])->save();

        return response()->json(['message' => 'Formule Pro résiliée.']);
    }
}
