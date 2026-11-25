<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\VerifyPinRequest;
use App\Http\Resources\TransactionResource;
use App\Models\Transaction;
use App\Services\EscrowService;
use App\Services\ReceiptService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class TransactionController extends Controller
{
    public function __construct(
        private readonly EscrowService $escrow,
        private readonly ReceiptService $receipts,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $userId = $this->userId($request);
        $transactions = Transaction::query()
            ->where('acheteur_id', $userId)->orWhere('vendeur_id', $userId)
            ->latest()->paginate(20);

        return response()->json([
            'data' => TransactionResource::collection($transactions)->resolve(),
            'meta' => ['current_page' => $transactions->currentPage(), 'last_page' => $transactions->lastPage(), 'total' => $transactions->total()],
        ]);
    }

    public function show(Request $request, Transaction $transaction): TransactionResource
    {
        abort_unless($this->isParty($request, $transaction), 403);

        return TransactionResource::make($transaction);
    }

    public function verifyPin(VerifyPinRequest $request, Transaction $transaction): JsonResponse
    {
        try {
            $tx = $this->escrow->verifierPin(
                $transaction,
                (string) $request->header('X-User-Id'),
                $request->validated('pin'),
                $request->ip(),
            );
        } catch (\RuntimeException $e) {
            $status = in_array($e->getCode(), [423, 429], true) ? $e->getCode() : 422;

            return response()->json(['message' => $e->getMessage()], $status);
        }

        return response()->json([
            'message' => 'Code PIN valide — fonds libérés.',
            'transaction' => TransactionResource::make($tx),
        ]);
    }

    public function receipt(Request $request, Transaction $transaction): HttpResponse
    {
        abort_unless($this->isParty($request, $transaction), 403);

        return $this->receipts->download($transaction);
    }

    private function isParty(Request $request, Transaction $transaction): bool
    {
        $id = $this->userId($request);

        return $id === $transaction->acheteur_id || $id === $transaction->vendeur_id;
    }

    /** Le gateway doit injecter une identité valide ; sinon 401 (jamais de SQL avec ''). */
    private function userId(Request $request): string
    {
        $id = (string) $request->header('X-User-Id');
        abort_unless($id !== '', 401, 'Identité manquante.');

        return $id;
    }
}
