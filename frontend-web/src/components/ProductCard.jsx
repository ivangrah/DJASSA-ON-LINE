import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftRight, BadgeCheck, Heart, MapPin, Store, Zap } from 'lucide-react';
import { CONDITION_LABELS, formatFCFA } from '../lib/format';

/**
 * Carte produit Djassa — badges TROC / VENTE FLASH / BOUTIQUE PRO · prix FCFA.
 */
export default function ProductCard({ article, compact = false }) {
  const [faved, setFaved] = useState(false);
  const [imageOk, setImageOk] = useState(Boolean(article.image_principale || article.images?.[0]));
  const isFlash = Boolean(article.vente_flash && article.prix_flash);
  const trocable = article.est_trocable || ['troc', 'mixte'].includes(article.mode_transaction);
  const isPro = Boolean(article.boutique);
  const prixActuel = Number(article.prix_actuel ?? article.prix);
  const prixOriginal = Number(article.prix);

  return (
    <Link to={`/article/${article.id}`} className="djassa-card djassa-card-hover group pressable block" aria-label={article.titre}>
      {/* Image 4:5 */}
      <div className="relative overflow-hidden bg-djassa-cloud">
        {imageOk ? (
          <img
            src={article.image_principale ?? article.images?.[0]}
            alt={article.titre}
            loading="lazy"
            onError={() => setImageOk(false)}
            className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-2 bg-djassa-mist">
            <span className="font-jakarta text-3xl font-extrabold text-djassa-black/20 select-none">Djassa</span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-djassa-slate/60">{article.categorie}</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1.5">
          {isFlash && (
            <span className="badge-flash shadow"><Zap size={10} strokeWidth={3} /> Vente flash</span>
          )}
          {trocable && (
            <span className="badge-troc shadow"><ArrowLeftRight size={10} strokeWidth={3} /> Troc</span>
          )}
          {isPro && (
            <span className="badge-pro shadow"><Store size={10} strokeWidth={3} /> Boutique pro</span>
          )}
        </div>

        {/* Favoris */}
        <button
          type="button"
          aria-pressed={faved}
          aria-label={faved ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          onClick={(e) => { e.preventDefault(); setFaved((v) => !v); }}
          className="absolute right-2 top-2 rounded-full bg-white/90 p-2 shadow backdrop-blur transition hover:scale-110"
        >
          <Heart key={String(faved)} size={16} strokeWidth={2.4} className={`${faved ? 'fill-djassa-red text-djassa-red heart-pop' : 'text-djassa-black'}`} />
        </button>
      </div>

      {/* Corps */}
      <div className="p-3">
        <p className="text-[10px] font-inter font-semibold uppercase tracking-wider text-djassa-slate">{CONDITION_LABELS[article.condition] ?? article.condition}</p>
        <h3 className="clamp-2 mt-0.5 min-h-[2.1rem] font-jakarta text-[13px] font-bold leading-snug text-djassa-black">{article.titre}</h3>

        {/* Prix */}
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="font-jakarta text-base font-extrabold tracking-tight text-djassa-black">{formatFCFA(prixActuel)}</span>
          {isFlash && (
            <span className="text-[11px] font-medium text-djassa-slate line-through">{formatFCFA(prixOriginal)}</span>
          )}
        </div>

        {/* Pied : boutique ou localisation */}
        <div className="mt-2 flex items-center justify-between gap-2">
          {isPro ? (
            <span className="flex min-w-0 items-center gap-1 text-[10px] font-semibold text-djassa-black">
              <BadgeCheck size={12} className="shrink-0 text-djassa-red" strokeWidth={2.5} />
              <span className="truncate">{article.boutique?.nom_boutique}</span>
            </span>
          ) : (
            <span className="flex min-w-0 items-center gap-1 text-[10px] text-djassa-slate">
              <MapPin size={11} className="shrink-0" />
              <span className="truncate">{article.quartier ? `${article.quartier}, ` : ''}{article.ville}</span>
            </span>
          )}
          {!compact && article.prix_negociable && (
            <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wide text-djassa-slate">Négociable</span>
          )}
        </div>
      </div>
    </Link>
  );
}
