<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Sonde de santé — vérifiée par le frontend web / mobile avant login
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

    // Les routes métier (auth, products, barter-offers, payments…) seront
    // branchées à l'Étape 2 dans ce préfixe /api/v1.
});
