import { useEffect, useMemo, useRef } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { Star, Package, ShieldCheck, ArrowRight, BadgeCheck, X, Tag, Zap, ChevronLeft, ChevronRight, ArrowLeftRight } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import ProductCardWide from '../components/ProductCardWide';
import { CONDITION_LABELS, formatFCFA } from '../lib/format';
import { ProductCardSkeleton, EmptyState, Spinner } from '../components/ui';

export default function Feed() {
  const gridRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const q = searchParams.get('q') ?? '';

  const queryParams = useMemo(() => ({ per_page: 12, sort: 'latest', ...(q ? { q } : {}) }), [q]);

  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['products', queryParams],
    queryFn: async ({ pageParam }) => (await api.get('/products', { params: { ...queryParams, page: pageParam } })).data,
    initialPageParam: 1,
    getNextPageParam: (last) => (last?.meta?.current_page < last?.meta?.last_page ? last.meta.current_page + 1 : undefined),
  });


  // Carrousel d'articles en promo (ventes flash + tendances)
  const { data: flashData, isLoading: isFlashLoading } = useQuery({
    queryKey: ['products', 'flash'],
    queryFn: async () => (await api.get('/products/flash')).data,
    staleTime: 30_000,
  });
  const { data: popularData } = useQuery({
    queryKey: ['products', 'popular'],
    queryFn: async () => (await api.get('/products', { params: { per_page: 8, sort: 'popular' } })).data,
    staleTime: 30_000,
  });

  const promoItems = useMemo(() => {
    const flash = (flashData?.data ?? []).map((o) => ({ ...o, kind: 'flash' }));
    const seen = new Set(flash.map((f) => f.id));
    const popular = (popularData?.data ?? [])
      .filter((p) => !seen.has(p.id))
      .map((p) => ({ ...p, kind: 'populaire' }))
      .slice(0, 8);
    return [...flash, ...popular];
  }, [flashData, popularData]);

  const carouselRef = useRef(null);
  const scrollPromo = (dir) => {
    const el = carouselRef.current;
    if (!el) return;
    const card = el.querySelector('[data-promo-card]');
    const amount = card ? card.offsetWidth + 12 : el.clientWidth * 0.9;
    el.scrollBy({ left: dir * amount, behavior: 'smooth' });
  };

  const articles = useMemo(() => (data?.pages ?? []).flatMap((p) => p.data ?? []), [data]);

  // GSAP — entrée en cascade des cartes
  useEffect(() => {
    if (isLoading || !gridRef.current) return;
    const cards = gridRef.current.querySelectorAll('[data-card]');
    if (cards.length) {
      gsap.fromTo(cards, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.05, ease: 'power3.out', clearProps: 'all' });
    }
  }, [isLoading, articles.length]);

  const clearQuery = () => setSearchParams({}, { replace: true });

  return (
    <div>
      {/* ===== HERO plein écran — photo immersive · Djassa Online ===== */}
      <section className="relative overflow-hidden bg-[#0c0c0c] text-white" aria-label="Djassa Online">
        <img
          src="/images/hero-shopping-bags.jpg"
          alt="Sacs de shopping rouges et noirs sur fond noir"
          className="absolute inset-0 h-full w-full select-none object-cover object-[50%_34%]"
        />
        {/* Scrim global doux + voile bas pour la lisibilité du texte centré */}
        <div className="absolute inset-0 bg-[#0b0b0b]/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0b]/95 via-[#0b0b0b]/25 to-transparent" />

        <div className="relative flex min-h-[100svh] flex-col px-5 sm:px-6 md:min-h-[92vh] md:px-10 xl:px-16">
          {/* Nav intégrée — logo gauche · liens centre · Se connecter droite */}
          <div className="flex items-center justify-between gap-4 border-b border-white/10 py-4 md:py-5">
            <Link to="/" className="flex items-center gap-2.5" aria-label="Djassa Online — accueil">
              <img src="/images/logo-256.png" alt="" aria-hidden="true" className="h-9 w-9 rounded-xl shadow-[0_4px_16px_rgba(237,15,2,0.5)]" />
              <span className="font-jakarta text-[15px] font-extrabold uppercase leading-none tracking-tight text-white sm:text-[17px]">
                Djassa<span className="text-[#E60023]">&nbsp;Online</span>
              </span>
            </Link>
            <nav className="hidden items-center gap-7 font-jakarta text-[10.5px] font-bold uppercase tracking-[0.16em] text-white/85 lg:flex" aria-label="Navigation">
              <a href="#feed" className="transition hover:text-white">Catalogue</a>
              <Link to="/publier" className="transition hover:text-white">Vendre</Link>
              <Link to="/souhaits" className="transition hover:text-white">Souhaits</Link>
              <a href="#feed" className="transition hover:text-white">Boutiques Pro</a>
            </nav>
            {isAuthenticated ? (
              <Link to="/moi" className="inline-flex h-9 items-center rounded-full bg-[#ED0F02] px-4 font-jakarta text-[9.5px] font-extrabold uppercase tracking-[0.18em] text-white transition hover:bg-[#ff1e12] active:scale-95 sm:h-10 sm:px-5 sm:text-[10.5px]">
                Mon Djassa
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="hidden h-9 items-center rounded-full border border-white/45 px-4 font-jakarta text-[9.5px] font-extrabold uppercase tracking-[0.18em] text-white transition hover:border-white hover:bg-white/10 active:scale-95 sm:inline-flex sm:h-10 sm:px-5 sm:text-[10.5px]">
                  Se connecter
                </Link>
                <Link to="/register" className="inline-flex h-9 items-center rounded-full bg-[#ED0F02] px-4 font-jakarta text-[9.5px] font-extrabold uppercase tracking-[0.18em] text-white shadow-[0_8px_22px_rgba(237,15,2,0.5)] transition hover:bg-[#ff1e12] active:scale-95 sm:h-10 sm:px-5 sm:text-[10.5px]">
                  S'inscrire
                </Link>
              </div>
            )}
          </div>

          {/* Headline centré */}
          <div className="flex flex-1 flex-col items-center justify-center pb-28 pt-10 text-center sm:pb-32 sm:pt-12 md:pb-40 md:pt-16">
            <h1 className="font-jakarta text-[17vw] font-extrabold leading-[0.95] tracking-tight text-white sm:text-[88px] md:text-[96px]">
              Achète. Vends.<br /><span className="text-[#E60023]">Troque.</span>
            </h1>
            <p className="mt-7 max-w-lg font-inter text-[14px] font-medium leading-7 tracking-wide text-white/85 sm:text-[16px] sm:leading-8">
              Tout le Djassa dans ta poche — occasion, troc malin, neuf au meilleur prix. Payé en confiance, remis en main propre.
            </p>
            <div className="mt-9">
              <a href="#feed" className="inline-flex h-12 items-center gap-2 rounded-full bg-[#ED0F02] px-6 font-jakarta text-[12px] font-extrabold uppercase tracking-[0.16em] text-white shadow-[0_14px_36px_rgba(237,15,2,0.45)] transition hover:bg-[#ff1e12] active:scale-95 sm:h-14 sm:px-8 sm:text-[13px]">
                Explorer le marché <ArrowRight size={17} strokeWidth={2.8} />
              </a>
            </div>
          </div>

          {/* Barre de réassurance — 4 statistiques */}
          <div className="absolute inset-x-3 bottom-[78px] sm:inset-x-4 md:inset-x-8 md:bottom-6 xl:inset-x-12">
            <div className="grid grid-cols-2 divide-white/10 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md md:grid-cols-4 md:divide-x">
              <div className="flex flex-col gap-1.5 px-4 py-4 sm:px-6">
                <span className="flex items-center gap-1.5 text-white">
                  <Star size={15} className="fill-[#ED0F02] text-[#ED0F02]" />
                  <span className="font-jakarta text-base font-extrabold sm:text-lg">4.8/5</span>
                </span>
                <span className="font-inter text-[8.5px] font-medium uppercase tracking-[0.16em] text-white/60 sm:text-[9px]">Vendeurs notés</span>
              </div>
              <div className="flex flex-col gap-1.5 border-l border-white/10 px-4 py-4 sm:px-6 md:border-l-0">
                <span className="flex items-center gap-1.5 text-white">
                  <BadgeCheck size={15} className="text-[#ED0F02]" strokeWidth={2.6} />
                  <span className="font-jakarta text-base font-extrabold sm:text-lg">50+</span>
                </span>
                <span className="font-inter text-[8.5px] font-medium uppercase tracking-[0.16em] text-white/60 sm:text-[9px]">Boutiques vérifiées</span>
              </div>
              <div className="flex flex-col gap-1.5 border-t border-white/10 px-4 py-4 sm:px-6 md:border-t-0 md:border-l">
                <span className="flex items-center gap-1.5 text-white">
                  <Package size={15} className="text-[#ED0F02]" strokeWidth={2.2} />
                  <span className="font-jakarta text-base font-extrabold sm:text-lg">1 500+</span>
                </span>
                <span className="font-inter text-[8.5px] font-medium uppercase tracking-[0.16em] text-white/60 sm:text-[9px]">Articles publiés</span>
              </div>
              <div className="flex flex-col gap-1.5 border-l border-t border-white/10 px-4 py-4 sm:px-6 md:border-l md:border-t-0">
                <span className="flex items-center gap-1.5 text-white">
                  <ShieldCheck size={15} className="text-[#ED0F02]" strokeWidth={2.2} />
                  <span className="font-jakarta text-[13px] font-extrabold leading-tight sm:text-base">Escrow + PIN</span>
                </span>
                <span className="font-inter text-[8.5px] font-medium uppercase tracking-[0.16em] text-white/60 sm:text-[9px]">Paiement sécurisé</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Section OFFRES — split 50/50 : promo (gauche) + vitrine (droite) ===== */}
      <section className="bg-[#F7F1E6] py-8 sm:py-12" aria-label="Offres spéciales Djassa">
        <div className="mx-auto max-w-7xl px-3 sm:px-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch lg:gap-5 lg:min-h-[440px] xl:min-h-[480px]">

            {/* Colonne gauche — Boostez vos économies */}
            <div className="relative flex h-full min-h-[300px] flex-col rounded-3xl bg-[#FFFDF6] p-5 shadow-card ring-1 ring-djassa-black/5 sm:p-6 lg:min-h-0 lg:overflow-hidden">
              <div className="pointer-events-none absolute -left-14 top-8 h-36 w-36 rounded-full bg-djassa-red/5 blur-2xl" aria-hidden="true" />
              <div className="pointer-events-none absolute -right-10 bottom-6 h-40 w-40 rounded-full bg-yellow-400/10 blur-2xl" aria-hidden="true" />

              <div className="relative flex min-h-0 flex-1 flex-col justify-between gap-3">
                <div className="flex shrink-0 items-start justify-between gap-3">
                  <span className="inline-flex w-fit items-center gap-2 rounded-full bg-djassa-red/10 px-3 py-1.5 text-[9px] font-jakarta font-extrabold uppercase tracking-[0.22em] text-djassa-red">
                    <Zap size={11} strokeWidth={3} fill="currentColor" /> Offre spéciale
                  </span>
                  <img src="/images/promo-stamp.jpg" alt="PROMO" aria-hidden="true" className="pointer-events-none h-12 w-auto shrink-0 -rotate-[10deg] select-none object-contain opacity-90 sm:h-14 lg:h-16" loading="lazy" />
                </div>

                <div className="flex min-h-0 flex-1 items-center justify-center py-0.5">
                  <div className="relative flex aspect-square h-full max-h-28 w-auto items-center justify-center sm:max-h-36 lg:max-h-32 xl:max-h-40">
                    <div className="absolute inset-0 rounded-full bg-[#FBEEDD]" aria-hidden="true" />
                    <img src="/images/promo-megaphone.jpg" alt="Mégaphone Special Promo illustrant les offres" className="relative h-[88%] w-[88%] object-contain mix-blend-multiply" />
                  </div>
                </div>

                <div className="shrink-0 text-center lg:text-left">
                  <h2 className="font-jakarta text-[1.7rem] font-black leading-[0.98] tracking-tighter text-djassa-black sm:text-4xl lg:text-[2.25rem] xl:text-[2.75rem]">
                    Boostez vos<br />économies<span className="text-djassa-red">.</span>
                  </h2>
                  <p className="mx-auto mt-2 max-w-md font-inter text-[12px] leading-relaxed text-djassa-slate sm:text-[13px] lg:mx-0 lg:mt-2.5">
                    Ne ratez pas nos offres exclusives. Économisez sur l'occasion certifiée, le troc malin et le neuf boutique — directement sur le Djassa, en FCFA.
                  </p>
                  <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                    <a href="#feed" className="inline-flex h-11 items-center gap-2 rounded-full bg-djassa-black px-5 font-jakarta text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-white transition hover:bg-djassa-red active:scale-95 sm:px-6 sm:text-[11px]">
                      Voir les offres <ArrowRight size={15} strokeWidth={3} />
                    </a>
                    <Link to="/souhaits" className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-djassa-black px-4 font-jakarta text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-djassa-black transition hover:border-djassa-red hover:text-djassa-red active:scale-95 sm:px-5 sm:text-[11px]">
                      Publier un besoin
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne droite — Carrousel grandes cartes vitrines */}
            <div className="relative flex h-full min-h-[340px] flex-col overflow-hidden rounded-3xl bg-[#FFFDF6] shadow-card ring-1 ring-djassa-black/5 lg:min-h-0">
              <div className="flex items-center justify-between px-4 pt-4 sm:px-5 sm:pt-5">
                <h3 className="flex items-center gap-2 font-jakarta text-base font-extrabold tracking-tight text-djassa-black sm:text-lg">
                  <Zap size={16} className="text-[#ED0F02]" strokeWidth={2.6} fill="currentColor" />
                  Les offres à saisir
                  <span className="font-inter text-[9px] font-semibold uppercase tracking-[0.18em] text-djassa-slate">/ {promoItems.length}</span>
                </h3>
                <div className="hidden items-center gap-2 sm:flex">
                  <button onClick={() => scrollPromo(-1)} aria-label="Offre précédente" className="flex h-10 w-10 items-center justify-center rounded-full bg-djassa-black text-white shadow-md transition hover:bg-djassa-red active:scale-95">
                    <ChevronLeft size={18} strokeWidth={3} />
                  </button>
                  <button onClick={() => scrollPromo(1)} aria-label="Offre suivante" className="flex h-10 w-10 items-center justify-center rounded-full bg-djassa-red text-white shadow-pop transition hover:bg-djassa-red-strong active:scale-95">
                    <ChevronRight size={18} strokeWidth={3} />
                  </button>
                </div>
              </div>

              <div
                ref={carouselRef}
                className="no-scrollbar mt-3 flex min-h-0 flex-1 snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-4 sm:px-5 sm:pb-5"
                role="list"
                aria-label="Articles en promotion"
              >
                {isFlashLoading && promoItems.length === 0 && (
                  <div className="flex h-full w-[88%] shrink-0 animate-pulse flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-djassa-black/5 sm:w-[85%]">
                    <div className="flex-1 bg-djassa-cloud" />
                    <div className="space-y-2 p-4">
                      <div className="h-3 w-1/3 rounded bg-djassa-cloud" />
                      <div className="h-4 w-3/4 rounded bg-djassa-cloud" />
                      <div className="h-5 w-1/2 rounded bg-djassa-cloud" />
                    </div>
                  </div>
                )}
                {!isFlashLoading && promoItems.length === 0 && (
                  <div className="flex h-full w-full items-center justify-center rounded-2xl bg-white/70 p-6 text-center ring-1 ring-djassa-black/5">
                    <p className="font-inter text-sm text-djassa-slate">Aucune offre disponible pour le moment.</p>
                  </div>
                )}
                {promoItems.map((offer) => {
                  const isFlash = offer.kind === 'flash';
                  const discount = isFlash ? Math.round((1 - Number(offer.prix_actuel) / Number(offer.prix)) * 100) : null;
                  const trocable = offer.est_trocable || ['troc', 'mixte'].includes(offer.mode_transaction);
                  return (
                    <div
                      key={offer.id}
                      data-promo-card
                      role="listitem"
                      onClick={(e) => { if (!e.target.closest('button, a')) navigate(`/article/${offer.id}`); }}
                      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('button, a')) { e.preventDefault(); navigate(`/article/${offer.id}`); } }}
                      tabIndex={0}
                      className="group flex h-full w-[88%] shrink-0 cursor-pointer snap-start flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-djassa-black/6 transition hover:shadow-pop focus-visible:ring-djassa-red sm:w-[85%] lg:w-[82%]"
                    >
                      {/* Image produit — grande vitrine */}
                      <div className="relative min-h-0 flex-1 overflow-hidden bg-djassa-cloud">
                        <Link to={`/article/${offer.id}`} className="block h-full w-full" tabIndex={-1} aria-hidden="true">
                          {offer.image_principale ? (
                            <img src={offer.image_principale} alt={offer.titre} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center font-jakarta text-3xl font-extrabold text-djassa-black/15">Djassa</div>
                          )}
                        </Link>
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent" />
                        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5">
                          {isFlash && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#ED0F02] px-2.5 py-1 font-jakarta text-[10px] font-extrabold uppercase tracking-wide text-white shadow-md">
                              <Zap size={10} strokeWidth={3} fill="currentColor" /> -{discount}% • FLASH
                            </span>
                          )}
                          {!isFlash && (
                            <span className="inline-flex items-center rounded-full bg-djassa-black px-2.5 py-1 font-jakarta text-[10px] font-extrabold uppercase tracking-wide text-white shadow-md">
                              POPULAIRE
                            </span>
                          )}
                          {trocable && (
                            <span className="badge-troc !px-2 !py-1"><ArrowLeftRight size={10} strokeWidth={3.5} /> Troc</span>
                          )}
                          <span className="inline-flex rounded-full bg-white/95 px-2.5 py-1 font-jakarta text-[9px] font-bold uppercase tracking-[0.12em] text-djassa-black shadow-sm">
                            {CONDITION_LABELS[offer.condition] ?? offer.condition}
                          </span>
                        </div>
                        <span className="absolute bottom-3 left-3 rounded-full bg-black/55 px-2.5 py-1 font-inter text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                          {offer.categorie}
                        </span>
                      </div>

                      {/* Infos produit */}
                      <div className="flex flex-col px-4 py-3 sm:px-4 sm:py-3.5">
                        <Link to={`/article/${offer.id}`} className="block">
                          <h4 className="line-clamp-2 font-jakarta text-[15px] font-bold leading-snug tracking-[-0.015em] text-djassa-black transition group-hover:text-djassa-red sm:text-[16px]">{offer.titre}</h4>
                        </Link>
                        <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
                          <span className="font-jakarta text-[22px] font-extrabold tracking-tight text-[#E60023] sm:text-[24px]">{formatFCFA(offer.prix_actuel ?? offer.prix)}</span>
                          {isFlash && <span className="font-inter text-[11px] font-medium text-djassa-slate line-through">{formatFCFA(offer.prix)}</span>}
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="truncate font-inter text-[11px] text-djassa-slate">{offer.boutique?.nom_boutique ?? offer.proprietaire?.nom ?? 'Particulier'}{offer.quartier ? ` · ${offer.quartier}` : ''}</span>
                          <button
                            type="button"
                            onClick={() => navigate(`/article/${offer.id}${trocable ? '?troc=1' : ''}`)}
                            className="inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-full bg-[#ED0F02] px-4 font-jakarta text-[9px] font-extrabold uppercase tracking-[0.1em] text-white transition hover:bg-[#ff1e12] active:scale-95"
                          >
                            {trocable ? <><ArrowLeftRight size={11} strokeWidth={2.8} /> Troc</> : 'Voir'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Flèches mobile */}
              <div className="flex items-center justify-center gap-4 pb-4 sm:hidden">
                <button onClick={() => scrollPromo(-1)} aria-label="Offre précédente" className="flex h-11 w-11 items-center justify-center rounded-full bg-djassa-black text-white active:scale-95"><ChevronLeft size={20} strokeWidth={3} /></button>
                <button onClick={() => scrollPromo(1)} aria-label="Offre suivante" className="flex h-11 w-11 items-center justify-center rounded-full bg-djassa-red text-white active:scale-95"><ChevronRight size={20} strokeWidth={3} /></button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ===== Grille produits — pleine largeur ===== */}
      <div id="feed" className="mx-auto max-w-7xl space-y-4 px-3 py-5 sm:px-6 md:py-8">
        {q && (
          <div className="flex items-center justify-between gap-2">
            <p className="font-inter text-xs text-djassa-slate">Résultats pour « <span className="font-bold text-djassa-black">{q}</span> »</p>
            <button onClick={clearQuery} className="inline-flex items-center gap-1 rounded-full border border-djassa-black/15 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-djassa-slate transition hover:border-djassa-red hover:text-djassa-red">
              <X size={12} /> Effacer
            </button>
          </div>
        )}

        {isLoading ? (
          <div ref={gridRef} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
            {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : isError ? (
          <EmptyState title="Impossible de charger le fil" hint="Vérifiez que l'API Djassa est démarrée (:8899)." />
        ) : articles.length === 0 ? (
          <EmptyState
            art="search"
            title="Rien à afficher ici pour l'instant"
            hint={q ? `Aucun article trouvé pour « ${q} ». Essayez un autre mot-clé.` : 'Soyez le premier à publier dans ce rayon.'}
            action={<Link to="/publier" className="btn-red btn-sm">Publier un article</Link>}
          />
        ) : (
          <>
            <div ref={gridRef} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
              {articles.map((article) => (
                <div key={article.id} data-card>
                  <ProductCardWide article={article} />
                </div>
              ))}
            </div>
            {hasNextPage && (
              <div className="flex justify-center pt-2">
                <button className="btn-outline btn-sm" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                  {isFetchingNextPage ? <><Spinner size={15} /> Chargement…</> : 'Charger plus d’annonces'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
