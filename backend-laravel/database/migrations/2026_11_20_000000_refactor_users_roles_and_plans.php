<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Djassa Online — séparation stricte Particulier / Vendeur Pro.
     *
     * role              : particulier | vendeur_pro | admin (défaut particulier)
     * plan_abonnement   : gratuit | pro — NULL tant que l'offre n'est pas choisie
     * abonnement_actif_jusqu_au : fin de la période Pro (NULL pour gratuit)
     *
     * Les colonnes historiques `plan` / `plan_expire_at` sont converties sans perte,
     * puis remplacées par le nouveau modèle métier.
     */
    public function up(): void
    {
        // 1. Rôles — on retire l'ancienne contrainte avant la conversion des valeurs.
        DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
        DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_plan_check');

        DB::statement(<<<'SQL'
            UPDATE users
            SET role = CASE
                WHEN role = 'pro_seller' THEN 'vendeur_pro'
                WHEN role = 'admin' THEN 'admin'
                ELSE 'particulier'
            END
        SQL);

        DB::statement("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'particulier'");
        DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('particulier', 'vendeur_pro', 'admin'))");

        // 2. Abonnement — renommage puis normalisation des anciennes valeurs.
        DB::statement('ALTER TABLE users RENAME COLUMN plan TO plan_abonnement');
        DB::statement('ALTER TABLE users RENAME COLUMN plan_expire_at TO abonnement_actif_jusqu_au');

        DB::statement(<<<'SQL'
            UPDATE users
            SET plan_abonnement = CASE
                WHEN plan_abonnement = 'pro' THEN 'pro'
                WHEN plan_abonnement = 'free' THEN 'gratuit'
                ELSE plan_abonnement
            END
        SQL);

        DB::statement('ALTER TABLE users ALTER COLUMN plan_abonnement DROP DEFAULT');
        DB::statement('ALTER TABLE users ALTER COLUMN plan_abonnement DROP NOT NULL');
        DB::statement('ALTER TABLE users ALTER COLUMN plan_abonnement SET DEFAULT NULL');
        DB::statement("ALTER TABLE users ADD CONSTRAINT users_plan_abonnement_check CHECK (plan_abonnement IS NULL OR plan_abonnement IN ('gratuit', 'pro'))");

        DB::statement('CREATE INDEX IF NOT EXISTS idx_users_plan_abonnement ON users (plan_abonnement)');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS idx_users_plan_abonnement');
        DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_plan_abonnement_check');
        DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');

        DB::statement(<<<'SQL'
            UPDATE users
            SET role = CASE
                WHEN role = 'vendeur_pro' THEN 'pro_seller'
                WHEN role = 'admin' THEN 'admin'
                ELSE 'user'
            END
        SQL);

        DB::statement("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user'");
        DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'pro_seller', 'admin'))");

        DB::statement('ALTER TABLE users RENAME COLUMN plan_abonnement TO plan');
        DB::statement('ALTER TABLE users RENAME COLUMN abonnement_actif_jusqu_au TO plan_expire_at');

        DB::statement(<<<'SQL'
            UPDATE users
            SET plan = CASE WHEN plan = 'pro' THEN 'pro' ELSE 'free' END
        SQL);

        DB::statement("ALTER TABLE users ALTER COLUMN plan SET DEFAULT 'free'");
        DB::statement('ALTER TABLE users ALTER COLUMN plan SET NOT NULL');
        DB::statement("ALTER TABLE users ADD CONSTRAINT users_plan_check CHECK (plan IN ('free', 'pro'))");
    }
};
