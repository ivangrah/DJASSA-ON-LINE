<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('abonnements', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('utilisateur_id')->constrained('users')->cascadeOnDelete();
            $table->string('formule', 16)->default('pro');
            $table->decimal('montant_fcfa', 12, 2)->default(5000);
            $table->string('statut', 16)->default('pending');
            $table->string('reference', 191)->unique();
            $table->string('geniuspay_ref', 191)->nullable()->unique();
            $table->timestampTz('debut_at')->nullable();
            $table->timestampTz('fin_at')->nullable();
            $table->timestampsTz();

            $table->index(['utilisateur_id', 'statut'], 'idx_abonnements_user_statut');
            $table->index('statut', 'idx_abonnements_statut');
        });

        DB::statement("ALTER TABLE abonnements ADD CONSTRAINT abonnements_formule_check CHECK (formule IN ('free','pro'))");
        DB::statement("ALTER TABLE abonnements ADD CONSTRAINT abonnements_statut_check CHECK (statut IN ('pending','active','expired','cancelled','failed'))");
        DB::statement("ALTER TABLE abonnements ADD CONSTRAINT abonnements_montant_check CHECK (montant_fcfa >= 0)");
    }

    public function down(): void
    {
        Schema::dropIfExists('abonnements');
    }
};
