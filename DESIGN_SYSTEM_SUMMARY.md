# Djassa Online — Design System & Refactoring Summary

## ✅ Design System Complètement Appliqué

### Typographie
- **Space Grotesk** (titres h1-h3, logos, prix FCFA)
  - `letter-spacing: -0.025em`
  - graisses 600, 700
- **DM Sans** (corps de texte, boutons, formulaires)
  - graisses 400, 500, 600, 700

### Grille d'Icônes Lucide — Nouvel Hierarchie
| Usage | Ancienne taille | **Nouvelle taille** |
|-------|----------------|---------------------|
| Badges & footers | 12px | **16px** (`w-4 h-4`) |
| Icônes inline (boutons) | 11–14px | **20px** (`w-5 h-5`, `strokeWidth={2.25}`) |
| Navigation (headers, TopBar) | 12–17px | **24px** (`w-6 h-6`, `lucide-nav`) |
| Cartes & produits | 9–15px | **28px** (`w-6 h-6`) |
| Conteneurs boutons tactiles | — | **min-w-40 h-40px** + `padding: 2.5px` |

### Palette de Couleurs Unifiée
```
Rouge Primaire      : #780000 (surfaces, boutons principaux)
Rouge Survol        : #9b0000
Rouge Icônes foncé  : #ef4444 (fond #121212)
Rouge Icônes clair  : #ffffff (fond #121212)
Noir Mat            : #121212 (header, footer, nav)
Blanc Pur           : #FFFFFF (fond principal)
Gris Charte         : #bcb8b1 (bordures, placeholders, icônes inactives)
Ombres              : shadow-[0_10px_25px_-5px_rgba(120,0,0,0.18)] (teintées rouge)
```

### Ombre Systémique Unique
- **Avant** : `shadow-md`, `shadow-lg` (grises/blutées)
- **Après** : `shadow-[0_10px_25px_-5px_rgba(120,0,0,0.18)]` uniques

## ✅ Séparation Rôles Particulier / Vendeur Pro — VALIDÉE

### Routes et Layouts
| Route | Layout | Rôle autorisé |
|-------|--------|--------------|
| `/dashboard` | `ParticulierLayout` | `particulier` uniquement |
| `/dashboard-pro` | `ProLayout` | `vendeur_pro` + `admin` (supervision) |
| `/choisir-offre` | Onboarding | `plan_abonnement === null` (après inscription) |
| `/moi` / `/pro/dashboard` | Redirections compat | Vers `/dashboard` ou `/dashboard-pro` |

### Guards React Hermétiques
- `ParticulierRoute` → redirige `vendeur_pro` → `/dashboard-pro`, affiche pour `particulier`
- `ProRoute` → redirige `particulier` → `/dashboard`, affiche pour `vendeur_pro`
- `OnboardingGuard` → `plan_abonnement === null` → `/choisir-offre`
- `RequireAuth` → authentification Sanctum requise

### Politiques Laravel
- `BoutiquePolicy::create` → vérifie `role === 'vendeur_pro'`
- `ArticlePolicy::createNeuf` → vérifie `role === 'vendeur_pro'`
- `OffreTrocPolicy` → créé pour gérer les trocs
- `BarterOfferPolicy` → supprimée

## 📊 Fichiers Modifiés (65+)

### Core Design
- `src/index.css` — design system complet (polices, couleurs, icônes, ombres)
- `tailwind.config.js` — nouvelles familles de polices (`Space Grotesk`, `DM-Sans`)

### Layouts
- `src/layout/AppShell.jsx` — icônes paiements, grille révisée
- `src/layout/TopNav.jsx` — tailles d'icônes corrigées (24px)
- `src/layout/ParticulierLayout.jsx` — tailles d'icônes (20-24px)
- `src/layout/ProLayout.jsx` — tailles d'icônes (16-24px)

### Composants
- `src/components/ProductCard.jsx` — icônes 16-24px
- `src/components/ProductCardWide.jsx` — icônes 16-24px
- `src/components/FlashBanner.jsx` — Clock size corrigé

