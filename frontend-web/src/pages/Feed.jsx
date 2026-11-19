import { useEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ArrowLeftRight, Zap, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';
import { MARKET_CATEGORIES } from '../lib/categories';
import ProductCard from '../components/ProductCard';
import FlashBanner from '../components/FlashBanner';
import { ProductCardSkeleton, EmptyState, Spinner } from '../components/ui';

const TABS = [
  { key: 'tout', label: 'Tout' },
  { key: 'occ', label: 'Seconde Main & Troc' },
  { key: 'neuf', label: 'Boutiques Neuves' },
];

export default function Feed() {
  const gridRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') ?? 'tout');
  const [category, setCategory] = useState(searchParams.get('category') ?? '');
  const [sort, setSort] = useState('latest');
  const q = searchParams.get('q') ?? '';
  const flashOnly = searchParams.get('flash') === '1';

  const queryParams = useMemo(() => {
    const p = { per_page: 12, sort };
    if (tab === 'occ') p.marche = 'occ';
    if (tab === 'neuf') p.marche = 'neuf';
    if (category) p.category = category;
    if (q) p.q = q;
    if (flashOnly) p.flash = 1;
    return p;
  }, [tab, category, q, sort, flashOnly]);

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
  const total = data?.pages?.[0]?.meta?.total ?? 0;

  // GSAP — entrée en cascade des cartes
  useEffect(() => {
    if (isLoading || !gridRef.current) return;
    const cards = gridRef.current.querySelectorAll('[data-card]');
    if (cards.length) {
      gsap.fromTo(cards, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.05, ease: 'power3.out', clearProps: 'all' });
    }
  }, [isLoading, articles.length]);

  const { data: flashData } = useQuery({
    queryKey: ['products', 'flash'],
    queryFn: async () => (await api.get('/products/flash')).data,
    staleTime: 30_000,
  });
  const flashItems = flashData?.data ?? [];

  const updateParams = (patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === '' || v === null || v === undefined) next.delete(k);
      else next.set(k, v);
    });
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="mx-auto max-w-7xl">
      {/* En-tête feed (noir, sobre) */}
      <section className="bg-djassa-black px-3 pb-4 pt-3 text-white sm:px-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-jakarta font-bold uppercase tracking-[0.22em] text-djassa-red-soft/80">Le Djassa, digital</p>
            <h1 className="font-jakarta text-lg font-extrabold leading-tight sm:text-2xl">
              Le bon plan <span className="text-djassa-red">près de chez vous</span>
            </h1>
          </div>
          <Link to="/souhaits" className="hidden items-center gap-1 rounded-full border border-white/15 px-3 py-1.5 text-[11px] font-semibold text-white/80 transition hover:border-djassa-red hover:text-white sm:inline-flex">
            Publier un souhait <ChevronRight size={12} />
          </Link>
        </div>

        {/* Onglets marché */}
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Type de marché">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => { setTab(t.key); updateParams({ tab: t.key === 'tout' ? null : t.key }); }}
              className={`whitespace-nowrap rounded-full px-4 py-2 font-jakarta text-xs font-bold transition ${tab === t.key ? 'bg-djassa-red text-white shadow-pop' : 'bg-white/10 text-white/80 hover:bg-white/15'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Rayons */}
        <div className="no-scrollbar mt-2.5 flex gap-2 overflow-x-auto pb-0.5" aria-label="Rayons">
          {MARKET_CATEGORIES.map(({ key, label, Icon }) => (
            <button
              key={key || 'all'}
              onClick={() => { setCategory(key); updateParams({ category: key || null }); }}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition ${category === key ? 'bg-white text-djassa-black' : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'}`}
            >
              <Icon size={13} strokeWidth={2.2} /> {label}
            </button>
          ))}
        </div>
      </section>

      <div className="space-y-4 px-3 py-4 sm:px-6">
        {/* Ventes Flash */}
        {flashItems.length > 0 && !q && <FlashBanner articles={flashItems} />}

        {/* Barre de tri / contexte */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-inter text-djassa-slate">
            {isLoading ? 'Chargement…' : (
              <><strong className="text-djassa-black">{total}</strong> annonce{total > 1 ? 's' : ''}{q && <> pour « <span className="font-semibold text-djassa-black">{q}</span> »</>}</>
            )}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold">
            {[
              { key: 'latest', label: 'Récents' },
              { key: 'price_asc', label: 'Prix ↑' },
              { key: 'price_desc', label: 'Prix ↓' },
            ].map((s) => (
              <button key={s.key} onClick={() => setSort(s.key)} className={`rounded-full px-2.5 py-1 ${sort === s.key ? 'bg-djassa-black text-white' : 'text-djassa-slate hover:text-djassa-black'}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grille */}
        {isLoading ? (
          <div ref={gridRef} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : isError ? (
          <EmptyState title="Impossible de charger le fil" hint="Vérifiez que l'API Djassa est démarrée (:8899)." />
        ) : articles.length === 0 ? (
          <EmptyState
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

        {/* Pied éditorial troc (signature) */}
        <aside className="flex items-center gap-3 rounded-2xl border border-djassa-red/25 bg-gradient-to-r from-djassa-red/5 to-transparent p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-djassa-red text-white"><ArrowLeftRight size={20} /></span>
          <div className="min-w-0 flex-1">
            <p className="font-jakarta text-xs font-extrabold text-djassa-black">Le troc Djassa, en 3 étapes</p>
            <p className="text-[11px] text-djassa-slate">Publiez → proposez vos articles + une soulte → échangez avec code PIN. Zéro arnaque.</p>
          </div>
          <Link to="/publier" className="btn-red btn-sm shrink-0"><Zap size={14} /> Publier</Link>
        </aside>
      </div>
    </div>
  );
}
