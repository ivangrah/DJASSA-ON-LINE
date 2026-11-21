<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\GoogleTokenRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\SelectPlanRequest;
use App\Http\Resources\UserResource;
use App\Models\Boutique;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class AuthController extends Controller
{
    /**
     * POST /api/v1/auth/register — inscription email/mot de passe.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'nom' => $request->validated('nom'),
            'email' => $request->validated('email'),
            'telephone' => $request->validated('telephone'),
            'password' => $request->validated('password'),
            'ville' => $request->validated('ville', 'Abidjan'),
            'role' => User::ROLE_PARTICULIER,
            // NULL = l'utilisateur doit encore passer par /choisir-offre.
            'plan_abonnement' => null,
            'abonnement_actif_jusqu_au' => null,
        ]);

        $token = $user->createToken('djassa-web')->plainTextToken;

        return response()->json([
            'user' => UserResource::make($user->load(['boutique', 'abonnement'])),
            'token' => $token,
            'token_type' => 'Bearer',
        ], 201);
    }

    /**
     * POST /api/v1/auth/login — connexion email/mot de passe.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->validated('email'))->first();

        if (! $user || ! $user->password || ! Hash::check($request->validated('password'), $user->password)) {
            return response()->json(['message' => 'Identifiants invalides.', 'errors' => ['email' => ['E-mail ou mot de passe incorrect.']]], 422);
        }

        $token = $user->createToken('djassa-web')->plainTextToken;

        return response()->json([
            'user' => UserResource::make($user->load(['boutique', 'abonnement'])),
            'token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    /**
     * POST /api/v1/auth/google — connexion via Google Cloud OAuth 2.0 (id_token).
     * Per App Flow §2 : vérification du jeton auprès de Google, création ou liaison du compte.
     */
    public function google(GoogleTokenRequest $request): JsonResponse
    {
        $payload = $this->verifyGoogleIdToken($request->validated('id_token'));

        if (! $payload) {
            return response()->json(['message' => 'Jeton Google invalide ou expiré.'], 401);
        }

        $googleId = (string) $payload['sub'];
        $email = $payload['email'] ?? null;
        $emailVerified = filter_var($payload['email_verified'] ?? false, FILTER_VALIDATE_BOOL);
        $nom = $payload['name'] ?? ($email ? strstr($email, '@', true) : 'Utilisateur Djassa');
        $avatar = $payload['picture'] ?? null;

        if (! $email || ! $emailVerified) {
            return response()->json(['message' => 'Un e-mail Google vérifié est requis.'], 422);
        }

        $user = User::where('google_id', $googleId)->first()
            ?? User::where('email', $email)->first();

        if ($user) {
            // Liaison / complétion du compte existant — le rôle et l'offre ne changent jamais ici.
            $user->fill([
                'google_id' => $user->google_id ?? $googleId,
                'avatar' => $user->avatar ?? $avatar,
                'email_verified_at' => $user->email_verified_at ?? now(),
            ])->save();
        } else {
            $user = User::create([
                'nom' => $nom,
                'email' => $email,
                'google_id' => $googleId,
                'avatar' => $avatar,
                'email_verified_at' => now(),
                'role' => User::ROLE_PARTICULIER,
                'plan_abonnement' => null,
                'abonnement_actif_jusqu_au' => null,
                'password' => null,
            ]);
        }

        $token = $user->createToken($user->isProSeller() ? 'djassa-pro' : 'djassa-web')->plainTextToken;

        return response()->json([
            'user' => UserResource::make($user->load(['boutique', 'abonnement'])),
            'token' => $token,
            'token_type' => 'Bearer',
            'needs_plan' => ! $user->hasChosenPlan(),
            'needs_boutique' => $user->isProSeller() && ! $user->boutique,
        ]);
    }

    /**
     * POST /api/v1/auth/select-plan — choix obligatoire de l'offre après inscription.
     *
     * gratuit → particulier + plan_abonnement=gratuit
     * pro     → vendeur_pro + plan_abonnement=pro + période d'un mois
     */
    public function selectPlan(SelectPlanRequest $request): JsonResponse
    {
        $user = $request->user();

        if ($user->isAdmin()) {
            return response()->json([
                'message' => 'Le compte administrateur n’est pas soumis au choix d’une offre.',
            ], 422);
        }

        $plan = $request->validated('plan');

        $user = DB::transaction(function () use ($user, $plan): User {
            /** @var User $locked */
            $locked = User::query()->lockForUpdate()->findOrFail($user->id);

            if ($plan === User::PLAN_PRO) {
                $proDejaActif = $locked->isProSeller()
                    && $locked->plan_abonnement === User::PLAN_PRO
                    && $locked->abonnement_actif_jusqu_au !== null
                    && $locked->abonnement_actif_jusqu_au->isFuture();

                $locked->forceFill([
                    'role' => User::ROLE_VENDEUR_PRO,
                    'plan_abonnement' => User::PLAN_PRO,
                    'abonnement_actif_jusqu_au' => $proDejaActif
                        ? $locked->abonnement_actif_jusqu_au
                        : now()->addMonth(),
                ])->save();
            } else {
                $locked->forceFill([
                    'role' => User::ROLE_PARTICULIER,
                    'plan_abonnement' => User::PLAN_GRATUIT,
                    'abonnement_actif_jusqu_au' => null,
                ])->save();
            }

            return $locked;
        });

        $user->load(['boutique', 'abonnement']);

        return response()->json([
            'message' => $plan === User::PLAN_PRO
                ? 'Votre offre Pro est active. Bienvenue dans votre espace vendeur.'
                : 'Votre offre gratuite est active. Bienvenue sur Djassa Online.',
            'user' => UserResource::make($user),
            'redirect_to' => $plan === User::PLAN_PRO ? '/dashboard-pro' : '/dashboard',
        ]);
    }

    /**
     * POST /api/v1/auth/logout — révocation du jeton courant.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json(['message' => 'Déconnexion réussie.']);
    }

    /**
     * GET /api/v1/auth/me — profil courant.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => UserResource::make($request->user()->load(['boutique', 'abonnement'])),
        ]);
    }

    /**
     * Vérifie un id_token Google via l'endpoint tokeninfo et contrôle l'audience
     * (web / Android / iOS clients déclarés dans le projet Google Cloud).
     *
     * @return array<string, mixed>|null
     */
    private function verifyGoogleIdToken(string $idToken): ?array
    {
        $allowedAud = array_filter(array_map('trim', explode(',', (string) config('services.google.client_id'))));

        if (empty($allowedAud)) {
            Log::warning('[Auth] GOOGLE_CLIENT_ID absent — vérification Google impossible (dev).');

            // En développement sans clé : on accepte uniquement un token factice 'dev' (tests locaux)
            if (app()->environment('local') && str_starts_with($idToken, 'dev.')) {
                return ['sub' => substr($idToken, 4), 'email' => 'dev-'.substr($idToken, 4).'@djassaonline.ci', 'email_verified' => true, 'name' => 'Dev Google'];
            }

            return null;
        }

        try {
            $response = Http::timeout(10)->get('https://oauth2.googleapis.com/tokeninfo', ['id_token' => $idToken]);
        } catch (\Throwable $e) {
            Log::error('[Auth] Google tokeninfo indisponible', ['error' => $e->getMessage()]);

            return null;
        }

        if (! $response->successful()) {
            return null;
        }

        $payload = $response->json();

        if (! isset($payload['aud']) || ! in_array($payload['aud'], $allowedAud, true)) {
            Log::warning('[Auth] id_token Google : audience non autorisée', ['aud' => $payload['aud'] ?? null]);

            return null;
        }

        if (isset($payload['exp']) && (int) $payload['exp'] < now()->timestamp) {
            return null;
        }

        return $payload;
    }
}
