<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UsersSeeder extends Seeder
{
    /**
     * Comptes de démonstration (marché ivoirien, FCFA).
     * Mot de passe unique pour tous : `password` (haché bcrypt).
     *
     * - particulier  : offre gratuite, pas de boutique, troc & occasion
     * - vendeur_pro  : offre Pro active un mois, boutique & neuf
     * - admin        : supervision transverse
     */
    public function run(): void
    {
        $password = Hash::make('password');
        $finPro = now()->addMonth();

        $users = [
            // --- Administration ---
            ['nom' => 'Admin Djassa', 'email' => 'admin@djassaonline.ci', 'telephone' => '+2250700000000', 'role' => User::ROLE_ADMIN, 'plan_abonnement' => User::PLAN_PRO, 'abonnement_actif_jusqu_au' => null, 'kyc_status' => User::KYC_VERIFIED, 'ville' => 'Abidjan', 'quartier' => 'Plateau', 'score_confiance' => 100],

            // --- Particuliers (C2C / troc / occasion) ---
            ['nom' => 'Koffi N\'Guessan', 'email' => 'koffi@djassaonline.ci', 'telephone' => '+2250701010101', 'role' => User::ROLE_PARTICULIER, 'plan_abonnement' => User::PLAN_GRATUIT, 'abonnement_actif_jusqu_au' => null, 'ville' => 'Abidjan', 'quartier' => 'Cocody', 'score_confiance' => 72],
            ['nom' => 'Adjoua Koné', 'email' => 'adjoua@djassaonline.ci', 'telephone' => '+2250702020202', 'role' => User::ROLE_PARTICULIER, 'plan_abonnement' => User::PLAN_GRATUIT, 'abonnement_actif_jusqu_au' => null, 'ville' => 'Abidjan', 'quartier' => 'Marcory', 'score_confiance' => 85],
            ['nom' => 'Yao Kouassi', 'email' => 'yao@djassaonline.ci', 'telephone' => '+2250703030303', 'role' => User::ROLE_PARTICULIER, 'plan_abonnement' => User::PLAN_GRATUIT, 'abonnement_actif_jusqu_au' => null, 'ville' => 'Bouaké', 'quartier' => 'Air France', 'score_confiance' => 64],
            ['nom' => 'Mariame Traoré', 'email' => 'mariame@djassaonline.ci', 'telephone' => '+2250704040404', 'role' => User::ROLE_PARTICULIER, 'plan_abonnement' => User::PLAN_GRATUIT, 'abonnement_actif_jusqu_au' => null, 'ville' => 'Yamoussoukro', 'quartier' => 'Habitat', 'score_confiance' => 58],
            ['nom' => 'Sérigné Diabaté', 'email' => 'serigne@djassaonline.ci', 'telephone' => '+2250705050505', 'role' => User::ROLE_PARTICULIER, 'plan_abonnement' => User::PLAN_GRATUIT, 'abonnement_actif_jusqu_au' => null, 'ville' => 'Abidjan', 'quartier' => 'Yopougon', 'score_confiance' => 47],
            ['nom' => 'Djassa Siline', 'email' => 'djassa.siline@djassaonline.ci', 'telephone' => '+2250706060606', 'role' => User::ROLE_PARTICULIER, 'plan_abonnement' => User::PLAN_GRATUIT, 'abonnement_actif_jusqu_au' => null, 'ville' => 'Abidjan', 'quartier' => 'Treichville', 'score_confiance' => 90],

            // --- Vendeurs Pro B2C ---
            ['nom' => 'Bakayoko Koffi (Quincaillerie Moderne)', 'email' => 'bakayoko@djassaonline.ci', 'telephone' => '+2250707070707', 'role' => User::ROLE_VENDEUR_PRO, 'plan_abonnement' => User::PLAN_PRO, 'abonnement_actif_jusqu_au' => $finPro, 'kyc_status' => User::KYC_VERIFIED, 'ville' => 'Abidjan', 'quartier' => 'Plateau', 'score_confiance' => 95],
            ['nom' => 'Awa Touré (Electro Services Pro)', 'email' => 'awa@djassaonline.ci', 'telephone' => '+2250708080808', 'role' => User::ROLE_VENDEUR_PRO, 'plan_abonnement' => User::PLAN_PRO, 'abonnement_actif_jusqu_au' => $finPro, 'kyc_status' => User::KYC_VERIFIED, 'ville' => 'Abidjan', 'quartier' => 'Marcory', 'score_confiance' => 96],
            ['nom' => 'Baba Cissé (Bazar de l\'Habitat)', 'email' => 'baba@djassaonline.ci', 'telephone' => '+2250709090909', 'role' => User::ROLE_VENDEUR_PRO, 'plan_abonnement' => User::PLAN_PRO, 'abonnement_actif_jusqu_au' => $finPro, 'kyc_status' => User::KYC_PENDING, 'ville' => 'Abidjan', 'quartier' => 'Yopougon', 'score_confiance' => 30],
        ];

        foreach ($users as $user) {
            User::updateOrCreate(
                ['email' => $user['email']],
                $user + ['password' => $password]
            );
        }
    }
}
