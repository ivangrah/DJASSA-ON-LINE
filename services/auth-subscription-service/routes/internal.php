<?php

use App\Http\Controllers\InternalController;
use Illuminate\Support\Facades\Route;

// Chargé depuis AppServiceProvider::boot() sans le préfixe « api ».
Route::get('/internal/jwt/validate', [InternalController::class, 'validateJwt']);
Route::get('/internal/auth/users/count', [InternalController::class, 'countUsers']);
Route::get('/internal/auth/users/{id}', [InternalController::class, 'getUser']);
Route::post('/internal/auth/users/{id}/wallet/credit', [InternalController::class, 'creditWallet']);

// Cible du proxy gateway pour auth_request (chemin interne sans JWT).
Route::get('/internal/validate', [InternalController::class, 'validateJwt']);
