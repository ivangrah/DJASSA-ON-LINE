<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Vérifie le header HMAC X-Djassa-Signature sur les appels inter-services (D3).
 * La charge signée est : METHODE + "\n" + CHEMIN + "\n" + CORPS_BRUT.
 */
class VerifyInternalSignature
{
    public function handle(Request $request, Closure $next): Response
    {
        $key = config('services.internal.signing_key');
        if (empty($key)) {
            return response()->json(['message' => 'DJASSA_INTERNAL_SIGNING_KEY non configurée.'], 503);
        }

        $body = $request->getContent();
        // Les clients HTTP sérialisent différemment un corps vide : '', '[]' ou '{}'.
        if (in_array($body, ['', '[]', '{}'], true)) {
            $body = '';
        }

        $provided = (string) $request->header('X-Djassa-Signature');
        $candidates = array_unique([$body, '', '[]', '{}']);

        foreach ($candidates as $candidate) {
            $expected = hash_hmac('sha256',
                $request->getMethod()."\n".$request->getPathInfo()."\n".$candidate,
                $key
            );
            if (hash_equals($expected, $provided)) {
                return $next($request);
            }
        }

        return response()->json(['message' => 'Signature interne invalide.'], 401);
    }
}
