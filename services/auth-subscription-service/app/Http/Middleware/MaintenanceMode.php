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
