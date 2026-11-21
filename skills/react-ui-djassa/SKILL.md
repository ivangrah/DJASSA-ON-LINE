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
