<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\PersonalAccessToken;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/** Endpoints /internal/* (réseau Docker + signature HMAC). */
class InternalController extends Controller
{
    private function verify(Request $request): void
    {
        $key = config('services.internal.signing_key');
        abort_if(empty($key), 503);

        $signature = (string) $request->header('X-Djassa-Signature');
        if ($signature !== '') {
            $body = $request->getContent();
            if (in_array($body, ['', '[]', '{}'], true)) {
                $body = '';
            }
            foreach (array_unique([$body, '', '[]', '{}']) as $candidate) {
                $expected = hash_hmac('sha256', $request->getMethod()."\n".$request->getPathInfo()."\n".$candidate, $key);
                if (hash_equals($expected, $signature)) {
                    return;
                }
            }
            abort(401, 'Signature interne invalide.');
        }

        // auth_request de nginx ne peut pas calculer de HMAC : header réservé au gateway.
        abort_unless($request->header('X-Gateway-Internal') === '1', 401);
    }

    /** Validation JWT centrale pour le gateway : renvoie X-User-Id / X-User-Role. */
    public function validateJwt(Request $request): JsonResponse
    {
        $this->verify($request);

        $token = $request->bearerToken();
        if (! $token) {
            return response()->json(['message' => 'Token manquant.'], 401);
        }

        $pat = PersonalAccessToken::findToken($token);
        if (! $pat || ($pat->expires_at && $pat->expires_at->isPast())) {
            return response()->json(['message' => 'Token invalide.'], 401);
        }

        /** @var User|null $user */
        $user = $pat->tokenable;
        if (! $user) {
            return response()->json(['message' => 'Utilisateur introuvable.'], 401);
        }

        $pat->forceFill(['last_used_at' => now()])->save();
        Log::debug('[JWT] token validé', ['user_id' => $user->id]);

        return response()->json(['id' => $user->id, 'role' => $user->role])
            ->header('X-User-Id', (string) $user->id)
            ->header('X-User-Role', (string) $user->role)
            ->header('X-User-Plan', (string) $user->plan_abonnement);
    }

    public function getUser(string $id): JsonResponse
    {
        $this->verify($request = request());
        $user = User::query()->select(['id','nom','email','telephone','role','plan_abonnement'])->findOrFail($id);

        return response()->json($user->toArray());
    }

    public function creditWallet(Request $request, string $id): JsonResponse
    {
        $this->verify($request);
        $data = $request->validate(['montant' => ['required','numeric','min:0']]);
        User::whereKey($id)->increment('solde_portefeuille', (float) $data['montant']);

        return response()->json(['ok' => true, 'user_id' => $id]);
    }
}
