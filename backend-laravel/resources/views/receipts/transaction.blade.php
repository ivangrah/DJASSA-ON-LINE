<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Reçu Djassa Online — {{ $transaction->id }}</title>
    <style>
        * { font-family: 'DejaVu Sans', sans-serif; }
        body { color: #121212; font-size: 12px; margin: 0; }
        .header { background: #121212; color: #FFFFFF; padding: 18px 28px; }
        .header .brand { font-size: 20px; font-weight: 800; }
        .header .brand span { color: #E11D48; }
        .header .doc { font-size: 10px; color: #F5F5F5; margin-top: 2px; }
        .band { background: #E11D48; height: 4px; }
        .content { padding: 24px 28px; }
        h1 { font-size: 15px; margin: 0 0 14px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        th, td { text-align: left; padding: 7px 10px; border-bottom: 1px solid #F5F5F5; }
        th { font-size: 10px; text-transform: uppercase; letter-spacing: .4px; color: #64748B; }
        .total { font-size: 16px; font-weight: 800; color: #E11D48; }
        .badge { display: inline-block; background: #121212; color: #FFFFFF; border-radius: 999px; padding: 3px 12px; font-size: 10px; font-weight: 700; letter-spacing: .5px; }
        .footer { border-top: 1px solid #F5F5F5; padding: 12px 28px; font-size: 9px; color: #64748B; }
        .grid { width: 100%; }
        .grid td { border: none; padding: 2px 4px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="brand">Djassa <span>Online</span></div>
        <div class="doc">La marketplace de revente et de troc en Afrique de l'Ouest — djassaonline.ci</div>
    </div>
    <div class="band"></div>

    <div class="content">
        <h1>{{ $transaction->boutique_id ? 'FACTURE / REÇU BOUTIQUE PRO' : 'REÇU DE TRANSACTION' }} <span class="badge">{{ strtoupper($transaction->escrow_status) }}</span></h1>

        <table class="grid">
            <tr><td><strong>Référence transaction :</strong> {{ $transaction->id }}</td>
                <td><strong>Date :</strong> {{ $transaction->released_at?->format('d/m/Y H:i') ?? $transaction->created_at->format('d/m/Y H:i') }}</td></tr>
            <tr><td><strong>Réf. GeniusPay :</strong> {{ $transaction->geniuspay_ref ?? '—' }}</td>
                <td><strong>Type :</strong> {{ $transaction->type === 'troc_mixte' ? 'Troc mixte (soulte)' : 'Achat direct' }}</td></tr>
        </table>

        <table>
            <thead><tr><th>Parties</th><th>Nom / Boutique</th><th>Téléphone</th></tr></thead>
            <tbody>
                <tr><td>Acheteur</td><td>{{ $transaction->acheteur?->nom }}</td><td>{{ $transaction->acheteur?->telephone ?? '—' }}</td></tr>
                <tr><td>Vendeur</td><td>{{ $transaction->boutique?->nom_boutique ?? $transaction->vendeur?->nom }}</td><td>{{ $transaction->boutique?->telephone ?? $transaction->vendeur?->telephone ?? '—' }}</td></tr>
            </tbody>
        </table>

        <table>
            <thead><tr><th>Article</th><th>Qté</th><th>Prix unitaire (FCFA)</th></tr></thead>
            <tbody>
                <tr>
                    <td>{{ $transaction->article?->titre }}<br><small>{{ $transaction->article?->categorie }} — état : {{ $transaction->article?->condition }}</small></td>
                    <td>1</td>
                    <td>{{ number_format((float) $transaction->montant, 0, ',', ' ') }}</td>
                </tr>
            </tbody>
        </table>

        <table>
            <tr><td>Sous-total</td><td style="text-align:right">{{ number_format((float) $transaction->montant, 0, ',', ' ') }} FCFA</td></tr>
            <tr><td>Frais de sécurisation Djassa (escrow)</td><td style="text-align:right">{{ number_format((float) $transaction->frais_escrow, 0, ',', ' ') }} FCFA</td></tr>
            <tr><td class="total">Total séquestré</td><td class="total" style="text-align:right">{{ number_format((float) $transaction->montant + (float) $transaction->frais_escrow, 0, ',', ' ') }} FCFA</td></tr>
        </table>

        @if ($transaction->boutique && $transaction->boutique->verifie)
            <p><strong>Boutique vérifiée</strong> — badge Vendeur Vérifié Djassa Online. SAV : {{ $transaction->boutique->telephone ?? 'via l’application' }}.</p>
        @endif
        <p>Paiement Mobile Money (Wave / Orange Money / MTN / Moov) via GeniusPay — fonds séquestrés jusqu'à validation par code PIN à la remise physique.</p>
    </div>

    <div class="footer">
        Document généré automatiquement par Djassa Online le {{ now()->format('d/m/Y à H:i') }} · En cas de litige, le code PIN fait foi. Ne communiquez jamais votre code PIN au téléphone ou par message.
    </div>
</body>
</html>
