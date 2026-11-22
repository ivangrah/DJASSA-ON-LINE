<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Protection stricte /admin/* : exige X-User-Role === 'admin' (injecté par la gateway)
 * ou un compte Sanctum local de rôle admin. Tout autre rôle -> 403.
 */
class EnsureAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $role = (string) $request->header('X-User-Role', '');
        if ($role === '') {
            $role = (string) ($request->user()?->role ?? '');
        }
        abort_unless($role === 'admin', 403, 'Accès réservé aux administrateurs.');

        return $next($request);
    }
}
