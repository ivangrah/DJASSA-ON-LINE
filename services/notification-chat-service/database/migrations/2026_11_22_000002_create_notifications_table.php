<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('user_id');
            $table->string('type', 30);
            $table->string('titre', 180);
            $table->text('corps')->nullable();
            $table->string('canal', 10)->default('email');
            $table->timestampTz('lu_le')->nullable();
            $table->string('source_reference', 191)->nullable();
            $table->timestampsTz();
        });
        DB::statement("ALTER TABLE notifications ADD CONSTRAINT notifications_canal_check CHECK (canal IN ('email','sms','push','in_app'))");
        DB::statement('CREATE INDEX idx_notifications_user ON notifications (user_id, created_at DESC)');
        DB::statement('CREATE INDEX idx_notifications_source ON notifications (source_reference)');
    }
    public function down(): void { Schema::dropIfExists('notifications'); }
};
