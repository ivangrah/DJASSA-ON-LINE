import { gsap } from 'gsap';
import { playCartPop } from '../utils/soundEffects';

const prefersReduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useFlyToCart() {
  return (sourceEl, imageUrl) => {
    const target = document.querySelector('[data-cart-target]');
    const bounceBadge = () => {
      const badge = document.querySelector('[data-cart-badge]');
      if (!badge) return;
      if (prefersReduced()) { gsap.set(badge, { scale: 1 }); return; }
      gsap.fromTo(badge, { scale: 1.45 }, { scale: 1, ease: 'elastic.out(1, 0.4)', duration: 0.6, overwrite: 'auto' });
    };

    playCartPop();
    if (!target || prefersReduced() || !sourceEl) { bounceBadge(); return; }

    const from = sourceEl.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    const clone = document.createElement(imageUrl ? 'img' : 'div');
    if (imageUrl) { clone.src = imageUrl; clone.alt = ''; clone.decoding = 'async'; }
    Object.assign(clone.style, {
      position: 'fixed', left: `${from.left}px`, top: `${from.top}px`,
      width: `${Math.max(40, from.width)}px`, height: `${Math.max(40, from.height)}px`,
      borderRadius: '8px', objectFit: 'cover', zIndex: '9999', pointerEvents: 'none',
      boxShadow: '0 10px 28px rgba(120,0,0,0.28)', background: '#fff', opacity: '0.95',
    });
    document.body.appendChild(clone);

    const dx = (to.left + to.width / 2) - (from.left + from.width / 2);
    const dy = (to.top + to.height / 2) - (from.top + from.height / 2);
    const arc = -Math.min(140, Math.abs(dx) * 0.2 + 70);

    gsap.to(clone, {
      duration: 0.72, x: dx, scale: 0.2, opacity: 0.4, ease: 'power2.inOut',
      onComplete() { clone.remove(); bounceBadge(); },
    });
    gsap.to(clone, { duration: 0.36, y: dy + arc, ease: 'power2.out' });
    gsap.to(clone, { duration: 0.36, y: dy, delay: 0.36, ease: 'power2.in' });
  };
}
