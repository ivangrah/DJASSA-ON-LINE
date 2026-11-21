<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restriction d'accès par rôle — ex. `role:vendeur_pro` ou `role:vendeur_pro,admin`.
 * L'administrateur conserve un accès transversal (supervision).
 */
class EnsureUserRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user || (! in_array($user->role, $roles, true) && ! $user->isAdmin())) {
            return response()->json([
                'message' => 'Accès réservé aux rôles : '.implode(', ', $roles).'.',
            ], 403);
        }

        return $next($request);
    }
}
