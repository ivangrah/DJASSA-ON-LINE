<?php

use App\Http\Controllers\InternalController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\WebhookController;
use Illuminate\Support\Facades\Route;

// Routes externes (le gateway les expose avec validation JWT centrale).
Route::prefix('api/v1/escrow')->group(function () {
    Route::post('/checkout', [PaymentController::class, 'init']);
    Route::get('/transactions', [TransactionController::class, 'index']);
    Route::get('/transactions/{transaction}', [TransactionController::class, 'show']);
    Route::post('/transactions/{transaction}/verify-pin', [TransactionController::class, 'verifyPin']);
    Route::get('/transactions/{transaction}/receipt', [TransactionController::class, 'receipt']);
    Route::post('/webhooks/geniuspay', [WebhookController::class, 'geniuspay']);
});

// Alias de transition : anciens chemins du monolithe (validation point 1).
Route::post('/api/v1/payments/geniuspay/init', [PaymentController::class, 'init']);
Route::get('/api/v1/transactions', [TransactionController::class, 'index']);
Route::get('/api/v1/transactions/{transaction}', [TransactionController::class, 'show']);
Route::post('/api/v1/transactions/{transaction}/verify-pin', [TransactionController::class, 'verifyPin']);
Route::post('/api/v1/webhooks/geniuspay', [WebhookController::class, 'geniuspay']);

// Cible du proxy gateway pour le webhook (route interne sans JWT).
Route::post('/internal/webhooks/geniuspay', [WebhookController::class, 'geniuspay']);

// /internal/* — réseau Docker privé + header signé (D3).
Route::prefix('internal/escrow')->group(function () {
    Route::get('/stats', [InternalController::class, 'stats']);
    Route::post('/checkout', [InternalController::class, 'checkout']);
    Route::get('/transactions/{id}', [InternalController::class, 'getTransaction']);
    Route::post('/transactions/{id}/hold', [InternalController::class, 'hold']);
    Route::post('/transactions/{id}/release', [InternalController::class, 'release']);
    Route::post('/webhooks/log', [InternalController::class, 'logWebhook']);
});
