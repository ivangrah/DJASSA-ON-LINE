<?php
use App\Http\Controllers\InternalController;
use Illuminate\Support\Facades\Route;
Route::get('/internal/troc/offres/{id}', [InternalController::class, 'getOffre']);
Route::post('/internal/troc/offres/{id}/complete', [InternalController::class, 'completeOffre']);
Route::post('/internal/troc/offres/{id}/release-lock', [InternalController::class, 'releaseLock']);