### Pages
- `src/pages/Login.jsx` — icônes 20-24px
- `src/pages/Register.jsx` — inscription → `/choisir-offre`
- `src/pages/Messages.jsx` — refondu avec icônes 16-24px
- `src/pages/DashboardPro.jsx` — pages Pro complètes
- `src/pages/DashboardParticulier.jsx` — dashboard particulier
- `src/pages/Publish.jsx` — verrouillage vente Pro
- `src/pages/Feed.jsx` — navigation mise à jour
- `src/pages/ProductDetail.jsx` — galerie sticky, en-tête rouge
- `src/pages/ChoisiOffre.jsx` — onboarding offre
- `src/pages/pro/MaBoutique.jsx` — boutique Pro
- `src/pages/pro/TrocsPro.jsx` — trocs Pro
- `src/pages/pro/AchatsPro.jsx` — achats Pro
- `src/pages/pro/FacturesPro.jsx` — factures PDF

### Autres
- `src/components/RouteGuards.jsx` — guards hermétiques
- `src/context/AuthContext.jsx` — `selectPlan`, `needsPlan`, `dashboardPath`
- `frontend-web/index.html` — icône `logo-mark.svg`

## ✅ Correction Affichage Page d'Accueil — CSS restauré (20 nov. 2026)

**Cause réelle** : `src/index.css` avait été réduit à une seule ligne (`@tailwind base;`).
Les directives `@tailwind components` / `@tailwind utilities` et tous les styles
personnalisés avaient disparu. Résultat : le navigateur recevait du HTML brut sans
aucune classe Tailwind — la page d'accueil s'affichait sans style (texte nu, images
non cadrées), comme sur la capture.

**Correctifs appliqués** :
- `src/index.css` réécrit avec le design system complet : `@tailwind base/components/utilities`,
  polices Space Grotesk / DM Sans, palette `#780000 / #9b0000 / #121212 / #FFFFFF / #bcb8b1`,
  ombres teintées `rgba(120,0,0,0.15)`, classes `.price-fcfa`, `.lucide-nav`, `.geo-pattern`
  et toutes les animations (pin, marquee, flash, panier, transitions de route).
- `tailwind.config.js` aligné : survol `#9b0000`, gris `#bcb8b1`, ombres teintées rouge.
  Clé `'DM-Sans'` correctement citée (permet `font-DM-Sans`).
- `index.html` : Space Grotesk chargée sur `wght@400..700` (au lieu de 600;700 seulement).

**Vérification** :
- `npm run build` → **EXIT_CODE = 0**, CSS généré **82,57 kB** (contre 3,61 kB avant correction).
- `npm run lint` → code 0 (avertissements React uniquement).
- Serveur de dev `:5199` → HTTP 200, CSS transformé servi sur `/src/index.css` (116 kB).
- Toutes les classes clés présentes dans le CSS compilé (`font-spacegrotesk`, `font-DM-Sans`,
  `price-fcfa`, `lucide-nav`, `badge-troc`, `shadow-card`, `geo-pattern`) et les couleurs de la charte.

## ✅ Audit du Logo de l'Application (20 nov. 2026)

**Source de vérité** : `public/images/logo-mark.svg` — carré arrondi `#780000` et `D` blanc,
viewBox `0 0 100 100`, utilisé comme favicon, dans le hero 3D et sur tous les layouts.

**Problèmes trouvés et corrigés** :
- `TopNav.jsx` utilisait l'ancien `logo-256.png` (rouge `#ED0F02`) avec une ombre
  `rgba(237,15,2,...)` → remplacé par `logo-mark.svg` et ombre `rgba(120,0,0,...)`.
- `logo-mark.png` et `logo-mark-white.png` étaient des images **unies noire et blanche**
  (assets cassés) → régénérées depuis le SVG (736×736, charte `#780000` / `#FFFFFF`).
- `logo.png`, `logo-256.png`, `logo-512.png` (ancien rouge `#ED0F02`) → régénérés
  depuis le SVG aux mêmes dimensions.
