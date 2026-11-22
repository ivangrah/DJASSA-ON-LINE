<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

/** Appels internes signés (HMAC) vers escrow pour l'agrégation financière admin. */
class AdminFinancialClient
{
    public function __construct(
        private readonly string $escrowUrl,
        private readonly string $signingKey,
    ) {}

    /** Statistiques financières d'un vendeur (règle 15 : appel poolé par l'appelant). */
    public function stats(string $vendeurId): array
    {
        $path = '/internal/escrow/stats?vendeur_id='.urlencode($vendeurId);
        $signature = hash_hmac('sha256', "GET\n".$path."\n", $this->signingKey);
        try {
            $res = Http::withHeaders([
                'Accept' => 'application/json',
                'X-Djassa-Signature' => $signature,
            ])->connectTimeout(3)->timeout(8)
              ->get(rtrim($this->escrowUrl, '/').$path);
            return $res->successful() ? $res->json() : [];
        } catch (\Throwable) {
            return [];
        }
    }
}
