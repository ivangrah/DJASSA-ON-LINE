<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Catalogue des offres/plans d'abonnement administrable. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('offres_abonnement', function (Blueprint $table): void {
            $table->id();
            $table->string('code', 40)->unique();
            $table->string('nom', 120);
            $table->text('description')->nullable();
            $table->unsignedBigInteger('montant_fcfa');
            $table->unsignedSmallInteger('duree_jours');
            $table->json('avantages')->nullable();
            $table->boolean('actif')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('offres_abonnement');
    }
};
