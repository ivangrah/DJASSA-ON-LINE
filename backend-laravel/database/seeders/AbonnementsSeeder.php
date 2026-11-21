<?php

namespace Database\Seeders;

use App\Models\Abonnement;
use App\Models\User;
use Illuminate\Database\Seeder;

class AbonnementsSeeder extends Seeder
{
    public function run(): void
    {
        $proEmails = [
            'bakayoko@djassaonline.ci',
            'awa@djassaonline.ci',
            'baba@djassaonline.ci',
        ];

        foreach (User::all() as $user) {
            $isPro = in_array($user->email, $proEmails, true);

            Abonnement::updateOrCreate(
                ['utilisateur_id' => $user->id],
                [
                    'formule' => $isPro ? Abonnement::FORMULE_PRO : Abonnement::FORMULE_GRATUIT,
                    'montant_fcfa' => $isPro ? Abonnement::PRIX_PRO : 0,
                    'statut' => Abonnement::STATUT_ACTIVE,
                    'reference' => 'DJASSA-'.($isPro ? 'PRO' : 'FREE').'-'.strtoupper(substr($user->id, 0, 12)),
                    'debut_at' => now()->subDays(5),
                    'fin_at' => $isPro ? now()->addDays(25) : null,
                ]
            );
        }
    }
}
