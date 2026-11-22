<?php
namespace App\Http\Middleware;
use Closure;
use Illuminate\Http\Request;
class EnsureAdmin
{
    public function handle(Request $request, Closure $next)
    {
        abort_unless((string) $request->header('X-User-Role', '') === 'admin', 403, 'Accès réservé aux administrateurs.');
        return $next($request);
    }
}
