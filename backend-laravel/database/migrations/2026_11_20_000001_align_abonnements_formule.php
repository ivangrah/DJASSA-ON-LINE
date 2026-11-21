<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Aligne l'historique d'abonnement sur le vocabulaire métier :
     * formule `free` → `gratuit` (cohérent avec users.plan_abonnement).
     */
    public function up(): void
    {
        DB::statement('ALTER TABLE abonnements DROP CONSTRAINT IF EXISTS abonnements_formule_check');
        DB::statement("UPDATE abonnements SET formule = 'gratuit' WHERE formule = 'free'");
        DB::statement("ALTER TABLE abonnements ADD CONSTRAINT abonnements_formule_check CHECK (formule IN ('gratuit', 'pro'))");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE abonnements DROP CONSTRAINT IF EXISTS abonnements_formule_check');
        DB::statement("UPDATE abonnements SET formule = 'free' WHERE formule = 'gratuit'");
        DB::statement("ALTER TABLE abonnements ADD CONSTRAINT abonnements_formule_check CHECK (formule IN ('free', 'pro'))");
    }
};
