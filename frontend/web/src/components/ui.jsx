import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

/* ---------- Spinner ---------- */
export function Spinner({ size = 22, className = '' }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-[3px]  border-t-djassa-red ${className}`}
      style={{ width: size, height: size }}
      aria-label="Chargement"
    />
  );
}

/* ---------- Skeletons ---------- */
export function ProductCardSkeleton() {
  return (
    <div className="djassa-card">
      <div className="skeleton aspect-[4/5] w-full rounded-[5px]" />
      <div className="space-y-2 p-3">
        <div className="skeleton h-4 w-4/5" />
        <div className="skeleton h-3 w-2/3" />
        <div className="skeleton h-5 w-1/2" />
      </div>
    </div>
  );
}

/* ---------- État vide (flat line-art bichrome + accent rouge) ---------- */
export function EmptyState({ title, hint, action, art = 'default', icon: Icon }) {
  const artMap = {
    default: <DefaultEmptyArt />,
    search: <SearchArt />,
    wishlist: <WishlistArt />,
    box: <BoxArt />,
    message: <MessageArt />,
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      <div className="flex h-36 w-48 items-center justify-center">
        {Icon ? <Icon size={56} strokeWidth={1.6} className="text-djassa-red" /> : (artMap[art] ?? artMap.default)}
      </div>
      <p className="font-spacegrotesk font-bold text-djassa-black">{title}</p>
      {hint && <p className="max-w-xs text-sm text-djassa-black/70">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

function DefaultEmptyArt() {
  return (
    <svg viewBox="0 0 200 160" className="h-full w-full" fill="none" aria-hidden="true">
      <circle cx="100" cy="80" r="52" stroke="#121212" strokeWidth="3" strokeDasharray="10 8" opacity="0.35" />
      <circle cx="100" cy="80" r="30" stroke="#121212" strokeWidth="3" opacity="0.55" />
      <path d="M100 62v36M100 98l-12-12M100 98l12-12" stroke="#121212" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.75" />
      <circle cx="148" cy="46" r="10" fill="#780000" />
      <path d="M145 46l2.2 2.2L152.5 43" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchArt() {
  return (
    <svg viewBox="0 0 200 160" className="h-full w-full" fill="none" aria-hidden="true">
      <circle cx="88" cy="72" r="40" stroke="#121212" strokeWidth="6" opacity="0.75" />
      <line x1="118" y1="102" x2="152" y2="136" stroke="#121212" strokeWidth="7" strokeLinecap="round" />
      <path d="M72 66c4-10 14-16 24-15" stroke="#121212" strokeWidth="5" strokeLinecap="round" opacity="0.5" />
      <circle cx="150" cy="42" r="9" fill="#780000" />
    </svg>
  );
}

function WishlistArt() {
  return (
    <svg viewBox="0 0 200 160" className="h-full w-full" fill="none" aria-hidden="true">
      <path d="M60 30h80l-8 26H68L60 30Z" stroke="#121212" strokeWidth="5" strokeLinejoin="round" />
      <path d="M72 62h56l-6 62H78l-6-62Z" stroke="#121212" strokeWidth="5" strokeLinejoin="round" />
      <path d="M92 84h16M92 102h16" stroke="#121212" strokeWidth="4" strokeLinecap="round" opacity="0.5" />
      <circle cx="150" cy="44" r="13" fill="#780000" />
      <path d="M144.5 44l4 4 7-8.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BoxArt() {
  return (
    <svg viewBox="0 0 200 160" className="h-full w-full" fill="none" aria-hidden="true">
      <path d="M100 20 L160 52 L160 110 L100 142 L40 110 L40 52 L100 20Z" stroke="#121212" strokeWidth="5" strokeLinejoin="round" />
      <path d="M100 20 L160 52 L100 84 L40 52" stroke="#121212" strokeWidth="5" strokeLinejoin="round" opacity="0.6" />
      <line x1="100" y1="84" x2="100" y2="142" stroke="#121212" strokeWidth="5" opacity="0.6" />
      <circle cx="162" cy="34" r="11" fill="#780000" />
    </svg>
  );
}

function MessageArt() {
  return (
    <svg viewBox="0 0 200 160" className="h-full w-full" fill="none" aria-hidden="true">
      <path d="M40 40h120v64H92l-26 22v-22H40V40Z" stroke="#121212" strokeWidth="5" strokeLinejoin="round" />
      <path d="M64 66h72M64 84h48" stroke="#121212" strokeWidth="4" strokeLinecap="round" opacity="0.5" />
      <circle cx="160" cy="34" r="10" fill="#780000" />
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
        className={`relative w-full ${wide ? 'sm:max-w-xl' : 'sm:max-w-md'} max-h-[92vh] overflow-y-auto rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] shadow-2xl animate-[sheetIn_.32s_cubic-bezier(.22,1,.36,1)]`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-white/95 px-5 py-4 backdrop-blur">
          <h3 className="font-spacegrotesk font-extrabold text-djassa-black">{title}</h3>
          <button onClick={onClose} className="rounded-[5px] p-1.5 text-djassa-black/70 hover:bg-djassa-cloud" aria-label="Fermer">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="sticky bottom-0 bg-white/95 px-5 py-3 backdrop-blur">{footer}</div>}
      </div>
      <style>{`@keyframes sheetIn { from { transform: translateY(48px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }`}</style>
    </div>
  );
}

/* ---------- Countdown de Vente Flash ---------- */
export function FlashCountdown({ targetIso, className = '' }) {
  const [label, setLabel] = useState('--:--:--');
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    const tick = () => {
      const total = Math.max(0, Math.floor((new Date(targetIso).getTime() - Date.now()) / 1000));
      const h = String(Math.floor(total / 3600)).padStart(2, '0');
      const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
      const s = String(total % 60).padStart(2, '0');
      setLabel(`${h}:${m}:${s}`);
      setUrgent(total > 0 && total < 600);
    };
    tick();
    const t = window.setInterval(tick, 1000);
    return () => window.clearInterval(t);
  }, [targetIso]);

  return <span className={`tabular-nums font-spacegrotesk font-extrabold ${urgent ? 'flash-urgent' : ''} ${className}`}>{label}</span>;
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
          className="h-16 w-14 rounded-[5px] bg-djassa-gray/15 text-center font-spacegrotesk text-2xl font-extrabold text-djassa-black outline-none transition focus:ring-2 focus:ring-djassa-red/25"
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
      className={`inline-flex shrink-0 items-center justify-center rounded-[5px] font-spacegrotesk font-bold text-white ${bg} ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
