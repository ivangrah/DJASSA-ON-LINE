<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Données de démo réalistes marché ivoirien (FCFA).
     * Comptes de démonstration — mot de passe unique : `password`
     *
     * @var list<string>
     */
    protected array $seeders = [
        UsersSeeder::class,
        BoutiquesSeeder::class,
        ArticlesSeeder::class,
        SouhaitsSeeder::class,
        OffresTrocSeeder::class,
        TransactionsSeeder::class,
        MessagesSeeder::class,
    ];

    public function run(): void
    {
        foreach ($this->seeders as $seeder) {
            $this->call($seeder);
        }
    }
}
