<?php

use App\Support\DomainSchema;

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Djassa Online — table `offres_troc` (MLD : `offres_troc`)
     * Proposition de troc pur ou mixte (objet[s] + soulte FCFA).
     * Statuts : pending | accepted | rejected | countered | completed | cancelled.
     * `montant_contre_offre_fcfa` = contre-proposition ajustée par le vendeur (App Flow §5 CAS B).
     */
    public function up(): void
    {
        Schema::create('offres_troc', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('article_cible_id');
            if (! DomainSchema::isolated()) {
                $table->foreign('article_cible_id')->references('id')->on('articles')->cascadeOnDelete();
            }
            $table->foreignUuid('acheteur_id');
            if (! DomainSchema::isolated()) {
                $table->foreign('acheteur_id')->references('id')->on('users')->cascadeOnDelete();
            } // initiateur de la proposition
            $table->foreignUuid('vendeur_id');
            if (! DomainSchema::isolated()) {
                $table->foreign('vendeur_id')->references('id')->on('users')->cascadeOnDelete();
            } // propriétaire de l'article cible (dénormalisé)
            $table->decimal('montant_soulte_fcfa', 12, 2)->default(0); // soulte proposée par l'acheteur
            $table->decimal('montant_contre_offre_fcfa', 12, 2)->nullable(); // soulte ajustée par le vendeur (contre-offre)
            $table->text('message')->nullable();
            $table->string('statut', 12)->default('pending');
            $table->timestampsTz();
        });

        DB::statement('ALTER TABLE offres_troc ADD CONSTRAINT offres_troc_soulte_check CHECK (montant_soulte_fcfa >= 0)');
        DB::statement('ALTER TABLE offres_troc ADD CONSTRAINT offres_troc_contre_offre_check CHECK (montant_contre_offre_fcfa IS NULL OR montant_contre_offre_fcfa >= 0)');
        DB::statement("ALTER TABLE offres_troc ADD CONSTRAINT offres_troc_statut_check CHECK (statut IN ('pending', 'accepted', 'rejected', 'countered', 'completed', 'cancelled'))");
        // Un utilisateur ne peut pas proposer un troc sur son propre article
        DB::statement('ALTER TABLE offres_troc ADD CONSTRAINT offres_troc_pas_soi_meme_check CHECK (acheteur_id <> vendeur_id)');

        DB::statement('CREATE INDEX idx_offres_troc_statut ON offres_troc (statut)');
        DB::statement('CREATE INDEX idx_offres_troc_article_cible ON offres_troc (article_cible_id)');
        DB::statement('CREATE INDEX idx_offres_troc_acheteur ON offres_troc (acheteur_id)');
        DB::statement('CREATE INDEX idx_offres_troc_vendeur ON offres_troc (vendeur_id)');
    }

    public function down(): void
    {
        Schema::dropIfExists('offres_troc');
    }
};
