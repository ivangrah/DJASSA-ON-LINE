import { useEffect, useMemo, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { Star, Package, ShieldCheck, ArrowRight, BadgeCheck, X, Flame, Zap, ChevronRight, ArrowLeftRight } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import { useQuery } from '@tanstack/react-query';
import { formatFCFA } from '../lib/format';
import { ProductCardSkeleton, EmptyState, Spinner } from '../components/ui';

export default function Feed() {
  const gridRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
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


  const { data: flashData, isLoading: isLoadingOffers } = useQuery({
    queryKey: ['products', 'flash'],
    queryFn: async () => (await api.get('/products/flash')).data,
    staleTime: 30_000,
  });
  const flashOffers = flashData?.data ?? [];

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

      {/* ===== Section PROMO — gris clair · les plus recherchés & meilleures offres ===== */}
      <section className="bg-[#ECEFF1] py-8 sm:py-10" aria-label="Promotions Djassa">
        <div className="mx-auto max-w-7xl px-3 sm:px-6">

          {/* En-tête de section */}
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-card ring-1 ring-djassa-black/10 sm:h-20 sm:w-20">
              <img src="/images/promo-megaphone.jpg" alt="Mégaphone SPECIAL PROMO" className="h-full w-full object-cover" loading="lazy" />
            </span>
            <div className="min-w-0">
              <p className="font-jakarta text-[9px] font-extrabold uppercase tracking-[0.28em] text-djassa-red sm:text-[11px]">Promo Djassa — ce qui part en ce moment</p>
              <h2 className="mt-0.5 font-jakarta text-2xl font-extrabold leading-[0.95] tracking-tight text-djassa-black sm:text-4xl">
                Les offres qui <span className="text-djassa-red">cartonnent.</span>
              </h2>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-12">
            {/* Carte gauche — LES PLUS RECHERCHÉS */}
            <div className="relative overflow-hidden rounded-3xl bg-white p-4 shadow-card ring-1 ring-djassa-black/5 sm:p-5 md:col-span-5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 rounded-full bg-djassa-red/10 px-3 py-1.5 text-[10px] font-jakarta font-extrabold uppercase tracking-[0.16em] text-djassa-red">
                  <Flame size={13} strokeWidth={2.6} /> Les plus recherchés
                </span>
                <span className="font-inter text-[9px] font-semibold uppercase tracking-[0.14em] text-djassa-slate">Hebdo</span>
              </div>

              <ol className="mt-4 space-y-3">
                {[
                  { rank: 1, name: 'Perceuse Bosch GSB 18V', cat: 'Outillage', searches: 240, width: '100%' },
                  { rank: 2, name: 'Groupe électrogène 2.5 kVA', cat: 'Électroménager', searches: 210, width: '88%' },
                  { rank: 3, name: 'iPhone 12 128 Go', cat: 'High-Tech', searches: 185, width: '76%' },
                  { rank: 4, name: 'Visseuse sans fil Makita', cat: 'Outillage', searches: 160, width: '66%' },
                  { rank: 5, name: 'Congélateur 250L', cat: 'Électroménager', searches: 128, width: '52%' },
                ].map((item) => (
                  <li key={item.rank} className="group flex items-center gap-3">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-jakarta text-[13px] font-extrabold ${item.rank === 1 ? 'bg-djassa-red text-white' : 'bg-djassa-cloud text-djassa-black'}`}>{item.rank}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate font-jakarta text-[11px] font-bold text-djassa-black sm:text-[12.5px]">{item.name}</p>
                        <span className="shrink-0 font-inter text-[9px] font-semibold text-djassa-slate">{item.searches}×</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="rounded-md bg-djassa-cloud px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-wide text-djassa-slate">{item.cat}</span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-djassa-cloud">
                          <div className="h-full rounded-full bg-gradient-to-r from-djassa-red to-orange-500" style={{ width: item.width }} />
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>

              <p className="mt-4 flex items-center gap-1.5 border-t border-djassa-black/8 pt-3 text-[9px] font-inter font-semibold uppercase tracking-[0.16em] text-djassa-slate">
                <ArrowLeftRight size={11} className="text-djassa-red" /> Troc activé sur 70% des annonces recherchées
              </p>
            </div>

            {/* Carte droite — MEILLEURES OFFRES */}
            <div className="relative overflow-hidden rounded-3xl bg-white p-4 shadow-card ring-1 ring-djassa-black/5 sm:p-5 md:col-span-7">
              {/* Tampon PROMO penché */}
              <img src="/images/promo-stamp.jpg" alt="PROMO" aria-hidden="true" className="pointer-events-none absolute -right-3 -top-5 h-24 w-auto rotate-[-8deg] select-none object-contain opacity-95 sm:-right-2 sm:-top-8 sm:h-32" loading="lazy" />

              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 rounded-full bg-djassa-black px-3 py-1.5 text-[10px] font-jakarta font-extrabold uppercase tracking-[0.16em] text-white">
                  <Zap size={13} strokeWidth={2.6} className="text-yellow-400" fill="#FDE68A" /> Meilleures offres
                </span>
                <span className="font-inter text-[9px] font-semibold uppercase tracking-[0.14em] text-djassa-slate">Ventes Flash</span>
              </div>

              <div className="mt-4 divide-y divide-djassa-black/8">
                {flashOffers.length === 0 && isLoadingOffers && (
                  Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 py-3">
                      <div className="h-16 w-16 animate-pulse rounded-2xl bg-djassa-cloud" />
                      <div className="flex-1 space-y-2"><div className="h-3 w-2/3 animate-pulse rounded bg-djassa-cloud" /><div className="h-3 w-1/3 animate-pulse rounded bg-djassa-cloud" /></div>
                    </div>
                  ))
                )}
                {flashOffers.map((offer) => {
                  const discount = Math.round((1 - Number(offer.prix_actuel) / Number(offer.prix)) * 100);
                  return (
                    <Link key={offer.id} to={`/article/${offer.id}`} className="group flex items-center gap-3 py-3 transition">
                      <img src={offer.image_principale} alt={offer.titre} className="h-16 w-16 shrink-0 rounded-2xl object-cover bg-djassa-cloud transition group-hover:scale-105 sm:h-20 sm:w-20" loading="lazy" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-jakarta text-[11px] font-bold leading-snug text-djassa-black transition group-hover:text-djassa-red sm:text-[12.5px]">{offer.titre}</p>
                        <p className="mt-0.5 flex items-baseline gap-2">
                          <span className="font-jakarta text-sm font-extrabold text-djassa-red sm:text-base">{formatFCFA(offer.prix_actuel)}</span>
                          <span className="font-inter text-[10px] text-djassa-slate line-through">{formatFCFA(offer.prix)}</span>
                        </p>
                        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-djassa-red/8 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-djassa-red">-{discount}% · {offer.boutique?.nom_boutique ?? 'Particulier'}</span>
                      </div>
                      <ChevronRight size={16} className="shrink-0 text-djassa-slate transition group-hover:translate-x-1 group-hover:text-djassa-red" />
                    </Link>
                  );
                })}
              </div>

              <a href="#feed" className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-full bg-djassa-black px-5 font-jakarta text-[10px] font-extrabold uppercase tracking-[0.16em] text-white transition hover:bg-djassa-red">
                Voir tout le catalogue <ArrowRight size={13} strokeWidth={2.8} />
              </a>
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
          <div ref={gridRef} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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
            <div ref={gridRef} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {articles.map((article) => (
                <div key={article.id} data-card>
                  <ProductCard article={article} />
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
