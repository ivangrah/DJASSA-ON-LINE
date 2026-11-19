---
name: motion-design
description: Use this skill for any animation, motion design, transition, micro-interaction, scroll effect, or visual polish work on the Djassa Online web app (frontend-web). Triggers on requests like "animer", "animation", "GSAP", "transition", "micro-interaction", "scroll", "parallax", "reveal", "hover", "motion design", "polish", "effet", "entrée", "sortie", "timeline", "ScrollTrigger", "pin", "scrub", "stagger", "ease", "durée", "keyframes", "CSS animation", "framer", "motion", "move", "bouger", "flottant", "floaty". Covers GSAP (already installed ^3.15.1), ScrollTrigger, Tailwind keyframes, React transitions, prefers-reduced-motion, and performance. Apply whenever adding or adjusting motion in frontend-web/src.
---

# Motion Design — Djassa Online

Stack motion : **GSAP 3.15.1** + **ScrollTrigger** (`gsap/ScrollTrigger`), **Tailwind** keyframes (index.css), CSS transitions. React 19, Vite. Tout se passe dans `frontend-web/src`.

## 1. Principes Djassa (à respecter)

- **Brand** : rouge vif `#ED0F02`/`#E60023`, noir `#121212`, crème `#F7F1E6`, blanc. Polices Sora (titres) + DM Sans (corps).
- **Ton** : marketplace ouest-africaine dynamique mais **propre et digné**. Pas de mouvement gratuit : chaque animation doit servir la compréhension ou le feedback.
- **L'utilisateur a explicitement demandé** que les illustrations du hero soient **statiques après leur entrée** ("stop les move chélou"). Pas de boucle flottante continue sauf demande explicite.
- **Reduced motion** : toujours respecter `prefers-reduced-motion: reduce` (voir §4).

## 2. Où placer le code

- **Entrées de page/section** : dans le composant, via `useLayoutEffect` + `gsap.context(() => {...}, scopeRef)` puis `ctx.revert()` au cleanup.
- **Scroll pinné / parallax** : `ScrollTrigger` importé depuis `gsap/ScrollTrigger`, enregistré avec `gsap.registerPlugin(ScrollTrigger)`.
- **Micro-interactions ponctuelles** (clic, hover) : Tailwind transitions (`transition-all duration-300`) ou classes CSS keyframes dans `index.css`.
- **Animations de page** : le shell utilise `.route-enter` (index.css) — ne pas empiler.

## 3. Patterns recommandés

### Entrée en cascade (stagger)
```jsx
const ctx = gsap.context(() => {
  gsap.from('[data-reveal]', {
    y: 28, opacity: 0, duration: 0.6, stagger: 0.08,
    ease: 'power3.out', clearProps: 'transform,opacity',
  });
}, scopeRef);
return () => ctx.revert();
```
- Utiliser des attributs `data-*` plutôt que des classes pour cibler (`data-hero`, `data-promo-*`, `data-card`).
- Toujours `clearProps` à la fin pour ne pas laisser d'inline styles qui cassent les hovers CSS.

### Masque de ligne (texte)
```jsx
<span className="block overflow-hidden">
  <span data-line className="block">Titre</span>
</span>
```
Animation : `gsap.from('[data-line]', { yPercent: 115, duration: 0.85, stagger: 0.14, ease: 'power4.out' })`.

### Pop d'un élément (badge, icône)
- `ease: 'back.out(1.7)'`, `scale: 0.7 → 1`, durée 0.45-0.55.

### Scroll pinné
```jsx
const tl = gsap.timeline({
  scrollTrigger: { trigger: scope, start: 'top top', end: '+=60%', pin: true, pinType: 'transform', scrub: 0.25, anticipatePin: 1 },
});
```
- `pinType: 'transform'` est **obligatoire** ici : le `AppShell` applique `.route-enter` (transform) sur `<main>`, ce qui casse le `position: fixed` natif du pin.
- Terminer par un `fromTo` sur un voile de couleur (crème `#F7F1E6`) pour une transition douce vers la section suivante.
- Progress bar : `scaleX` piloté dans `onUpdate`.

