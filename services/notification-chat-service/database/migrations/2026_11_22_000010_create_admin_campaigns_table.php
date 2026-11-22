<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_campaigns', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('titre', 150);
            $table->text('message');
            $table->string('audience', 30);
            $table->uuid('target_user_id')->nullable();
            $table->string('priorite', 20)->default('info'); // info|warning|urgent
            $table->boolean('send_email')->default(false);
            $table->unsignedInteger('destinataires_count')->default(0);
            $table->string('statut', 20)->default('queued'); // queued|sent|failed
            $table->uuid('requested_by')->nullable();
            $table->timestamps();
            $table->index(['created_at']);
            $table->index(['priorite']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_campaigns');
    }
};
