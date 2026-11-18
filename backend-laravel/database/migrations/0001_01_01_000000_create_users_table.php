<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Djassa Online — table `users` (MLD : `utilisateurs`)
     * UUID PK · rôles user | pro_seller | admin · KYC léger · portefeuille FCFA escrow.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('nom', 150);
            $table->string('email', 255)->nullable()->unique();
            $table->string('telephone', 20)->nullable()->unique();
            $table->string('password')->nullable(); // null pour comptes Google-only
            $table->string('google_id', 191)->nullable()->unique();
            $table->string('avatar')->nullable();
            $table->string('role', 20)->default('user'); // user | pro_seller | admin
            $table->string('kyc_status', 20)->default('none'); // none | pending | verified
            $table->string('ville', 100)->default('Abidjan');
            $table->string('quartier', 100)->nullable();
            $table->decimal('solde_portefeuille', 12, 2)->default(0); // FCFA — alimenté à la libération escrow
            $table->integer('score_confiance')->default(50); // 0-100, gamification Djassa
            $table->timestamp('email_verified_at')->nullable();
            $table->timestamp('telephone_verified_at')->nullable();
            $table->rememberToken();
            $table->timestampsTz();
        });

        // Contraintes CHECK (intégrité MLD)
        DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'pro_seller', 'admin'))");
        DB::statement("ALTER TABLE users ADD CONSTRAINT users_kyc_status_check CHECK (kyc_status IN ('none', 'pending', 'verified'))");
        DB::statement('ALTER TABLE users ADD CONSTRAINT users_solde_check CHECK (solde_portefeuille >= 0)');
        DB::statement('ALTER TABLE users ADD CONSTRAINT users_score_confiance_check CHECK (score_confiance BETWEEN 0 AND 100)');

        DB::statement('CREATE INDEX idx_users_role ON users (role)');

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->uuid('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
