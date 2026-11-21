<?php

use App\Support\DomainSchema;

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Djassa Online — table `articles` (MLD : `articles`)
     * Double marché : C2C (boutique_id NULL, occasion) & B2C (boutique_id NOT NULL, neuf, stock).
     * État : neuf | comme_neuf | bon_etat | usage (PRD 3.2).
     * Mode de transaction : vente | troc | mixte (TRD trade_mode sale|barter|hybrid).
     * specs JSONB + index GIN · recherche plein texte TSVECTOR généré.
     */
    public function up(): void
    {
        Schema::create('articles', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('utilisateur_id');
            if (! DomainSchema::isolated()) {
                $table->foreign('utilisateur_id')->references('id')->on('users')->cascadeOnDelete();
            }
            $table->foreignUuid('boutique_id')->nullable();
            if (! DomainSchema::isolated()) {
                $table->foreign('boutique_id')->references('id')->on('boutiques')->nullOnDelete();
            } // NULL = C2C particulier
            $table->string('titre', 180);
            $table->text('description')->nullable();
            $table->decimal('prix', 12, 2); // FCFA — NUMERIC(12,2)
            $table->decimal('prix_flash', 12, 2)->nullable(); // prix promo Ventes Flash
            $table->boolean('prix_negociable')->default(false);
            $table->string('condition', 20)->default('bon_etat'); // neuf | comme_neuf | bon_etat | usage
            $table->string('mode_transaction', 10)->default('vente'); // vente | troc | mixte
            $table->boolean('est_trocable')->default(false);
            $table->integer('stock')->default(1);
            $table->string('categorie', 100); // Outillage | High-Tech | Mode | Maison | Électroménager | Auto/Moto
            $table->jsonb('specs')->nullable(); // attributs dynamiques (marque, puissance…)
            $table->jsonb('images')->nullable(); // URLs WebP, [0] = image principale
            $table->string('ville', 100)->default('Abidjan');
            $table->string('quartier', 100)->nullable();
            $table->string('statut', 12)->default('draft'); // draft | published | reserved | sold | archived
            $table->boolean('vente_flash')->default(false);
            $table->timestampTz('flash_fin_at')->nullable();
            $table->unsignedInteger('vues')->default(0);
            $table->unsignedInteger('favoris')->default(0);
            $table->timestampsTz();
        });

        // Intégrité (MLD Figure 5 — CHECK prix >= 0)
        DB::statement('ALTER TABLE articles ADD CONSTRAINT articles_prix_check CHECK (prix >= 0)');
        DB::statement('ALTER TABLE articles ADD CONSTRAINT articles_prix_flash_check CHECK (prix_flash IS NULL OR prix_flash >= 0)');
        DB::statement('ALTER TABLE articles ADD CONSTRAINT articles_stock_check CHECK (stock >= 0)');
        DB::statement("ALTER TABLE articles ADD CONSTRAINT articles_condition_check CHECK (condition IN ('neuf', 'comme_neuf', 'bon_etat', 'usage'))");
        DB::statement("ALTER TABLE articles ADD CONSTRAINT articles_mode_check CHECK (mode_transaction IN ('vente', 'troc', 'mixte'))");
        DB::statement("ALTER TABLE articles ADD CONSTRAINT articles_statut_check CHECK (statut IN ('draft', 'published', 'reserved', 'sold', 'archived'))");

        // Règle métier B2C : condition = neuf réservée aux boutiques pro vérifiées
        DB::statement("ALTER TABLE articles ADD CONSTRAINT articles_neuf_boutique_check CHECK (condition <> 'neuf' OR boutique_id IS NOT NULL)");

        // Index performance
        DB::statement('CREATE INDEX idx_articles_statut ON articles (statut)');
        DB::statement('CREATE INDEX idx_articles_categorie ON articles (categorie)');
        DB::statement('CREATE INDEX idx_articles_condition ON articles (condition)');
        DB::statement('CREATE INDEX idx_articles_mode ON articles (mode_transaction) WHERE statut = \'published\'');
        DB::statement('CREATE INDEX idx_articles_boutique ON articles (boutique_id) WHERE boutique_id IS NOT NULL');
        DB::statement('CREATE INDEX idx_articles_trocable ON articles (est_trocable) WHERE est_trocable = true');
        DB::statement('CREATE INDEX idx_articles_vente_flash ON articles (vente_flash, flash_fin_at) WHERE vente_flash = true');
        // GIN sur specs (JSONB) + recherche plein texte FR (titre + description)
        DB::statement('CREATE INDEX idx_articles_specs_gin ON articles USING GIN (specs)');
        DB::statement("ALTER TABLE articles ADD COLUMN recherche tsvector GENERATED ALWAYS AS (to_tsvector('french', coalesce(titre, '') || ' ' || coalesce(description, '') || ' ' || coalesce(categorie, ''))) STORED");
        DB::statement('CREATE INDEX idx_articles_recherche_gin ON articles USING GIN (recherche)');
    }

    public function down(): void
    {
        Schema::dropIfExists('articles');
    }
};
