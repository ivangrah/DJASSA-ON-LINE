import { gsap } from 'gsap';
import { playDeleteWhoosh, playUpdateTick } from './soundEffects';

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function animateDeleteExit(el) {
  if (!el) return Promise.resolve();
  playDeleteWhoosh();
  if (reduced()) return Promise.resolve();

  return new Promise((resolve) => {
    const h = el.offsetHeight;
    gsap.killTweensOf(el);
    gsap.set(el, { height: h, overflow: 'hidden' });
    const tl = gsap.timeline({ onComplete: resolve });
    tl.to(el, { backgroundColor: 'rgba(120,0,0,0.06)', duration: 0.08, ease: 'power1.out' })
      .to(el, { x: 20, opacity: 0, duration: 0.25, ease: 'power2.in' }, '+=0.02')
      .to(el, { height: 0, paddingTop: 0, paddingBottom: 0, marginTop: 0, marginBottom: 0, borderWidth: 0, duration: 0.22, ease: 'power2.inOut' }, '-=0.05');
  });
}

export function highlightUpdated(el, { pillText = 'Mis à jour' } = {}) {
  if (!el) return;
  playUpdateTick();
  if (reduced()) {
    el.classList.add('djassa-updated-flash');
    window.setTimeout(() => el.classList.remove('djassa-updated-flash'), 1200);
    return;
  }

  gsap.killTweensOf(el);
  gsap.fromTo(el, { backgroundColor: 'rgba(16,185,129,0.15)', scale: 1.01 }, { backgroundColor: 'rgba(16,185,129,0)', scale: 1, duration: 1.2, ease: 'power2.out', clearProps: 'backgroundColor,transform' });

  // Temporary pill - for TR, attach to last TD; else attach to element itself.
  const isTr = el.tagName === 'TR';
  const host = isTr ? (el.querySelector('td:last-child') || el.querySelector('td') || el) : (el.querySelector('[data-update-pill-host]') || el);
  if (host && host instanceof HTMLElement) {
    const pill = document.createElement('span');
    pill.textContent = pillText;
    pill.className = 'djassa-update-pill';
    Object.assign(pill.style, {
      display: 'inline-flex', marginLeft: '0.5rem', padding: '0.1rem 0.45rem', borderRadius: '5px',
      fontSize: '10px', fontWeight: '800', background: 'rgba(16,185,129,0.14)', color: '#065F46',
      verticalAlign: 'middle', pointerEvents: 'none',
    });
    host.appendChild(pill);
    gsap.fromTo(pill, { opacity: 0, y: -4 }, { opacity: 1, y: 0, duration: 0.18, ease: 'power2.out' });
    gsap.to(pill, { opacity: 0, y: -4, delay: 1.0, duration: 0.25, onComplete: () => pill.remove() });
  }
}

export const highlightUpdatedRow = highlightUpdated;
export function useRowExitAnimation() { return { animateDeleteExit }; }
