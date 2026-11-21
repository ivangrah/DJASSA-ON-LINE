<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChangePlanRequest;
use App\Http\Resources\AbonnementResource;
use App\Models\Abonnement;
use App\Models\User;
use App\Services\GeniusPayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class AbonnementController extends Controller
{
    public function __construct(private GeniusPayService $geniusPay)
    {
    }

    /** Formules disponibles + abonnement courant. */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $current = $user->abonnement;

        return response()->json([
            'formules' => [
                [
                    'formule' => Abonnement::FORMULE_GRATUIT,
                    'nom' => 'Gratuite',
                    'montant_fcfa' => '0.00',
                    'avantages' => [
                        'Publier des annonces d’occasion',
                        'Troc pur et mixte',
                        'Acheter sur le marché',
                        'Messagerie & Mur des souhaits',
                    ],
                    'limitation' => 'Pas de boutique ni de vente de neuf',
                ],
                [
                    'formule' => Abonnement::FORMULE_PRO,
                    'nom' => 'Pro',
                    'montant_fcfa' => (string) Abonnement::PRIX_PRO,
                    'avantages' => [
                        'Toutes les fonctionnalités gratuites',
                        'Ouvrir sa Boutique Pro (vitrine /boutique/:slug)',
                        'Vendre du neuf avec factures PDF',
                        'Dashboard analytics & ventes flash',
                        'Badge vendeur vérifié après KYC',
                    ],
                    'duree_mois' => Abonnement::DUREE_MOIS,
                ],
            ],
            'abonnement' => $current ? AbonnementResource::make($current) : null,
            'plan_actuel' => $user->plan_abonnement,
            'abonnement_actif_jusqu_au' => $user->abonnement_actif_jusqu_au?->toIso8601String(),
            'is_pro' => $user->isProSeller(),
            'needs_plan' => ! $user->hasChosenPlan(),
        ]);
    }

    /** Abonnement de l'utilisateur connecté. */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $abonnement = $user->abonnement;

        return response()->json([
            'abonnement' => $abonnement ? AbonnementResource::make($abonnement) : null,
            'plan' => $user->plan_abonnement,
            'abonnement_actif_jusqu_au' => $user->abonnement_actif_jusqu_au?->toIso8601String(),
            'is_pro' => $user->isProSeller(),
            'needs_plan' => ! $user->hasChosenPlan(),
        ]);
    }

    /** Souscrire à la formule Pro — initie un paiement GeniusPay. */
    public function upgrade(ChangePlanRequest $request): JsonResponse
    {
        $user = $request->user();

        if ($user->isProSeller() && $user->hasActiveProPlan()) {
            return response()->json(['message' => 'Votre formule Pro est déjà active.'], 422);
        }

        // Réutilise un abonnement pending non payé, sinon en crée un nouveau.
        $abonnement = $user->abonnement;
        if (! $abonnement || $abonnement->statut !== Abonnement::STATUT_PENDING) {
            $abonnement = Abonnement::create([
                'utilisateur_id' => $user->id,
                'formule' => Abonnement::FORMULE_PRO,
                'montant_fcfa' => Abonnement::PRIX_PRO,
                'statut' => Abonnement::STATUT_PENDING,
                'reference' => 'DJASSA-PRO-'.strtoupper(bin2hex(random_bytes(6))),
            ]);
        }

        try {
            $session = $this->geniusPay->initiate(Abonnement::PRIX_PRO, $abonnement->reference, [
                'description' => 'Formule Pro Djassa Online — 1 mois',
                'customer' => array_filter([
                    'name' => $user->nom,
                    'email' => $user->email,
                    'phone' => $user->telephone,
                ]),
                'metadata' => ['type' => 'abonnement', 'abonnement_id' => $abonnement->id],
            ]);
        } catch (RuntimeException $e) {
            $abonnement->update(['statut' => Abonnement::STATUT_FAILED]);

            return response()->json(['message' => 'Paiement indisponible pour le moment.'], 502);
        }

        $abonnement->update(['geniuspay_ref' => $session['geniuspay_ref']]);

        return response()->json([
            'abonnement' => AbonnementResource::make($abonnement->fresh()),
            'payment_url' => $session['payment_url'],
            'geniuspay_ref' => $session['geniuspay_ref'],
            'montant' => (string) Abonnement::PRIX_PRO,
            'mock' => $session['mock'],
        ]);
    }

    /** Résilier : retour à la formule gratuite. */
    public function cancel(Request $request): JsonResponse
    {
        $user = $request->user();
        $abonnement = $user->abonnement;

        DB::transaction(function () use ($user, $abonnement) {
            if ($abonnement) {
                $abonnement->update(['statut' => Abonnement::STATUT_CANCELLED]);
            }
            $user->update([
                'plan_abonnement' => User::PLAN_GRATUIT,
                'abonnement_actif_jusqu_au' => null,
                'role' => $user->isAdmin() ? User::ROLE_ADMIN : User::ROLE_PARTICULIER,
            ]);
        });

        return response()->json(['message' => 'Formule Pro résiliée. Vous êtes de retour sur la formule gratuite.']);
    }

    /** Active l'abonnement après paiement (appelé par le webhook). */
    public static function activer(Abonnement $abonnement): void
    {
        if ($abonnement->statut === Abonnement::STATUT_ACTIVE) {
            return;
        }
        $debut = now();
        $abonnement->update([
            'statut' => Abonnement::STATUT_ACTIVE,
            'debut_at' => $debut,
            'fin_at' => $debut->copy()->addMonth(),
        ]);
        $abonnement->utilisateur->update([
            'plan_abonnement' => User::PLAN_PRO,
            'role' => User::ROLE_VENDEUR_PRO,
            'abonnement_actif_jusqu_au' => $debut->copy()->addMonth(),
        ]);
    }
}
