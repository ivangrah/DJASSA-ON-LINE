<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void
    {
        Schema::create('offres_troc', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('article_cible_id'); // référence logique (catalog)
            $table->uuid('acheteur_id');      // référence logique (auth)
            $table->uuid('vendeur_id');       // référence logique (auth)
            $table->decimal('montant_soulte_fcfa', 12, 2)->default(0);
            $table->decimal('montant_contre_offre_fcfa', 12, 2)->nullable();
            $table->text('message')->nullable();
            $table->string('reference', 191)->nullable()->unique();
            $table->string('statut', 12)->default('pending');
            $table->timestampsTz();
        });
        DB::statement('ALTER TABLE offres_troc ADD CONSTRAINT offres_troc_soulte_check CHECK (montant_soulte_fcfa >= 0)');
        DB::statement('ALTER TABLE offres_troc ADD CONSTRAINT offres_troc_contre_offre_check CHECK (montant_contre_offre_fcfa IS NULL OR montant_contre_offre_fcfa >= 0)');
        DB::statement("ALTER TABLE offres_troc ADD CONSTRAINT offres_troc_statut_check CHECK (statut IN ('pending','accepted','rejected','countered','completed','cancelled'))");
        DB::statement('ALTER TABLE offres_troc ADD CONSTRAINT offres_troc_pas_soi_meme_check CHECK (acheteur_id <> vendeur_id)');
        DB::statement('CREATE INDEX idx_offres_statut ON offres_troc (statut)');
        DB::statement('CREATE INDEX idx_offres_article ON offres_troc (article_cible_id)');
        DB::statement('CREATE INDEX idx_offres_acheteur ON offres_troc (acheteur_id)');
        DB::statement('CREATE INDEX idx_offres_vendeur ON offres_troc (vendeur_id)');
        DB::statement('CREATE INDEX idx_offres_created ON offres_troc (created_at DESC)');
    }
    public function down(): void { Schema::dropIfExists('offres_troc'); }
};
