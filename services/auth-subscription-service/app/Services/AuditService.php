<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Http\Request;

/** Écrit les événements d'audit (login/logout/actions admin) dans djassa_auth_db. */
class AuditService
{
    public function record(
        string $action,
        ?string $userId = null,
        ?Request $request = null,
        array $meta = []
    ): AuditLog {
        return AuditLog::create([
            'user_id' => $userId,
            'action' => $action,
            'ip' => $request?->ip(),
            'user_agent' => $request ? (string) $request->userAgent() : null,
            'meta' => $meta ?: null,
            'created_at' => now(),
        ]);
    }
}
