<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
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

    public function getTransaction(Request $request, string $id): JsonResponse
    {
        $this->verifyInternalSignature($request);

        return response()->json(Transaction::findOrFail($id)->toArray());
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
