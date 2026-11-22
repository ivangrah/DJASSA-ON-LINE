<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('conversation_id');
            $table->uuid('expediteur_id');
            $table->uuid('destinataire_id');
            $table->uuid('article_id')->nullable();
            $table->uuid('offre_troc_id')->nullable();
            $table->string('type', 20)->default('texte');
            $table->text('contenu')->nullable();
            $table->jsonb('payload')->nullable();
            $table->timestampTz('lu_at')->nullable();
            $table->timestampsTz();
        });
        DB::statement("ALTER TABLE messages ADD CONSTRAINT messages_type_check CHECK (type IN ('texte','offre_prix','carte_troc','systeme'))");
        DB::statement('ALTER TABLE messages ADD CONSTRAINT messages_parties_check CHECK (expediteur_id <> destinataire_id)');
        DB::statement('CREATE INDEX idx_messages_conversation ON messages (conversation_id, created_at)');
        DB::statement('CREATE INDEX idx_messages_unread ON messages (destinataire_id) WHERE lu_at IS NULL');
    }
    public function down(): void { Schema::dropIfExists('messages'); }
};
