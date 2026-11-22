<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

/** Résout le nombre de destinataires via auth-service interne (HMAC). */
class CampaignTargetService
{
    public function count(string $audience, ?string $userId): int
    {
        $base = rtrim((string) config('services.internal.auth_url', 'http://auth-subscription-service:8080'), '/');
        $key = (string) config('services.internal.signing_key', '');
        $path = '/internal/auth/users/count';
        $query = http_build_query(array_filter(['audience' => $audience, 'user_id' => $userId]));
        $sig = hash_hmac('sha256', "GET\n{$path}\n", $key);
        try {
            $res = Http::withHeaders(['Accept' => 'application/json', 'X-Djassa-Signature' => $sig])
                ->connectTimeout(3)->timeout(8)->get($base . $path, array_filter(['audience' => $audience, 'user_id' => $userId]));
            if ($res->successful()) return (int) ($res->json('count') ?? 0);
        } catch (\Throwable) {}
        // fallback conservative
        return $audience === 'user' && $userId ? 1 : 0;
    }
}
