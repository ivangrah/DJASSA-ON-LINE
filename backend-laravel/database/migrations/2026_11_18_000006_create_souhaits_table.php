<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Djassa Online — table `souhaits` (MLD : `souhaits`)
     * Mur des Souhaits : recherche inversée. keywords TSVECTOR + index GIN
     * pour les alertes instantanées à la publication d'un article correspondant.
     */
    public function up(): void
    {
        Schema::create('souhaits', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('utilisateur_id')->constrained('users')->cascadeOnDelete();
            $table->string('titre', 200); // ex : "Recherche groupe électrogène d'occasion"
            $table->text('description')->nullable();
            $table->decimal('budget_max', 12, 2)->nullable(); // FCFA
            $table->boolean('accepte_troc')->default(true);
            $table->string('categorie', 100)->nullable();
            $table->string('ville', 100)->default('Abidjan');
            $table->string('statut', 12)->default('active'); // active | fulfilled | closed
            $table->unsignedInteger('vues')->default(0);
            $table->timestampsTz();
        });

        DB::statement('ALTER TABLE souhaits ADD CONSTRAINT souhaits_budget_check CHECK (budget_max IS NULL OR budget_max >= 0)');
        DB::statement("ALTER TABLE souhaits ADD CONSTRAINT souhaits_statut_check CHECK (statut IN ('active', 'fulfilled', 'closed'))");

        // Keywords FTS FR générés : titre + description + catégorie — index GIN pour le matching
        DB::statement("ALTER TABLE souhaits ADD COLUMN mots_cles tsvector GENERATED ALWAYS AS (to_tsvector('french', coalesce(titre, '') || ' ' || coalesce(description, '') || ' ' || coalesce(categorie, ''))) STORED");
        DB::statement('CREATE INDEX idx_souhaits_mots_cles_gin ON souhaits USING GIN (mots_cles)');
        DB::statement('CREATE INDEX idx_souhaits_statut ON souhaits (statut) WHERE statut = \'active\'');
        DB::statement('CREATE INDEX idx_souhaits_categorie ON souhaits (categorie)');
    }

    public function down(): void
    {
        Schema::dropIfExists('souhaits');
    }
};
