# Djassa Online — Application Mobile

React Native (Expo SDK 58) · React Navigation (Bottom Tabs + Stack) · Expo SecureStore · Lucide React Native · @react-native-community/netinfo? non — REST axios direct · même API `/api/v1` que le web (Laravel :8899).

## Démarrage

> API Laravel sur **127.0.0.1:8899** (port 8000 occupé sur la machine) ; sur Android émulateur, utilisez `10.0.2.2:8899` (détection automatique via `Platform.OS`). Surcharge : `EXPO_PUBLIC_API_URL`.

```bash
cd mobile-app
npm install
npm run web      # preview navigateur (react-native-web) → http://127.0.0.1:8081
npx expo start   # Expo Go / émulateur (scan QR ou touche `a`/`i`)
npx expo export --platform web   # bundles web de production (dist/)
```

## Écrans (maquette `../docs/maquette_2.jpeg`)

| Écran | Navigation | Contenu |
|---|---|---|
| **Accueil (Feed)** | Onglet Accueil | En-tête noir logo `Djassa Online` + point rouge, recherche, onglets `Tout / Seconde Main & Troc / Boutiques Neuves`, rayons, **bannière Ventes Flash avec compte à rebours temps réel**, grille 2 colonnes (badges TROC / BOUTIQUE PRO / VENTE FLASH), pull-to-refresh + infinite scroll |
| **Fiche produit** | `Article` (modal) | Galerie + thumbnails, badges, vendeur/boutique (badge vérifié), **Proposer un troc** (modale : mes articles publiés + soulte FCFA) et **Acheter** (récap → GeniusPay, en mode MOCK : « Simuler le paiement réussi ») |
| **Mur des Souhaits** | Onglet Souhaits | Fil des besoins + publier un souhait (modale : titre, budget, rayon, accepte troc) |
| **Publier (+)** | Bouton central rouge `+` | Tunnel 3 étapes — Photos (expo-image-picker + compression WebP via expo-image-manipulator) → Détails (catégorie, état, specs) → Mode (`Vente / Troc / Mixte`) avec récap sombre |
| **Messages** | Onglet Messages | Inbox (badge non lus) + fil : bulles, **carte de troc interactive** (Accepter / Refuser / Contre-offre FCFA), offre de prix formelle |
| **Mon Djassa** | Onglet Mon Djassa | Carte profil sombre (avatar initiales, score confiance), **portefeuille FCFA**, onglets Annonces / Ventes / Achats, **Valider PIN** à la remise (overlay coche animée) |
| **Dashboard Pro** | Bouton Dashboard Pro | Stats dark : CA libéré, encaissé séquestré, ventes totales, note clients, stock critique ≤ 2, ventes flash actives |
| **Login / Register** | Gate non authentifiée | Google (mode dev sans clé) + e-mail/mot de passe, bascule Particulier / Boutique Pro |

## Démo recommandée

1. Connexion `koffi@djassaonline.ci` / `password` → feed → tap la **Meuleuse Makita** → **Proposer un troc** (sa visseuse + 15 000 FCFA)
2. Onglet Messages → la carte de troc apparaît avec les actions Vendeur (Accepter / Contre-offre 20 000)
3. Acheter la perceuse Bosch avec `adjoua@djassaonline.ci` → paiement MOCK → lien Mailpit (http://127.0.0.1:8025) : e-mail avec le **PIN**
4. Repasser en `bakayoko@djassaonline.ci` → Mon Djassa → Mes ventes → **Valider PIN** (`1234`) → overlay « Fonds libérés ! »

## Design system (identique web)

Rouge `#E11D48` / `#E60023` · Noir `#121212` · Blanc · gris `#F5F5F5` — `Plus Jakarta Sans` (titres/prix) + `Inter` (corps) — bottom tab bar avec **bouton `+` rouge central**, badges métier identiques au web.
