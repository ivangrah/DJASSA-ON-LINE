<?php

namespace App\Services;

use App\Models\Transaction;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;

/**
 * ReceiptService — reçus & factures PDF Djassa Online (PRD §3.1 :
 * "Dashboard Boutique Pro … génération de reçus PDF" / App Flow §6).
 */
class ReceiptService
{
    public function generatePdf(Transaction $transaction): string
    {
        $transaction->loadMissing(['acheteur', 'vendeur', 'article', 'boutique', 'offreTroc']);

        $pdf = Pdf::loadView('receipts.transaction', ['transaction' => $transaction])
            ->setPaper('a4');

        return $pdf->output();
    }

    public function download(Transaction $transaction): Response
    {
        $filename = 'djassa-recu-'.$transaction->id.'.pdf';

        return response($this->generatePdf($transaction), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }
}
