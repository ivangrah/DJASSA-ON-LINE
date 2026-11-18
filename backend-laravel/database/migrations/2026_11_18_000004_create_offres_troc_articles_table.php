<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Djassa Online — table d'association `offres_troc_articles` (MLD)
     * Articles proposés par l'acheteur en échange de l'article cible (1..N par offre).
     */
    public function up(): void
    {
        Schema::create('offres_troc_articles', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('offre_troc_id')->constrained('offres_troc')->cascadeOnDelete();
            $table->foreignUuid('article_offert_id')->constrained('articles')->cascadeOnDelete();
            $table->timestampsTz();
        });

        // Un même article ne peut être proposé deux fois dans la même offre
        DB::statement('ALTER TABLE offres_troc_articles ADD CONSTRAINT offres_troc_articles_unique UNIQUE (offre_troc_id, article_offert_id)');
        DB::statement('CREATE INDEX idx_offres_troc_articles_offre ON offres_troc_articles (offre_troc_id)');
        DB::statement('CREATE INDEX idx_offres_troc_articles_article ON offres_troc_articles (article_offert_id)');
    }

    public function down(): void
    {
        Schema::dropIfExists('offres_troc_articles');
    }
};
