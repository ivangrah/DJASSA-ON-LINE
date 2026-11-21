import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeftRight, BadgeCheck, Check, Heart, ShoppingCart, Star, Zap } from 'lucide-react';
import { useCart } from '../context/CartContext';
import ProductGallery from './ProductGallery';
import { useToast } from '../context/ToastContext';
import { CONDITION_LABELS, formatFCFA } from '../lib/format';

/**
 * Carte produit compacte — conteneur div cliquable (pas de <a> imbriqué).
 * Toute la carte mène à la fiche sauf boutons/liens internes.
 */
export default function ProductCardWide({ article }) {
  const navigate = useNavigate();
  const cart = useCart();
  const toast = useToast();
  const [faved, setFaved] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const inCart = cart.has(article.id);
  const isFlash = Boolean(article.vente_flash && article.prix_flash);
  const trocable = article.est_trocable || ['troc', 'mixte'].includes(article.mode_transaction);
  const isPro = Boolean(article.boutique);
  const prixActuel = Number(article.prix_actuel ?? article.prix);
  const prixOriginal = Number(article.prix);
  const discount = isFlash ? Math.round((1 - prixActuel / prixOriginal) * 100) : 0;
  const sellerName = isPro ? article.boutique?.nom_boutique : article.proprietaire?.nom ?? 'Particulier';
  const description = (article.description ?? '').trim();

  const addToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inCart) {
      if (cart.add(article)) toast.success('Article ajouté au panier.');
    } else {
      toast.info('Déjà dans votre panier.');
    }
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 700);
  };

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
      className="group flex cursor-pointer flex-col overflow-hidden rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] p-2 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-pop focus-visible:ring-2 focus-visible:ring-djassa-red/25 sm:rounded-[5px] sm:p-2.5"
      aria-label={`${article.titre} — ${formatFCFA(prixActuel)}`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[5px] bg-djassa-cloud border-solid border-[0.5px] border-[rgba(18,18,18,0.08)]">
        <Link to={`/article/${article.id}`} className="block h-full w-full" aria-label={`Voir ${article.titre}`} tabIndex={-1}>
          <ProductGallery article={article} images={article.images} />
        </Link>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/40 to-transparent" />

        <div className="absolute left-2 top-9 z-10 flex flex-col items-start gap-1">
          {isFlash && (
            <span className="badge-flash !px-1.5 !py-0.5"><Zap size={16} strokeWidth={3.5} /> −{discount}%</span>
          )}
          {trocable && (
            <span className="badge-troc !px-1.5 !py-0.5"><ArrowLeftRight size={16} strokeWidth={3.5} /> Troc</span>
          )}
          {isPro && (
            <span className="badge-pro !px-1.5 !py-0.5"><BadgeCheck size={16} strokeWidth={3} /> Pro</span>
          )}
        </div>

        <button
          type="button"
          aria-pressed={faved}
          aria-label={faved ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          onClick={() => setFaved((v) => !v)}
          className="absolute right-2 top-2 rounded-[5px] bg-white/92 p-1.5 shadow-sm transition hover:scale-110 active:scale-95"
        >
          <Heart size={20} strokeWidth={2.6} className={faved ? 'fill-djassa-red text-djassa-red heart-pop' : 'text-djassa-black'} />
        </button>

        <button
          type="button"
          onClick={addToCart}
          aria-label={inCart ? 'Déjà dans le panier' : 'Ajouter au panier'}
          title={inCart ? 'Déjà dans le panier' : 'Ajouter au panier'}
          className={`group/cart absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-[5px] shadow-lg ring-2  backdrop-blur transition hover:scale-110 active:scale-95 ${justAdded ? 'cart-pop' : ''} ${inCart ? 'bg-emerald-600 text-white' : 'bg-gradient-to-br from-[#780000] to-[#780000] text-white'}`}
        >
          {justAdded ? <Check size={20} strokeWidth={3} /> : <ShoppingCart size={20} strokeWidth={2.6} />}
        </button>

        <span className="absolute bottom-2 left-2 rounded-[5px] bg-white/92 px-2 py-0.5 text-[7.5px] font-bold uppercase tracking-[0.1em] text-djassa-black shadow-sm">
          {CONDITION_LABELS[article.condition] ?? article.condition}
        </span>
      </div>

      {/* Infos */}
      <div className="flex flex-1 flex-col px-1 pb-1 pt-2.5">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/article/${article.id}`} className="min-w-0 flex-1">
            <h3 className="line-clamp-1 font-spacegrotesk text-[12px] font-bold leading-[1.3] tracking-[-0.015em] text-djassa-black transition group-hover:text-djassa-red">
              {article.titre}
            </h3>
          </Link>
          <span className="mt-0.5 hidden shrink-0 rounded-[5px] bg-djassa-cloud px-2 py-0.5 text-[7.5px] font-semibold uppercase tracking-wide text-djassa-black/70 sm:inline-flex">
            {article.categorie}
          </span>
        </div>

        <div className="flex flex-wrap items-baseline gap-1.5">
          <span className="font-spacegrotesk text-[16px] font-extrabold tracking-tight text-[#780000] sm:text-[17px]">{formatFCFA(prixActuel)}</span>
          {isFlash && <span className="font-DM-Sans text-[10px] font-medium text-djassa-black/70 line-through">{formatFCFA(prixOriginal)}</span>}
          {article.prix_negociable && <span className="rounded-[5px] bg-emerald-50 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wide text-emerald-700">Nég.</span>}
        </div>

        <div className="mt-1 flex items-center gap-1.5">
          <span className="flex items-center gap-0.5 text-amber-400">
            {[0, 1, 2, 3, 4].map((i) => <Star key={i} size={16} className="fill-amber-400 text-amber-400" />)}
          </span>
          <span className="font-DM-Sans font-semibold text-djassa-black/75 text-[10px]">4.8</span>
          <span className="text-[9px]">·</span>
          <span className="truncate font-DM-Sans text-[9.5px]">{sellerName}{isPro && article.boutique?.verifie ? ' ✓' : ''}</span>
        </div>

        <p className="mt-1 line-clamp-1 text-[10.5px] leading-snug text-djassa-black/70">
          {description || 'Bon état, remise en main propre ou troc possible.'}
        </p>

        <div className="mt-auto flex items-center gap-1.5 pt-2">
          <button
            type="button"
            onClick={goPrimary}
            className="inline-flex h-7 flex-1 items-center justify-center gap-1 rounded-[5px] bg-[#780000] px-3 font-spacegrotesk text-[9px] font-extrabold uppercase tracking-[0.1em] text-white shadow-[0_3px_12px_rgba(120,0,0,0.3)] transition hover:bg-[#780000] active:scale-95"
          >
            {trocable ? <><ArrowLeftRight size={24} strokeWidth={2.8} /> Troc</> : 'Acheter'}
          </button>
          <button
            type="button"
            onClick={goDetails}
            className="inline-flex h-7 items-center justify-center rounded-[5px] px-3 font-spacegrotesk text-[9px] font-extrabold uppercase tracking-[0.1em] text-djassa-black transition hover:bg-djassa-black hover:text-white active:scale-95"
          >
            Détails
          </button>
        </div>
      </div>
    </div>
  );
}
