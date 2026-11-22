<?php

use App\Http\Controllers\AbonnementController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\InternalController;
use Illuminate\Support\Facades\Route;

// Routes publiques
Route::post('/api/v1/auth/register', [AuthController::class, 'register']);
Route::post('/api/v1/auth/login', [AuthController::class, 'login']);
Route::post('/api/v1/auth/google', [AuthController::class, 'google']);

// Routes authentifiées
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/api/v1/auth/logout', [AuthController::class, 'logout']);
    Route::get('/api/v1/auth/me', [AuthController::class, 'me']);
    Route::post('/api/v1/auth/select-plan', [AuthController::class, 'selectPlan']);
    Route::get('/api/v1/abonnements/formules', [AbonnementController::class, 'index']);
    Route::get('/api/v1/abonnements/me', [AbonnementController::class, 'me']);
    Route::post('/api/v1/abonnements/upgrade', [AbonnementController::class, 'upgrade']);
    Route::post('/api/v1/abonnements/cancel', [AbonnementController::class, 'cancel']);
});
