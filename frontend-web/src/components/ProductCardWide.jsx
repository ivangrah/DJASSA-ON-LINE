import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeftRight, BadgeCheck, Heart, Star, Zap } from 'lucide-react';
import { CONDITION_LABELS, formatFCFA } from '../lib/format';

/**
 * Carte produit compacte — conteneur div cliquable (pas de <a> imbriqué).
 * Toute la carte mène à la fiche sauf boutons/liens internes.
 */
export default function ProductCardWide({ article }) {
  const navigate = useNavigate();
  const [faved, setFaved] = useState(false);
  const [imageOk, setImageOk] = useState(Boolean(article.image_principale || article.images?.[0]));
  const isFlash = Boolean(article.vente_flash && article.prix_flash);
  const trocable = article.est_trocable || ['troc', 'mixte'].includes(article.mode_transaction);
  const isPro = Boolean(article.boutique);
  const prixActuel = Number(article.prix_actuel ?? article.prix);
  const prixOriginal = Number(article.prix);
  const discount = isFlash ? Math.round((1 - prixActuel / prixOriginal) * 100) : 0;
  const image = article.image_principale ?? article.images?.[0];
  const sellerName = isPro ? article.boutique?.nom_boutique : article.proprietaire?.nom ?? 'Particulier';
  const description = (article.description ?? '').trim();

  const goPrimary = () => navigate(`/article/${article.id}${trocable ? '?troc=1' : ''}`);
  const goDetails = () => navigate(`/article/${article.id}`);
  const handleCardClick = (e) => {
    if (e.target.closest('button, a')) return;
    navigate(`/article/${article.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('button, a')) {
          e.preventDefault();
          navigate(`/article/${article.id}`);
        }
      }}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-[20px] bg-white p-2.5 shadow-card ring-1 ring-djassa-black/6 transition-all duration-300 hover:-translate-y-1 hover:shadow-pop focus-visible:ring-djassa-red"
      aria-label={`${article.titre} — ${formatFCFA(prixActuel)}`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-djassa-cloud">
        <Link to={`/article/${article.id}`} className="block h-full w-full" aria-label={`Voir ${article.titre}`} tabIndex={-1}>
          {imageOk && image ? (
            <img
              src={image}
              alt={article.titre}
              loading="lazy"
              onError={() => setImageOk(false)}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-djassa-mist font-jakarta text-lg font-extrabold text-djassa-black/15">Djassa</div>
          )}
        </Link>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/40 to-transparent" />

        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {isFlash && (
            <span className="badge-flash !px-1.5 !py-0.5"><Zap size={8} strokeWidth={3.5} /> −{discount}%</span>
          )}
          {trocable && (
            <span className="badge-troc !px-1.5 !py-0.5"><ArrowLeftRight size={8} strokeWidth={3.5} /> Troc</span>
          )}
          {isPro && (
            <span className="badge-pro !px-1.5 !py-0.5"><BadgeCheck size={8} strokeWidth={3} /> Pro</span>
          )}
        </div>

        <button
          type="button"
          aria-pressed={faved}
          aria-label={faved ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          onClick={() => setFaved((v) => !v)}
          className="absolute right-2 top-2 rounded-full bg-white/92 p-1.5 shadow-sm transition hover:scale-110 active:scale-95"
        >
          <Heart size={12} strokeWidth={2.6} className={faved ? 'fill-djassa-red text-djassa-red heart-pop' : 'text-djassa-black'} />
        </button>

        <span className="absolute bottom-2 left-2 rounded-full bg-white/92 px-2 py-0.5 text-[7.5px] font-bold uppercase tracking-[0.1em] text-djassa-black shadow-sm">
          {CONDITION_LABELS[article.condition] ?? article.condition}
        </span>
      </div>

      {/* Infos */}
      <div className="flex flex-1 flex-col px-1.5 pb-1.5 pt-2.5">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/article/${article.id}`} className="min-w-0 flex-1">
            <h3 className="line-clamp-2 min-h-[2.2rem] font-jakarta text-[13px] font-bold leading-[1.3] tracking-[-0.015em] text-djassa-black transition group-hover:text-djassa-red sm:text-[13.5px]">
              {article.titre}
            </h3>
          </Link>
          <span className="mt-0.5 hidden shrink-0 rounded-full bg-djassa-cloud px-2 py-0.5 text-[7.5px] font-semibold uppercase tracking-wide text-djassa-slate sm:inline-flex">
            {article.categorie}
          </span>
        </div>

        <p className="mt-1 flex flex-wrap items-baseline gap-1.5">
          <span className="font-jakarta text-[17px] font-extrabold tracking-tight text-[#E60023] sm:text-[18px]">{formatFCFA(prixActuel)}</span>
          {isFlash && <span className="font-inter text-[10px] font-medium text-djassa-slate line-through">{formatFCFA(prixOriginal)}</span>}
          {article.prix_negociable && <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wide text-emerald-700">Nég.</span>}
        </p>

        <p className="mt-1 flex items-center gap-1 text-[10px] text-djassa-slate">
          <span className="flex items-center gap-0.5 text-amber-400">
            {[0, 1, 2, 3, 4].map((i) => <Star key={i} size={9} className="fill-amber-400 text-amber-400" />)}
          </span>
          <span className="font-inter font-semibold text-djassa-black/75">4.8</span>
          <span>·</span>
          <span className="truncate font-inter">{sellerName}{isPro && article.boutique?.verifie ? ' ✓' : ''}</span>
        </p>

        <p className="mt-1 line-clamp-2 min-h-[2rem] font-inter text-[11px] leading-[1.45] text-djassa-slate">
          {description || 'Bon état, remise en main propre ou troc possible.'}
        </p>

        <div className="mt-auto flex items-center gap-1.5 pt-2.5">
          <button
            type="button"
            onClick={goPrimary}
            className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-full bg-[#ED0F02] px-3 font-jakarta text-[9px] font-extrabold uppercase tracking-[0.1em] text-white shadow-[0_4px_14px_rgba(237,15,2,0.35)] transition hover:bg-[#ff1e12] active:scale-95"
          >
            {trocable ? <><ArrowLeftRight size={11} strokeWidth={2.8} /> Troc</> : 'Acheter'}
          </button>
          <button
            type="button"
            onClick={goDetails}
            className="inline-flex h-8 items-center justify-center rounded-full border-[1.5px] border-djassa-black/20 px-3 font-jakarta text-[9px] font-extrabold uppercase tracking-[0.1em] text-djassa-black transition hover:border-djassa-black hover:bg-djassa-black hover:text-white active:scale-95"
          >
            Détails
          </button>
        </div>
      </div>
    </div>
  );
}
