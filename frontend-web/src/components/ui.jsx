import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

/* ---------- Spinner ---------- */
export function Spinner({ size = 22, className = '' }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-[3px] border-djassa-red/20 border-t-djassa-red ${className}`}
      style={{ width: size, height: size }}
      aria-label="Chargement"
    />
  );
}

/* ---------- Skeletons ---------- */
export function ProductCardSkeleton() {
  return (
    <div className="djassa-card">
      <div className="skeleton aspect-[4/5] w-full rounded-none" />
      <div className="space-y-2 p-3">
        <div className="skeleton h-4 w-4/5" />
        <div className="skeleton h-3 w-2/3" />
        <div className="skeleton h-5 w-1/2" />
      </div>
    </div>
  );
}

/* ---------- État vide (flat line-art bichrome + accent rouge) ---------- */
export function EmptyState({ title, hint, action, icon }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      <div className="flex h-36 w-48 items-center justify-center">{icon ?? <DefaultEmptyArt />}</div>
      <p className="font-jakarta font-bold text-djassa-black">{title}</p>
      {hint && <p className="max-w-xs text-sm text-djassa-slate">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

function DefaultEmptyArt() {
  return (
    <svg viewBox="0 0 200 160" className="h-full w-full" fill="none" aria-hidden="true">
      <circle cx="100" cy="80" r="52" stroke="#121212" strokeWidth="3" strokeDasharray="10 8" opacity="0.35" />
      <circle cx="100" cy="80" r="30" stroke="#121212" strokeWidth="3" opacity="0.55" />
      <path d="M100 62v36M100 98l-12-12M100 98l12-12" stroke="#121212" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.75" transform="rotate(0 100 80)" />
      <circle cx="148" cy="46" r="10" fill="#E11D48" />
      <path d="M145 46l2.2 2.2L152.5 43" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------- Modal / Bottom sheet (mobile-first) ---------- */
export function Modal({ open, onClose, title, children, wide = false, footer }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title ?? 'Boîte de dialogue'}>
      <button className="absolute inset-0 bg-djassa-black/60 backdrop-blur-[2px]" onClick={onClose} aria-label="Fermer" />
      <div
        ref={panelRef}
        className={`relative w-full ${wide ? 'sm:max-w-xl' : 'sm:max-w-md'} max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl animate-[sheetIn_.32s_cubic-bezier(.22,1,.36,1)]`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-djassa-black/5 bg-white/95 px-5 py-4 backdrop-blur">
          <h3 className="font-jakarta font-extrabold text-djassa-black">{title}</h3>
          <button onClick={onClose} className="rounded-full p-1.5 text-djassa-slate hover:bg-djassa-cloud" aria-label="Fermer">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="sticky bottom-0 border-t border-djassa-black/5 bg-white/95 px-5 py-3 backdrop-blur">{footer}</div>}
      </div>
      <style>{`@keyframes sheetIn { from { transform: translateY(48px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }`}</style>
    </div>
  );
}

/* ---------- Countdown de Vente Flash ---------- */
export function FlashCountdown({ targetIso, className = '' }) {
  const [label, setLabel] = useState('--:--:--');

  useEffect(() => {
    const tick = () => {
      const total = Math.max(0, Math.floor((new Date(targetIso).getTime() - Date.now()) / 1000));
      const h = String(Math.floor(total / 3600)).padStart(2, '0');
      const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
      const s = String(total % 60).padStart(2, '0');
      setLabel(`${h}:${m}:${s}`);
    };
    tick();
    const t = window.setInterval(tick, 1000);
    return () => window.clearInterval(t);
  }, [targetIso]);

  return <span className={`tabular-nums font-jakarta font-extrabold ${className}`}>{label}</span>;
}

/* ---------- Saisie PIN à 4 chiffres (remise physique) ---------- */
export function PinInput({ onComplete, autoFocus = true }) {
  const [digits, setDigits] = useState(['', '', '', '']);
  const refs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const handle = (idx, value) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[idx] = value;
    setDigits(next);
    if (value && idx < 3) refs[idx + 1].current?.focus();
    if (next.every((d) => d !== '')) onComplete?.(next.join(''));
  };

  const handleKey = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) refs[idx - 1].current?.focus();
  };

  useEffect(() => {
    if (autoFocus) refs[0].current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus]);

  return (
    <div className="flex items-center justify-center gap-3">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={refs[i]}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={d}
          onChange={(e) => handle(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          className="h-16 w-14 rounded-2xl border-2 border-djassa-black/15 bg-djassa-mist text-center font-jakarta text-2xl font-extrabold text-djassa-black outline-none transition focus:border-djassa-red focus:ring-4 focus:ring-djassa-red/15"
          aria-label={`Chiffre ${i + 1}`}
        />
      ))}
    </div>
  );
}

/* ---------- Avatar initiales (fallback charte : blanc sur noir/rouge) ---------- */
export function Avatar({ name, size = 40, tone = 'black', className = '' }) {
  const initials = (name ?? '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  const bg = tone === 'red' ? 'bg-djassa-red' : 'bg-djassa-black';

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-jakarta font-bold text-white ${bg} ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
