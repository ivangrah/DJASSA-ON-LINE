<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/** Table du domaine escrow — aucune FK cross-domaine (D2). */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('acheteur_id');
            $table->uuid('vendeur_id');
            $table->uuid('article_id')->nullable();
            $table->uuid('offre_troc_id')->nullable();
            $table->uuid('boutique_id')->nullable();
            $table->string('type', 12)->default('achat');
            $table->decimal('montant', 12, 2);
            $table->decimal('frais_escrow', 12, 2)->default(0);
            $table->string('geniuspay_ref', 191)->nullable()->unique();
            $table->string('escrow_status', 12)->default('initiated');
            $table->string('pin_hash')->nullable();
            $table->unsignedSmallInteger('pin_attempts')->default(0);
            $table->timestampTz('held_at')->nullable();
            $table->timestampTz('released_at')->nullable();
            $table->timestampTz('refunded_at')->nullable();
            $table->timestampsTz();
        });

        DB::statement('ALTER TABLE transactions ADD CONSTRAINT transactions_montant_check CHECK (montant >= 0)');
        DB::statement('ALTER TABLE transactions ADD CONSTRAINT transactions_escrow_status_check CHECK (escrow_status IN (\'initiated\',\'held\',\'released\',\'refunded\',\'failed\'))');
        DB::statement('ALTER TABLE transactions ADD CONSTRAINT transactions_pin_attempts_check CHECK (pin_attempts <= 5)');
        DB::statement('ALTER TABLE transactions ADD CONSTRAINT transactions_parties_check CHECK (acheteur_id <> vendeur_id)');
        DB::statement('CREATE INDEX idx_transactions_statut ON transactions (escrow_status)');
        DB::statement('CREATE INDEX idx_transactions_acheteur ON transactions (acheteur_id)');
        DB::statement('CREATE INDEX idx_transactions_vendeur ON transactions (vendeur_id)');
    }

    public function down(): void { Schema::dropIfExists('transactions'); }
};
