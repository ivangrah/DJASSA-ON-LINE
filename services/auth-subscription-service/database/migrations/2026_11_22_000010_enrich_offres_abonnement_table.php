<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Enrichit les offres: cible rôle, limite articles, mise en avant. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('offres_abonnement', function (Blueprint $table): void {
            if (! Schema::hasColumn('offres_abonnement', 'role_cible')) {
                $table->string('role_cible', 30)->default('tous')->after('nom');
            }
            if (! Schema::hasColumn('offres_abonnement', 'max_articles')) {
                $table->unsignedInteger('max_articles')->nullable()->after('duree_jours');
            }
            if (! Schema::hasColumn('offres_abonnement', 'is_featured')) {
                $table->boolean('is_featured')->default(false)->after('actif');
            }
        });
    }

    public function down(): void
    {
        Schema::table('offres_abonnement', function (Blueprint $table): void {
            $table->dropColumn(array_filter(['role_cible', 'max_articles', 'is_featured'], fn ($c) => Schema::hasColumn('offres_abonnement', $c)));
        });
    }
};
