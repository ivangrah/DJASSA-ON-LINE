<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void
    {
        Schema::create('articles', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('utilisateur_id'); // références logiques, pas de FK cross-base
            $table->uuid('boutique_id')->nullable();
            $table->string('titre', 180);
            $table->text('description')->nullable();
            $table->decimal('prix', 12, 2);
            $table->decimal('prix_flash', 12, 2)->nullable();
            $table->boolean('prix_negociable')->default(false);
            $table->string('condition', 20)->default('bon_etat');
            $table->string('mode_transaction', 10)->default('vente');
            $table->boolean('est_trocable')->default(false);
            $table->integer('stock')->default(1);
            $table->string('categorie', 100);
            $table->jsonb('specs')->nullable();
            $table->jsonb('images')->nullable();
            $table->string('ville', 100)->default('Abidjan');
            $table->string('quartier', 100)->nullable();
            $table->string('statut', 12)->default('draft');
            $table->boolean('vente_flash')->default(false);
            $table->timestampTz('flash_fin_at')->nullable();
            $table->unsignedInteger('vues')->default(0);
            $table->unsignedInteger('favoris')->default(0);
            $table->timestampsTz();
        });
        DB::statement('ALTER TABLE articles ADD CONSTRAINT articles_prix_check CHECK (prix >= 0)');
        DB::statement('ALTER TABLE articles ADD CONSTRAINT articles_stock_check CHECK (stock >= 0)');
        DB::statement("ALTER TABLE articles ADD CONSTRAINT articles_statut_check CHECK (statut IN ('draft','published','reserved','sold','archived'))");
        DB::statement("ALTER TABLE articles ADD CONSTRAINT articles_condition_check CHECK (condition IN ('neuf','comme_neuf','bon_etat','usage'))");
        DB::statement('CREATE INDEX idx_articles_statut ON articles (statut)');
        DB::statement('CREATE INDEX idx_articles_marche ON articles (mode_transaction)');
        DB::statement('CREATE INDEX idx_articles_categorie ON articles (categorie)');
        DB::statement('CREATE INDEX idx_articles_ville ON articles (ville)');
        DB::statement('CREATE INDEX idx_articles_created ON articles (created_at DESC)');
        DB::statement('CREATE INDEX idx_articles_prix ON articles (prix)');
        DB::statement('CREATE INDEX idx_articles_utilisateur ON articles (utilisateur_id)');
        DB::statement('CREATE INDEX idx_articles_boutique ON articles (boutique_id)');
    }
    public function down(): void { Schema::dropIfExists('articles'); }
};
