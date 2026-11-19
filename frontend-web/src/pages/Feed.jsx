import { useEffect, useMemo, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { Star, Package, ShieldCheck, ArrowRight, BadgeCheck, X } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
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
          <div className="flex flex-1 flex-col items-center justify-center pb-28 pt-6 text-center sm:pb-32 md:pb-36">
            <h1 className="font-jakarta text-[15vw] font-extrabold leading-[0.92] tracking-tight text-white sm:text-7xl md:text-[92px] xl:text-[104px]">
              Achète.<br />Vends.<br /><span className="text-[#E60023]">Troque.</span>
            </h1>
            <p className="mt-4 max-w-md font-inter text-[12px] font-medium leading-snug text-white/80 sm:text-[15px]">
              Outillage, High-Tech, Mode, Électroménager — neuf ou seconde main, troc pur ou mixte avec soulte FCFA. Paiement Mobile Money sécurisé par code PIN.
            </p>
            <div className="mt-6">
              <a href="#feed" className="inline-flex h-12 items-center gap-2 rounded-full bg-[#ED0F02] px-6 font-jakarta text-[12px] font-extrabold uppercase tracking-[0.16em] text-white shadow-[0_14px_36px_rgba(237,15,2,0.45)] transition hover:bg-[#ff1e12] active:scale-95 sm:h-14 sm:px-8 sm:text-[13px]">
                Explorer le marché <ArrowRight size={17} strokeWidth={2.8} />
              </a>
            </div>
          </div>

          {/* Barre de réassurance — 4 statistiques */}
          <div className="absolute inset-x-3 bottom-[78px] sm:inset-x-4 md:inset-x-8 md:bottom-6 xl:inset-x-12">
            <div className="grid grid-cols-2 divide-white/10 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md md:grid-cols-4 md:divide-x">
              <div className="flex flex-col gap-1 px-4 py-3 sm:px-5">
                <span className="flex items-center gap-1.5 text-white">
                  <Star size={15} className="fill-[#ED0F02] text-[#ED0F02]" />
                  <span className="font-jakarta text-base font-extrabold sm:text-lg">4.8/5</span>
                </span>
                <span className="font-inter text-[8.5px] font-medium uppercase tracking-[0.14em] text-white/60 sm:text-[9px]">Vendeurs notés</span>
              </div>
              <div className="flex flex-col gap-1 border-l border-white/10 px-4 py-3 sm:px-5 md:border-l-0">
                <span className="flex items-center gap-1.5 text-white">
                  <BadgeCheck size={15} className="text-[#ED0F02]" strokeWidth={2.6} />
                  <span className="font-jakarta text-base font-extrabold sm:text-lg">50+</span>
                </span>
                <span className="font-inter text-[8.5px] font-medium uppercase tracking-[0.14em] text-white/60 sm:text-[9px]">Boutiques vérifiées</span>
              </div>
              <div className="flex flex-col gap-1 border-t border-white/10 px-4 py-3 sm:px-5 md:border-t-0 md:border-l">
                <span className="flex items-center gap-1.5 text-white">
                  <Package size={15} className="text-[#ED0F02]" strokeWidth={2.2} />
                  <span className="font-jakarta text-base font-extrabold sm:text-lg">1 500+</span>
                </span>
                <span className="font-inter text-[8.5px] font-medium uppercase tracking-[0.14em] text-white/60 sm:text-[9px]">Articles publiés</span>
              </div>
              <div className="flex flex-col gap-1 border-l border-t border-white/10 px-4 py-3 sm:px-5 md:border-l md:border-t-0">
                <span className="flex items-center gap-1.5 text-white">
                  <ShieldCheck size={15} className="text-[#ED0F02]" strokeWidth={2.2} />
                  <span className="font-jakarta text-[13px] font-extrabold leading-tight sm:text-base">Escrow + PIN</span>
                </span>
                <span className="font-inter text-[8.5px] font-medium uppercase tracking-[0.14em] text-white/60 sm:text-[9px]">Paiement sécurisé</span>
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
