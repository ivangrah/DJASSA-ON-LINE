<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\WebhookLog;
use App\Services\BrevoNotificationService;
use App\Services\EscrowService;
use App\Services\GeniusPayService;
use App\Services\InternalApiClient;
use App\Services\RedisStreamPublisher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/** Webhook GeniusPay : signature HMAC + idempotence, sans modèle cross-domaine. */
class WebhookController extends Controller
{
    private const SUCCESS = ['success', 'successful', 'completed', 'payment.success', 'paid'];
    private const FAILURE = ['failed', 'failure', 'cancelled', 'canceled', 'error', 'payment.failed'];

    public function __construct(
        private readonly GeniusPayService $geniusPay,
        private readonly EscrowService $escrow,
        private readonly InternalApiClient $internal,
        private readonly RedisStreamPublisher $events,
        private readonly BrevoNotificationService $notifications,
    ) {
    }

    public function geniuspay(Request $request): JsonResponse
    {
        $raw = $request->getContent();
        if (! $this->geniusPay->verifyWebhookSignature($raw, $request->header('X-GeniusPay-Signature'))) {
            Log::warning('[Webhook] Signature invalide');

            return response()->json(['message' => 'Signature invalide.'], 401);
        }

        $payload = json_decode($raw, true) ?: [];
        $reference = $payload['reference'] ?? $payload['geniuspay_ref'] ?? $payload['data']['reference'] ?? null;
        if (! $reference) {
            return response()->json(['message' => 'Référence manquante.'], 422);
        }

        $eventId = (string) ($payload['event_id'] ?? $payload['id'] ?? hash('sha256', $raw));
        $hash = hash('sha256', $raw);

        if (WebhookLog::where('fournisseur', 'geniuspay')->where('reference', $reference)->where('event_id', $eventId)->exists()) {
            return response()->json(['received' => true, 'idempotent' => true]);
        }

        $status = strtolower((string) ($payload['status'] ?? $payload['event'] ?? $payload['data']['status'] ?? ''));
        $response = $this->process($reference, $status, $payload);

        WebhookLog::create([
            'fournisseur' => 'geniuspay', 'reference' => $reference,
            'event_id' => $eventId, 'payload_hash' => $hash, 'traite_le' => now(),
        ]);

        return $response;
    }

    private function process(string $reference, string $status, array $payload): JsonResponse
    {
        // Abonnement Pro : l'activation est déléguée à auth-subscription via événement.
        if (str_starts_with($reference, 'DJASSA-PRO-')) {
            if (in_array($status, self::SUCCESS, true)) {
                $this->events->publish('payment.succeeded', [
                    'reference' => $reference, 'type' => 'abonnement', 'payload' => $payload,
                ]);

                return response()->json(['received' => true, 'abonnement' => 'active']);
            }
            $this->events->publish('payment.failed', ['reference' => $reference, 'type' => 'abonnement']);

            return response()->json(['received' => true, 'abonnement' => 'failed']);
        }

        $transaction = Transaction::where('geniuspay_ref', $reference)->first();
        if (! $transaction && preg_match('/^DJASSA-[A-Z_]+-([0-9a-f-]{36})$/i', $reference, $m)) {
            $transaction = Transaction::where('id', $m[1])->first();
        }
        if (! $transaction) {
            return response()->json(['message' => 'Transaction inconnue.'], 404);
        }

        if (in_array($status, self::SUCCESS, true)) {
            $pin = $this->escrow->marquerHeld($transaction);
            if ($pin !== null) {
                $acheteur = $this->internal->getUser($transaction->acheteur_id);
                if (! empty($acheteur['email'])) {
                    $this->notifications->pinEscrowEmail(
                        (object) $acheteur, $pin, (float) $transaction->montant, 'Article Djassa Online'
                    );
                }
            }
            $this->events->publish('payment.held', [
                'transaction_id' => $transaction->id, 'reference' => $reference,
            ]);

            return response()->json(['received' => true]);
        }

        if (in_array($status, self::FAILURE, true)) {
            $this->escrow->marquerEchec($transaction);

            return response()->json(['received' => true]);
        }

        return response()->json(['received' => true, 'ignored' => true]);
    }
}
