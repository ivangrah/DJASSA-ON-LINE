<?php

namespace Database\Seeders;

use App\Models\Article;
use App\Models\Boutique;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Catalogue de démonstration — prix en FCFA, contexte ivoirien.
 * Images : URLs Unsplash (placeholders réalistes, à remplacer par des visuels réels en prod).
 */
class ArticlesSeeder extends Seeder
{
    public function run(): void
    {
        // Images auto-hébergées (storage/app/public/products/seed) — aucun host externe requis
        $img = fn (string $id) => rtrim(config('app.url'), '/').'/storage/products/seed/'.$id.'.jpg';

        // Chaque article expose 4 vues (carrousel au survol). On compose à partir du pool
        // d'images dispo, en gardant l'image d'origine en première position.
        $pool = [
            '1504148455328-c376907d081c', '1530124566582-a618bc2615dc',
            '1583394293214-28ded15ee548', '1585771724684-38269d6639fd',
            '1511707171634-5f897ff02aa9', '1585060544812-6b45742d762f',
            '1542272604-787c3835535d', '1584568694244-14fbdf83bd30',
            '1568772585407-9361f9bf3a87', '1586023492125-27b2c045efd7',
            '1523275335684-37898b6baf30', '1517694712202-14dd9538aa97',
        ];
        $gallery = function (array $base) use ($img, $pool): array {
            $out = [];
            foreach ($base as $u) {
                $out[] = $u;
                if (count($out) >= 4) break;
            }
            // complète avec des images du pool (différentes de celles déjà présentes)
            foreach ($pool as $id) {
                if (count($out) >= 4) break;
                $url = $img($id);
                if (!in_array($url, $out, true)) $out[] = $url;
            }
            return array_slice($out, 0, 4);
        };

        $quincaillerie = Boutique::where('slug', 'quincaillerie-moderne')->firstOrFail();
        $electro = Boutique::where('slug', 'electro-services-pro')->firstOrFail();
        $bazar = Boutique::where('slug', 'bazar-de-lhabitat')->firstOrFail();

        $bakayoko = User::where('email', 'bakayoko@djassaonline.ci')->firstOrFail();
        $awa = User::where('email', 'awa@djassaonline.ci')->firstOrFail();
        $baba = User::where('email', 'baba@djassaonline.ci')->firstOrFail();
        $koffi = User::where('email', 'koffi@djassaonline.ci')->firstOrFail();
        $adjoua = User::where('email', 'adjoua@djassaonline.ci')->firstOrFail();
        $yao = User::where('email', 'yao@djassaonline.ci')->firstOrFail();
        $mariame = User::where('email', 'mariame@djassaonline.ci')->firstOrFail();
        $serigne = User::where('email', 'serigne@djassaonline.ci')->firstOrFail();
        $siline = User::where('email', 'djassa.siline@djassaonline.ci')->firstOrFail();

        $articles = [
            /* ================= BOUTIQUES PRO B2C — NEUF ================= */
            [
                'boutique' => $quincaillerie, 'owner' => $bakayoko,
                'titre' => 'Perceuse sans fil Bosch GSB 18V-50 (2 batteries 2.0Ah)',
                'description' => 'Perceuse à percussion sans fil professionnelle Bosch 18V, couple 50 Nm, mandrin 13 mm, 2 batteries Li-Ion 2.0Ah + coffret L-BOXX. Garantie 12 mois.',
                'prix' => 85000, 'prix_negociable' => true, 'condition' => Article::CONDITION_NEUF,
                'mode_transaction' => Article::MODE_MIXTE, 'est_trocable' => true, 'stock' => 15,
                'categorie' => 'Outillage', 'specs' => ['marque' => 'Bosch', 'tension' => '18V', 'couple_nm' => 50, 'garantie_mois' => 12],
                'images' => $gallery([$img('1504148455328-c376907d081c'), $img('1530124566582-a618bc2615dc')]),
                'ville' => 'Abidjan', 'quartier' => 'Plateau', 'statut' => Article::STATUT_PUBLISHED,
            ],
            [
                'boutique' => $quincaillerie, 'owner' => $bakayoko,
                'titre' => 'Meuleuse d\'angle Makita GA5030 720W — 125 mm',
                'description' => 'Meuleuse d\'angle Makita 720W, disque 125 mm, idéale métallerie et chantier. Neuve sous blister, facture Pro fournie.',
                'prix' => 32500, 'prix_flash' => 27500, 'prix_negociable' => false, 'condition' => Article::CONDITION_NEUF,
                'mode_transaction' => Article::MODE_VENTE, 'est_trocable' => true, 'stock' => 22,
                'categorie' => 'Outillage', 'specs' => ['marque' => 'Makita', 'puissance_w' => 720, 'disque_mm' => 125],
                'images' => $gallery([$img('1504148455328-c376907d081c')]),
                'ville' => 'Abidjan', 'quartier' => 'Plateau', 'statut' => Article::STATUT_PUBLISHED,
                'vente_flash' => true, 'flash_fin_at' => now()->addHours(24),
            ],
            [
                'boutique' => $quincaillerie, 'owner' => $bakayoko,
                'titre' => 'Visseuse à chocs DeWalt DCF887 18V XR',
                'description' => 'Visseuse à chocs brushless DeWalt 3 vitesses, 205 Nm, compacte et ultra-puissante. Neuve avec 2 batteries 5Ah + chargeur rapide.',
                'prix' => 95000, 'prix_negociable' => true, 'condition' => Article::CONDITION_NEUF,
                'mode_transaction' => Article::MODE_MIXTE, 'est_trocable' => true, 'stock' => 8,
                'categorie' => 'Outillage', 'specs' => ['marque' => 'DeWalt', 'tension' => '18V', 'couple_nm' => 205],
                'images' => $gallery([$img('1504148455328-c376907d081c')]),
                'ville' => 'Abidjan', 'quartier' => 'Plateau', 'statut' => Article::STATUT_PUBLISHED,
            ],
            [
                'boutique' => $quincaillerie, 'owner' => $bakayoko,
                'titre' => 'Perforateur Bosch GBH 2-26 (800W SDS-plus)',
                'description' => 'Perforateur SDS-plus 800W, force de frappe 2.7 J, perçage béton Ø 26 mm. Outil neuf, usage professionnel intensif.',
                'prix' => 118000, 'prix_negociable' => false, 'condition' => Article::CONDITION_NEUF,
                'mode_transaction' => Article::MODE_VENTE, 'est_trocable' => false, 'stock' => 10,
                'categorie' => 'Outillage', 'specs' => ['marque' => 'Bosch', 'puissance_w' => 800, 'frappe_j' => 2.7],
                'images' => $gallery([$img('1504148455328-c376907d081c')]),
                'ville' => 'Abidjan', 'quartier' => 'Plateau', 'statut' => Article::STATUT_PUBLISHED,
            ],
            [
                'boutique' => $electro, 'owner' => $awa,
                'titre' => 'Groupe électrogène 2.5 kVA — démarrage électrique',
                'description' => 'Groupe électrogène 230V, 2.5 kVA, essence, démarrage électrique + lanceur, autonomie 8h. Garantie 6 mois et SAV Marcory.',
                'prix' => 185000, 'prix_flash' => 159000, 'prix_negociable' => true, 'condition' => Article::CONDITION_NEUF,
                'mode_transaction' => Article::MODE_VENTE, 'est_trocable' => false, 'stock' => 6,
                'categorie' => 'Électroménager', 'specs' => ['marque' => 'Générique Pro', 'puissance_kva' => 2.5, 'carburant' => 'essence', 'demarrage' => 'electrique'],
                'images' => $gallery([$img('1530124566582-a618bc2615dc')]),
                'ville' => 'Abidjan', 'quartier' => 'Marcory', 'statut' => Article::STATUT_PUBLISHED,
                'vente_flash' => true, 'flash_fin_at' => now()->addHours(24),
            ],
            [
                'boutique' => $electro, 'owner' => $awa,
                'titre' => 'Onduleur APC Back-UPS 850VA / 450W',
                'description' => 'Onduleur APC 850VA, 4 prises FR, régulation AVR, écran LCD, idéal régie et bureau à Abidjan. Neuf, garantie 12 mois.',
                'prix' => 65000, 'prix_negociable' => false, 'condition' => Article::CONDITION_NEUF,
                'mode_transaction' => Article::MODE_MIXTE, 'est_trocable' => true, 'stock' => 11,
                'categorie' => 'High-Tech', 'specs' => ['marque' => 'APC', 'puissance_va' => 850],
                'images' => $gallery([$img('1583394293214-28ded15ee548')]),
                'ville' => 'Abidjan', 'quartier' => 'Marcory', 'statut' => Article::STATUT_SOLD,
                'vente_flash' => false,
            ],
            [
                'boutique' => $bazar, 'owner' => $baba,
                'titre' => 'Climatiseur Split Samsung 12 000 BTU — Digital Inverter',
                'description' => 'Climatiseur split 1.5 CV, Digital Inverter, classe A++, télécommande + kit d\'installation inclus. Bazar de l\'Habitat, meilleur prix de Yopougon.',
                'prix' => 320000, 'prix_negociable' => true, 'condition' => Article::CONDITION_NEUF,
                'mode_transaction' => Article::MODE_VENTE, 'est_trocable' => false, 'stock' => 4,
                'categorie' => 'Électroménager', 'specs' => ['marque' => 'Samsung', 'btu' => 12000, 'classe' => 'A++'],
                'images' => $gallery([$img('1585771724684-38269d6639fd')]),
                'ville' => 'Abidjan', 'quartier' => 'Yopougon', 'statut' => Article::STATUT_PUBLISHED,
            ],

            /* ================= C2C — SECONDE MAIN & TROC ================= */
            [
                'boutique' => null, 'owner' => $koffi,
                'titre' => 'iPhone 12 128 Go — comme neuf, batterie 91%',
                'description' => 'iPhone 12 128 Go bleu, écran parfait sans rayure, batterie 91%, avec boîte et câble d\'origine. Vendu à Cocody, remise avec PIN Djassa.',
                'prix' => 165000, 'prix_negociable' => true, 'condition' => Article::CONDITION_COMME_NEUF,
                'mode_transaction' => Article::MODE_MIXTE, 'est_trocable' => true, 'stock' => 1,
                'categorie' => 'High-Tech', 'specs' => ['marque' => 'Apple', 'modele' => 'iPhone 12', 'stockage_go' => 128, 'batterie_pct' => 91],
                'images' => $gallery([$img('1511707171634-5f897ff02aa9')]),
                'ville' => 'Abidjan', 'quartier' => 'Cocody', 'statut' => Article::STATUT_SOLD,
            ],
            [
                'boutique' => null, 'owner' => $adjoua,
                'titre' => 'Samsung Galaxy A54 5G — 128 Go, bon état',
                'description' => 'Galaxy A54 5G 128 Go, coque depuis le premier jour, micro-rayures discrètes à peine visibles. Chargeur rapide inclus.',
                'prix' => 95000, 'prix_negociable' => true, 'condition' => Article::CONDITION_BON_ETAT,
                'mode_transaction' => Article::MODE_VENTE, 'est_trocable' => false, 'stock' => 1,
                'categorie' => 'High-Tech', 'specs' => ['marque' => 'Samsung', 'modele' => 'Galaxy A54', 'stockage_go' => 128],
                'images' => $gallery([$img('1585060544812-6b45742d762f')]),
                'ville' => 'Abidjan', 'quartier' => 'Marcory', 'statut' => Article::STATUT_PUBLISHED,
            ],
            [
                'boutique' => null, 'owner' => $koffi,
                'titre' => 'Visseuse sans fil Makita 14.4V — usagée, fonctionne parfaitement',
                'description' => 'Visseuse Makita 14.4V, mandrin 10 mm, 1 batterie 1.5Ah + chargeur. Marques de chantier mais tout fonctionne. Idéale pour bricoleur ou troc.',
                'prix' => 18000, 'prix_negociable' => false, 'condition' => Article::CONDITION_USAGE,
                'mode_transaction' => Article::MODE_MIXTE, 'est_trocable' => true, 'stock' => 1,
                'categorie' => 'Outillage', 'specs' => ['marque' => 'Makita', 'tension' => '14.4V'],
                'images' => $gallery([$img('1530124566582-a618bc2615dc')]),
                'ville' => 'Abidjan', 'quartier' => 'Cocody', 'statut' => Article::STATUT_PUBLISHED,
            ],
            [
                'boutique' => null, 'owner' => $adjoua,
                'titre' => 'Jean Levi\'s 501 vintage W32 L34',
                'description' => 'Jean Levi\'s 501 authentique, coupe regular, usure naturelle du denim, porté 3 fois. W32 L34.',
                'prix' => 12000, 'prix_negociable' => true, 'condition' => Article::CONDITION_BON_ETAT,
                'mode_transaction' => Article::MODE_VENTE, 'est_trocable' => false, 'stock' => 1,
                'categorie' => 'Mode', 'specs' => ['marque' => 'Levi\'s', 'taille' => 'W32 L34'],
                'images' => $gallery([$img('1542272604-787c3835535d')]),
                'ville' => 'Abidjan', 'quartier' => 'Marcory', 'statut' => Article::STATUT_PUBLISHED,
            ],
            [
                'boutique' => null, 'owner' => $yao,
                'titre' => 'Congélateur horizontal 250L — bon état',
                'description' => 'Congélateur horizontal 250L, gaz R600a, thermostat réglable, coffre étanche. Testé et fonctionnel, facture d\'origine.',
                'prix' => 85000, 'prix_negociable' => true, 'condition' => Article::CONDITION_BON_ETAT,
                'mode_transaction' => Article::MODE_VENTE, 'est_trocable' => false, 'stock' => 1,
                'categorie' => 'Électroménager', 'specs' => ['capacite_l' => 250],
                'images' => $gallery([$img('1584568694244-14fbdf83bd30')]),
                'ville' => 'Bouaké', 'quartier' => 'Air France', 'statut' => Article::STATUT_PUBLISHED,
            ],
            [
                'boutique' => null, 'owner' => $koffi,
                'titre' => 'Caisse à outils complète 108 pièces — bon état',
                'description' => 'Kit outillage mécanique 108 pièces : cliquets, douilles, clés mixtes, tournevis, pinces, coffret soufflé. Complet et rangé.',
                'prix' => 45000, 'prix_negociable' => true, 'condition' => Article::CONDITION_BON_ETAT,
                'mode_transaction' => Article::MODE_MIXTE, 'est_trocable' => true, 'stock' => 1,
                'categorie' => 'Outillage', 'specs' => ['pieces' => 108],
                'images' => $gallery([$img('1504148455328-c376907d081c')]),
                'ville' => 'Abidjan', 'quartier' => 'Cocody', 'statut' => Article::STATUT_PUBLISHED,
            ],
            [
                'boutique' => null, 'owner' => $mariame,
                'titre' => 'Yamaha Crypton 2019 — 38 000 km, révisée',
                'description' => 'Yamaha Crypton 110cc, 2019, 38 000 km, carnet d\'entretien, pneus neufs, freins refaits. Vendue à Yamoussoukro, papiers en règle.',
                'prix' => 450000, 'prix_negociable' => true, 'condition' => Article::CONDITION_BON_ETAT,
                'mode_transaction' => Article::MODE_VENTE, 'est_trocable' => false, 'stock' => 1,
                'categorie' => 'Auto/Moto', 'specs' => ['marque' => 'Yamaha', 'modele' => 'Crypton', 'annee' => 2019, 'kilometrage' => 38000],
                'images' => $gallery([$img('1568772585407-9361f9bf3a87')]),
                'ville' => 'Yamoussoukro', 'quartier' => 'Habitat', 'statut' => Article::STATUT_PUBLISHED,
            ],
            [
                'boutique' => null, 'owner' => $serigne,
                'titre' => 'Groupe électrogène d\'occasion 2.5 kVA — démarrage lanceur',
                'description' => 'Groupe électrogène 2.5 kVA démarrage lanceur, essence, compteur ~800h. Démarre au quart de tour, parfait pour magasin ou résidence. Troc possible contre PC portable.',
                'prix' => 80000, 'prix_negociable' => true, 'condition' => Article::CONDITION_USAGE,
                'mode_transaction' => Article::MODE_MIXTE, 'est_trocable' => true, 'stock' => 1,
                'categorie' => 'Électroménager', 'specs' => ['puissance_kva' => 2.5, 'heures_compteur' => 800],
                'images' => $gallery([$img('1530124566582-a618bc2615dc')]),
                'ville' => 'Abidjan', 'quartier' => 'Yopougon', 'statut' => Article::STATUT_PUBLISHED,
            ],
            [
                'boutique' => null, 'owner' => $siline,
                'titre' => 'Meuble TV scandinave chêne massif — 1m60',
                'description' => 'Meuble TV en chêne massif, style scandinave, 160 cm, 2 tiroirs + niches. Largement sous-estimé, achetable pour débarrasser.',
                'prix' => 60000, 'prix_negociable' => true, 'condition' => Article::CONDITION_BON_ETAT,
                'mode_transaction' => Article::MODE_VENTE, 'est_trocable' => false, 'stock' => 1,
                'categorie' => 'Maison', 'specs' => ['materiau' => 'chêne', 'largeur_cm' => 160],
                'images' => $gallery([$img('1586023492125-27b2c045efd7')]),
                'ville' => 'Abidjan', 'quartier' => 'Treichville', 'statut' => Article::STATUT_PUBLISHED,
            ],
            [
                'boutique' => null, 'owner' => $siline,
                'titre' => 'Casio G-Shock GA-2100 — comme neuve, 2 mois',
                'description' => 'G-Shock GA-2100 "CasiOak" noir/rouge, portée 2 mois, verre sans rayure, écrin et bracelet d\'origine.',
                'prix' => 75000, 'prix_negociable' => false, 'condition' => Article::CONDITION_COMME_NEUF,
                'mode_transaction' => Article::MODE_MIXTE, 'est_trocable' => true, 'stock' => 1,
                'categorie' => 'Mode', 'specs' => ['marque' => 'Casio', 'modele' => 'GA-2100'],
                'images' => $gallery([$img('1523275335684-37898b6baf30')]),
                'ville' => 'Abidjan', 'quartier' => 'Treichville', 'statut' => Article::STATUT_PUBLISHED,
            ],
            [
                'boutique' => null, 'owner' => $yao,
                'titre' => 'PC portable HP EliteBook 840 G5 — i5 8Go/256Go SSD',
                'description' => 'EliteBook 840 G5, i5-8250U, 8 Go RAM, SSD 256 Go, écran 14" FHD. Dalle lumineuse, batterie ~3h, Windows 11. Idéal étudiant/dev.',
                'prix' => 220000, 'prix_negociable' => true, 'condition' => Article::CONDITION_BON_ETAT,
                'mode_transaction' => Article::MODE_VENTE, 'est_trocable' => false, 'stock' => 1,
                'categorie' => 'High-Tech', 'specs' => ['marque' => 'HP', 'processeur' => 'i5-8250U', 'ram_go' => 8, 'ssd_go' => 256],
                'images' => $gallery([$img('1517694712202-14dd9538aa97')]),
                'ville' => 'Bouaké', 'quartier' => 'Air France', 'statut' => Article::STATUT_PUBLISHED,
            ],
        ];

        foreach ($articles as $data) {
            $boutique = $data['boutique'];
            $owner = $data['owner'];
            unset($data['boutique'], $data['owner']);

            Article::updateOrCreate(
                ['titre' => $data['titre']],
                $data + [
                    'utilisateur_id' => $owner->id,
                    'boutique_id' => $boutique?->id,
                ]
            );
        }
    }
}
