<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/** Journal d'idempotence des webhooks — un événement ne doit jamais produire deux effets. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('webhooks_logs', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('fournisseur', 20);
            $table->string('reference', 191);
            $table->string('event_id', 191);
            $table->string('payload_hash', 64);
            $table->timestampTz('traite_le')->useCurrent();
            $table->timestampsTz();

            $table->unique(['fournisseur', 'reference', 'event_id'], 'webhooks_logs_uniq_event');
            $table->unique(['reference', 'payload_hash'], 'webhooks_logs_uniq_payload');
            $table->index('reference', 'webhooks_logs_reference_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('webhooks_logs');
    }
};
