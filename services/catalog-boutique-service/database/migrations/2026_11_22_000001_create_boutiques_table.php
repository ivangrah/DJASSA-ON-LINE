<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void
    {
        Schema::create('boutiques', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('utilisateur_id')->unique(); // UUID logique (domaine auth)
            $table->string('nom_boutique', 150)->unique();
            $table->string('slug', 170)->unique();
            $table->text('description')->nullable();
            $table->string('logo')->nullable();
            $table->string('banniere')->nullable();
            $table->string('rccm_doc')->nullable();
            $table->string('telephone', 20)->nullable();
            $table->string('categorie', 100)->nullable();
            $table->string('adresse', 255)->nullable();
            $table->string('ville', 100)->default('Abidjan');
            $table->boolean('is_active')->default(true);
            $table->boolean('verifie')->default(false);
            $table->boolean('accepte_troc')->default(true);
            $table->decimal('note_moyenne', 3, 2)->default(0);
            $table->unsignedInteger('nombre_avis')->default(0);
            $table->unsignedBigInteger('total_ventes')->default(0);
            $table->timestampsTz();
        });
        DB::statement('CREATE INDEX idx_boutiques_ville ON boutiques (ville)');
        DB::statement('CREATE INDEX idx_boutiques_categorie ON boutiques (categorie)');
        DB::statement('CREATE INDEX idx_boutiques_verifie ON boutiques (verifie)');
    }
    public function down(): void { Schema::dropIfExists('boutiques'); }
};
