<?php

namespace App\Http\Middleware;

use App\Services\MaintenanceService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Bloque les non-admin (503 + message) quand le Mode Maintenance est actif. */
class MaintenanceMode
{
    public function __construct(private readonly MaintenanceService $maintenance) {}

    public function handle(Request $request, Closure $next): Response
    {
        // Exemptions : connexion (pour que l'admin puisse entrer) et validation JWT interne de la gateway.
        $path = $request->path();
        if (str_starts_with($path, 'internal/') || in_array($path, [
            'api/v1/auth/login', 'api/v1/auth/register', 'api/v1/auth/google', 'api/v1/maintenance', 'up',
        ], true)) {
            return $next($request);
        }

        $state = $this->maintenance->state();
        if (! ($state['enabled'] ?? false)) {
            return $next($request);
        }
        $role = (string) $request->header('X-User-Role', '') ?: (string) ($request->user()?->role ?? '');
        if ($role === 'admin') {
            return $next($request);
        }

        return response()->json([
            'message' => $state['message'] ?: 'La plateforme est en maintenance.',
            'maintenance' => true,
        ], 503);
    }
}
