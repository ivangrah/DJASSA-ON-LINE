<?php

use Illuminate\Support\Facades\Route;

// Chargé depuis AppServiceProvider::boot() SANS le préfixe automatique « api ».
// Le chemin signé par escrow-payment-service est donc bien /internal/...
Route::prefix('internal')->middleware('internal')->group(function () {
    Route::get('/catalog/articles/{id}', [\App\Http\Controllers\Api\V1\InternalController::class, 'getArticle']);
    Route::post('/catalog/articles/{id}/statut', [\App\Http\Controllers\Api\V1\InternalController::class, 'setArticleStatut']);
    Route::get('/auth/users/{id}', [\App\Http\Controllers\Api\V1\InternalController::class, 'getUser']);
    Route::post('/auth/users/{id}/wallet/credit', [\App\Http\Controllers\Api\V1\InternalController::class, 'creditWallet']);
    Route::get('/troc/offres/{id}', [\App\Http\Controllers\Api\V1\InternalController::class, 'getOffre']);
    Route::post('/troc/offres/{id}/complete', [\App\Http\Controllers\Api\V1\InternalController::class, 'completeOffre']);
});

