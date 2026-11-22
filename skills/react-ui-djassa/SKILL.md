---
name: react-ui-djassa
description: Applique le design system de Djassa Online sur le web (React/Vite) et le mobile (Expo) — palette #780000 / #121212 / #FFFFFF, Space Grotesk + DM Sans, composants border-none, icônes >= 16px, GSAP et Three.js. Utiliser pour toute création ou refonte d'écran.
---

# Design System Djassa (cible)

## Palette

| Rôle | Hex |
|---|---|
| Accent principal (rouge bordeaux) | `#780000` |
| Encre / fond sombre | `#121212` |
| Blanc | `#FFFFFF` |

## Typographie

- **Titres** : `Space Grotesk`
- **Corps** : `DM Sans`
- Pas d'italique, pas de tracking large sur les petits textes, pas de dégradé de texte.

## Composants

- `border-none` par défaut ; la hiérarchie vient du fond, de l'espacement et de la typographie, pas des bordures.
- Icônes : une seule source (Lucide), **taille minimale 16px**, stroke 1.5–2.
- Espacements sur grille de 4px ; valeurs identiques pour éléments identiques.
- Mouvement : GSAP (durée courte, easing sobre), `prefers-reduced-motion` respecté. Three.js/Rive uniquement pour les moments signature, jamais pour décorer.

## État du code

Le code actif est **déjà aligné** : 123 occurrences de `#780000`, `Space Grotesk` + `DM Sans` chargées dans `index.html`, 0 occurrence des anciens tokens `#E11D48/#E60023`. `DESIGN_SYSTEM_SUMMARY.md` reste une doc historique à rafraîchir.

## Performance & production — règles 1–13 et 29

Le référentiel complet est dans `AGENTS.md`. Checklist frontend obligatoire :

1. Squelettes calqués sur la structure réelle des cartes/dashboards — **jamais** de spinner nu.
2. Images WebP/AVIF + `loading="lazy"` + `decoding="async"` sous la ligne de flottaison.
3. Polices `Space Grotesk` / `DM Sans` auto-hébergées en `.woff2`, graisses 400/500/600/700 uniquement ; **aucun** appel Google Fonts bloquant.
4. `React.lazy()` + `Suspense` par route ; Three.js / GSAP isolés via `manualChunks` dans `vite.config.js`.
5. Virtualisation (`@tanstack/react-virtual`) catalogue, transactions, messagerie.
6. `React.memo` / `useMemo` / `useCallback` ; contextes Auth/Cart cloisonnés.
7. Debounce **300 ms** sur la recherche catalogue.
8. Déduplication TanStack Query + verrou anti-double-clic sur `POST /escrow/checkout`.
9. Optimistic UI avec rollback (favoris, panier, lecture de message).
10. Streaming IA token par token (SSE / `ReadableStream`) si une aide IA est branchée.
11. Scripts tiers chargés après `window.load` ou en `defer`.
12. Pages d'erreur dédiées 403 / 404 / 500 / Offline, charte `#780000`, `border-none`.
13. Tests obligatoires CPU 4× + Fast 3G, mesure RUM des Core Web Vitals sur smartphones d'entrée de gamme.
