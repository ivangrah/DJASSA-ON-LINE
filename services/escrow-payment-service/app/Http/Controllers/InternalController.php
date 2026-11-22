<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Services\GeniusPayService;
use App\Models\WebhookLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

/** Endpoints /internal/* — réseau Docker privé + header HMAC signé (D3). */
class InternalController extends Controller
{
    private function verifyInternalSignature(Request $request): void
    {
        $key = config('services.internal.signing_key');
        if (empty($key)) {
            throw new RuntimeException('DJASSA_INTERNAL_SIGNING_KEY manquante.');
        }
        $body = $request->getContent();
        $expected = hash_hmac('sha256', $request->getMethod()."\n".$request->getPathInfo()."\n".$body, $key);
        abort_unless(hash_equals($expected, (string) $request->header('X-Djassa-Signature')), 401);
    }

    /** Checkout d'abonnement Pro appelé par auth-subscription ( interne signé ). */
    public function checkout(Request $request, GeniusPayService $geniusPay): JsonResponse
    {
        $this->verifyInternalSignature($request);
        $data = $request->validate([
            'user_id' => ['required','uuid'],
            'reference' => ['required','string'],
            'montant' => ['required','numeric','min:0'],
        ]);

        // Idempotence : la référence déterministe (ex. DJASSA-SOULTE-{offre}) sert de clé.
        $existing = Transaction::where('idempotency_key', $data['reference'])->first();
        if ($existing) {
            return response()->json([
                'payment_url' => null, 'mock' => false,
                'geniuspay_ref' => $existing->geniuspay_ref,
                'transaction_id' => $existing->id, 'idempotent' => true,
            ]);
        }

        $transaction = Transaction::create([
            'acheteur_id' => $data['user_id'],
            'vendeur_id' => '00000000-0000-4000-8000-000000000000',
            'type' => Transaction::TYPE_ACHAT, 'montant' => $data['montant'],
            'frais_escrow' => 0, 'escrow_status' => Transaction::ESCROW_INITIATED,
            'idempotency_key' => $data['reference'],
        ]);
        $session = $geniusPay->initiate((float) $data['montant'], $data['reference'], [
            'description' => 'Abonnement Pro Djassa Online',
            'metadata' => ['type' => 'abonnement', 'transaction_id' => $transaction->id],
        ]);
        $transaction->update(['geniuspay_ref' => $session['geniuspay_ref']]);

        return response()->json([
            'payment_url' => $session['payment_url'], 'mock' => $session['mock'],
            'geniuspay_ref' => $session['geniuspay_ref'], 'transaction_id' => $transaction->id,
        ]);
    }

    public function getTransaction(Request $request, string $id): JsonResponse
    {
        $this->verifyInternalSignature($request);

        return response()->json(Transaction::findOrFail($id)->toArray());
    }

    /** Agrégation financière pour le Super Dashboard (appel interne signé). */
    public function stats(Request $request): JsonResponse
    {
        $this->verifyInternalSignature($request);
        $vendeurId = (string) $request->query('vendeur_id', '');
        $q = Transaction::query()->select(['vendeur_id', 'montant', 'escrow_status']);
        if ($vendeurId !== '') $q->where('vendeur_id', $vendeurId);

        $rows = $q->get();
        $ca = (float) $rows->whereIn('escrow_status', ['held', 'released'])->sum('montant');
        $held = (float) $rows->where('escrow_status', 'held')->sum('montant');
        $released = (float) $rows->where('escrow_status', 'released')->sum('montant');

        return response()->json([
            'chiffre_affaires' => $ca,
            'fonds_held' => $held,
            'fonds_released' => $released,
            'volume_ventes' => $rows->count(),
        ]);
    }

    public function hold(Request $request, string $id, \App\Services\EscrowService $escrow): JsonResponse
    {
        $this->verifyInternalSignature($request);
        $escrow->marquerHeld(Transaction::findOrFail($id));

        return response()->json(['held' => true]);
    }

    public function release(Request $request, string $id, \App\Services\EscrowService $escrow): JsonResponse
    {
        $this->verifyInternalSignature($request);
        $body = $request->validate(['vendeur_id' => 'required|uuid', 'pin' => 'required|string|size:4']);
        $tx = $escrow->verifierPin(Transaction::findOrFail($id), $body['vendeur_id'], $body['pin']);

        return response()->json(['released' => true, 'transaction' => $tx->toArray()]);
    }

    public function logWebhook(Request $request): JsonResponse
    {
        $this->verifyInternalSignature($request);
        $data = $request->validate([
            'reference' => 'required|string', 'event_id' => 'required|string', 'payload_hash' => 'required|string|size:64',
        ]);
        $exists = WebhookLog::where('reference', $data['reference'])->where('event_id', $data['event_id'])->exists();
        if (! $exists) {
            WebhookLog::create($data + ['fournisseur' => 'geniuspay', 'traite_le' => now()]);
        }

        return response()->json(['logged' => ! $exists, 'idempotent' => $exists]);
    }
}
