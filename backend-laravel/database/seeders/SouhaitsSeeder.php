<?php

namespace Database\Seeders;

use App\Models\Souhait;
use App\Models\User;
use Illuminate\Database\Seeder;

class SouhaitsSeeder extends Seeder
{
    public function run(): void
    {
        $souhaits = [
            ['email' => 'mariame@djassaonline.ci', 'titre' => 'Recherche groupe électrogène d\'occasion, budget max 90 000 FCFA ou troc', 'description' => 'Pour mon commerce à Yamoussoukro lors des délestages CIE. Accepte troc contre électroménager.', 'budget_max' => 90000, 'accepte_troc' => true, 'categorie' => 'Électroménager', 'ville' => 'Yamoussoukro'],
            ['email' => 'djassa.siline@djassaonline.ci', 'titre' => 'Recherche perceuse Bosch GSB 18V d\'occasion', 'description' => 'Perceuse sans fil Bosch 18V, pas trop usagée, idéal avec batterie et chargeur.', 'budget_max' => 50000, 'accepte_troc' => false, 'categorie' => 'Outillage', 'ville' => 'Abidjan'],
            ['email' => 'adjoua@djassaonline.ci', 'titre' => 'Recherche iPhone 13 ou équivalent, budget 250 000 FCFA', 'description' => 'Préférence iPhone 13 128Go, état bon minimum, remise en main propre à Marcory.', 'budget_max' => 250000, 'accepte_troc' => true, 'categorie' => 'High-Tech', 'ville' => 'Abidjan'],
            ['email' => 'yao@djassaonline.ci', 'titre' => 'Recherche outillage complet pour menuiserie', 'description' => 'Dégauchisseuse, scie circulaire, ponceuse… Budget ouvert, accepte troc contre PC portable HP EliteBook.', 'budget_max' => 350000, 'accepte_troc' => true, 'categorie' => 'Outillage', 'ville' => 'Bouaké'],
            ['email' => 'serigne@djassaonline.ci', 'titre' => 'Recherche climatiseur split 12 000 BTU neuf ou comme neuf', 'description' => 'Pour un local commercial à Yopougon. Paiement comptant Mobile Money.', 'budget_max' => 300000, 'accepte_troc' => false, 'categorie' => 'Électroménager', 'ville' => 'Abidjan'],
        ];

        foreach ($souhaits as $data) {
            $user = User::where('email', $data['email'])->firstOrFail();
            unset($data['email']);

            Souhait::updateOrCreate(
                ['titre' => $data['titre']],
                $data + ['utilisateur_id' => $user->id, 'statut' => Souhait::STATUT_ACTIVE]
            );
        }
    }
}
