import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  ArrowLeftRight, BadgeCheck, ChevronRight, Eye, Flag, Heart, Image as ImageIcon,
  LockKeyhole, MapPin, MessageCircle, PackageOpen, Share2, ShieldCheck, ShoppingCart,
  Store, Tag, Zap,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import { CONDITION_LABELS, CONDITION_STYLES, formatFCFA, timeAgo } from '../lib/format';
import { Avatar, EmptyState } from '../components/ui';
import BarterModal from '../components/BarterModal';
import CheckoutModal from '../components/CheckoutModal';
import ProductCardWide from '../components/ProductCardWide';

/** Jeu de données réaliste mais hostile, injecté uniquement en dev via ?data=worst. */
function worstCaseArticle(apiArticle) {
  return {
    ...apiArticle,
    titre: 'Caisse à outils complète 108 pièces — modèle professionnel avec coffret renforcé, cliquets, douilles, clés mixtes, tournevis et pinces, livraison en main propre à Cocody',
    description: (apiArticle.description || 'Kit outillage mécanique complet et rangé.').repeat(14),
    prix: '99999999.99',
    prix_actuel: '99999999.99',
    vues: 1284,
    stock: 1,
    images: [],
    specs: {
      ...(apiArticle.specs ?? {}),
      nombre_de_pieces_inclus: '108 pièces avec coffret de transport renforcé et garantie atelier',
      reference_fournisseur_importee: 'NW-HOLD-108-PRO-2026-001-CI-ABJ',
    },
    boutique: apiArticle.boutique
      ? { ...apiArticle.boutique, nom_boutique: 'Bakayoko Koffi — Quincaillerie Moderne & Services Industriels de Côte d’Ivoire' }
      : null,
    proprietaire: { ...(apiArticle.proprietaire ?? {}), nom: 'Aleksandra Wiśniewska-Kowalczyk' },
  };
}

