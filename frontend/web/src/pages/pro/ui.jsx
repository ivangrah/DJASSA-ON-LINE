import { Package } from 'lucide-react';

/** En-tête de page — eyebrow rouge, titre Jakarta, action à droite. */
export function PageHead({ eyebrow, title, subtitle, action }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <p className="font-spacegrotesk text-[9px] font-extrabold uppercase tracking-[0.2em] text-djassa-red">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 font-spacegrotesk text-[26px] font-extrabold leading-tight tracking-tight sm:text-[32px]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-djassa-black/50">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** Carte statistique du dashboard. */
export function StatCard({ icon: Icon, label, value, hint, tone = 'light' }) {
  const dark = tone === 'dark';
  return (
    <div
      className={`relative overflow-hidden rounded-[5px]  p-4 ${
        dark
          ? ' bg-djassa-black border-solid border-[0.5px] border-[rgba(255,255,255,0.12)] text-white'
          : ' bg-white text-djassa-black'
      }`}
    >
      {dark && (
        <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-[5px] bg-djassa-red/30 blur-2xl" aria-hidden="true" />
      )}
      <div className={`relative flex h-9 w-9 items-center justify-center rounded-[5px] ${dark ? 'bg-white/10 text-djassa-red' : 'bg-djassa-red/10 text-djassa-red'}`}>
        <Icon size={17} />
      </div>
      <p className="relative mt-3 font-spacegrotesk text-[24px] font-extrabold leading-none tracking-tight">{value}</p>
      <p className={`relative mt-1 text-[10px] font-semibold uppercase tracking-wide ${dark ? 'text-white/45' : 'text-djassa-black/45'}`}>
        {label}
      </p>
      {hint && <p className={`relative mt-1.5 text-[10px] ${dark ? 'text-white/40' : 'text-djassa-black/40'}`}>{hint}</p>}
    </div>
  );
}

/** Petit badge d'état. */
export function TinyBadge({ children, tone = 'gray' }) {
  const tones = {
    gray: 'bg-djassa-cloud text-djassa-black/60',
    red: 'bg-djassa-red/10 text-djassa-red',
    dark: 'bg-djassa-black text-white',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-800',
    sky: 'bg-sky-50 text-sky-700',
    outline: '  text-djassa-black/55',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-[5px] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${tones[tone] ?? tones.gray}`}>
      {children}
    </span>
  );
}

/** Vignette produit carrée. */
export function ProductThumb({ article, className = 'h-14 w-14' }) {
  return (
    <div className={`${className} shrink-0 overflow-hidden rounded-[5px] bg-djassa-cloud border-solid border-[0.5px] border-[rgba(18,18,18,0.08)]`}>
      {article?.image_principale ? (
        <img src={article.image_principale} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-djassa-black/25">
          <Package size={20} />
        </div>
      )}
    </div>
  );
}

/** Panneau blanc standard du dashboard. */
export function Panel({ title, hint, action, children, className = '' }) {
  return (
    <section className={`rounded-[5px]   bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] p-4 shadow-card sm:p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            {title && <h2 className="font-spacegrotesk text-[15px] font-extrabold tracking-tight">{title}</h2>}
            {hint && <p className="mt-0.5 text-[10.5px] text-djassa-black/45">{hint}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
