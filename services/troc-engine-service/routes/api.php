<?php
use App\Http\Controllers\TrocController;
use Illuminate\Support\Facades\Route;
// Lecture : le gateway injecte l'identité pour les routes protégées.
Route::get('/api/v1/trocs', [TrocController::class, 'index']);
Route::get('/api/v1/trocs/{offre}', [TrocController::class, 'show']);
Route::post('/api/v1/trocs', [TrocController::class, 'store']);
Route::patch('/api/v1/trocs/{offre}/respond', [TrocController::class, 'respond']);
// Alias de transition vers les anciens chemins.
Route::get('/api/v1/barter-offers', [TrocController::class, 'index']);
Route::post('/api/v1/barter-offers', [TrocController::class, 'store']);
Route::get('/api/v1/barter-offers/{offre}', [TrocController::class, 'show']);
Route::patch('/api/v1/barter-offers/{offre}/respond', [TrocController::class, 'respond']);
