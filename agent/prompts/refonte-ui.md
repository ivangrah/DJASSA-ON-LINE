# Prompt standard — refonte d'écran

Contexte : Djassa Online, design system dans `skills/react-ui-djassa/`.

Demande : refondre l'écran `<ecran>` (`frontend/web/src/pages/...` ou `frontend/mobile/...`).

Procédure :
1. auditer l'existant (spacing, couleur, copy, type, layout, accessibilité) ;
2. proposer une direction (palette #780000, Space Grotesk + DM Sans, border-none, icônes ≥ 16px) **et attendre validation** ;
3. appliquer par passes : spacing → copy → type → layout → détails → motion ;
4. respecter `prefers-reduced-motion`, contrastes 4.5:1, labels et focus clavier ;
5. vérifier `npm run build` et rendre l'écran pour comparer.

Ne pas inventer de fonctionnalité ni de donnée. Conserver les rôles et les parcours Particulier / Pro.