/** Bascule dev-only Demo / Worst case, ancrée hors du contenu testé. */
function WorstCaseToggle() {
  const [params, setParams] = useSearchParams();
  const worst = params.get('data') === 'worst';

  const set = (next) => setParams((prev) => {
    const copy = new URLSearchParams(prev);
    if (next === 'demo') copy.delete('data');
    else copy.set('data', next);
    return copy;
  }, { replace: true });

  return (
    <div className="fixed bottom-20 right-3 z-[70] flex overflow-hidden rounded-[5px] bg-djassa-gray/80 p-0.5 font-sans text-[10px] text-djassa-black shadow-card ring-djassa-black/10 md:bottom-4">
      {[['demo', 'Demo data'], ['worst', 'Worst case']].map(([value, label]) => (
        <button
          key={value}
          type="button"
          onClick={() => set(value)}
          aria-pressed={worst === (value === 'worst')}
          className={`rounded-[5px] px-3 py-1.5 font-semibold transition-colors ${worst === (value === 'worst') ? 'bg-white text-djassa-black' : 'text-djassa-black/60'}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const cart = useCart();
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeImage, setActiveImage] = useState(0);
  const [barterOpen, setBarterOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [faved, setFaved] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => (await api.get(`/products/${id}`)).data,
    enabled: Boolean(id),
  });
  const apiArticle = data?.data;
  const article = useMemo(() => {
    if (!import.meta.env.DEV || !apiArticle) return apiArticle;
    if (searchParams.get('data') !== 'worst') return apiArticle;
    return worstCaseArticle(apiArticle);
  }, [apiArticle, searchParams]);
  const images = article?.images?.length ? article.images : (article?.image_principale ? [article.image_principale] : []);

  const boutiqueId = article?.boutique?.id;
  const { data: simData, isLoading: simLoading, fetchNextPage: fetchSimNext } = useInfiniteQuery({
    queryKey: ['products', 'boutique', boutiqueId],
    queryFn: async ({ pageParam }) => (await api.get('/products', {
      params: { per_page: 8, sort: 'popular', category: article?.categorie, boutique_id: boutiqueId, page: pageParam },
    })).data,
    initialPageParam: 1,
    enabled: Boolean(boutiqueId),
    staleTime: 60_000,
  });
  const similarArticles = useMemo(() => simData?.pages?.flatMap((p) => p.data ?? []) ?? [], [simData]);
  const hasSimNext = Boolean(simData?.meta?.current_page < simData?.meta?.last_page);

  useEffect(() => {
    setActiveImage(0);
  }, [id]);

  const trocable = article?.est_trocable || ['troc', 'mixte'].includes(article?.mode_transaction);
  const isFlash = Boolean(article?.vente_flash && article?.prix_flash);
  const prixActuel = Number(article?.prix_actuel ?? article?.prix ?? 0);

  // Ouverture auto du modal troc via ?troc=1 (depuis une carte), avec garde auth
  useEffect(() => {
    if (searchParams.get('troc') !== '1') return;
    if (!isAuthenticated) {
      toast.info('Connectez-vous pour proposer un troc.');
      navigate('/login', { state: { from: `/article/${id}?troc=1` }, replace: true });
      return;
    }
    if (!article) return;
    if (trocable) setBarterOpen(true);
    else toast.info('Ce vendeur n’accepte pas le troc sur cet article.');
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('troc');
      return next;
    }, { replace: true });
  }, [searchParams, isAuthenticated, article, trocable, id, navigate, toast, setSearchParams]);

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: article.titre, url: window.location.href });
      else { await navigator.clipboard.writeText(window.location.href); toast.success('Lien copié dans le presse-papier.'); }
    } catch { /* abandonné par l'utilisateur */ }
  };

  const requireAuth = () => {
    if (!isAuthenticated) {
      toast.info('Connectez-vous pour continuer.');
      navigate('/login', { state: { from: `/article/${id}` } });
      return false;
    }
    return true;
  };

  const addToCart = () => {
    if (!requireAuth()) return;
    if (cart.add(article)) toast.success('Article ajouté au panier.');
    else toast.info('Cet article est déjà dans votre panier.');
  };

  const ready = !isLoading && !isError && Boolean(article);

  if (!ready && isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid gap-5 md:grid-cols-[minmax(0,42%)_minmax(0,1fr)]">
          <div className="skeleton aspect-square w-full rounded-[5px]" />
          <div className="space-y-4">
            <div className="skeleton h-5 w-1/3" />
            <div className="skeleton h-7 w-3/4" />
            <div className="skeleton h-40 w-full rounded-[5px]" />
            <div className="skeleton h-24 w-full rounded-[5px]" />
          </div>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mx-auto max-w-lg overflow-hidden rounded-[5px] bg-djassa-red border-solid border-[0.5px] border-[rgba(255,255,255,0.12)] text-white shadow-pop">
          <div className="p-7 text-center">
            <PackageOpen size={38} className="mx-auto" strokeWidth={1.6} />
            <h1 className="mt-3 font-spacegrotesk text-[22px] font-extrabold">Article introuvable</h1>
            <p className="mx-auto mt-1 max-w-sm text-[12px] leading-relaxed text-white/80">
              {error?.response?.data?.message ?? 'Cette annonce n’est plus disponible.'}
            </p>
            <Link to="/" className="mt-5 inline-flex items-center gap-2 rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] shadow-card px-4 py-2.5 font-spacegrotesk text-[11px] font-extrabold uppercase tracking-wide text-djassa-red transition hover:bg-djassa-black hover:text-white">
              Retour au fil <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const sellerName = article.boutique?.nom_boutique ?? article.proprietaire?.nom;
  const lowStock = Boolean(article.boutique && Number(article.stock) > 0 && Number(article.stock) <= 5);

  return (
    <div className="mx-auto max-w-7xl px-3 py-3 sm:px-5 md:py-5">
      {/* Fil d'Ariane */}
      <nav className="mb-3 flex items-center gap-1.5 text-[10.5px] text-djassa-black/60" aria-label="Fil d'Ariane">
        <Link to="/" className="font-semibold transition hover:text-djassa-red">Accueil</Link>
        <ChevronRight size={12} className="text-djassa-red" />
        <Link to={`/?category=${encodeURIComponent(article.categorie)}`} className="font-semibold transition hover:text-djassa-red">{article.categorie}</Link>
        <ChevronRight size={12} className="text-djassa-red" />
        <span className="line-clamp-1 font-bold text-djassa-black">{article.titre}</span>
      </nav>

      {/* ===== BANDEAU ROUGE ===== */}
      <section
        className="relative overflow-hidden rounded-[5px] px-5 py-5 text-white shadow-card sm:px-7 sm:py-6"
        style={{ background: 'linear-gradient(135deg, #780000 0%, #4A0000 60%, #140505 100%)' }}
      >
        <img src="/images/shoppers.webp" alt="" aria-hidden="true" className="art-warm pointer-events-none absolute -bottom-8 right-4 hidden h-40 w-auto select-none object-contain opacity-70 sm:block"  loading="lazy" decoding="async" />
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 rounded-[5px] bg-white/15 px-2.5 py-1 font-spacegrotesk text-[9px] font-extrabold uppercase tracking-[0.2em]">
            <Store size={13} /> Vitrine Djassa
          </span>
          <h1 className="mt-2 font-spacegrotesk text-[26px] font-extrabold uppercase leading-none tracking-[0.16em] sm:text-[36px]">
            Article<span className="text-white/55">.</span>
          </h1>
          <p className="mt-2 max-w-lg font-DM-Sans text-[11px] leading-relaxed text-white/70">
            {article.categorie} · {article.quartier ? `${article.quartier}, ` : ''}{article.ville} — paiement sécurisé par séquestre et code PIN.
          </p>
        </div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,44%)_minmax(0,1fr)] lg:gap-6">
        {/* Galerie + confiance */}
        <div className="self-start lg:sticky lg:top-20">
          <div className="relative overflow-hidden rounded-[5px] bg-djassa-cloud border-solid border-[0.5px] border-[rgba(18,18,18,0.08)]">
            {images[activeImage] ? (
              <img src={images[activeImage]} alt={article.titre} width={800} height={800} fetchPriority="high" className="aspect-square w-full object-cover"  loading="lazy" decoding="async" />
            ) : (
              <div className="flex aspect-square w-full flex-col items-center justify-center bg-djassa-red/[0.05]">
                <ImageIcon size={42} className="text-djassa-red/30" />
                <span className="mt-2 font-spacegrotesk text-sm font-extrabold text-djassa-red/30">Djassa Online</span>
              </div>
            )}

            {isFlash && (
              <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-[5px] bg-djassa-red px-3 py-1.5 font-spacegrotesk text-[10px] font-extrabold uppercase tracking-[0.12em] text-white shadow-pop">
                <Zap size={24} strokeWidth={3} fill="currentColor" /> Vente flash
              </span>
            )}
            <span className="absolute bottom-3 left-3 rounded-[5px] bg-djassa-black/80 px-2.5 py-1 font-spacegrotesk text-[9px] font-extrabold text-white">
              {images.length ? `${activeImage + 1} / ${images.length}` : '0 photo'}
            </span>
            <button
              type="button"
              onClick={() => setFaved((v) => !v)}
              aria-pressed={faved}
              aria-label="Ajouter aux favoris"
              className="absolute right-3 top-3 rounded-[5px] bg-white p-2.5 shadow-card transition hover:scale-105 active:scale-95"
            >
              <Heart size={19} className={faved ? 'fill-djassa-red text-djassa-red' : 'text-djassa-black'} strokeWidth={2.2} />
            </button>
          </div>

          {images.length > 1 && (
            <div className="no-scrollbar mt-2.5 flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={`h-14 w-14 shrink-0 overflow-hidden rounded-[5px] transition ${
                    i === activeImage ? 'ring-2 ring-djassa-red ring-offset-2' : '  '
                  }`}
                  aria-label={`Photo ${i + 1}`}
                  aria-current={i === activeImage ? 'true' : undefined}
                >
                  <img src={img} alt="" width={56} height={56} loading="lazy" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
                </button>
              ))}
            </div>
          )}

          <div className="mt-3 rounded-[5px] bg-djassa-red/[0.05] p-3.5">
            <p className="font-spacegrotesk text-[10px] font-extrabold uppercase tracking-[0.14em] text-djassa-red">Acheter sur Djassa, c’est protégé</p>
            <ul className="mt-2.5 space-y-2 text-[10.5px] leading-snug text-djassa-black/65">
              <li className="flex gap-2"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-djassa-red" /> Paiement Mobile Moneybloqué en séquestre.</li>
              <li className="flex gap-2"><LockKeyhole size={14} className="mt-0.5 shrink-0 text-djassa-red" /> Code PIN remis à l’acheteur, saisi par le vendeur.</li>
              <li className="flex gap-2"><BadgeCheck size={14} className="mt-0.5 shrink-0 text-djassa-red" /> Fonds libérés après remise en main propre.</li>
            </ul>
          </div>
        </div>

        {/* Détails */}
        <div className="min-w-0 space-y-3">
          {/* Titre et badges */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-[5px]  px-2.5 py-1 text-[9.5px] font-extrabold uppercase tracking-wide ${CONDITION_STYLES[article.condition] ?? CONDITION_STYLES.bon_etat}`}>
                {CONDITION_LABELS[article.condition]}
              </span>
              {article.est_neuf_boutique && (
                <span className="inline-flex items-center gap-1 rounded-[5px] bg-djassa-red px-2.5 py-1 text-[9.5px] font-extrabold uppercase tracking-wide text-white">
                  <Store size={10} strokeWidth={3} /> Neuf boutique pro
                </span>
              )}
              {trocable && (
                <span className="inline-flex items-center gap-1 rounded-[5px] bg-djassa-black px-2.5 py-1 text-[9.5px] font-extrabold uppercase tracking-wide text-white">
                  <ArrowLeftRight size={10} strokeWidth={2.6} /> Troc accepté
                </span>
              )}
              {article.prix_negociable && (
                <span className="rounded-[5px] bg-emerald-50 px-2.5 py-1 shadow-card text-[9.5px] font-extrabold uppercase tracking-wide text-emerald-700">
                  Prix négociable
                </span>
              )}
            </div>
            <h1 className="mt-2.5 text-balance font-spacegrotesk text-[22px] font-extrabold leading-[1.12] tracking-tight text-djassa-black sm:text-[28px]">
              {article.titre}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10.5px] text-djassa-black/55">
              <span className="flex items-center gap-1"><MapPin size={12} className="text-djassa-red" />{article.quartier ? `${article.quartier}, ` : ''}{article.ville}</span>
              <span className="flex items-center gap-1 tabular-nums"><Eye size={12} className="text-djassa-red" />{article.vues ?? 0} vue{(article.vues ?? 0) > 1 ? 's' : ''}</span>
              <span>Publiée {timeAgo(article.created_at)}</span>
            </div>
          </div>

          {/* Panneau vendeur + prix + actions */}
          <section className="overflow-hidden rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] shadow-card">
            <div className="p-4 text-white" style={{ background: 'linear-gradient(135deg, #780000 0%, #4A0000 60%, #140505 100%)' }}>
              <div className="flex items-center gap-3">
                <Avatar name={sellerName} size={42} tone="red" className="ring-2 ring-white/30" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 font-spacegrotesk text-[13px] font-extrabold">
                    <span className="truncate">{sellerName}</span>
                    {article.boutique?.verifie && <BadgeCheck size={15} className="shrink-0 fill-white text-djassa-red" aria-label="Vendeur vérifié" />}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] text-white/80">
                    {article.boutique
                      ? `Boutique Pro${article.boutique.note_moyenne && Number(article.boutique.note_moyenne) > 0 ? ` · ★ ${Number(article.boutique.note_moyenne).toFixed(1)} (${article.boutique.nombre_avis} avis)` : ''}`
                      : `Particulier · Score ${article.proprietaire?.score_confiance ?? 50}/100`}
                  </p>
                </div>
                {article.boutique && (
                  <Link
                    to={`/boutique/${article.boutique.slug}`}
                    className="hidden shrink-0 rounded-[5px] bg-white/15 px-3 py-1.5 font-spacegrotesk text-[9.5px] font-extrabold uppercase tracking-wide text-white transition hover:bg-white/25 sm:inline-flex"
                  >
                    Voir la boutique
                  </Link>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-end justify-between gap-2 pt-3">
                <div>
                  <p className="price-fcfa text-[30px] leading-none tracking-tight sm:text-[34px]">
                    {formatFCFA(prixActuel)}
                  </p>
                  {isFlash && (
                    <p className="price-fcfa mt-1 text-[11px] text-white/70 line-through">{formatFCFA(article.prix)}</p>
                  )}
                </div>
                {lowStock && (
                  <span className="rounded-[5px] bg-white px-2.5 py-1 font-spacegrotesk text-[9.5px] font-extrabold uppercase tracking-wide text-djassa-red">
                    Plus que {article.stock} en stock
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => requireAuth() && setCheckoutOpen(true)}
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] font-spacegrotesk text-[11.5px] font-extrabold uppercase tracking-[0.1em] text-djassa-red shadow-card transition hover:bg-djassa-black hover:text-white active:scale-[0.99]"
              >
                <ShieldCheck size={17} strokeWidth={2.3} /> Acheter {formatFCFA(prixActuel)}
              </button>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <button type="button" onClick={addToCart} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[5px] px-2 font-spacegrotesk text-[10px] font-extrabold uppercase tracking-wide text-djassa-red transition hover:bg-djassa-red hover:text-white active:scale-95">
                  <ShoppingCart size={15} strokeWidth={2.3} /> Panier
                </button>
                {trocable && (
                  <button type="button" onClick={() => requireAuth() && setBarterOpen(true)} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[5px] bg-djassa-black border-solid border-[0.5px] border-[rgba(255,255,255,0.12)] px-2 font-spacegrotesk text-[10px] font-extrabold uppercase tracking-wide text-white transition hover:bg-djassa-red active:scale-95">
                    <ArrowLeftRight size={15} strokeWidth={2.4} /> Troc
                  </button>
                )}
                <button type="button" onClick={() => requireAuth() && navigate(`/messages?to=${article.proprietaire?.id}&article=${article.id}`)} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[5px] px-2 font-spacegrotesk text-[10px] font-extrabold uppercase tracking-wide text-djassa-black transition hover:bg-djassa-black hover:text-white active:scale-95">
                  <MessageCircle size={15} strokeWidth={2.3} /> Message
                </button>
                <button type="button" onClick={share} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[5px] px-2 font-spacegrotesk text-[10px] font-extrabold uppercase tracking-wide text-djassa-black transition hover:bg-djassa-black hover:text-white active:scale-95">
                  <Share2 size={15} strokeWidth={2.3} /> Partager
                </button>
              </div>
              {!trocable && (
                <p className="mt-2 text-[10px] text-djassa-black/50">Le troc n’est pas activé sur cet article.</p>
              )}
            </div>
          </section>

          {/* Description + caractéristiques */}
          <section className="rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] p-4 shadow-card">
            <h2 className="flex items-center gap-2 font-spacegrotesk text-[13px] font-extrabold uppercase tracking-wide text-djassa-black">
              <span className="flex h-6 w-6 items-center justify-center rounded-[5px] bg-djassa-red/10 text-djassa-red"><PackageOpen size={13} /></span>
              Description
            </h2>
            <p className="mt-2.5 whitespace-pre-line text-[12.5px] leading-[1.7] text-djassa-black/75">
              {article.description || 'Aucune description fournie par le vendeur.'}
            </p>

            {article.specs && Object.keys(article.specs).length > 0 && (
              <div className="mt-4 pt-4">
                <h2 className="flex items-center gap-2 font-spacegrotesk text-[13px] font-extrabold uppercase tracking-wide text-djassa-black">
                  <span className="flex h-6 w-6 items-center justify-center rounded-[5px] bg-djassa-red/10 text-djassa-red"><Tag size={13} /></span>
                  Caractéristiques
                </h2>
                <dl className="mt-2.5 divide-y divide-djassa-gray/30">
                  {Object.entries(article.specs).slice(0, 8).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-[minmax(0,130px)_minmax(0,1fr)] gap-3 py-2">
                      <dt className="text-[10px] font-bold uppercase tracking-wide text-djassa-red/80">{String(key).replaceAll('_', ' ')}</dt>
                      <dd className="text-[12px] font-semibold text-djassa-black/80">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </section>

          <button
            type="button"
            onClick={() => toast.success('Signalement transmis. Notre équipe va examiner cette annonce.')}
            className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-djassa-black/55 transition hover:text-djassa-red"
          >
            <Flag size={24} /> Signaler cette annonce
          </button>
        </div>
      </div>

      {/* Autres articles de la boutique */}
      {article.boutique && (
        <section className="mt-8 overflow-hidden rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-djassa-red px-4 py-3 text-white">
            <h2 className="flex items-center gap-2 font-spacegrotesk text-[15px] font-extrabold tracking-tight">
              <Store size={16} /> Autres articles de la boutique
            </h2>
            <Link to={`/boutique/${article.boutique.slug}`} className="inline-flex items-center gap-1.5 rounded-[5px] bg-white px-3 py-1.5 font-spacegrotesk text-[10px] font-extrabold uppercase tracking-wide text-djassa-red transition hover:bg-djassa-black hover:text-white">
              Voir la boutique <ChevronRight size={13} />
            </Link>
          </div>
          <div className="p-3 sm:p-4">
            {simLoading ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="djassa-card skeleton h-[260px] rounded-[5px] sm:h-[300px]" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5 lg:grid-cols-3 xl:grid-cols-4">
                {similarArticles.filter((a) => a.id !== id).map((a) => (
                  <div key={a.id}><ProductCardWide article={a} /></div>
                ))}
                {similarArticles.length === 0 && (
                  <EmptyState title="Aucun autre article trouvé" hint="Revenez bientôt — la boutique publiera des nouveautés." />
                )}
              </div>
            )}
            {hasSimNext && (
              <button type="button" onClick={() => fetchSimNext()} disabled={simLoading} className="mt-4 w-full rounded-[5px] py-2.5 font-spacegrotesk text-[10px] font-extrabold uppercase tracking-wide text-djassa-red transition hover:bg-djassa-red hover:text-white disabled:cursor-not-allowed disabled:opacity-50">
                Charger plus
              </button>
            )}
          </div>
        </section>
      )}

      {import.meta.env.DEV && <WorstCaseToggle />}

      <BarterModal open={barterOpen} onClose={() => setBarterOpen(false)} targetArticle={article} onSuccess={() => navigate(`/messages?to=${article.proprietaire?.id}&article=${article.id}`)} />
      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} article={article} onPaid={() => {}} />
    </div>
  );
}
