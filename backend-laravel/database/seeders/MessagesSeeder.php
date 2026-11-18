<?php

namespace Database\Seeders;

use App\Models\Article;
use App\Models\Message;
use App\Models\OffreTroc;
use App\Models\User;
use Illuminate\Database\Seeder;

class MessagesSeeder extends Seeder
{
    public function run(): void
    {
        $koffi = User::where('email', 'koffi@djassaonline.ci')->firstOrFail();
        $adjoua = User::where('email', 'adjoua@djassaonline.ci')->firstOrFail();
        $bakayoko = User::where('email', 'bakayoko@djassaonline.ci')->firstOrFail();
        $awa = User::where('email', 'awa@djassaonline.ci')->firstOrFail();

        $meuleuse = Article::where('titre', 'like', 'Meuleuse d\'angle Makita GA5030%')->firstOrFail();
        $perceuse = Article::where('titre', 'like', 'Perceuse sans fil Bosch GSB 18V-50%')->firstOrFail();
        $onduleur = Article::where('titre', 'like', 'Onduleur APC Back-UPS 850VA%')->firstOrFail();

        $offre1 = OffreTroc::where('article_cible_id', $meuleuse->id)->firstOrFail();

        $base = now()->subHours(5);

        $messages = [
            /* --- Conversation Koffi ↔ Bakayoko — troc mixte meuleuse (pending) --- */
            ['expediteur_id' => $koffi->id, 'destinataire_id' => $bakayoko->id, 'article_id' => $meuleuse->id, 'offre_troc_id' => $offre1->id, 'type' => Message::TYPE_TEXTE, 'contenu' => 'Bonjour, la meuleuse est-elle toujours disponible ?', 'created_at' => $base],
            ['expediteur_id' => $bakayoko->id, 'destinataire_id' => $koffi->id, 'article_id' => $meuleuse->id, 'type' => Message::TYPE_TEXTE, 'contenu' => 'Bonjour Koffi, oui elle est en stock à la boutique du Plateau.', 'created_at' => $base->copy()->addMinutes(4)],
            ['expediteur_id' => $koffi->id, 'destinataire_id' => $bakayoko->id, 'article_id' => $meuleuse->id, 'offre_troc_id' => $offre1->id, 'type' => Message::TYPE_CARTE_TROC, 'contenu' => 'Proposition de troc : Visseuse sans fil Makita 14.4V + 15 000 FCFA de soulte', 'payload' => ['montant_soulte_fcfa' => 15000, 'articles_offerts' => ['Visseuse sans fil Makita 14.4V'], 'statut_offre' => 'pending'], 'created_at' => $base->copy()->addMinutes(9)],

            /* --- Conversation Adjoua ↔ Bakayoko — achat B2C perceuse (held) --- */
            ['expediteur_id' => $adjoua->id, 'destinataire_id' => $bakayoko->id, 'article_id' => $perceuse->id, 'type' => Message::TYPE_TEXTE, 'contenu' => 'Bonjour, je viens de payer la perceuse Bosch sur Djassa. Je passerai la retirer en boutique cet après-midi.', 'created_at' => $base->copy()->addHours(2)],
            ['expediteur_id' => $bakayoko->id, 'destinataire_id' => $adjoua->id, 'article_id' => $perceuse->id, 'type' => Message::TYPE_SYSTEME, 'contenu' => 'Paiement confirmé (GP-DEMO-000001). Les 85 000 FCFA sont bloqués en séquestre. Présentez votre code PIN à la remise.', 'payload' => ['transaction_type' => 'achat', 'escrow_status' => 'held'], 'created_at' => $base->copy()->addHours(2)->addMinutes(1)],

            /* --- Conversation Koffi ↔ Awa — troc mixte onduleur (completed) --- */
            ['expediteur_id' => $koffi->id, 'destinataire_id' => $awa->id, 'article_id' => $onduleur->id, 'type' => Message::TYPE_CARTE_TROC, 'contenu' => 'Troc accepté : iPhone 12 + 10 000 FCFA. Remise effectuée, merci !', 'payload' => ['montant_soulte_fcfa' => 10000, 'escrow_status' => 'released'], 'lu_at' => now()->subDay(), 'created_at' => now()->subDays(2)],
            ['expediteur_id' => $awa->id, 'destinataire_id' => $koffi->id, 'article_id' => $onduleur->id, 'type' => Message::TYPE_SYSTEME, 'contenu' => 'Code PIN validé — fonds libérés vers votre portefeuille. À bientôt sur Djassa Online.', 'lu_at' => now()->subDay(), 'created_at' => now()->subDay()],
        ];

        foreach ($messages as $data) {
            $createdAt = $data['created_at'] ?? now();
            unset($data['created_at']);

            $message = new Message();
            $message->timestamps = false;
            $message->forceFill($data + [
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);
            $message->save();
        }
    }
}
