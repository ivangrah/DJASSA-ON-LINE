<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void
    {
        Schema::create('conversations', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('participant_1'); // références logiques (auth)
            $table->uuid('participant_2');
            $table->uuid('article_id')->nullable();  // référence logique (catalog)
            $table->uuid('offre_troc_id')->nullable(); // référence logique (troc)
            $table->timestampTz('dernier_message_at')->nullable();
            $table->timestampsTz();
            $table->unique(['participant_1','participant_2','article_id'], 'conversations_unique');
        });
        DB::statement('ALTER TABLE conversations ADD CONSTRAINT conversations_parties_check CHECK (participant_1 <> participant_2)');
        DB::statement('CREATE INDEX idx_conversations_p1 ON conversations (participant_1, dernier_message_at DESC)');
        DB::statement('CREATE INDEX idx_conversations_p2 ON conversations (participant_2, dernier_message_at DESC)');
    }
    public function down(): void { Schema::dropIfExists('conversations'); }
};
