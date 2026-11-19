<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('plan', 16)->default('free')->after('role');
            $table->timestampTz('plan_expire_at')->nullable()->after('plan');
        });

        DB::statement("ALTER TABLE users ADD CONSTRAINT users_plan_check CHECK (plan IN ('free','pro'))");

        // Les comptes Pro existants (seed) gardent leur accès : on aligne plan & date.
        DB::statement("UPDATE users SET plan = 'pro', plan_expire_at = NOW() + INTERVAL '1 month' WHERE role = 'pro_seller'");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_plan_check');
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['plan', 'plan_expire_at']);
        });
    }
};
