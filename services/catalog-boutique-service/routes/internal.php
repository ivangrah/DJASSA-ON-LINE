<?php
use App\Http\Controllers\InternalController;
use Illuminate\Support\Facades\Route;
// Chargé sans le préfixe « api » depuis AppServiceProvider::boot().
Route::get('/internal/catalog/articles/{id}', [InternalController::class, 'getArticle']);
Route::post('/internal/catalog/articles/{id}/statut', [InternalController::class, 'setArticleStatut']);
Route::post('/internal/catalog/articles/{id}/stock/decrement', [InternalController::class, 'decrementStock']);
Route::get('/internal/catalog/boutiques/by-user/{id}', [InternalController::class, 'getBoutiqueByUser']);
