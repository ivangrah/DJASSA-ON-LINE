<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Djassa Online — table `messages` (MLD : `messages`)
     * Chat lié à un article (et/ou une offre de troc).
     * Types : texte | offre_prix | carte_troc | systeme — `payload` JSONB transporte
     * les cartes d'actions rapides (montant, contre-offre, PIN) (PRD §3.4).
     */
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->foreignUuid('expediteur_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('destinataire_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('article_id')->nullable()->constrained('articles')->nullOnDelete();
            $table->foreignUuid('offre_troc_id')->nullable()->constrained('offres_troc')->nullOnDelete();
            $table->string('type', 20)->default('texte'); // texte | offre_prix | carte_troc | systeme
            $table->text('contenu')->nullable();
            $table->jsonb('payload')->nullable(); // ex : {"montant_fcfa": 25000, "soulte_fcfa": 10000}
            $table->timestampTz('lu_at')->nullable();
            $table->timestampsTz();
        });

        DB::statement("ALTER TABLE messages ADD CONSTRAINT messages_type_check CHECK (type IN ('texte', 'offre_prix', 'carte_troc', 'systeme'))");
        DB::statement('ALTER TABLE messages ADD CONSTRAINT messages_parties_check CHECK (expediteur_id <> destinataire_id)');

        DB::statement('CREATE INDEX idx_messages_article ON messages (article_id, created_at)');
        DB::statement('CREATE INDEX idx_messages_conversation ON messages (expediteur_id, destinataire_id, created_at)');
        DB::statement('CREATE INDEX idx_messages_offre_troc ON messages (offre_troc_id) WHERE offre_troc_id IS NOT NULL');
        DB::statement('CREATE INDEX idx_messages_non_lus ON messages (destinataire_id) WHERE lu_at IS NULL');
    }

    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
