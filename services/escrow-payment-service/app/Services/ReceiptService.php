<?php

namespace App\Services;

use App\Models\Transaction;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;

/** Reçu PDF du domaine escrow — aucune relation vers un autre domaine. */
class ReceiptService
{
    public function generatePdf(Transaction $transaction): string
    {
        $html = '<h1>Djassa Online — Reçu de séquestre</h1>'
            .'<p>Référence : '.e($transaction->geniuspay_ref ?? $transaction->id).'</p>'
            .'<p>Montant : '.e((string) $transaction->montant).' FCFA</p>'
            .'<p>Statut : '.e($transaction->escrow_status).'</p>'
            .'<p>Date : '.e(optional($transaction->released_at)->toIso8601String() ?? now()->toIso8601String()).'</p>';

        return Pdf::loadHTML($html)->setPaper('a4')->output();
    }

    public function download(Transaction $transaction): Response
    {
        return response($this->generatePdf($transaction), 200)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'inline; filename="recu-'.$transaction->id.'.pdf"');
    }
}
