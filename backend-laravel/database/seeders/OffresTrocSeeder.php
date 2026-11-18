<?php

namespace Database\Seeders;

use App\Models\Article;
use App\Models\OffreTroc;
use App\Models\User;
use Illuminate\Database\Seeder;

class OffresTrocSeeder extends Seeder
{
    public function run(): void
    {
        $koffi = User::where('email', 'koffi@djassaonline.ci')->firstOrFail();
        $bakayoko = User::where('email', 'bakayoko@djassaonline.ci')->firstOrFail();
        $awa = User::where('email', 'awa@djassaonline.ci')->firstOrFail();

        $visseuseMakita = Article::where('titre', 'like', 'Visseuse sans fil Makita 14.4V%')->firstOrFail();
        $iphone12 = Article::where('titre', 'like', 'iPhone 12 128 Go%')->firstOrFail();
        $meuleuse = Article::where('titre', 'like', 'Meuleuse d\'angle Makita GA5030%')->firstOrFail();
        $onduleur = Article::where('titre', 'like', 'Onduleur APC Back-UPS 850VA%')->firstOrFail();

        // --- Offre 1 : PENDING — Koffi propose visseuse Makita + 15 000 FCFA contre la meuleuse Makita ---
        $offre1 = OffreTroc::updateOrCreate(
            ['article_cible_id' => $meuleuse->id, 'acheteur_id' => $koffi->id, 'statut' => OffreTroc::STATUT_PENDING],
            [
                'vendeur_id' => $bakayoko->id,
                'montant_soulte_fcfa' => 15000,
                'message' => 'Bonjour, je propose ma visseuse Makita + 15 000 FCFA de soulte contre la meuleuse. Remise possible à la boutique (Plateau).',
            ]
        );
        $offre1->articlesOfferts()->syncWithoutDetaching([$visseuseMakita->id]);

        // --- Offre 2 : ACCEPTED — Koffi propose l'iPhone 12 + 10 000 FCFA contre l'onduleur APC (troc mixte) ---
        $offre2 = OffreTroc::updateOrCreate(
            ['article_cible_id' => $onduleur->id, 'acheteur_id' => $koffi->id, 'statut' => OffreTroc::STATUT_ACCEPTED],
            [
                'vendeur_id' => $awa->id,
                'montant_soulte_fcfa' => 10000,
                'message' => 'Bonjour, je troque mon iPhone 12 + 10 000 FCFA contre l\'onduleur. Merci de me confirmer la disponibilité.',
            ]
        );
        $offre2->articlesOfferts()->syncWithoutDetaching([$iphone12->id]);
    }
}
