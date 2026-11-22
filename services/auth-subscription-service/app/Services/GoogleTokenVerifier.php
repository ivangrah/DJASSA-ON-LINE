<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

/** Vérification id_token via Google tokeninfo — timeouts stricts (règle 18 : 3s / 8s). */
class GoogleTokenVerifier
{
    public function verify(string $idToken): ?array
    {
        try {
            $response = Http::connectTimeout((int) config('services.google.connect_timeout', 3))
                ->timeout((int) config('services.google.timeout', 8))
                ->asJson()
                ->get(config('services.google.tokeninfo_url'), ['id_token' => $idToken]);

            if ($response->failed()) {
                return null;
            }
            $data = $response->json();
        } catch (\Throwable $e) {
            throw new RuntimeException('Google OAuth indisponible.', 503, $e);
        }

        $clientId = config('services.google.client_id');
        if (! empty($clientId) && ($data['aud'] ?? null) !== $clientId) {
            return null; // audience invalide
        }
        if (! empty($data['exp']) && (int) $data['exp'] < time()) {
            return null; // token expiré
        }
        if (empty($data['sub']) || empty($data['email'])) {
            return null;
        }

        return $data;
    }
}
