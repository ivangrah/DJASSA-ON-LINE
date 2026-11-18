<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\VerifyPinRequest;
use App\Http\Resources\TransactionResource;
use App\Models\Transaction;
use App\Services\EscrowService;
use App\Services\ReceiptService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use RuntimeException;

/**
 * /transactions — consultation (parties), vérification du PIN à la remise, reçus.
 */
class TransactionController extends Controller
{
    public function __construct(
        private readonly EscrowService $escrow,
        private readonly ReceiptService $receipts,
    ) {
    }

    /**
     * GET /api/v1/transactions?escrow_status=held — mes transactions (acheteur ou vendeur).
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Transaction::query()
            ->with(['article', 'boutique', 'acheteur', 'vendeur'])
            ->where(fn ($q) => $q->where('acheteur_id', $request->user()->id)->orWhere('vendeur_id', $request->user()->id));

        if ($status = $request->string('escrow_status')->toString()) {
            $query->where('escrow_status', $status);
        }

        return TransactionResource::collection($query->latest()->paginate(20));
    }

    /**
     * GET /api/v1/transactions/{transaction} — détail (parties uniquement).
     */
    public function show(Request $request, Transaction $transaction): TransactionResource
    {
        $this->authorize('view', $transaction);

        return TransactionResource::make($transaction->load(['article', 'boutique', 'acheteur', 'vendeur', 'offreTroc']));
    }

    /**
     * POST /api/v1/transactions/{transaction}/verify-pin — remise physique (App Flow §4 étape 4).
     * Le vendeur saisit le PIN dicté par l'acheteur → libération immédiate des fonds.
     */
    public function verifyPin(VerifyPinRequest $request, Transaction $transaction): JsonResponse
    {
        try {
            $transaction = $this->escrow->verifierPin($transaction, $request->user(), $request->validated('pin'));
        } catch (RuntimeException $e) {
            $status = $e->getCode() === 423 ? 423 : 422;

            return response()->json(['message' => $e->getMessage()], $status);
        }

        return response()->json([
            'message' => 'Code PIN valide — fonds libérés vers votre portefeuille.',
            'transaction' => TransactionResource::make($transaction->load(['article', 'boutique', 'acheteur', 'vendeur'])),
            'receipt_url' => url('/api/v1/transactions/'.$transaction->id.'/receipt'),
        ]);
    }

    /**
     * GET /api/v1/transactions/{transaction}/receipt — reçu / facture PDF Djassa.
     */
    public function receipt(Request $request, Transaction $transaction): \Symfony\Component\HttpFoundation\Response
    {
        $this->authorize('receipt', $transaction);

        return $this->receipts->download($transaction);
    }
}
