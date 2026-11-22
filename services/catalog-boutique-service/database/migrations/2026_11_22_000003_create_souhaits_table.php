<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void
    {
        Schema::create('souhaits', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('utilisateur_id');
            $table->string('titre', 180);
            $table->text('description')->nullable();
            $table->decimal('budget_max', 12, 2)->nullable();
            $table->boolean('accepte_troc')->default(true);
            $table->string('categorie', 100)->nullable();
            $table->string('ville', 100)->nullable();
            $table->string('statut', 12)->default('active');
            $table->unsignedInteger('vues')->default(0);
            $table->timestampsTz();
        });
        DB::statement("ALTER TABLE souhaits ADD CONSTRAINT souhaits_statut_check CHECK (statut IN ('active','fulfilled','closed'))");
        DB::statement('CREATE INDEX idx_souhaits_user ON souhaits (utilisateur_id)');
        DB::statement('CREATE INDEX idx_souhaits_statut ON souhaits (statut)');
        DB::statement('CREATE INDEX idx_souhaits_categorie ON souhaits (categorie)');
    }
    public function down(): void { Schema::dropIfExists('souhaits'); }
};