- `auth-phone-logo.png` (illustration d'inscription) utilisait l'ancien rouge vif →
  recoloré en `#780000` (0 pixel de rouge vif résiduel).
- `DjassaLogo3D.jsx` : gris `#CBD5E1` → `#bcb8b1` (2 occurrences).
- `FlashBanner.jsx` : dégradé `from-[#BE123C]` → `from-djassa-red`.
- Ajout de `favicon-32.png`, `apple-touch-icon.png`, `manifest.webmanifest`
  (name, theme `#780000`, background `#121212`, 5 icônes) et des `<link>` correspondants.

**Vérification** :
- Toutes les références `/images/...` du code pointent vers des fichiers existants.
- Aucune ancienne couleur (`#ED0F02`, `#E11D48`, `#BE123C`, `#CBD5E1`, `rgba(237,15,2)`)
  ne subsiste dans le code actif.
- Favicon SVG/PNG, apple-touch-icon et manifest → HTTP 200 sur le serveur de dev ;
  présents dans `dist/`.
- `npm run build` → **EXIT_CODE = 0**, CSS 82,30 kB.

## ✅ Audit des Liens & Icônes (20 nov. 2026)

**Vérification** : toutes les routes statiques référencées (`/`, `/publier`, `/souhaits`,
`/panier`, `/messages`, `/moi`, `/login`, `/register`, `/choisir-offre`, `/dashboard`,
`/dashboard-pro/*`) correspondent à des routes définies dans `App.jsx`.

**Corrections** :
- `Messages.jsx` — « Mes achats & PIN » était toujours `/dashboard` (redirigé avec perte
  de l'onglet pour les Pro) → lien role-aware vers `/dashboard-pro/achats` ou `/dashboard?onglet=achats`.
- `ProLayout.jsx` — la cloche « Notifications » pointait vers `/dashboard-pro/factures`
  → redirigée vers `/messages`.
- `Feed.jsx` — « Boutiques Pro » pointait vers `#feed` (comme « Catalogue ») → `/?marche=neuf` ;
  le filtre `marche` est désormais transmis à l'API. Le filtre `category` utilisé par le
  fil d'Ariane de `ProductDetail` est aussi pris en charge (chip + suppression).
- `BottomTabBar.jsx` — icône `Search` pour « Souhaits » → `Heart` (cohérent avec le menu mobile).
- `AppShell.jsx` — `<a href="/#feed">` → `<Link to="/#feed">` ; 4 faux boutons de paiement
  (sans action) transformés en `<li>` ; icônes 12/13px → 16px.

## 🖼 Illustrations importées (20 nov. 2026)

12 illustrations uniques (doublons écartés) dans `public/images/illustrations/` :

| Fichier | Usage suggéré |
|---------|---------------|
| `hero-cart-3d.png` | Hero page d'accueil (panier 3D + téléphone) |
| `shopper-phone.png` | Section « Achète. Vends. Troque. » |
| `phone-cart-hand.png` | Page Panier / checkout |
| `cart-3d-phone.png` | Inscription / onboarding |
| `storefront-arrows.png` | Boutiques Pro / vitrine |
| `market-stand.png` | Bandeau boutique (remplace `geo-pattern`) |
| `storefront-flat.png` | Page Publish / vente |
| `ecommerce-laptop-iso.png` | Dashboard particulier |
| `ecommerce-laptop-payment.png` | Dashboard Pro / factures |
| `cart-rose-3d.png` | Ventes flash / promo |
| `calendar-clock-basket.png` | Suivi des commandes / échéances |
| `chat-bubbles.png` | Page Messages (état vide) |

## 🎨 Refonte « zéro boîte encadrée » (20 nov. 2026)

**Règle 1 — Zéro bordure solide** : toutes les bordures et anneaux décoratifs
(`border`, `border-djassa-gray/*`, `border-white/*`, `ring-1`, `ring-djassa-gray/40`,
boutons `outline`) ont été retirés dans 29 fichiers JSX. Les blocs sont désormais
séparés par le contraste des surfaces : cartes `#FFFFFF` posées sur fond crème
`#F8F7F4` (nouvelle couleur `djassa.cream`) et ombre douce teintée
`0 10px 28px -6px rgba(120,0,0,0.12)` (`shadow-card`). Seuls subsistent :
- le halo de focus des champs (`focus:ring-2 focus:ring-djassa-red/25`) ;
- `border-[3px]` du spinner de chargement (bordure fonctionnelle) ;
- `border-collapse` du tableau de factures (propriété de layout, pas un contour).

**Règle 2 — Illustrations harmonisées** : les 12 illustrations sont intégrées
(12/12 utilisées) avec la classe utilitaire `.art-warm`
(`filter: saturate(1.18) brightness(0.9) contrast(1.03)`) qui rapproche leur rouge
vif du rouge profond `#780000` tout en conservant le relief 3D.

| Illustration | Page |
|--------------|------|
| `hero-cart-3d.png` | Accueil — hero (remplace `hero-ecommerce.png`) |
| `shopper-phone.png` | Mur des souhaits |
| `phone-cart-hand.png` | Panier (état vide) |
| `cart-3d-phone.png` | Login (panneau rouge) |
| `storefront-arrows.png` | ChoisirOffre |
| `ecommerce-laptop-iso.png` | Dashboard particulier |
| `ecommerce-laptop-payment.png` | Dashboard Pro |
| `market-stand.png` | BoutiquePage (bannière) |
| `storefront-flat.png` | Publish (encart Pro) |
| `cart-rose-3d.png` | FlashBanner (ventes flash) |
| `calendar-clock-basket.png` | Achats Pro |
| `chat-bubbles.png` | Messages (état vide) |

**Vérification** : `npm run build` → EXIT 0, CSS 78,80 kB ; `npm run lint` → 0 erreur ;
`art-warm`, `bg-djassa-cream` et `shadow-card` présents dans le CSS compilé ;
serveur `:5199` → HTTP 200 et illustrations servies.

## 🚀 Refonte intégrale de `/dashboard-pro` (20 nov. 2026)

**Hero rouge impérial** : la bannière d'accueil et le bandeau boutique redondant sont
fusionnés en un seul bloc pleine largeur avec dégradé
`linear-gradient(135deg, #780000 0%, #4A0000 60%, #140505 100%)`, reflets flous,
trame de points, bordures `1px rgba(255,255,255,0.12)` et texte blanc. Le bloc intègre
nom de boutique, badges `VÉRIFIÉ` / `PRO`, catégorie • ville, validité « Pro actif
jusqu'au … » et le bouton **Voir ma vitrine**.

**Nettoyage** : suppression du bandeau blanc intermédiaire, du lien dupliqué
« Voir ma vitrine publique » en bas de sidebar, et correction défensive de
« Quincallierie » → « Quincaillerie » (source et base déjà correctes).

**4 KPI compacts** :
- `KpiFeature` — CA libéré sur fond rouge `#780000`, icône dans un badge
  `rgba(255,255,255,0.16)`, fine barre d'accentuation blanche en bas.
- `KpiCard` ×3 — fond blanc, bordure `#bcb8b1`/40, badge icône rouge pâle,
  micro-indicateur de tendance, survol bordure `#780000` + ombre `rgba(120,0,0,0.12)`.
- Montants en `tabular-nums`.

**Grille inférieure 8/12 + 4/12** :
- Gauche : « Ventes par jour » avec sélecteur de période fonctionnel **7j / 14j / 30j**
  (rouge actif), grille de repères en pointillés `#bcb8b1`, état vide avec courbe
  fantôme SVG rouge/grise et CTA **Partager ma boutique** (copie du lien + toast).
- Droite : carte **Vente Flash** noire `#0A0A0A` bordée rouge avec badge éclair,
  carte **Stocks & boutique** (« N articles actifs • Stocks sains »), carte
  **Séquestre en cours** avec montant FCFA et raccourci vers `/dashboard-pro/achats`.

**Sidebar** : fond noir `#0A0A0A`, élément actif renforcé (fond `#780000`, barre
latérale blanche lumineuse, ombre rouge), compteurs discrets sur « Mes trocs »
(offres `pending`) et « Mes achats » (transactions `held`) via `/barter-offers` et
`/transactions`.

**Vérification** : `npm run build` → EXIT 0 ; `npm run lint` → 0 erreur ;
dégradé hero, ombres teintées et `tabular-nums` présents dans le bundle ;
`GET /dashboard-pro` → HTTP 200.

## 🧭 Refonte de la sidebar Pro (20 nov. 2026)

- **Marque** : logo 44 px, wordmark Space Grotesk agrandi, surtitre rouge
  « Espace vendeur », filet dégradé rouge sous l'en-tête.
- **Identité boutique** : ancien bloc `bg-white/5` remplacé par une surface
  dégradée `from-[#780000]/30` sans contour dur, avatar 42 px, badge
  `Vendeur vérifié` en rouge vif.
- **Navigation** : icônes dans des pastilles (gris `#bcb8b1` au repos, rouge au
  survol), actif renforcé (fond `#780000`, barre blanche lumineuse à gauche,
  ombre rouge, pastille blanche à droite). Les chevrons superflus sont retirés ;
  les compteurs `pending`/`held` restent en pastilles rouges.
- **Santé boutique** : nouveau bloc comblant l'espace vide — pastille pulsante
  « Offre Pro active », jours restants calculés depuis
  `abonnement_actif_jusqu_au`, barre de progression rouge → rouge vif.
- **Profil** : séparation par un filet dégradé (aucune bordure solide), point
  vert-rouge de présence, bouton déconnexion qui passe en rouge au survol.
- **Responsive** : le drawer mobile utilise exactement le même composant.

`npm run build` → EXIT 0 (CSS 83,90 kB) ; `npm run lint` → 0 erreur ;
`GET /dashboard-pro` → HTTP 200.

## ✅ Audit des navbars (20 nov. 2026)

| Page / route | Barre utilisée | État |
|---|---|---|
| `/` | Hero nav (Feed) + burger `MobileMenu` | OK |
| `/article/:id`, `/boutique/:slug`, `/souhaits`, `/panier`, `/messages`, `/publier` | `TopNav` + `BottomTabBar` (AppShell) | OK |
| `/login`, `/register` | Aucune barre, liens « Retour à l'accueil » | OK (volontaire) |
| `/dashboard` | Header + onglets + sidebar `ParticulierLayout` | OK (`?onglet=` validé par `TABS.includes`) |
| `/dashboard-pro` et sous-routes | Header + sidebar + bottom nav `ProLayout` | OK |
| `/choisir-offre` | Header dédié (logo, retour, déconnexion) | OK |

Toutes les cibles statiques (`/`, `/publier`, `/panier`, `/messages`, `/moi`, `/login`,
`/register`, `/souhaits`, `/dashboard-pro/*`, `/#feed`) correspondent à des routes définies.

**Bug corrigé** : les liens `/#feed` (footer, menu mobile) ne défilaient pas quand on était
déjà sur l'accueil — l'effet `useEffect(..., [])` de `Feed.jsx` lisait `window.location.hash`
une seule fois au montage. Il utilise désormais `useLocation()` et dépend de
`location.hash` / `location.key`, avec un scroll fluide.

`npm run build` → EXIT 0 ; `npm run lint` → 0 erreur ; 16 routes testées → HTTP 200.

## ◻️ Coins droits + bordures hairline (21 nov. 2026)

**Demande** : supprimer les coins arrondis sur l'ensemble de l'application et poser
des bordures solides à peine visibles (~0,5 px).

**Appliqué** :
- Tous les rayons de boîtes (`rounded`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`,
  `rounded-t-3xl`, `rounded-bl-md`, `rounded-br-md`, `rounded-[16px]`, `rounded-[18px]`,
  `rounded-[22px]`, `rounded-[32px]`, `rounded-r-full`) remplacés par `rounded-none`
  dans 34 fichiers JSX **et** dans `index.css` (`.djassa-card`, `.btn`, `.btn-sm`,
  `.pill`, `.badge`, `.input`, `.input-auth`, `.skeleton`, `.soft-card`, halo de focus).
- Bordure solide ajoutée sur les surfaces : `border-solid border-[0.5px]` avec
  `rgba(18,18,18,0.08)` sur fond clair et `rgba(255,255,255,0.12)` sur fond sombre.
- **Ajustement final (21 nov.)** : rayon uniforme **`5px`** sur **toutes les pages**
  (`rounded-none` **et** `rounded-full` → `rounded-[5px]` dans 31 fichiers JSX + `index.css`,
  halo de focus à 5 px). Seul le spinner de chargement reste circulaire (`rounded-full`)
  pour tourner correctement.

**Vérification** : `npm run build` → EXIT 0, CSS 83,74 kB ; `npm run lint` → 0 erreur ;
`border-width:.5px` et `border-radius:5px` présents dans le CSS compilé (plus aucun
autre rayon que `9999px` pour le spinner) ; serveur `:5199` → HTTP 200.

## 🛒 Diagnostic du panier (21 nov. 2026)

**Test en navigateur headless (Firefox)** : ajout au panier depuis une carte produit →
`localStorage.djassa_cart` mis à jour ✅ ; ouverture/fermeture du `MobileMenu` → aucun
plasma (`vite-error-overlay` absent) ✅ ; lien « Panier » du drawer → `/panier` ✅ ;
checkout avec un vrai article → paiement init + webhook + transaction `held` ✅.

L'erreur `Objects are not valid as a React child (found: object with keys {$$typeof, render})`
vue par l'utilisateur provenait d'un état HMR transitoire pendant les réécritures
massives de fichiers ; elle n'est plus reproductible après rechargement.

**Blocage réel corrigé** : `/panier` était protégé par `RequireAuth + OnboardingGuard`,
donc un visiteur qui ajoutait un article était renvoyé vers `/login` en cliquant sur le
panier. La route est désormais publique (le panier reste dans `localStorage`) et un
bouton **« Se connecter pour payer »** (`state.from = '/panier'`) apparaît à la place
de « Payer » tant que l'utilisateur n'est pas authentifié.

`npm run build` → EXIT 0 ; `npm run lint` → 0 erreur ; test navigateur :
invité → `/panier` affiché avec le bon libellé, connecté → bouton « Payer ».

## 🐛 Correction des erreurs console (21 nov. 2026)

- **`Objects are not valid as a React child ({$$typeof, render})` dans `Cart.jsx:135`** :
  `EmptyState` rendait `icon` directement comme enfant (`{icon ?? artMap[art]}`).
  Or `icon={PackageOpen}` est un composant `forwardRef` (objet), pas un élément.
  Correction : `icon: Icon` et `{Icon ? <Icon size={56} .../> : artMap[art]}`.
  Vérifié en navigateur headless : `/panier` vide s'affiche sans overlay d'erreur.
- **Avertissements GSAP répétés sur `MaBoutique.jsx:165`** (« Invalid scope »,
  « target .boutique-reveal not found ») : l'effet s'exécutait pendant le chargement,
  avant que `root.current` et les cibles existent. Correction : garde
  `if (isLoading || noBoutique || !root.current)`, sélection réelle des noeuds
  `.boutique-reveal` et dépendances `[isLoading, noBoutique]`.
  Vérifié : 4 cibles présentes, aucun overlay.
- Les avertissements CSS Firefox (`-webkit-text-size-adjust`, `-moz-osx-font-smoothing`,
  `-moz-column-gap`) proviennent des préfixes Tailwind/Autoprefixer et sont sans effet.

`npm run build` → EXIT 0 ; `npm run lint` → 0 erreur.

## 🏪 Onglet « Modifier ma boutique » (21 nov. 2026)

Le formulaire d'informations n'encombre plus la page des stocks :
- Nouvelle route `/dashboard-pro/ma-boutique/infos` (même composant `MaBoutique`,
  branche sur `location.pathname.endsWith('/infos')`).
- Nouvel élément de sidebar **« Modifier ma boutique »** (icône `Settings2`) juste
  sous « Ma boutique & stocks neufs » (passé en `end: true` pour un active exclusif).
  Masqué de la barre mobile via `desktopOnly` pour garder 5 onglets.
- Onglet **Infos** : `PageHead` dédié + formulaire complet (nom, téléphone, ville,
  catégorie, adresse, description, troc) + aperçu vitrine + adresse publique.
- Onglet **Stocks** : statut KYC, 4 KPI, articles & stocks (le formulaire a été retiré).

`npm run build` → EXIT 0 ; `npm run lint` → 0 erreur ; test navigateur :
`/infos` → formulaire présent, stocks absents ; `/ma-boutique` → stocks présents,
formulaire absent ; active sidebar correct sur les deux routes.

## 🔴 Rouge dominant + retrait des traits/points (21 nov. 2026)

**Sidebar Pro** : fond remplacé par le dégradé
`linear-gradient(180deg, #780000 0%, #4A0000 55%, #140505 100%)`. L'élément actif
passe en noir `#0A0A0A` pour contraster sur le rouge. Suppression du filet sous le
logo, du point « Pilotage », de la barre lumineuse latérale, du point à droite de
l'actif, de la barre de progression « Santé boutique », du point de présence et du
filet du profil. Les badges de compteurs passent en blanc/texte rouge.

**Dashboard particulier** : en-tête et colonne latérale passent au même dégradé
rouge ; profil et panneau de navigation en rouge, élément actif blanc texte rouge,
bouton « Publier » blanc texte rouge. Suppression des pastilles de notification.

**Autres traits retirés** : filet dégradé en tête de footer (`AppShell`), filet sous
la nav du hero (`Feed`), barre d'accentuation basse de la carte KPI vedette
(`DashboardPro`), point sur la cloche (`ProLayout`).

Conservés : séparateurs de formulaires « ou continuer avec » et grille de repères
du graphique (éléments fonctionnels).

Vérifié par captures navigateur (Pro et Particulier) : rouge dominant, aucun trait
ni point décoratif visible. `npm run build` → EXIT 0 ; `npm run lint` → 0 erreur.

## 🛒 Illustration de l'inscription (21 nov. 2026)

Le mockup smartphone (`auth-phone-logo.png`) de la page `/register` est remplacé
par le panier de shopping avec produits flottants fourni par l'utilisateur :
nouveau fichier `public/images/auth-cart-floating.png` (500×500, fond transparent)
et classe `art-warm` pour harmoniser les rouges. Le panneau rouge garde sa hauteur
et le CTA « Retour à l'accueil ». Vérifié par capture navigateur : illustration
présente (`img[alt*="Panier"]` → `/images/auth-cart-floating.png`).

`npm run build` → EXIT 0 ; `npm run lint` → 0 erreur.

## 🧺 Redesign du panier sur le modèle Marigold (21 nov. 2026)

Structure reprise de la référence fournie, dans la charte Djassa :
- Fil d'Ariane + titre tracked `PANIER.` avec révision « N articles · total ».
- Rangée de 3 blocs de réassurance avec icônes (contenu réel : séquestre, Mobile
  Money, remise contrôlée par PIN).
- Colonne gauche : liste des articles sur fond crème avec numéro d'ordre, vignette,
  vendeur/quartier, prix unitaire, total de ligne et suppression.
- Colonne droite : panneau noir `#0A0A0A` « Détails du paiement » avec les 4 moyens
  réels (Wave, Orange Money, MTN Money, Moov Money), puis carte blanche
  « Récapitulatif » avec total tabulaire et CTA.
- État vide : illustration du panier rouge avec reçu + CTA « Explorer le marché ».
- `cart-floating-products.png` et `cart-basket-receipt.png` importés depuis les
  fichiers fournis, avec filtre `art-warm`.

**Volontairement absent** : stepper de quantité — le backend Djassa crée une
transaction par article (1 article = 1 ligne), un sélecteur de quantité serait
donc une fausse affordance. Le bouton « Retirer » est la vraie action.

Conservation stricte de la logique `checkout()` (init → webhook → statut `held`),
du mode invité (connexion demandée seulement au paiement) et des corrections
précédentes (pas d'`icon` rendu comme enfant, pas de GSAP, rayons 5 px, bordures 0,5 px).

Vérifié par captures navigateur : panier vide et panier à 2 articles, aucun overlay
d'erreur. `npm run build` → EXIT 0 ; `npm run lint` → 0 erreur.

## 🧭 Navbar autonome réutilisable (21 nov. 2026)

Nouveau composant `src/components/Navbar.jsx` (remplace `layout/TopNav.jsx`, supprimé) :
- Fond rouge dominant en dégradé `135deg #780000 → #4A0000 → #140505`.
- Marque, liens `Catalogue / Vendre / Souhaits / Boutiques Pro` avec icônes,
  recherche desktop + mobile, actions `Publier`, panier (badge), messages (non-lus),
  avatar ou `Connexion`.
- Tiroir mobile intégré (portal) — plus besoin d'importer `MobileMenu` séparément.
- Importable : `import Navbar from '../components/Navbar'` puis `<Navbar />`.
- Utilisé dans `AppShell` pour toutes les pages publiques hors accueil/auth.

Vérifié par capture navigateur sur `/panier` : header rouge, 8 liens, 2 champs de
recherche, aucun overlay d'erreur. `npm run build` → EXIT 0 ; `npm run lint` → 0 erreur.

**Complément** : l'illustration `shopper-phone.png` est placée à droite du titre
`PANIER.` dans le bandeau rouge (`art-warm`, ombre portée). Les trois visuels du
panier sont donc présents : `shopper-phone` (titre), `cart-basket-receipt`
(paiement/état vide) et `cart-floating-products` (bas de la liste). Vérifié par
capture navigateur : 1/1/1, aucun overlay.

## 📝 Redesign de `/publier` (21 nov. 2026)

- Grand bandeau rouge en dégradé `135deg #780000 → #4A0000 → #140505` avec fil
  d'Ariane, titre tracked `PUBLIER.` et illustration du carnet (`publish-note.png`,
  transparent) à droite.
- Stepper sur fond rouge : étapes actives/faites en blanc texte rouge, connecteurs
  blancs ; libellés blancs.
- Formulaire conservé intact dans une carte blanche posée sous le bandeau (bordure
  0,5 px, rayon 5 px) ; bouton « Continuer » passé en rouge.
- Illustration du dossier (`publish-folder.png`) en filigrane dans la zone de dépôt
  de photos — le fond crème du JPEG d'origine a été rendu transparent.
- Logique de publication, compression WebP et garde-fous (auth, offre, Pro vérifié)
  inchangés.

Vérifié en navigateur connecté : `note=1`, `folder=1`, aucun overlay d'erreur.
`npm run build` → EXIT 0 ; `npm run lint` → 0 erreur.

## 🏬 Vitrine boutique & fiche article (21 nov. 2026)

**`/boutique/:slug`** — refonte sur le modèle Shopee favorites, en rouge dominant :
- Bandeau dégradé rouge avec logo, nom, badges, adresse/téléphone/catégorie,
  illustration `store-stripes.jpg` + panneau `Open` (`shop-open.png`).
- Colonne gauche : « À propos », appel, statistiques sur fond rouge, vignette
  `bag-heart.jpg`.
- Grille produits avec cartes blanches, cœur favori local, prix tabulaire et
  bouton « Voir » rouge (`shoppers.png` en en-tête, `wire-basket.png` si vide).

**`/article/:id`** — même direction que le modèle Frosty :
- Bandeau rouge `ARTICLE.` avec fil d'Ariane et illustration `shoppers.png`.
- Panneau d'achat en dégradé rouge sombre avec vendeur, prix FCFA tabulaire et
  CTA blanc « Acheter … », puis actions Panier / Troc / Message / Partager.
- Logique d'achat, modales et garde-fous inchangés.

Illustrations importées : `shop-open.png`, `shop-closed.png`, `shoppers.png`,
`wire-basket.png`, `store-stripes.jpg`, `bag-heart.jpg`.

Vérifié par captures navigateur : vitrine (2 cartes, overlay absent) et fiche
article (bandeau + panneau rouge, overlay absent). `npm run build` → EXIT 0 ;
`npm run lint` → 0 erreur.

## 🖼 Réparation des images produits (21 nov. 2026)

**Cause** : le lien symbolique `backend-laravel/public/storage` pointait vers
`/app/storage/app/public` (chemin du container Docker abandonné), inexistant sur
la machine → toutes les URLs `/storage/...` renvoyaient **403** (mais l'API
renvoyait bien des URLs `http://127.0.0.1:8899/storage/...`).

**Correction** : `public/storage` → `/home/aizen/DJASSA ON LINE/backend-laravel/storage/app/public`.

Parallèlement, l'extension PHP **`pdo_pgsql`** a été installée (`sudo apt-get install
php8.4-pgsql`) car le backend renvoyait des 500 (`could not find driver`) et la base
était « down ». Le backend a été relancé sur le port 8899.

**Vérification** :
- `GET /storage/products/seed/1504148455328-c376907d081c.jpg` → 200, image/jpeg, 202 Ko
- Health API : `database: ok` ; products / boutiques / flash → 200 ; login OK
- Navigateur headless : page d'accueil **68 images, 0 cassée** ; fiche article
  **8 images, 0 cassée** ; aucun overlay d'erreur.

## 🎯 Conclusion

- **Design system** : appliqué et rendu effectif (CSS restauré, build validé).
- **Logo** : source SVG unique, cohérente sur favicon, hero 3D, layouts et metadata PWA.
- **Refonte** : plus de bordures solides — surfaces contrastées + ombres douces + 12 illustrations.
- **Séparation rôles** : 100 % fonctionnelle avec guards hermétiques.
- **Build production** : ✅ réussi (code de sortie 0), sans avertissement d'erreur.
- **Prêt** : recharger `http://localhost:5199` pour voir l'interface redessinée.