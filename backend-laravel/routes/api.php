<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BoutiqueController;
use App\Http\Controllers\Api\V1\BarterOfferController;
use App\Http\Controllers\Api\V1\MessageController;
use App\Http\Controllers\Api\V1\PaymentController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\SouhaitController;
use App\Http\Controllers\Api\V1\TransactionController;
use App\Http\Controllers\Api\V1\WebhookController;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    /* ----------------------------------------------------------------
     |  Santé / readiness
     * ---------------------------------------------------------------- */
    Route::get('/health', function () {
        try {
            DB::select('select 1');
            $db = 'ok';
        } catch (Throwable) {
            $db = 'down';
        }

        return response()->json([
            'status' => 'ok',
            'service' => 'djassa-online-api',
            'version' => '1.0.0',
            'database' => $db,
            'time' => now()->toIso8601String(),
        ]);
    })->name('v1.health');

    /* ----------------------------------------------------------------
     |  Webhooks — hors auth (signature HMAC GeniusPay)
     * ---------------------------------------------------------------- */
    Route::post('/webhooks/geniuspay', [WebhookController::class, 'geniuspay'])->name('v1.webhooks.geniuspay');

    /* ----------------------------------------------------------------
     |  Authentification publique
     * ---------------------------------------------------------------- */
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/google', [AuthController::class, 'google']);

    /* ----------------------------------------------------------------
     |  Catalogue public — TRD §6 : ?mode=barter|sale ?condition=new|used ?category= ?q=
     * ---------------------------------------------------------------- */
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/flash', [ProductController::class, 'flash']);
    Route::get('/products/mine', [ProductController::class, 'mine'])->middleware('auth:sanctum');
    Route::get('/products/{product}', [ProductController::class, 'show']);

    /* ----------------------------------------------------------------
     |  Vitrines boutiques pro — publiques
     * ---------------------------------------------------------------- */
    Route::get('/boutiques', [BoutiqueController::class, 'index']);
    Route::get('/boutiques/me/dashboard', [BoutiqueController::class, 'dashboard'])->middleware('auth:sanctum');
    Route::get('/boutiques/{boutique:slug}', [BoutiqueController::class, 'show']);

    /* ----------------------------------------------------------------
     |  Mur des Souhaits — lecture publique
     * ---------------------------------------------------------------- */
    Route::get('/souhaits', [SouhaitController::class, 'index']);
    Route::get('/souhaits/mine', [SouhaitController::class, 'mine'])->middleware('auth:sanctum');
    Route::get('/souhaits/{souhait}', [SouhaitController::class, 'show']);

    /* ----------------------------------------------------------------
     |  Routes authentifiées — 60 req/min (TRD §6)
     * ---------------------------------------------------------------- */
    Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {

        // Auth
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);

        // Catalogue — publication & édition
        Route::post('/products', [ProductController::class, 'store']);
        Route::put('/products/{product}', [ProductController::class, 'update']);
        Route::delete('/products/{product}', [ProductController::class, 'destroy']);
        Route::post('/products/{product}/flash', [ProductController::class, 'startFlashSale']);
        Route::delete('/products/{product}/flash', [ProductController::class, 'stopFlashSale']);

        // Boutiques pro — gestion
        Route::post('/boutiques', [BoutiqueController::class, 'store']);
        Route::put('/boutiques/{boutique}', [BoutiqueController::class, 'update']);
        Route::post('/boutiques/{boutique}/verify', [BoutiqueController::class, 'verify']);

        // Troc pur & mixte
        Route::get('/barter-offers', [BarterOfferController::class, 'index']);
        Route::post('/barter-offers', [BarterOfferController::class, 'store']);
        Route::get('/barter-offers/{barterOffer}', [BarterOfferController::class, 'show']);
        Route::patch('/barter-offers/{barterOffer}/respond', [BarterOfferController::class, 'respond']);

        // Paiements GeniusPay & escrow
        Route::post('/payments/geniuspay/init', [PaymentController::class, 'init']);
        Route::get('/transactions', [TransactionController::class, 'index']);
        Route::get('/transactions/{transaction}', [TransactionController::class, 'show']);
        Route::post('/transactions/{transaction}/verify-pin', [TransactionController::class, 'verifyPin']);
        Route::get('/transactions/{transaction}/receipt', [TransactionController::class, 'receipt']);

        // Mur des Souhaits — publication & réponse
        Route::post('/souhaits', [SouhaitController::class, 'store']);
        Route::delete('/souhaits/{souhait}', [SouhaitController::class, 'destroy']);
        Route::post('/souhaits/{souhait}/respond', [SouhaitController::class, 'respond']);

        // Messagerie interactive
        Route::get('/messages/conversations', [MessageController::class, 'conversations']);
        Route::get('/messages/thread', [MessageController::class, 'thread']);
        Route::get('/messages/unread-count', [MessageController::class, 'unreadCount']);
        Route::post('/messages', [MessageController::class, 'store']);
        Route::post('/messages/{message}/read', [MessageController::class, 'read']);
    });
});
