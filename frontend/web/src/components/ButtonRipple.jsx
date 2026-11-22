import { useEffect } from 'react';
import { playButtonClick } from '../utils/soundEffects';

const ACTION_SELECTOR = 'button:not(:disabled), [role="button"]:not([aria-disabled="true"])';

function isActionButton(el) {
  if (!el) return false;
  if (el.closest('[data-no-ripple]')) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === 'button') return true;
  if (el.getAttribute('role') === 'button') return true;
  return false;
}

function isPrimaryAction(el) {
  const cls = ` ${el.className || ''} `;
  if (/btn-red|btn-black|btn-primary|bg-djassa-red|bg-\[#780000\]|bg-djassa-black|bg-\[#121212\]|bg-black/.test(cls)) return true;
  try {
    const bg = window.getComputedStyle(el).backgroundColor;
    const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (m) {
      const [r, g, b] = [Number(m[1]), Number(m[2]), Number(m[3])];
      // red #780000 or dark #121212/black
      if ((r > 90 && g < 40 && b < 40) || (r < 40 && g < 40 && b < 40)) return true;
    }
  } catch {}
  return false;
}

function rippleColor(el) {
  try {
    const bg = window.getComputedStyle(el).backgroundColor;
    const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (m) {
      const [r, g, b] = [Number(m[1]), Number(m[2]), Number(m[3])];
      const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      if (luminance < 0.55) return 'rgba(255, 255, 255, 0.18)';
    }
  } catch {}
  return 'rgba(120, 0, 0, 0.10)';
}

function addRipple(el, event) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const rect = el.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const size = Math.max(rect.width, rect.height) * 2;
  const x = (event.clientX ?? rect.left + rect.width / 2) - rect.left - size / 2;
  const y = (event.clientY ?? rect.top + rect.height / 2) - rect.top - size / 2;
  const ripple = document.createElement('span');
  ripple.className = 'djassa-ripple';
  ripple.style.width = `${size}px`;
  ripple.style.height = `${size}px`;
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  ripple.style.background = rippleColor(el);
  const prevPos = el.style.position;
  if (window.getComputedStyle(el).position === 'static') el.style.position = 'relative';
  const prevOverflow = el.style.overflow;
  if (window.getComputedStyle(el).overflow === 'visible') el.style.overflow = 'hidden';
  el.appendChild(ripple);
  const cleanup = () => {
    ripple.remove();
    el.style.position = prevPos;
    el.style.overflow = prevOverflow;
  };
  ripple.addEventListener('animationend', cleanup, { once: true });
  // Sécurité : si l'animation n'a pas lieu (onglet masqué, reduced-motion
  // basculé en direct), on ne laisse pas de styles inline résiduels.
  setTimeout(cleanup, 500);
}

export default function ButtonRipple() {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const onPointerDown = (e) => {
      const el = e.target.closest?.(ACTION_SELECTOR);
      if (!isActionButton(el) || reduced) return;
      el.classList.add('djassa-pressed');
    };
    const clearPress = (e) => {
      const el = e.target.closest?.(ACTION_SELECTOR);
      if (el) el.classList.remove('djassa-pressed');
      document.querySelectorAll('.djassa-pressed').forEach((n) => n.classList.remove('djassa-pressed'));
    };
    const onClick = (e) => {
      const el = e.target.closest?.(ACTION_SELECTOR);
      if (!isActionButton(el)) return;
      // sound only for action buttons (buttons/role=button, not passive text links)
      if (isPrimaryAction(el) || el.tagName.toLowerCase() === 'button' || el.getAttribute('role') === 'button') {
        playButtonClick();
      }
      if (isPrimaryAction(el)) addRipple(el, e);
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('pointerup', clearPress, true);
    document.addEventListener('pointercancel', clearPress, true);
    document.addEventListener('pointerleave', clearPress, true);
    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('pointerup', clearPress, true);
      document.removeEventListener('pointercancel', clearPress, true);
      document.removeEventListener('pointerleave', clearPress, true);
      document.removeEventListener('click', onClick, true);
    };
  }, []);

  return null;
}
