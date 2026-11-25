<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Chantier B — ajoute l'état `disputed` à la machine à états du séquestre.
 *
 * La contrainte d'origine (2026_11_22_000000) refuse `disputed`. On remplace
 * UNIQUEMENT cette contrainte : aucune colonne, donnée ou autre contrainte n'est
 * modifiée. Le `down()` restaure strictement la contrainte initiale.
 */
return new class extends Migration
{
    private const CONSTRAINT = 'transactions_escrow_status_check';

    private const STATES_INITIAL = "'initiated','held','released','refunded','failed'";

    private const STATES_WITH_DISPUTED = "'initiated','held','released','refunded','failed','disputed'";

    public function up(): void
    {
        DB::statement('ALTER TABLE transactions DROP CONSTRAINT IF EXISTS '.self::CONSTRAINT);
        DB::statement(
            'ALTER TABLE transactions ADD CONSTRAINT '.self::CONSTRAINT
            .' CHECK (escrow_status IN ('.self::STATES_WITH_DISPUTED.'))'
        );
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE transactions DROP CONSTRAINT IF EXISTS '.self::CONSTRAINT);
        DB::statement(
            'ALTER TABLE transactions ADD CONSTRAINT '.self::CONSTRAINT
            .' CHECK (escrow_status IN ('.self::STATES_INITIAL.'))'
        );
    }
};
