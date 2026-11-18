<?php

namespace Database\Seeders;

use App\Models\Article;
use App\Models\Boutique;
use App\Models\OffreTroc;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Transactions de démo — Escrow GeniusPay.
 * PIN de démonstration (bcrypt) : T1 = `1234` (held, à retirer chez la boutique) — T2 = `4321` (released).
 * En production, les PIN ne sont jamais persistés en clair.
 */
class TransactionsSeeder extends Seeder
{
    public function run(): void
    {
        $adjoua = User::where('email', 'adjoua@djassaonline.ci')->firstOrFail();
        $koffi = User::where('email', 'koffi@djassaonline.ci')->firstOrFail();
        $bakayoko = User::where('email', 'bakayoko@djassaonline.ci')->firstOrFail();
        $awa = User::where('email', 'awa@djassaonline.ci')->firstOrFail();

        $quincaillerie = Boutique::where('slug', 'quincaillerie-moderne')->firstOrFail();

        $perceuse = Article::where('titre', 'like', 'Perceuse sans fil Bosch GSB 18V-50%')->firstOrFail();
        $onduleur = Article::where('titre', 'like', 'Onduleur APC Back-UPS 850VA%')->firstOrFail();
        $offre2 = OffreTroc::where('article_cible_id', $onduleur->id)->where('acheteur_id', $koffi->id)->firstOrFail();

        /* --- T1 : achat direct B2C, escrow HELD (en attente de remise + PIN) ---
           Article → reserved pour éviter la double vente. */
        Transaction::updateOrCreate(
            ['geniuspay_ref' => 'GP-DEMO-000001'],
            [
                'acheteur_id' => $adjoua->id,
                'vendeur_id' => $bakayoko->id,
                'article_id' => $perceuse->id,
                'boutique_id' => $quincaillerie->id,
                'type' => Transaction::TYPE_ACHAT,
                'montant' => 85000,
                'frais_escrow' => 2550, // 3% frais de sécurisation Djassa
                'escrow_status' => Transaction::ESCROW_HELD,
                'pin_hash' => Hash::make('1234'),
                'held_at' => now()->subHours(3),
            ]
        );
        $perceuse->update(['statut' => Article::STATUT_RESERVED, 'stock' => $perceuse->stock - 1]);

        /* --- T2 : troc mixte (iPhone + 10 000 FCFA), escrow RELEASED (remise faite) --- */
        Transaction::updateOrCreate(
            ['geniuspay_ref' => 'GP-DEMO-000002'],
            [
                'acheteur_id' => $koffi->id,
                'vendeur_id' => $awa->id,
                'article_id' => $onduleur->id,
                'offre_troc_id' => $offre2->id,
                'boutique_id' => $awa->boutique?->id ?? Boutique::where('slug', 'electro-services-pro')->value('id'),
                'type' => Transaction::TYPE_TROC_MIXTE,
                'montant' => 10000,
                'frais_escrow' => 0,
                'escrow_status' => Transaction::ESCROW_RELEASED,
                'pin_hash' => Hash::make('4321'),
                'held_at' => now()->subDays(2),
                'released_at' => now()->subDay(),
            ]
        );
        $onduleur->update(['statut' => Article::STATUT_SOLD, 'stock' => 0]);
        $offre2->update(['statut' => OffreTroc::STATUT_COMPLETED]);
    }
}
