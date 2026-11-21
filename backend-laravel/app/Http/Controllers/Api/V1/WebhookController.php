<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Abonnement;
use App\Models\Article;
use App\Models\Message;
use App\Models\Transaction;
use App\Models\WebhookLog;
use App\Services\BrevoNotificationService;
use App\Services\EscrowService;
use App\Services\GeniusPayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * /webhooks — réception sécurisée des notifications GeniusPay.
 * Signature HMAC-SHA256 vérifiée sur le corps brut (TRD §5.2).
 * Idempotent : un même événement renvoyé deux fois ne double pas l'effet.
 */
class WebhookController extends Controller
{
    public function __construct(
        private readonly GeniusPayService $geniusPay,
        private readonly EscrowService $escrow,
        private readonly BrevoNotificationService $notifications,
    ) {
    }

    public function geniuspay(Request $request): JsonResponse
    {
        $rawBody = $request->getContent();
        $signature = $request->header('X-GeniusPay-Signature');

        if (! $this->geniusPay->verifyWebhookSignature($rawBody, $signature)) {
            Log::warning('[Webhook GeniusPay] Signature invalide', ['ip' => $request->ip()]);

            return response()->json(['message' => 'Signature invalide.'], 401);
        }

        $payload = json_decode($rawBody, true) ?: [];
        $reference = $payload['reference'] ?? $payload['geniuspay_ref'] ?? $payload['data']['reference'] ?? null;
        $status = $payload['status'] ?? $payload['event'] ?? $payload['data']['status'] ?? null;

        if (! $reference) {
            return response()->json(['message' => 'Référence manquante.'], 422);
        }

        $payloadHash = hash('sha256', $rawBody);
        $eventId = (string) ($payload['event_id'] ?? $payload['id'] ?? $payloadHash);

        // Idempotence : un même événement rejoué est acquitté sans rejouer l'effet métier.
        $dejaTraite = WebhookLog::query()
            ->where('fournisseur', 'geniuspay')
            ->where('reference', $reference)
            ->where('event_id', $eventId)
            ->exists();

        if ($dejaTraite) {
            Log::info('[Webhook GeniusPay] Événement déjà traité (idempotent)', ['reference' => $reference, 'event_id' => $eventId]);

            return response()->json(['received' => true, 'idempotent' => true]);
        }

        Log::info('[Webhook GeniusPay] Événement reçu', ['reference' => $reference, 'status' => $status]);

        $response = $this->processGeniusPay($payload, $reference, $status);

        WebhookLog::create([
            'fournisseur' => 'geniuspay',
            'reference' => $reference,
            'event_id' => $eventId,
            'payload_hash' => $payloadHash,
            'traite_le' => now(),
        ]);

        return $response;
    }

    private function processGeniusPay(array $payload, string $reference, ?string $status): JsonResponse
    {
        // Abonnement Pro (DJASSA-PRO-…) — activé avant toute recherche de transaction
        if (str_starts_with($reference, 'DJASSA-PRO-') || Abonnement::where('geniuspay_ref', $reference)->exists()) {
            $abonnement = Abonnement::where('geniuspay_ref', $reference)
                ->orWhere('reference', $reference)
                ->first();
            if ($abonnement) {
                if ($abonnement->statut === Abonnement::STATUT_ACTIVE) {
                    return response()->json(['received' => true, 'idempotent' => true]);
                }
                if ($this->isSuccessStatus((string) $status)) {
                    AbonnementController::activer($abonnement);
                    Log::info('[Webhook] Abonnement Pro activé', ['abonnement_id' => $abonnement->id]);
                    return response()->json(['received' => true, 'abonnement' => 'active']);
                }
                $abonnement->update(['statut' => Abonnement::STATUT_FAILED]);
                return response()->json(['received' => true, 'abonnement' => 'failed']);
            }
        }

        $transaction = Transaction::where('geniuspay_ref', $reference)->first();

        if (! $transaction) {
            // La référence locale (DJASSA-...) peut être renvoyée selon l'intégration
            $transaction = Transaction::where('id', 'like', '%'.preg_replace('/^DJASSA-(ACHAT|SOULTE)-/', '', $reference).'%')->first();
        }

        if (! $transaction) {
            return response()->json(['message' => 'Transaction inconnue.'], 404);
        }

        if ($this->isSuccessStatus((string) $status)) {
            if ($transaction->escrow_status === Transaction::ESCROW_HELD) {
                return response()->json(['received' => true, 'idempotent' => true]);
            }

            try {
                $pin = $this->escrow->marquerHeld($transaction);
            } catch (\RuntimeException $e) {
                // État incompatible (échec/refund…) : on acquitte pour éviter les tempêtes de retry GeniusPay
                Log::warning('[Webhook GeniusPay] marquerHeld ignoré', ['reference' => $reference, 'error' => $e->getMessage()]);

                return response()->json(['received' => true, 'ignored' => true]);
            }

            if ($pin !== null) {
                $transaction->refresh();

                Message::create([
                    'expediteur_id' => $transaction->vendeur_id,
                    'destinataire_id' => $transaction->acheteur_id,
                    'article_id' => $transaction->article_id,
                    'type' => Message::TYPE_SYSTEME,
                    'contenu' => 'Paiement confirmé — vos fonds sont bloqués en séquestre. Présentez votre code PIN au vendeur à la remise.',
                    'payload' => ['escrow_status' => 'held', 'transaction_id' => $transaction->id],
                ]);

                $acheteur = $transaction->acheteur;
                if ($acheteur?->email) {
                    $this->notifications->pinEscrowEmail($acheteur, $pin, (float) $transaction->montant, $transaction->article?->titre ?? 'Article');
                }
            }

            return response()->json(['received' => true]);
        }

        if ($this->isFailureStatus((string) $status)) {
            $this->escrow->marquerEchec($transaction);

            return response()->json(['received' => true]);
        }

        return response()->json(['received' => true, 'ignored' => true]);
    }

    private function isSuccessStatus(string $status): bool
    {
        return in_array(strtolower($status), ['success', 'successful', 'completed', 'payment.success', 'paid'], true);
    }

    private function isFailureStatus(string $status): bool
    {
        return in_array(strtolower($status), ['failed', 'failure', 'cancelled', 'canceled', 'error', 'payment.failed'], true);
    }
}
