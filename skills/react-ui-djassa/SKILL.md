---
name: react-ui-djassa
description: Applique la charte graphique Djassa Online (accent #780000, encre #121212, surfaces #F6F6F6 et #EFEFEF, Space Grotesk pour les titres, DM Sans pour le corps, icônes Lucide, GSAP sobre) au frontend web React/Vite/Tailwind et au mobile Expo. À utiliser pour créer ou modifier un composant, une page, un écran, un style, un token de couleur, une police, un bouton, une carte, un état vide, un squelette de chargement ou une page d'erreur, et pour auditer le code contre les interdits (#E11D48, #E60023, glow, glassmorphism, dégradés violets ou bleus, Google Fonts). Ne pas utiliser pour la logique métier, l'API, la base de données ou le séquestre.
---

# Charte Djassa Online — frontend web et mobile

## Source de vérité

La charte **version active** de Djassa Online prévaut sur tout autre skill de design, document historique ou maquette. En cas d'écart, suis le code et l'`AGENTS.md` du dépôt.

## Tokens (jamais de valeur en dur dans les composants)

| Token | Valeur | Usage |
|---|---|---|
| `--accent` | `#780000` | Accent principal, fonds de boutons |
| `--ink` | `#121212` | Encre, texte, fonds sombres |
| `--white` | `#FFFFFF` | Blanc, texte sur accent |
| `--surface-1` | `#F6F6F6` | Surface claire |
| `--surface-2` | `#EFEFEF` | Surface secondaire |
| `--success` | un seul vert lisible avec texte blanc (ex. `#1B7F46`) | Succès, jamais several verts |

- Une erreur se signale par **une icône et un message**, pas seulement par une couleur.
- Le rouge `#780000` est **interdit comme couleur de texte sur fond sombre** (contraste ~1,6:1). Il s'utilise en fond de bouton avec texte blanc.

## Typographie

- Titres : **Space Grotesk 700**, `letter-spacing: -0.03em` à partir de 24 px.
- Corps : **DM Sans 400 / 500 / 700**, interligne 1,4, 16 px minimum sur mobile.
- Polices `.woff2` auto-hébergées (latin + latin-ext), `font-display: swap` ; aucun appel Google Fonts.
- Échelle : 12 / 14 / 16 / 20 / 24 / 32 / 40 / 56 px.
- Montants : `Intl.NumberFormat('fr-FR')`, chiffres tabulaires, espace insécable.
- Pas d'italique, pas de tracking large sur les petits textes, pas de dégradé de texte.

## Composants

- `border-none` par défaut ; hiérarchie par fond, espacement et typographie, pas par bordures ou ombres lourdes.
- Coins arrondis, grille de **8 px**, cibles tactiles ≥ 44 px.
- Lucide est la seule source d'icônes : **24 px**, trait 2 px, jamais moins de 16 px à l'écran.
- Séparation par surfaces et espacement, pas par bordures.
- Squelettes qui reprennent la structure des cartes, jamais de spinner nu.
- États vides, 403, 404, 500 et hors-ligne prévus dès la création.
- Modale de confirmation pour toute action destructive, jamais `window.confirm`.

## Motion

- GSAP sobre : **un mouvement principal par écran**, entrées 300–450 ms, sorties 0,5× plus courtes.
- `prefers-reduced-motion` respecté.
- Animer `transform` / `opacity` uniquement.
- Three.js / Rive réservés aux moments signature, pas à la décoration courante.

## Interdits

- `#E11D48`, `#E60023`, verts citron ou olive.
- Dégradés violets ou bleus, glow / bloom, glassmorphism (`backdrop-filter`).
- Fond crème + serif, polices distantes.
- Valeurs de couleur en dur dans les composants.

## État du code

Le code actif est déjà aligné : 123 occurrences de `#780000`, `Space Grotesk` + `DM Sans` chargées dans `index.html`, 0 occurrence des anciens tokens `#E11D48` / `#E60023`. `DESIGN_SYSTEM_SUMMARY.md` reste une doc historique à rafraîchir.

## Performance & production — règles 1–13 et 29

Référentiel complet dans `AGENTS.md` (section 6). Checklist applicable :

1. Squelettes reproduisant la structure des cartes/dashboards, jamais de spinner nu.
2. WebP/AVIF + `loading="lazy"` et `decoding="async"` sous la ligne de flottaison.
3. Polices auto-hébergées `.woff2`, graisses 400/500/600/700, aucun appel Google Fonts bloquant.
4. Code splitting par route : `React.lazy()` + `Suspense`, chunks lourds isolés via `manualChunks` dans `vite.config.js`.
5. Virtualisation `@tanstack/react-virtual` pour catalogue infini, transactions et fils de messagerie.
6. Zéro re-render inutile : `React.memo`, `useMemo`, `useCallback`, contextes cloisonnés (Auth, Cart).
7. Debounce 300 ms sur la recherche catalogue avant appel API.
8. Déduplication des requêtes + verrou anti-double-clic sur `POST /escrow/checkout` (TanStack Query).
9. Optimistic UI avec rollback : favoris/souhaits, panier, lecture de message.
10. Streaming IA par token (SSE / `ReadableStream`) si une aide à la rédaction est intégrée.
11. Scripts tiers différés après `window.load` ou en `defer`.
12. Pages d'erreur dédiées 403 (dont Pro expiré), 404, 500, hors-ligne, charte `#780000`, `border-none`.
13. Qualité terrain : Core Web Vitals (RUM) + tests CPU 4× / Fast 3G sur smartphone d'entrée de gamme.
29. Montée en charge multi-instances derrière l'API Gateway + répartition du trafic.

## Méthode

1. Audit : `grep -rniE "E11D48|E60023|backdrop-filter|fonts.googleapis|linear-gradient|box-shadow.*0 0" frontend/` puis tableau fichier / problème / correctif.
2. Correction par lots : tokens → polices → composants → pages.
3. Vérification : `cd frontend/web && npm run build` (chunk principal < 150 Ko), contraste ≥ 4,5:1, navigation clavier, parcours navigateur sans erreur console.
