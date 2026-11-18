<?php

namespace Database\Seeders;

use App\Models\Boutique;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class BoutiquesSeeder extends Seeder
{
    public function run(): void
    {
        $boutiques = [
            [
                'proprietaire_email' => 'bakayoko@djassaonline.ci',
                'nom_boutique' => 'Quincaillerie Moderne',
                'description' => 'Quincaillerie professionnelle au Plateau : outillage électroportatif, outillage à main, visserie et consommables pour chantiers et particuliers exigeants.',
                'categorie' => 'Outillage',
                'adresse' => 'Avenue Houdaille, Immeuble Les Palmiers',
                'ville' => 'Abidjan',
                'telephone' => '+2250707070707',
                'verifie' => true,
                'accepte_troc' => true,
                'note_moyenne' => 4.6,
                'nombre_avis' => 128,
                'total_ventes' => 486,
            ],
            [
                'proprietaire_email' => 'awa@djassaonline.ci',
                'nom_boutique' => 'Electro Services Pro',
                'description' => 'Spécialiste outillage électroportatif, électroménager neuf et groupe électrogène — service après-vente et garantie 12 mois.',
                'categorie' => 'Électroménager',
                'adresse' => 'Boulevard de Marseille, Résidence Électra',
                'ville' => 'Abidjan',
                'telephone' => '+2250708080808',
                'verifie' => true,
                'accepte_troc' => false,
                'note_moyenne' => 4.8,
                'nombre_avis' => 214,
                'total_ventes' => 731,
            ],
            [
                'proprietaire_email' => 'baba@djassaonline.ci',
                'nom_boutique' => 'Bazar de l\'Habitat',
                'description' => 'Climatiseurs, ventilateurs, outillage léger et articles de maison — les bonnes affaires de Yopougon.',
                'categorie' => 'Maison',
                'adresse' => 'Niangon Nord, en face de la station Shell',
                'ville' => 'Abidjan',
                'telephone' => '+2250709090909',
                'verifie' => false, // KYC en attente — badge non attribué
                'accepte_troc' => false,
                'note_moyenne' => 0,
                'nombre_avis' => 0,
                'total_ventes' => 0,
            ],
        ];

        foreach ($boutiques as $data) {
            $owner = User::where('email', $data['proprietaire_email'])->firstOrFail();
            unset($data['proprietaire_email']);

            Boutique::updateOrCreate(
                ['utilisateur_id' => $owner->id],
                $data + ['slug' => Str::slug($data['nom_boutique'])]
            );
        }
    }
}
