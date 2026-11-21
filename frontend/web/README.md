# Djassa Online — Frontend Web

SPA React 19 (JavaScript / Vite) · Tailwind CSS 3 · GSAP · TanStack Query · React Router 6 · Lucide Icons.

## Démarrage

> L'API Laravel écoute sur **127.0.0.1:8899** (port 8000 occupé sur cette machine).
> La dev-server Vite écoute sur **127.0.0.1:5199** (port 5173 occupé) et **proxifie `/api`** → pas de CORS en dev.

```bash
cd frontend-web
npm install
npm run dev      # http://127.0.0.1:5199
npm run build    # build de production (dist/)
npm run lint     # oxlint
```

Variables (`.env.local`) :
- `VITE_API_URL` — URL complète de l'API en prod (défaut : `/api/v1` proxifié)
- `VITE_GOOGLE_CLIENT_ID` — Google Cloud OAuth Client ID Web (sinon bouton « Google » en mode dev : `dev.testeur`)

## Routes (App Shell Djassa — TopNav desktop + Bottom Tab Bar mobile)

| Route | Écran |
|---|---|
| `/` | **Feed hybride** — onglets `Tout | Seconde Main & Troc | Boutiques Neuves`, rayons, **Ventes Flash** (carrousel + countdown GSAP), recherche full-text, infinite scroll |
| `/article/:id` | **Fiche produit** — galerie, CTA « Acheter » / « Proposer un troc » (modale inventaire + soulte) |
| `/boutique/:slug` | **Vitrine Boutique Pro** — bannière, badge vérifié, stats, catalogue neuf |
| `/souhaits` | **Mur des Souhaits** — publication + réponse avec un article |
| `/messages` | **Messagerie** — inbox + fil (cartes de troc interactives : accepter / refuser / contre-offre · offre de prix formelle) |
| `/publier` | **Tunnel de publication 3 étapes** — Photos (compression WebP client) → Détails & État (specs JSONB dynamiques) → Prix & Mode (Vente / Troc / Mixte) |
| `/moi` | **Mon Djassa** — profil, portefeuille FCFA, mes annonces, mes transactions (bouton « Valider PIN » vendeur), reçus PDF |
| `/pro/dashboard` | **Dashboard Boutique Pro** (dark) — CA, encaissé séquestré, stock critique ≤ 2, histogrammes ventes/jour, lancement de Ventes Flash |
| `/login` `/register` | Auth — Google Cloud OAuth ou email/mot de passe (inscription Particulier ou Boutique Pro) |

## Design system

- Rouge primaire **#780000** · Noir **#121212** · Blanc **#FFFFFF** · gris `#F8FAFC`
- **Plus Jakarta Sans** (titres, prix) · **Inter** (corps) — Google Fonts
- Badges `TROC` (rouge) / `BOUTIQUE PRO` (noir) / `VENTE FLASH` (rouge→orange), cartes blanches sur fond gris, squelettes de chargement, états vides flat line-art, toasts noirs, bottom tab bar avec **bouton `+` rouge central**.
- GSAP : shimmer Ventes Flash, cascade des cartes à l'affichage, apparition succès publication.

## Flux de démo recommandés

1. Connexion `koffi@djassaonline.ci` / `password` → feed → ouvrir la **Meuleuse Makita** (boutique Quincaillerie Moderne) → **Proposer un troc** (sa visseuse + soulte) → conversation créée avec carte de troc.
2. Ouvrir `bakayoko@djassaonline.ci` dans un second onglet → `/messages` → accepter ou contre-offrir la carte.
3. Acheter la **Perceuse Bosch** avec `adjoua@djassaonline.ci` → « Payer via Mobile Money » → mode MOCK → « Simuler le paiement réussi » → ouvrir **Mailpit** (http://127.0.0.1:8025) : e-mail avec le **code PIN**.
4. Repasser en `bakayoko@` → `/moi` → onglet **Mes ventes** → **Valider PIN** → fonds libérés + reçu PDF.
5. Créer un souhait en `mariame@djassaonline.ci` puis publier un article correspondant en `koffi@` → notification automatique (Mur des Souhaits).
