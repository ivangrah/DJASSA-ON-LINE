import { gsap } from 'gsap';

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function pulseHeart(el) {
  if (!el || reduced()) return;
  gsap.fromTo(el, { scale: 1.35 }, { scale: 1, duration: 0.45, ease: 'elastic.out(1, 0.45)', overwrite: 'auto' });
}

export function burstParticles(anchorEl, color = '#780000') {
  if (!anchorEl || reduced()) return;
  const r = anchorEl.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  for (let i = 0; i < 6; i++) {
    const p = document.createElement('span');
    const size = 4 + Math.random() * 4;
    const angle = (Math.PI * 2 * i) / 6;
    const dist = 14 + Math.random() * 10;
    Object.assign(p.style, {
      position: 'fixed', left: `${cx - size / 2}px`, top: `${cy - size / 2}px`,
      width: `${size}px`, height: `${size}px`, borderRadius: '999px', background: color,
      pointerEvents: 'none', zIndex: '9999',
    });
    document.body.appendChild(p);
    gsap.to(p, { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, opacity: 0, scale: 0.2, duration: 0.55, ease: 'power2.out', onComplete: () => p.remove() });
  }
}
