<?php

use App\Http\Controllers\AbonnementController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\InternalController;
use Illuminate\Support\Facades\Route;

// État du mode maintenance (public — la page /maintenance doit pouvoir lire le message).
Route::get('/api/v1/maintenance', [\App\Http\Controllers\AdminController::class, 'maintenanceState']);

// Routes publiques
Route::post('/api/v1/auth/register', [AuthController::class, 'register']);
Route::post('/api/v1/auth/login', [AuthController::class, 'login']);
Route::post('/api/v1/auth/google', [AuthController::class, 'google']);
Route::get('/api/v1/offres', [\App\Http\Controllers\AdminOffreController::class, 'publicIndex']);

// Routes Administration — protégées par X-User-Role === 'admin' (injecté par la gateway).
Route::middleware(['auth:sanctum', 'admin'])->prefix('/api/v1/admin')->group(function () {
    Route::get('/users', [App\Http\Controllers\AdminController::class, 'users']);
    Route::post('/users', [App\Http\Controllers\AdminController::class, 'storeUser']);
    Route::get('/users/{id}', [App\Http\Controllers\AdminController::class, 'showUser']);
    Route::put('/users/{id}', [App\Http\Controllers\AdminController::class, 'updateUser']);
    Route::delete('/users/{id}', [App\Http\Controllers\AdminController::class, 'destroyUser']);
    Route::post('/users/{id}/reset-password', [App\Http\Controllers\AdminController::class, 'resetPassword']);
    Route::get('/profile', [App\Http\Controllers\AdminController::class, 'profile']);
    Route::patch('/profile', [App\Http\Controllers\AdminController::class, 'updateProfile']);
    Route::post('/maintenance', [App\Http\Controllers\AdminController::class, 'maintenance']);
    Route::get('/maintenance', [App\Http\Controllers\AdminController::class, 'maintenanceState']);
    Route::get('/audit', [App\Http\Controllers\AdminController::class, 'audit']);
    Route::get('/offres', [App\Http\Controllers\AdminOffreController::class, 'index']);
    Route::post('/offres', [App\Http\Controllers\AdminOffreController::class, 'store']);
    Route::put('/offres/{id}', [App\Http\Controllers\AdminOffreController::class, 'update']);
    Route::delete('/offres/{id}', [App\Http\Controllers\AdminOffreController::class, 'destroy']);
});

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
