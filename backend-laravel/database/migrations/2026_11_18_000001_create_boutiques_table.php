<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Djassa Online — table `boutiques` (MLD : `boutiques`)
     * Vitrine B2C officielle, relation 1:1 avec users (rôle vendeur_pro).
     * URL publique : /boutique/:slug — badge "Vendeur Vérifié".
     */
    public function up(): void
    {
        Schema::create('boutiques', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('utilisateur_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->string('nom_boutique', 150);
            $table->string('slug', 170)->unique(); // /boutique/quincaillerie-moderne
            $table->text('description')->nullable();
            $table->string('logo')->nullable();
            $table->string('banniere')->nullable(); // ratio 3:1, fond sombre #0F172A / dégradé rouge
            $table->string('rccm_doc')->nullable(); // document KYC léger (registre commerce)
            $table->string('telephone', 20)->nullable();
            $table->string('categorie', 100)->nullable(); // Outillage | High-Tech | Mode | Maison | Électroménager | Auto/Moto
            $table->string('adresse', 255)->nullable();
            $table->string('ville', 100)->default('Abidjan');
            $table->boolean('verifie')->default(false); // badge Vendeur Vérifié
            $table->boolean('is_active')->default(true);
            $table->boolean('accepte_troc')->default(true); // troc partiel sur articles neufs (PRD 3.3)
            $table->decimal('note_moyenne', 3, 2)->default(0); // 0.00 – 5.00
            $table->unsignedInteger('nombre_avis')->default(0);
            $table->unsignedBigInteger('total_ventes')->default(0);
            $table->timestampsTz();
        });

        DB::statement('ALTER TABLE boutiques ADD CONSTRAINT boutiques_note_check CHECK (note_moyenne BETWEEN 0 AND 5)');
        DB::statement('CREATE INDEX idx_boutiques_verifie ON boutiques (verifie) WHERE verifie = true');
        DB::statement('CREATE INDEX idx_boutiques_categorie ON boutiques (categorie)');
    }

    public function down(): void
    {
        Schema::dropIfExists('boutiques');
    }
};
