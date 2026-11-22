<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\GoogleTokenRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\SelectPlanRequest;
use App\Http\Resources\AbonnementResource;
use App\Http\Resources\UserResource;
use App\Models\Abonnement;
use App\Models\User;
use App\Services\GoogleTokenVerifier;
use App\Services\InternalApiClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

class AuthController extends Controller
{
    public function __construct(
        private readonly GoogleTokenVerifier $google,
        private readonly InternalApiClient $internal,
        private readonly \App\Services\AuditService $audit,
    ) {
    }

    private function respond(User $user, string $token): JsonResponse
    {
        // Cookie HttpOnly : le jeton n'est plus lisible par le JavaScript (mitigation XSS).
        // Le jeton reste aussi renvoyé en JSON pour les clients mobiles (Bearer).
        $cookie = cookie(
            'djassa_token', $token,
            60 * 24 * 7, '/', null,
            app()->environment('production'),
            true, false, 'Lax'
        );

        return response()->json([
            'user' => UserResource::make($this->withBoutique($user)),
            'token' => $token,
            'token_type' => 'Bearer',
        ])->withCookie($cookie);
    }

    /** Enrichit la ressource sans relation Eloquent cross-base (API interne signée). */
    private function withBoutique(User $user): User
    {
        try {
            $user->boutiquePayload = $this->internal->getBoutiqueByUser($user->id);
        } catch (RuntimeException) {
            $user->boutiquePayload = null; // le catalogue n'est pas encore disponible
        }

        return $user;
    }

    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'nom' => $request->validated('nom'),
            'email' => $request->validated('email'),
            'telephone' => $request->validated('telephone'),
            'password' => $request->validated('password'),
            'ville' => $request->validated('ville', 'Abidjan'),
            'role' => User::ROLE_PARTICULIER,
            'plan_abonnement' => null, // onboarding obligatoire
        ]);

        return $this->respond($user, $user->createToken('djassa-web')->plainTextToken);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->validated('email'))->first();
        if (! $user || ! $user->password || ! Hash::check($request->validated('password'), $user->password)) {
            $this->audit->record('login_failed', $user?->id, $request, ['email' => $request->validated('email')]);
            return response()->json(['message' => 'Identifiants invalides.'], 401);
        }

        $this->audit->record('login', $user->id, $request);
        return $this->respond($user, $user->createToken('djassa-web')->plainTextToken);
    }

    public function google(GoogleTokenRequest $request): JsonResponse
    {
        $data = $this->google->verify($request->validated('id_token'));
        if (! $data) {
            return response()->json(['message' => 'id_token Google invalide.'], 401);
        }

        $user = User::where('google_id', $data['sub'])->first()
            ?? User::where('email', $data['email'])->first();

        if (! $user) {
            $user = User::create([
                'nom' => $data['name'] ?? explode('@', $data['email'])[0],
                'email' => $data['email'], 'google_id' => $data['sub'],
                'email_verified_at' => now(), 'role' => User::ROLE_PARTICULIER,
                'plan_abonnement' => null,
            ]);
        } elseif (! $user->google_id) {
            $user->update(['google_id' => $data['sub']]);
        }

        return $this->respond($user, $user->createToken('djassa-web')->plainTextToken);
    }

    /**
     * B1 : le choix « pro » ne crée qu'une INTENTION de paiement.
     * Aucun rôle vendeur_pro ni plan pro n'est accordé ici : l'activation
     * n'a lieu que sur payment.succeeded vérifié (event Redis → consumer).
     */
    public function selectPlan(SelectPlanRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->isAdmin()) {
            return response()->json(['message' => 'Le compte administrateur n’est pas soumis au choix d’une offre.'], 422);
        }
        if ($user->hasChosenPlan()) {
            return response()->json(['message' => 'Votre offre est déjà choisie.'], 422);
        }

        $plan = $request->validated('plan');

        if ($plan === User::PLAN_PRO) {
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

            // Offre formelle gratuite jusqu'au paiement confirmé.
            $user->forceFill([
                'role' => User::ROLE_PARTICULIER,
                'plan_abonnement' => User::PLAN_GRATUIT,
                'abonnement_actif_jusqu_au' => null,
            ])->save();

            return response()->json([
                'message' => 'Finalisez le paiement Pro pour activer vos outils vendeur.',
                'user' => UserResource::make($this->withBoutique($user->refresh())),
                'abonnement' => (new AbonnementResource($abonnement))->resolve(),
                'redirect_to' => '/dashboard',
            ]);
        }

        $user->forceFill([
            'role' => User::ROLE_PARTICULIER,
            'plan_abonnement' => User::PLAN_GRATUIT,
            'abonnement_actif_jusqu_au' => null,
        ])->save();

        return response()->json([
            'message' => 'Votre offre gratuite est active.',
            'user' => UserResource::make($this->withBoutique($user->refresh())),
            'redirect_to' => '/dashboard',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => UserResource::make($this->withBoutique($request->user()))]);
    }

    public function logout(Request $request): JsonResponse
    {
        $this->audit->record('logout', (string) ($request->user()?->id ?? ''), $request);
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'Déconnecté.'])
            ->withoutCookie('djassa_token');
    }
}
