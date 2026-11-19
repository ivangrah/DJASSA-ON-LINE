import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeftRight, BadgeCheck, Heart, MapPin, MessageCircle, Zap } from 'lucide-react';
import { CONDITION_LABELS, formatFCFA } from '../lib/format';

/**
 * Carte produit Djassa — épurée, avec actions rapides (Troc / Message).
 * Les boutons apparaissent au survol sur desktop, toujours visibles sur mobile.
 */
export default function ProductCard({ article }) {
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

  const goTroc = (e) => {
    e.preventDefault();
    navigate(`/article/${article.id}?troc=1`);
  };

  const goMessage = (e) => {
    e.preventDefault();
    navigate(`/messages?to=${article.proprietaire?.id}&article=${article.id}`);
  };

  return (
    <Link
      to={`/article/${article.id}`}
      className="group flex flex-col overflow-hidden rounded-[22px] bg-white shadow-card ring-1 ring-djassa-black/6 transition-all duration-300 hover:-translate-y-1 hover:shadow-pop focus-visible:ring-djassa-red"
      aria-label={`${article.titre} — ${formatFCFA(prixActuel)}`}
    >
      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-djassa-cloud">
        {imageOk && image ? (
          <img
            src={image}
            alt={article.titre}
            loading="lazy"
            onError={() => setImageOk(false)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-djassa-mist">
            <span className="font-jakarta text-[26px] font-extrabold tracking-tight text-djassa-black/15">Djassa</span>
            <span className="text-[8px] font-semibold uppercase tracking-[0.2em] text-djassa-slate/60">{article.categorie}</span>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent" />

        {/* Badges haut-gauche */}
        <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
          {isFlash && (
            <span className="badge-flash shadow-md"><Zap size={9} strokeWidth={3.5} /> Vente flash{discount > 0 ? ` −${discount}%` : ''}</span>
          )}
          {trocable && (
            <span className="badge-troc shadow-md"><ArrowLeftRight size={9} strokeWidth={3.5} /> Troc</span>
          )}
          {isPro && (
            <span className="badge-pro shadow-md"><BadgeCheck size={9} strokeWidth={3} /> Boutique pro</span>
          )}
        </div>

        {/* Favori */}
        <button
          type="button"
          aria-pressed={faved}
          aria-label={faved ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          onClick={(e) => { e.preventDefault(); setFaved((v) => !v); }}
          className="absolute right-2.5 top-2.5 rounded-full bg-white/92 p-2 shadow-md backdrop-blur transition hover:scale-110 active:scale-95"
        >
          <Heart size={15} strokeWidth={2.4} className={faved ? 'fill-djassa-red text-djassa-red heart-pop' : 'text-djassa-black'} />
        </button>

        {/* État sur l'image */}
        <span className="absolute bottom-2.5 left-2.5 rounded-full bg-white/92 px-2.5 py-1 text-[8.5px] font-bold uppercase tracking-[0.12em] text-djassa-black shadow-sm backdrop-blur">
          {CONDITION_LABELS[article.condition] ?? article.condition}
        </span>
      </div>

      {/* Corps */}
      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="line-clamp-2 min-h-[2.3rem] font-jakarta text-[12.5px] font-bold leading-snug text-djassa-black transition group-hover:text-djassa-red">
          {article.titre}
        </h3>

        {/* Prix + vendeur */}
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1.5">
            <span className="font-jakarta text-[19px] font-extrabold tracking-tight text-[#E60023]">{formatFCFA(prixActuel)}</span>
            {isFlash && <span className="font-inter text-[9.5px] text-djassa-slate line-through">{formatFCFA(prixOriginal)}</span>}
          </div>
          <span className="flex min-w-0 items-center gap-1">
            <span className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[7px] font-extrabold text-white ${isPro ? 'bg-djassa-red' : 'bg-djassa-black'}`}>
              {sellerName.slice(0, 1).toUpperCase()}
            </span>
            <span className="truncate text-[9px] font-semibold text-djassa-black/70">{sellerName}</span>
            {isPro && article.boutique?.verifie && <BadgeCheck size={10} strokeWidth={2.6} className="shrink-0 fill-djassa-red text-white" />}
          </span>
        </div>

        {/* Localisation */}
        <p className="mt-1 flex items-center gap-1 text-[10px] font-medium text-djassa-slate">
          <MapPin size={10} className="shrink-0" />
          <span className="truncate">{article.quartier ? `${article.quartier}, ` : ''}{article.ville}</span>
        </p>

        {/* Actions rapides — apparaissent au survol (desktop) */}
        <div className="mt-auto flex items-center gap-2 pt-3 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
          <button
            type="button"
            onClick={goTroc}
            disabled={!trocable}
            className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-djassa-red font-jakarta text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-djassa-red transition hover:bg-djassa-red hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ArrowLeftRight size={13} strokeWidth={2.8} /> Troc
          </button>
          <button
            type="button"
            onClick={goMessage}
            className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-djassa-black font-jakarta text-[9.5px] font-extrabold uppercase tracking-[0.1em] text-white transition hover:bg-djassa-red"
          >
            <MessageCircle size={13} strokeWidth={2.6} /> Message
          </button>
        </div>
      </div>
    </Link>
  );
}
