<?php
use App\Http\Controllers\BoutiqueController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\SouhaitController;
use Illuminate\Support\Facades\Route;

// Catalogue public (aucun JWT, cache Redis)
Route::get('/api/v1/products', [ProductController::class, 'index']);
Route::get('/api/v1/products/flash', [ProductController::class, 'index']);
Route::get('/api/v1/products/{product}', [ProductController::class, 'show']);
// Super Dashboard Admin — boutiques & finances (X-User-Role injecté par la gateway).
Route::middleware('admin.catalog')->prefix('/api/v1/admin/catalog')->group(function () {
    Route::get('/boutiques', [App\Http\Controllers\AdminBoutiqueController::class, 'index']);
    Route::get('/boutiques/finances', [App\Http\Controllers\AdminBoutiqueController::class, 'finances']);
    Route::get('/boutiques/{id}', [App\Http\Controllers\AdminBoutiqueController::class, 'show']);
    Route::post('/boutiques', [App\Http\Controllers\AdminBoutiqueController::class, 'store']);
    Route::put('/boutiques/{id}', [App\Http\Controllers\AdminBoutiqueController::class, 'update']);
    Route::delete('/boutiques/{id}', [App\Http\Controllers\AdminBoutiqueController::class, 'destroy']);
});

Route::get('/api/v1/boutiques', [BoutiqueController::class, 'index']);
Route::get('/api/v1/boutiques/{boutique:slug}', [BoutiqueController::class, 'show']);
Route::get('/api/v1/souhaits', [SouhaitController::class, 'index']);
Route::get('/api/v1/souhaits/{souhait}', function (string $souhait) {
    return \App\Http\Resources\SouhaitResource::make(\App\Models\Souhait::findOrFail($souhait));
});

// Écritures : le gateway a validé le JWT et injecté X-User-Id / X-User-Role.
Route::get('/api/v1/products/mine', function (Illuminate\Http\Request $request) {
    $page = \App\Models\Article::where('utilisateur_id', (string) $request->header('X-User-Id'))
        ->select(['id','titre','prix','statut','created_at'])->paginate(20);
    return response()->json(['data' => $page->items(), 'meta' => ['total' => $page->total()]]);
});
Route::post('/api/v1/products', [ProductController::class, 'store']);
Route::put('/api/v1/products/{product}', [ProductController::class, 'update']);
Route::delete('/api/v1/products/{product}', [ProductController::class, 'destroy']);
Route::get('/api/v1/boutiques/me/dashboard', function (Illuminate\Http\Request $request) {
    $b = \App\Models\Boutique::where('utilisateur_id', (string) $request->header('X-User-Id'))->firstOrFail();
    return \App\Http\Resources\BoutiqueResource::make($b);
});
Route::post('/api/v1/boutiques', [BoutiqueController::class, 'store']);
Route::put('/api/v1/boutiques/{boutique}', [BoutiqueController::class, 'update']);
Route::post('/api/v1/souhaits', [SouhaitController::class, 'store']);
Route::delete('/api/v1/souhaits/{souhait}', [SouhaitController::class, 'destroy']);
