<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Négociation structurée dans le chat : prix + lieu de remise, avec contre-proposition. */
    public function up(): void
    {
        Schema::create('deals', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('conversation_id');
            $table->uuid('article_id')->nullable();
            $table->uuid('propose_par');
            $table->decimal('montant_fcfa', 12, 2);
            $table->string('lieu_remise', 255);
            $table->string('statut', 12)->default('proposed');
            $table->timestampsTz();

            $table->index(['conversation_id', 'created_at'], 'idx_deals_conversation');
        });

        DB::statement("ALTER TABLE deals ADD CONSTRAINT deals_statut_check CHECK (statut IN ('proposed','accepted','countered','rejected'))");
        DB::statement('ALTER TABLE deals ADD CONSTRAINT deals_montant_check CHECK (montant_fcfa >= 0)');
    }

    public function down(): void
    {
        Schema::dropIfExists('deals');
    }
};
