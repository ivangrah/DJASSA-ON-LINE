import { Package } from 'lucide-react';

/** En-tête de page — eyebrow rouge, titre Jakarta, action à droite. */
export function PageHead({ eyebrow, title, subtitle, action }) {
  const renderTitle = () => {
    if (typeof title === 'string' && title.includes('Djassa')) {
      const parts = title.split(/(Djassa\.?)/);
      return parts.map((part, i) =>
        /^Djassa\.?$/.test(part)
          ? <span key={i} className="text-[#780000]">{part}</span>
          : <span key={i}>{part}</span>
      );
    }
    return title;
  };

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <p className="font-sans text-[11px] font-bold uppercase tracking-[0.15em] text-[#780000]">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 font-display text-3xl font-extrabold leading-tight tracking-tight text-neutral-950 md:text-4xl">
          {renderTitle()}
        </h1>
        {subtitle && (
          <p className="mt-1 max-w-2xl font-sans text-sm font-normal leading-relaxed text-neutral-500">
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
  const renderValue = () => {
    if (typeof value === 'string') {
      const m = value.match(/^(.*?)(?:\s*FCFA\s*)$/);
      if (m) return <><span>{m[1].trim()}</span><span className={`ml-1.5 text-lg font-bold ${dark ? 'text-white/50' : 'text-neutral-500'}`}>FCFA</span></>;
      const m2 = value.match(/^FCFA\s*(.*)$/);
      if (m2) return <><span className={`mr-1.5 text-lg font-bold ${dark ? 'text-white/50' : 'text-neutral-500'}`}>FCFA</span><span>{m2[1].trim()}</span></>;
    }
    return value;
  };
  return (
    <div
      className={`relative overflow-hidden rounded-[5px] p-4 ${
        dark
          ? 'bg-djassa-black border-solid border-[0.5px] border-[rgba(255,255,255,0.12)] text-white'
          : 'bg-white text-djassa-black'
      }`}
    >
      {dark && (
        <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-[5px] bg-djassa-red/30 blur-2xl" aria-hidden="true" />
      )}
      <div className={`relative flex h-9 w-9 items-center justify-center rounded-[5px] ${dark ? 'bg-white/10 text-djassa-red' : 'bg-djassa-red/10 text-djassa-red'}`}>
        <Icon size={17} />
      </div>
      <p className={`relative mt-3 font-display text-2xl font-extrabold leading-none tracking-tight tabular-nums lg:text-3xl ${dark ? 'text-white' : 'text-neutral-950'}`}>{renderValue()}</p>
      <p className={`relative mt-1 font-sans text-[11px] font-semibold uppercase tracking-[0.1em] ${dark ? 'text-white/45' : 'text-[#bcb8b1]'}`}>
        {label}
      </p>
      {hint && <p className={`relative mt-1.5 font-sans text-xs ${dark ? 'text-white/40' : 'text-neutral-500'}`}>{hint}</p>}
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
    <span className={`inline-flex items-center gap-1 rounded-[5px] px-2 py-0.5 text-[0.8125rem] font-extrabold uppercase tracking-wide ${tones[tone] ?? tones.gray}`}>
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
export function Panel({ title, hint, action, children, className = '', ...props }) {
  return (
    <section {...props} className={`rounded-[5px]   bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] p-4 shadow-card sm:p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            {title && <h2 className="font-display text-lg font-bold tracking-tight text-neutral-900">{title}</h2>}
            {hint && <p className="mt-0.5 font-sans text-sm font-normal text-neutral-500">{hint}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
