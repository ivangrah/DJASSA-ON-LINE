<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void
    {
        Schema::create('offres_troc_articles', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('offre_troc_id');
            $table->uuid('article_offert_id');
            $table->timestampsTz();
            $table->unique(['offre_troc_id', 'article_offert_id'], 'offres_troc_articles_unique');
        });
        DB::statement('CREATE INDEX idx_pivot_offre ON offres_troc_articles (offre_troc_id)');
    }
    public function down(): void { Schema::dropIfExists('offres_troc_articles'); }
};
