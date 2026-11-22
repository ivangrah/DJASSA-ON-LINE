<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void
    {
        Schema::create('verrous_stock', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('article_id');
            $table->uuid('offre_id');
            $table->timestampTz('expire_le');
            $table->timestampsTz();
            $table->unique(['article_id', 'offre_id'], 'verrous_stock_unique');
        });
        DB::statement('CREATE INDEX idx_verrous_expire ON verrous_stock (expire_le)');
        DB::statement('CREATE INDEX idx_verrous_article ON verrous_stock (article_id)');
    }
    public function down(): void { Schema::dropIfExists('verrous_stock'); }
};