### Compteurs animés
```jsx
const obj = { v: 0 };
tl.to(obj, { v: target, duration: 1.3, ease: 'power2.out', onUpdate: () => {
  el.textContent = Math.round(obj.v).toLocaleString('fr-FR') + suffix;
} });
```
- Format FR : `toLocaleString('fr-FR')` puis remplacer `\u202f`/`\u00a0` par espace.

### Hover image (carrousel 4 vues)
- `setInterval` de 4000 ms au `mouseenter`, reset à l'index 0 au `mouseleave`, nettoyage dans le return de l'effet. Voir `ProductGallery.jsx`.

### Micro-interactions CSS (index.css)
- `.heart-pop`, `.cart-pop`, `.cart-badge-pop` : `animation: ... cubic-bezier(0.34, 1.8, 0.64, 1)`.
- Toujours `active:scale-95` sur les boutons rouges, `transition-all duration-200/300`.

## 4. Accessibilité & performance (obligatoire)

- **Reduced motion** : vérifier `window.matchMedia('(prefers-reduced-motion: reduce)').matches` et, si vrai, ne pas animer (garder l'état final naturel).
- **Nettoyage** : toujours `ctx.revert()` dans le return du `useLayoutEffect`. Les `ScrollTrigger` créés dans un `gsap.context` sont automatiquement détruits par `revert()`.
- **Portals** : tout overlay/menu rendu en portal (`createPortal`) échappe au pin (voir `MobileMenu.jsx`).
- **Ciblage** : préférer `data-*` aux classes CSS pour les sélecteurs GSAP (robuste au refactor).
- **Pas de `cards.slice()`** sur un NodeList → toujours `Array.from(...).slice()`.
- **Variables isolées** : dans chaque `gsap.context` callback, redéclarer les variables (`const scope = heroRef.current; const q = sel => scope.querySelectorAll(sel)`). Ne pas réutiliser celles d'un autre contexte.

## 5. Durées et easings de référence

| Type | Durée | Ease |
|---|---|---|
| Entrée titre (masque) | 0.85 | `power4.out` |
| Entrée illustration (pop) | 0.7-0.9 | `back.out(1.5-2)` |
| Entrée texte/CTA | 0.5-0.6 | `power3.out` / `back.out(1.7)` |
| Stagger cartes | 0.6-0.65 | `power3.out`, stagger 0.1-0.12 |
| Scroll scrub | 0.25-1 | `power1.in` / `power2.in` |
| Compteur | 1.2-1.3 | `power2.out` |
| Micro-interaction | 0.2-0.45 | `cubic-bezier(0.34, 1.8, 0.64, 1)` |

## 6. Checklist avant commit

- [ ] `npm run build` passe sans erreur.
- [ ] Pas de `cards.slice` / `NodeList.slice` non wrappé.
- [ ] `clearProps: 'all'` sur les entrées pour ne pas casser les hovers CSS.
- [ ] `prefers-reduced-motion` géré.
- [ ] Pas de boucle continue (`repeat: -1`) sauf demande explicite de l'utilisateur (il a déjà demandé d'arrêter les mouvements "chélou").
- [ ] Screenshot desktop + mobile vérifiés.
- [ ] Pas de "Invalid scope" en console (voir §4 portals).

## 7. Fichiers de référence dans le repo

- `frontend-web/src/pages/Feed.jsx` — hero pinné + entrée promo (timeline GSAP complète).
- `frontend-web/src/components/ProductGallery.jsx` — hover carrousel 4 vues.
- `frontend-web/src/components/MobileMenu.jsx` — drawer rendu en portal.
- `frontend-web/src/components/FlashBanner.jsx` — marquee infini (`repeat: -1`).
- `frontend-web/src/index.css` — keyframes `.heart-pop`, `.cart-pop`, `.flash-progress`.
- `frontend-web/tailwind.config.js` — keyframes `floaty`, `pulseDot`, `shimmer`.
