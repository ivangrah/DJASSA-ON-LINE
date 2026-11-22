import { useEffect, useLayoutEffect } from 'react';
import gsap from 'gsap';

/**
 * Entrée de page sobre et cohérente (Vague animations Djassa).
 * Anime les éléments marqués `data-reveal` (et optionnellement `data-reveal-stagger`)
 * avec un fade + légère montée, en cascade. Respecte prefers-reduced-motion.
 *
 * Usage :
 *   const scope = useRef(null);
 *   usePageReveal(scope);
 *   return <div ref={scope}>…<section data-reveal>…</section>…</div>;
 */
export function usePageReveal(scopeRef, options = {}) {
  const { y = 16, duration = 0.55, stagger = 0.07, ease = 'power3.out' } = options;

  useLayoutEffect(() => {
    const scope = scopeRef?.current;
    if (!scope) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const els = Array.from(scope.querySelectorAll('[data-reveal]'));
    if (!els.length) return;

    if (reduce) {
      els.forEach((el) => { el.style.opacity = '1'; el.style.transform = 'none'; });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from(els, {
        y, opacity: 0, duration, stagger, ease,
        clearProps: 'transform,opacity',
      });
    }, scope);

    return () => ctx.revert();
  }, [scopeRef, y, duration, stagger, ease]);

  useEffect(() => () => {}, []);
}