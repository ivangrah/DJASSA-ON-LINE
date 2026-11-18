<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Djassa Online — table `transactions` (MLD : `transactions`)
     * Séquestre GeniusPay (Escrow) : initiated → held → released | refunded | failed.
     * Code PIN à 4 chiffres stocké HACHÉ (bcrypt) — jamais en clair (TRD §7.1).
     * pin_attempts plafonné à 5 tentatives avant blocage de l'escrow.
     */
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('acheteur_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('vendeur_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('article_id')->constrained('articles')->restrictOnDelete();
            $table->foreignUuid('offre_troc_id')->nullable()->constrained('offres_troc')->nullOnDelete(); // NULL = achat direct
            $table->foreignUuid('boutique_id')->nullable()->constrained('boutiques')->nullOnDelete(); // B2C = facture PDF
            $table->string('type', 12)->default('achat'); // achat | troc_mixte (soulte GeniusPay)
            $table->decimal('montant', 12, 2); // FCFA bloqués en escrow
            $table->decimal('frais_escrow', 12, 2)->default(0); // frais de sécurisation Djassa
            $table->string('geniuspay_ref', 191)->nullable()->unique();
            $table->string('escrow_status', 12)->default('initiated'); // initiated | held | released | refunded | failed
            $table->string('pin_hash')->nullable(); // bcrypt du code PIN 4 chiffres
            $table->unsignedSmallInteger('pin_attempts')->default(0);
            $table->timestampTz('held_at')->nullable();
            $table->timestampTz('released_at')->nullable();
            $table->timestampTz('refunded_at')->nullable();
            $table->timestampsTz();
        });

        DB::statement('ALTER TABLE transactions ADD CONSTRAINT transactions_montant_check CHECK (montant >= 0)');
        DB::statement('ALTER TABLE transactions ADD CONSTRAINT transactions_frais_check CHECK (frais_escrow >= 0)');
        DB::statement("ALTER TABLE transactions ADD CONSTRAINT transactions_type_check CHECK (type IN ('achat', 'troc_mixte'))");
        DB::statement("ALTER TABLE transactions ADD CONSTRAINT transactions_escrow_status_check CHECK (escrow_status IN ('initiated', 'held', 'released', 'refunded', 'failed'))");
        DB::statement('ALTER TABLE transactions ADD CONSTRAINT transactions_pin_attempts_check CHECK (pin_attempts <= 5)');
        DB::statement('ALTER TABLE transactions ADD CONSTRAINT transactions_parties_check CHECK (acheteur_id <> vendeur_id)');

        DB::statement('CREATE INDEX idx_transactions_escrow_status ON transactions (escrow_status)');
        DB::statement('CREATE INDEX idx_transactions_acheteur ON transactions (acheteur_id)');
        DB::statement('CREATE INDEX idx_transactions_vendeur ON transactions (vendeur_id)');
        DB::statement('CREATE INDEX idx_transactions_article ON transactions (article_id)');
        DB::statement('CREATE INDEX idx_transactions_offre_troc ON transactions (offre_troc_id) WHERE offre_troc_id IS NOT NULL');
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
