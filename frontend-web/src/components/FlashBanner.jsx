import { useEffect, useMemo, useRef } from 'react';
import { gsap } from 'gsap';
import { Zap, Clock } from 'lucide-react';
import { formatFCFA } from '../lib/format';
import { FlashCountdown } from './ui';
import { Link } from 'react-router-dom';

/**
 * Bannière Ventes Flash (boutiques pro) — dégradé rouge, compte à rebours temps réel.
 */
export default function FlashBanner({ articles }) {
  const shimmerRef = useRef(null);

  // Le flash le plus imminent — dérivé pendant le rendu
  const nearest = useMemo(() => {
    if (!articles?.length) return null;
    return [...articles].sort((a, b) => new Date(a.flash_fin_at) - new Date(b.flash_fin_at))[0];
  }, [articles]);

  useEffect(() => {
    const node = shimmerRef.current;
    if (!node) return undefined;
    const tween = gsap.fromTo(node, { x: '-100%' }, { x: '240%', duration: 2.4, repeat: -1, ease: 'power2.inOut' });
    return () => tween.kill();
  }, []);

  if (!nearest) return null;

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-djassa-red via-djassa-red-strong to-[#FF5A3C] p-[1px] shadow-pop" aria-label="Vente flash en cours">
      {/* Shimmer balayant */}
      <div ref={shimmerRef} aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-1/4 bg-white/25 blur-2xl" />

      <div className="relative flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[#C1112E] via-djassa-red-strong to-[#E8472A] px-4 py-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15">
          <Zap size={22} className="fill-yellow-300 text-yellow-300" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-jakarta text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/85">Ventes flash boutiques</p>
          <p className="truncate font-jakarta text-sm font-extrabold text-white">{nearest.titre}</p>
          <p className="text-[11px] font-semibold text-white/80">{formatFCFA(nearest.prix_flash)} <span className="line-through opacity-70">{formatFCFA(nearest.prix)}</span></p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="flex items-center gap-1 rounded-full bg-djassa-black/40 px-2.5 py-1 text-[10px] font-bold text-yellow-300">
            <Clock size={11} strokeWidth={3} /> <FlashCountdown targetIso={nearest.flash_fin_at} />
          </span>
          <Link to={`/article/${nearest.id}`} className="text-[10px] font-jakarta font-bold uppercase tracking-wide text-white underline underline-offset-2 decoration-white/50 hover:decoration-white">
            J'en profite
          </Link>
        </div>
      </div>
    </section>
  );
}
