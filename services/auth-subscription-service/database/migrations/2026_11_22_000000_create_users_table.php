<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('nom', 150);
            $table->string('email')->unique();
            $table->string('telephone', 20)->nullable();
            $table->string('password')->nullable();
            $table->string('google_id')->nullable()->unique();
            $table->string('role', 20)->default('particulier');
            $table->string('plan_abonnement', 10)->nullable();
            $table->timestampTz('abonnement_actif_jusqu_au')->nullable();
            $table->boolean('verifie')->default(false);
            $table->string('kyc_status', 20)->default('none');
            $table->string('ville', 100)->default('Abidjan');
            $table->string('quartier', 100)->nullable();
            $table->string('avatar')->nullable();
            $table->decimal('solde_portefeuille', 12, 2)->default(0);
            $table->timestamp('email_verified_at')->nullable();
            $table->rememberToken();
            $table->timestampsTz();
        });

        DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('particulier','vendeur_pro','admin'))");
        DB::statement("ALTER TABLE users ADD CONSTRAINT users_plan_check CHECK (plan_abonnement IS NULL OR plan_abonnement IN ('gratuit','pro'))");
        DB::statement('CREATE INDEX idx_users_email ON users (email)');
        DB::statement('CREATE INDEX idx_users_role ON users (role)');
    }

    public function down(): void { Schema::dropIfExists('users'); }
};
