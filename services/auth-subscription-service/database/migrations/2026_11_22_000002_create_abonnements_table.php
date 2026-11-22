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
            $table->uuid('utilisateur_id'); // référence logique, pas de FK cross-domaine
            $table->string('formule', 10);
            $table->decimal('montant_fcfa', 12, 2)->default(0);
            $table->string('statut', 12)->default('pending');
            $table->string('reference', 191)->nullable()->unique();
            $table->string('geniuspay_ref', 191)->nullable();
            $table->timestampTz('debut_at')->nullable();
            $table->timestampTz('fin_at')->nullable();
            $table->timestampsTz();
        });

        DB::statement("ALTER TABLE abonnements ADD CONSTRAINT abonnements_formule_check CHECK (formule IN ('gratuit','pro'))");
        DB::statement("ALTER TABLE abonnements ADD CONSTRAINT abonnements_statut_check CHECK (statut IN ('pending','active','expired','cancelled','failed'))");
        DB::statement('CREATE INDEX idx_abonnements_user ON abonnements (utilisateur_id)');
    }

    public function down(): void { Schema::dropIfExists('abonnements'); }
};
