import { lazy, memo, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useSearchParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Star, Package, ShieldCheck, ArrowRight, BadgeCheck, X, Tag, Zap, ChevronLeft, ChevronRight, ArrowLeftRight, ChevronDown, Search, SlidersHorizontal, ShoppingCart, Check, ChevronUp } from 'lucide-react';
gsap.registerPlugin(ScrollTrigger);
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import ProductCardWide from '../components/ProductCardWide';
import ProductGallery from '../components/ProductGallery';
import MobileMenu from '../components/MobileMenu';
const DjassaLogo3D = lazy(() => import('../components/DjassaLogo3D'));
const MemoProductCardWide = memo(ProductCardWide);
import { CONDITION_LABELS, formatFCFA } from '../lib/format';
import { ProductCardSkeleton, EmptyState, Spinner } from '../components/ui';

export default function Feed() {
  const heroRef = useRef(null);
  const promoRef = useRef(null);
  const gridRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { isAuthenticated, dashboardPath } = useAuth();
  const cart = useCart();
  const { count: cartCount } = cart;
  const toast = useToast();
  const navigate = useNavigate();
  const q = searchParams.get('q') ?? '';
  const sort = searchParams.get('sort') ?? 'latest';
  const category = searchParams.get('category') ?? '';
  const marche = searchParams.get('marche') ?? '';
  const [searchInput, setSearchInput] = useState(q);
  const [visiblePages, setVisiblePages] = useState(1);

  const queryParams = useMemo(
    () => ({
      per_page: 12,
      sort,
      ...(q ? { q } : {}),
      ...(category ? { category } : {}),
      ...(marche ? { marche } : {}),
    }),
    [q, sort, category, marche],
  );

  // Synchronise le champ avec l'URL (navigation / retour arrière)
  useEffect(() => { setSearchInput(q); }, [q]);
  // Replie la liste quand un filtre ou le tri change
  useEffect(() => { setVisiblePages(1); }, [q, sort, category, marche]);

  const updateParams = (mutate) => setSearchParams((prev) => {
    const next = new URLSearchParams(prev);
    mutate(next);
    return next;
  });

  // Debounce 300 ms sur la recherche (règle 3) — évite un appel API par frappe.
  useEffect(() => {
    if (searchInput === q) return undefined;
    const timer = setTimeout(() => {
      updateParams((next) => {
        const value = searchInput.trim();
        if (value) next.set('q', value);
        else next.delete('q');
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, q]);

  const submitSearch = (e) => {
    e.preventDefault();
    const value = searchInput.trim();
    updateParams((next) => {
      if (value) next.set('q', value);
      else next.delete('q');
    });
  };

  const addPromoToCart = (e, offer) => {
    e.preventDefault();
    e.stopPropagation();
    if (cart.has(offer.id)) { toast.info('Déjà dans votre panier.'); return; }
    if (cart.add(offer)) toast.success('Article ajouté au panier.');
  };

  const clearQuery = () => { setSearchInput(''); updateParams((next) => next.delete('q')); };
  const clearCategory = () => updateParams((next) => next.delete('category'));
  const clearMarche = () => updateParams((next) => next.delete('marche'));
  const setSort = (value) => updateParams((next) => next.set('sort', value));

  const {
    data,
    isLoading,
    isFetching,
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

  const articles = useMemo(
    () => (data?.pages ?? []).slice(0, visiblePages).flatMap((p) => p.data ?? []),
    [data, visiblePages],
  );
  const loadedPages = data?.pages?.length ?? 0;
  const canLoadMore = hasNextPage || visiblePages < loadedPages;

  const loadMore = async () => {
    if (visiblePages < loadedPages) { setVisiblePages((v) => v + 1); return; }
    const res = await fetchNextPage();
    if (!res?.error) setVisiblePages((v) => v + 1);
  };

  const collapseList = () => {
    setVisiblePages(1);
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const total = data?.pages?.[0]?.meta?.total ?? articles.length;

  // Navigation vers le catalogue : recale après le pin ScrollTrigger du hero
  const scrollToFeed = (e) => {
    e.preventDefault();
    const el = document.getElementById('feed');
    if (!el) return;
    ScrollTrigger.refresh();
    window.requestAnimationFrame(() => {
      const y = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  };

  // Arrivée sur /#feed (footer, menu mobile, partage, retour navigateur)
  // Le hash doit être surveillé : un Link clique depuis l'accueil ne remonte pas le composant.
  useEffect(() => {
    if (location.hash !== '#feed') return undefined;
    const t = window.setTimeout(() => {
      const el = document.getElementById('feed');
      if (!el) return;
      ScrollTrigger.refresh();
      const y = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }, 250);
    return () => window.clearTimeout(t);
  }, [location.hash, location.key]);

  // Liens filtrés (catégorie, Boutiques Pro) : on rejoint directement la grille
  useEffect(() => {
    if (!category && !marche) return undefined;
    const t = window.setTimeout(() => {
      const el = document.getElementById('feed');
      if (!el) return;
      ScrollTrigger.refresh();
      const y = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }, 150);
    return () => window.clearTimeout(t);
  }, [category, marche]);

  // GSAP — entrée en cascade des cartes
  useEffect(() => {
    if (isLoading || !gridRef.current) return;
    const cards = gridRef.current.querySelectorAll('[data-card]');
    if (cards.length) {
      gsap.fromTo(cards, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.05, ease: 'power3.out', clearProps: 'all' });
    }
  }, [isLoading, articles.length]);

  // GSAP — animations d'entrée du hero (une seule fois, puis statique)
  useLayoutEffect(() => {
    if (!heroRef.current) return undefined;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scope = heroRef.current;
    const q = (sel) => scope.querySelectorAll(sel);

    const ctx = gsap.context(() => {
      const lines = q('[data-hero-line]');
      const sub = scope.querySelector('[data-hero-sub]');
      const cta = scope.querySelector('[data-hero-cta]');
      const nav = scope.querySelector('[data-hero-nav]');
      const visuals = q('[data-hero-visual]');
      const stats = scope.querySelector('[data-hero-stats]');

      if (reduce) {
        gsap.set([...lines, sub, cta, nav, ...visuals, stats].filter(Boolean), { clearProps: 'all' });
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.1 });
      if (nav) tl.from(nav, { y: -18, opacity: 0, duration: 0.6 }, 0);
      if (lines.length) {
        tl.from(lines, { yPercent: 115, opacity: 0, duration: 0.85, stagger: 0.14, ease: 'power4.out', clearProps: 'transform,opacity' }, 0.1);
      }
      if (sub) tl.from(sub, { y: 16, opacity: 0, duration: 0.6 }, '-=0.45');
      if (cta) tl.from(cta, { y: 14, opacity: 0, scale: 0.96, duration: 0.55, ease: 'back.out(1.7)' }, '-=0.4');
      if (visuals.length) {
        tl.from(visuals, {
          scale: 0.82, opacity: 0, x: (i) => (i === 0 ? 34 : i === 1 ? -34 : 0),
          duration: 0.9, stagger: 0.12, ease: 'back.out(1.5)', clearProps: 'transform,opacity',
        }, 0.25);
      }
      if (stats) tl.from(stats, { y: 28, opacity: 0, duration: 0.7 }, '-=0.5');
      q('[data-hero-count]').forEach((el) => {
        const target = Number(el.dataset.heroCount);
        const decimals = Number(el.dataset.decimals ?? 0);
        const suffix = el.dataset.suffix ?? '';
        const obj = { v: 0 };
        tl.to(obj, {
          v: target, duration: 1.3, ease: 'power2.out',
          onUpdate: () => {
            const n = obj.v.toFixed(decimals);
            const value = el.hasAttribute('data-thousands') && decimals === 0
              ? Math.round(obj.v).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ')
              : n;
            el.textContent = value + suffix;
          },
        }, '-=1.0');
      });
    }, heroRef);

    // GSAP — scroll pinned : le hero se démonte pour laisser place à la section promo
    const ctxScroll = gsap.context(() => {
      if (!heroRef.current || !promoRef.current) return;
      if (reduce) return;

      const s = heroRef.current;
      const sq = (sel) => s.querySelectorAll(sel);
      const bg = s.querySelector('[data-hero-bg]');
      const veil = s.querySelector('[data-hero-veil]');
      const cue = s.querySelector('[data-hero-cue]');
      const progress = s.querySelector('[data-hero-progress]');
      const heroNav = s.querySelector('[data-hero-nav]');
      const heroSub = s.querySelector('[data-hero-sub]');
      const heroCta = s.querySelector('[data-hero-cta]');
      const heroStats = s.querySelector('[data-hero-stats]');
      const heroVisuals = sq('[data-hero-visual]');
      const heroLines = sq('[data-hero-line]');
      const lineA = heroLines[0];
      const lineB = heroLines[1];

      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: '+=65%',
          pin: true,
          pinType: 'transform',
          scrub: 0.25,
          anticipatePin: 1,
          onUpdate: (self) => {
            if (progress) gsap.set(progress, { scaleX: self.progress });
          },
        },
      });

      // Zoom du fond qui recule
      if (bg) scrollTl.fromTo(bg, { scale: 1, z: 0 }, { scale: 1.35, z: 120, opacity: 0.45, ease: 'none' }, 0);

      // Titre : les deux lignes s'écartent en sens opposés
      if (lineA) scrollTl.fromTo(lineA, { yPercent: 0, opacity: 1 }, { yPercent: -130, opacity: 0, ease: 'power2.in' }, 0);
      if (lineB) scrollTl.fromTo(lineB, { yPercent: 0, opacity: 1 }, { yPercent: 130, opacity: 0, ease: 'power2.in' }, 0);

      // Sous-titre, CTA et nav s'effacent
      if (heroSub) scrollTl.to(heroSub, { y: -30, opacity: 0, ease: 'power2.in' }, 0);
      if (heroCta) scrollTl.to(heroCta, { y: 30, opacity: 0, ease: 'power2.in' }, 0);
      if (heroNav) scrollTl.to(heroNav, { y: -30, opacity: 0, ease: 'power2.in' }, 0);

      // Illustrations qui se dispersent vers les bords
      if (heroVisuals.length) {
        scrollTl.to(heroVisuals, {
          x: (i) => (i === 0 ? 90 : i === 1 ? -90 : -40),
          y: -30, scale: 0.88, opacity: 0, ease: 'power2.in', stagger: 0.05,
        }, 0);
      }

      // Stats qui descendent
      if (heroStats) scrollTl.to(heroStats, { y: 70, opacity: 0, ease: 'power2.in' }, 0);
      if (cue) scrollTl.to(cue, { opacity: 0, y: 12, ease: 'power2.in' }, 0);

      // Voile crème fondu en fin de scroll → transition douce avec la section suivante
      if (veil) scrollTl.fromTo(veil, { opacity: 0 }, { opacity: 1, ease: 'power1.inOut' }, 0.4);

      // timeline d'entrée détaillée de la section promo
      const promo = promoRef.current;
      const pq = (sel) => promo.querySelectorAll(sel);
      const cols = pq('[data-promo-col]');
      const badge = promo.querySelector('[data-promo-badge]');
      const stamp = promo.querySelector('[data-promo-stamp]');
      const illustration = promo.querySelector('[data-promo-illustration]');
      const title = promo.querySelector('[data-promo-title]');
      const desc = promo.querySelector('[data-promo-desc]');
      const buttons = promo.querySelector('[data-promo-buttons]');
      const rHeader = promo.querySelector('[data-promo-header]');
      const arrows = promo.querySelector('[data-promo-arrows]');
      const cards = pq('[data-promo-card]');

      const promoTl = gsap.timeline({
        scrollTrigger: { trigger: promo, start: 'top 80%', toggleActions: 'play none none reverse' },
      });

      // Les 2 blocs arrivent
      promoTl.from(cols, { y: 56, opacity: 0, duration: 0.8, stagger: 0.14, ease: 'power3.out', clearProps: 'transform,opacity' }, 0);

      // Bloc gauche : badge, tampon (rotation), mégaphone (pop), titre, desc, boutons
      if (badge) promoTl.from(badge, { scale: 0.7, opacity: 0, duration: 0.5, ease: 'back.out(2)' }, 0.25);
      if (stamp) promoTl.from(stamp, { scale: 0.4, rotation: -35, opacity: 0, duration: 0.6, ease: 'back.out(2)' }, 0.35);
      if (illustration) promoTl.from(illustration, { scale: 0.65, y: 20, opacity: 0, duration: 0.75, ease: 'back.out(1.6)' }, 0.4);
      if (title) promoTl.from(title, { y: 26, opacity: 0, duration: 0.6, ease: 'power3.out' }, 0.55);
      if (desc) promoTl.from(desc, { y: 18, opacity: 0, duration: 0.55 }, 0.68);
      if (buttons) promoTl.from(buttons, { y: 16, opacity: 0, duration: 0.55 }, 0.8);

      // Bloc droit : header, flèches, cartes en cascade
      if (rHeader) promoTl.from(rHeader, { y: -18, opacity: 0, duration: 0.5 }, 0.4);
      if (arrows) promoTl.from(arrows, { scale: 0.7, opacity: 0, duration: 0.5, ease: 'back.out(2)' }, 0.55);
      if (cards.length) {
        promoTl.from(Array.from(cards).slice(0, 4), {
          y: 44, opacity: 0, scale: 0.94, duration: 0.65, stagger: 0.1, ease: 'power3.out', clearProps: 'transform,opacity',
        }, 0.5);
      }
    }, heroRef);

    return () => { ctx.revert(); ctxScroll.revert(); };
  }, []);

  return (
    <div>
      {/* ===== HERO plein écran — photo immersive · Djassa Online ===== */}
      <section ref={heroRef} className="relative overflow-hidden bg-[#121212] text-white" aria-label="Djassa Online">
        <img
          data-hero-bg
          src="/images/hero-shopping-bags.webp"
          alt="Sacs de shopping rouges et noirs sur fond noir"
          className="absolute inset-0 h-full w-full select-none object-cover object-[50%_34%]"
         loading="eager" decoding="async" fetchPriority="high" />
        {/* Scrim global doux + voile bas pour la lisibilité du texte centré */}
        <div className="absolute inset-0 bg-[#121212]/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212]/95 via-[#121212]/25 to-transparent" />

        {/* Barre de progression du scroll */}
        <div className="absolute inset-x-0 top-0 z-30 h-[3px] bg-white/10">
          <div data-hero-progress className="h-full w-full origin-left scale-x-0 bg-[#780000]" />
        </div>

        <div className="relative flex min-h-[100svh] flex-col px-5 sm:px-6 md:min-h-[100svh] md:px-10 xl:px-16">
          {/* Nav intégrée — logo gauche · liens centre · Se connecter droite */}
          <div data-hero-nav className="relative flex items-center justify-between gap-4 py-3 md:py-4">
            <Link to="/" className="flex items-center gap-2.5" aria-label="Djassa Online — accueil">
              <Suspense fallback={<img src="/images/logo-mark.svg" alt="" className="h-12 w-12 animate-pulse" />}>
                <DjassaLogo3D
                  svgUrl="/images/logo-mark.svg"
                  tiltDeg={-16}
                  className="h-12 w-12 shrink-0 md:h-14 md:w-14"
                />
              </Suspense>
              <span className="font-spacegrotesk text-[15px] font-extrabold uppercase leading-none tracking-tight text-white sm:text-[17px]">
                Djassa<span className="text-djassa-gray">&nbsp;Online</span>
              </span>
            </Link>
            <MobileMenu />
            <nav className="hidden items-center gap-7 font-spacegrotesk text-[10.5px] font-bold uppercase tracking-[0.16em] text-white/85 lg:flex" aria-label="Navigation">
              <a href="#feed" onClick={scrollToFeed} className="transition hover:text-white">Catalogue</a>
              <Link to="/publier" className="transition hover:text-white">Vendre</Link>
              <Link to="/souhaits" className="transition hover:text-white">Souhaits</Link>
              <Link to="/?marche=neuf" className="transition hover:text-white">Boutiques Pro</Link>
            </nav>
            {isAuthenticated ? (
              <Link to={dashboardPath || '/choisir-offre'} className="hidden h-9 items-center rounded-[5px] bg-[#780000] px-4 font-spacegrotesk text-[9.5px] font-extrabold uppercase tracking-[0.18em] text-white transition hover:bg-[#780000] active:scale-95 sm:h-10 sm:px-5 sm:text-[10.5px] lg:inline-flex">
                Mon Djassa
              </Link>
            ) : (
              <div className="hidden items-center gap-2 lg:flex">
                <Link to="/login" className="hidden h-9 items-center rounded-[5px] bg-white/10 px-4 font-spacegrotesk text-[9.5px] font-extrabold uppercase tracking-[0.18em] text-white backdrop-blur transition hover:bg-white/20 active:scale-95 sm:inline-flex sm:h-10 sm:px-5 sm:text-[10.5px]">
                  Se connecter
                </Link>
                <Link to="/register" className="inline-flex h-9 items-center rounded-[5px] bg-[#780000] px-4 font-spacegrotesk text-[9.5px] font-extrabold uppercase tracking-[0.18em] text-white shadow-[0_8px_22px_rgba(120,0,0,0.5)] transition hover:bg-[#780000] active:scale-95 sm:h-10 sm:px-5 sm:text-[10.5px]">
                  S'inscrire
                </Link>
              </div>
            )}
          </div>

          {/* Visuel e-commerce — mobile (au-dessus du titre) */}
          <img
            src="/images/illustrations/hero-cart-3d.webp"
            alt="Panier Djassa sur mobile — achats en ligne et livraison"
            data-hero-visual
            className="art-warm pointer-events-none relative z-0 mx-auto -mb-1 mt-0 w-[150px] select-none object-contain opacity-95 drop-shadow-[0_18px_30px_rgba(0,0,0,0.55)] sm:w-[200px] lg:hidden"
           loading="eager" decoding="async" fetchPriority="high" />

          {/* Headline centré */}
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center pb-[224px] pt-2 text-center sm:pb-40 sm:pt-8 md:pb-44 md:pt-10">
            <h1 className="font-spacegrotesk text-[15vw] font-extrabold leading-[0.95] tracking-tight text-white sm:text-[80px] md:text-[84px]">
              <span className="block overflow-hidden"><span data-hero-line className="block">Achète. Vends.</span></span>
              <span className="block overflow-hidden"><span data-hero-line className="block text-[#780000]">Troque.</span></span>
            </h1>
            <p data-hero-sub className="mt-6 max-w-lg font-DM-Sans text-[13px] font-medium leading-6 tracking-wide text-white/85 sm:text-[14px] sm:leading-7">
              Tout le Djassa dans ta poche — occasion, troc malin, neuf au meilleur prix. Payé en confiance, remis en main propre.
            </p>
            <div data-hero-cta className="mt-8">
              <a href="#feed" onClick={scrollToFeed} className="inline-flex h-11 items-center gap-2 rounded-[5px] bg-[#780000] px-6 font-spacegrotesk text-[11.5px] font-extrabold uppercase tracking-[0.16em] text-white shadow-[0_12px_30px_rgba(120,0,0,0.38)] transition hover:bg-[#780000] active:scale-95 sm:h-12 sm:px-7 sm:text-[12px]">
                Explorer le marché <ArrowRight size={16} strokeWidth={2.8} />
              </a>
            </div>
          </div>

          {/* Visuels e-commerce — desktop (flottants + légendes) */}
          <div data-hero-visual className="pointer-events-none absolute right-[2%] top-[38%] z-0 hidden w-[clamp(300px,26vw,460px)] -translate-y-1/2 flex-col items-center xl:flex">
            <img src="/images/illustrations/hero-cart-3d.webp" alt="Panier Djassa sur mobile — achats en ligne et livraison" className="art-warm w-full select-none object-contain opacity-95 drop-shadow-[0_30px_60px_rgba(0,0,0,0.6)]"  loading="eager" decoding="async" fetchPriority="high" />
            <div className="mt-1 rounded-[5px] bg-black/55 px-3.5 py-1.5 text-center shadow-card backdrop-blur-md">
              <p className="font-spacegrotesk text-[10px] font-extrabold uppercase tracking-[0.14em] text-white">Livré en confiance</p>
              <p className="font-DM-Sans text-[9px] text-white/65">Paiement sécurisé · Escrow + PIN</p>
            </div>
          </div>
          <div data-hero-visual className="pointer-events-none absolute left-[0%] top-[40%] z-0 hidden w-[clamp(280px,25vw,440px)] -translate-y-1/2 flex-col items-center xl:flex">
            <img src="/images/hero-bags-burst.webp" alt="Sacs de shopping et cadeaux Djassa" className="w-full select-none object-contain opacity-90 drop-shadow-[0_30px_60px_rgba(0,0,0,0.6)]"  loading="eager" decoding="async" fetchPriority="high" />
            <div className="mt-1 rounded-[5px] bg-black/70 px-3.5 py-1.5 text-center shadow-card backdrop-blur-md">
              <p className="font-spacegrotesk text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#780000]">Occasion & Troc</p>
              <p className="font-DM-Sans text-[9px] text-white/65">Le bon plan seconde main</p>
            </div>
          </div>
          {/* Indicateur de scroll */}
          <div data-hero-cue className="pointer-events-none absolute bottom-[100px] left-1/2 z-20 hidden -translate-x-1/2 flex-col items-center gap-1.5 md:flex md:bottom-[96px]">
            <span className="font-spacegrotesk text-[9px] font-extrabold uppercase tracking-[0.2em] text-white/65">Scroll pour découvrir</span>
            <ChevronDown size={16} className="text-[#780000]" strokeWidth={3} />
          </div>

          {/* Barre de réassurance — 4 statistiques */}
          <div data-hero-stats className="absolute inset-x-3 bottom-[78px] sm:inset-x-4 md:inset-x-8 md:bottom-6 xl:inset-x-12">
            <div className="grid grid-cols-2 divide-white/10 rounded-[5px] bg-black/60 shadow-card backdrop-blur-md md:grid-cols-4 md:divide-x">
              <div className="flex flex-col gap-1 px-4 py-3.5 sm:px-5">
                <span className="flex items-center gap-1.5 text-white">
                  <Star size={14} className="fill-[#780000] text-[#780000]" />
                  <span data-hero-count="4.8" data-decimals="1" data-suffix="/5" className="font-spacegrotesk text-base font-extrabold sm:text-lg">4.8/5</span>
                </span>
                <span className="font-DM-Sans text-[8px] font-medium uppercase tracking-[0.16em] text-white/60 sm:text-[8.5px]">Vendeurs notés</span>
              </div>
              <div className="flex flex-col gap-1 px-4 py-3.5 sm:px-5">
                <span className="flex items-center gap-1.5 text-white">
                  <BadgeCheck size={14} className="text-[#780000]" strokeWidth={2.6} />
                  <span data-hero-count="50" data-suffix="+" className="font-spacegrotesk text-base font-extrabold sm:text-lg">50+</span>
                </span>
                <span className="font-DM-Sans text-[8px] font-medium uppercase tracking-[0.16em] text-white/60 sm:text-[8.5px]">Boutiques vérifiées</span>
              </div>
              <div className="flex flex-col gap-1 px-4 py-3.5 sm:px-5">
                <span className="flex items-center gap-1.5 text-white">
                  <Package size={14} className="text-[#780000]" strokeWidth={2.2} />
                  <span data-hero-count="1500" data-suffix="+" data-thousands className="font-spacegrotesk text-base font-extrabold sm:text-lg">1 500+</span>
                </span>
                <span className="font-DM-Sans text-[8px] font-medium uppercase tracking-[0.16em] text-white/60 sm:text-[8.5px]">Articles publiés</span>
              </div>
              <div className="flex flex-col gap-1 px-4 py-3.5 sm:px-5">
                <span className="flex items-center gap-1.5 text-white">
                  <ShieldCheck size={14} className="text-[#780000]" strokeWidth={2.2} />
                  <span className="font-spacegrotesk text-[12px] font-extrabold leading-tight sm:text-base">Escrow + PIN</span>
                </span>
                <span className="font-DM-Sans text-[8px] font-medium uppercase tracking-[0.16em] text-white/60 sm:text-[8.5px]">Paiement sécurisé</span>
              </div>
            </div>
          </div>
        </div>

        {/* Voile crème — transition vers la section promo pendant le scroll pinné */}
        <div data-hero-veil className="pointer-events-none absolute inset-0 z-20 bg-djassa-cream opacity-0" />
      </section>

      {/* ===== Section OFFRES — split 50/50 : promo (gauche) + vitrine (droite) ===== */}
      <section ref={promoRef} className="bg-djassa-cream py-8 sm:py-12" aria-label="Offres spéciales Djassa">
        <div className="mx-auto max-w-7xl px-3 sm:px-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch lg:gap-5 lg:min-h-[440px] xl:min-h-[480px]">

            {/* Colonne gauche — Boostez vos économies */}
            <div data-promo-col className="relative flex h-full min-h-[300px] flex-col rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] p-5 shadow-card sm:p-6 lg:min-h-0 lg:overflow-hidden">
              <div data-promo-glow className="pointer-events-none absolute -left-14 top-8 h-36 w-36 rounded-[5px] bg-djassa-red/5 blur-2xl" aria-hidden="true" />
              <div className="pointer-events-none absolute -right-10 bottom-6 h-40 w-40 rounded-[5px] bg-yellow-400/10 blur-2xl" aria-hidden="true" />
              <div className="relative flex min-h-0 flex-1 flex-col justify-between gap-3">
                <div className="flex shrink-0 items-start justify-between gap-3">
                  <span data-promo-badge className="inline-flex w-fit items-center gap-2 rounded-[5px] bg-djassa-red/10 px-3 py-1.5 text-[9px] font-spacegrotesk font-extrabold uppercase tracking-[0.22em] text-djassa-red">
                    <Zap size={20} strokeWidth={3} fill="currentColor" /> Offre spéciale
                  </span>
                  <img data-promo-stamp src="/images/promo-stamp.webp" alt="PROMO" aria-hidden="true" className="pointer-events-none h-12 w-auto shrink-0 -rotate-[10deg] select-none object-contain opacity-90 sm:h-14 lg:h-16" loading="lazy" />
                </div>

                <div className="flex min-h-0 flex-1 items-center justify-center py-1">
                  <div data-promo-illustration className="relative flex aspect-square h-full max-h-36 w-auto items-center justify-center sm:max-h-44 lg:max-h-44 xl:max-h-52">
                    <div className="absolute inset-0 rounded-[5px] bg-[#FFF1F2]" aria-hidden="true" />
                    <img src="/images/promo-megaphone.webp" alt="Mégaphone Special Promo illustrant les offres" className="relative h-[88%] w-[88%] object-contain mix-blend-multiply"  loading="lazy" decoding="async" />
                  </div>
                </div>

                <div className="shrink-0 text-center lg:text-left">
                  <h2 data-promo-title className="font-spacegrotesk text-[1.7rem] font-black leading-[0.98] tracking-tighter text-djassa-black sm:text-4xl lg:text-[2.25rem] xl:text-[2.75rem]">
                    Boostez vos<br />économies<span className="text-djassa-red">.</span>
                  </h2>
                  <p data-promo-desc className="mx-auto mt-2 max-w-md font-DM-Sans text-[12px] leading-relaxed text-djassa-black/70 sm:text-[13px] lg:mx-0 lg:mt-2.5">
                    Ne ratez pas nos offres exclusives. Économisez sur l'occasion certifiée, le troc malin et le neuf boutique — directement sur le Djassa, en FCFA.
                  </p>
                  <div data-promo-buttons className="mt-3.5 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                    <a href="#feed" onClick={scrollToFeed} className="inline-flex h-11 items-center gap-2 rounded-[5px] bg-djassa-black px-5 font-spacegrotesk text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-white transition hover:bg-djassa-red active:scale-95 sm:px-6 sm:text-[11px]">
                      Voir les offres <ArrowRight size={24} strokeWidth={3} />
                    </a>
                    <Link to="/souhaits" className="inline-flex h-11 items-center gap-2 rounded-[5px] bg-djassa-cream px-4 font-spacegrotesk text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-djassa-black shadow-card transition hover:text-djassa-red active:scale-95 sm:px-5 sm:text-[11px]">
                      Publier un besoin
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne droite — Carrousel grandes cartes vitrines */}
            <div data-promo-col className="relative flex h-full min-h-[340px] flex-col overflow-hidden rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] shadow-card lg:min-h-0">
              <div data-promo-header className="flex items-center justify-between px-4 pt-4 sm:px-5 sm:pt-5">
                <h3 className="flex items-center gap-2 font-spacegrotesk text-base font-extrabold tracking-tight text-djassa-black sm:text-lg">
                  <Zap size={16} className="text-[#780000]" strokeWidth={2.6} fill="currentColor" />
                  Les offres à saisir
                  <span className="font-DM-Sans text-[9px] font-semibold uppercase tracking-[0.18em] text-djassa-black/70">/ {promoItems.length}</span>
                </h3>
                <div data-promo-arrows className="hidden items-center gap-2 sm:flex">
                  <button onClick={() => scrollPromo(-1)} aria-label="Offre précédente" className="flex h-10 w-10 items-center justify-center rounded-[5px] bg-djassa-black text-white shadow-md transition hover:bg-djassa-red active:scale-95">
                    <ChevronLeft size={18} strokeWidth={3} />
                  </button>
                  <button onClick={() => scrollPromo(1)} aria-label="Offre suivante" className="flex h-10 w-10 items-center justify-center rounded-[5px] bg-djassa-red text-white shadow-pop transition hover:bg-djassa-red-strong active:scale-95">
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
                  <div className="flex h-full w-[88%] shrink-0 animate-pulse flex-col overflow-hidden rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] shadow-card sm:w-[85%]">
                    <div className="flex-1 bg-djassa-cloud" />
                    <div className="space-y-2 p-4">
                      <div className="h-3 w-1/3 rounded-[5px] bg-djassa-cloud" />
                      <div className="h-4 w-3/4 rounded-[5px] bg-djassa-cloud" />
                      <div className="h-5 w-1/2 rounded-[5px] bg-djassa-cloud" />
                    </div>
                  </div>
                )}
                {!isFlashLoading && promoItems.length === 0 && (
                  <div className="flex h-full w-full items-center justify-center rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] p-6 text-center shadow-card">
                    <p className="font-DM-Sans text-sm text-djassa-black/70">Aucune offre disponible pour le moment.</p>
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
                      className="group flex h-full w-[232px] shrink-0 cursor-pointer snap-start flex-col overflow-hidden rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] shadow-card transition hover:shadow-pop focus-visible:ring-2 focus-visible:ring-djassa-red/25 sm:w-[260px] lg:w-[300px]"
                    >
                      {/* Image produit — grande vitrine */}
                      <div className="relative min-h-0 flex-1 overflow-hidden bg-djassa-cloud">
                        <Link to={`/article/${offer.id}`} className="block h-full w-full" tabIndex={-1} aria-hidden="true">
                          <ProductGallery article={offer} images={offer.images} />
                        </Link>
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/55 to-transparent" />
                        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5">
                          {isFlash && (
                            <span className="inline-flex items-center gap-1 rounded-[5px] bg-[#780000] px-2.5 py-1 font-spacegrotesk text-[10px] font-extrabold uppercase tracking-wide text-white shadow-md">
                              <Zap size={16} strokeWidth={3} fill="currentColor" /> -{discount}% • FLASH
                            </span>
                          )}
                          {!isFlash && (
                            <span className="inline-flex items-center rounded-[5px] bg-djassa-black px-2.5 py-1 font-spacegrotesk text-[10px] font-extrabold uppercase tracking-wide text-white shadow-md">
                              POPULAIRE
                            </span>
                          )}
                          {trocable && (
                            <span className="badge-troc !px-2 !py-1"><ArrowLeftRight size={16} strokeWidth={3.5} /> Troc</span>
                          )}
                          <span className="inline-flex rounded-[5px] bg-white/95 px-2.5 py-1 font-spacegrotesk text-[9px] font-bold uppercase tracking-[0.12em] text-djassa-black shadow-sm">
                            {CONDITION_LABELS[offer.condition] ?? offer.condition}
                          </span>
                        </div>
                        <span className="absolute bottom-2 left-2 rounded-[5px] bg-djassa-black px-2.5 py-1 font-DM-Sans text-[8.5px] font-semibold uppercase tracking-wide text-white shadow-sm">
                          {offer.categorie}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => addPromoToCart(e, offer)}
                          aria-label={cart.has(offer.id) ? 'Déjà dans le panier' : 'Ajouter au panier'}
                          title={cart.has(offer.id) ? 'Déjà dans le panier' : 'Ajouter au panier'}
                          className={`absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-[5px] shadow-lg ring-2  backdrop-blur transition hover:scale-110 active:scale-95 ${cart.has(offer.id) ? 'bg-emerald-600 text-white' : 'bg-gradient-to-br from-[#780000] to-[#780000] text-white'}`}
                        >
                          {cart.has(offer.id) ? <Check size={24} strokeWidth={3} /> : <ShoppingCart size={24} strokeWidth={2.6} />}
                        </button>
                      </div>

                      {/* Infos produit */}
                      <div className="flex flex-col px-4 py-3 sm:px-4 sm:py-3.5">
                        <Link to={`/article/${offer.id}`} className="block">
                          <h4 className="line-clamp-2 font-spacegrotesk text-[13.5px] font-bold leading-snug tracking-[-0.01em] text-djassa-black transition group-hover:text-djassa-red sm:text-[14.5px]">{offer.titre}</h4>
                        </Link>
                        <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
                          <span className="font-spacegrotesk text-[15px] font-extrabold tracking-tight text-[#780000] sm:text-[17px]">{formatFCFA(offer.prix_actuel ?? offer.prix)}</span>
                          {isFlash && <span className="font-DM-Sans text-[11px] font-medium text-djassa-black/70 line-through">{formatFCFA(offer.prix)}</span>}
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-1.5">
                          <span className="truncate font-DM-Sans text-[9.5px] text-djassa-black/70">{offer.boutique?.nom_boutique ?? offer.proprietaire?.nom ?? 'Particulier'}{offer.quartier ? ` · ${offer.quartier}` : ''}</span>
                          <button
                            type="button"
                            onClick={() => navigate(`/article/${offer.id}${trocable ? '?troc=1' : ''}`)}
                            className="inline-flex h-6 shrink-0 items-center justify-center gap-1 rounded-[5px] bg-[#780000] px-3 font-spacegrotesk text-[8.5px] font-extrabold uppercase tracking-[0.1em] text-white transition hover:bg-[#780000] active:scale-95"
                          >
                            {trocable ? <><ArrowLeftRight size={20} strokeWidth={2.8} /> Troc</> : 'Voir'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Flèches mobile */}
              <div className="flex items-center justify-center gap-4 pb-4 sm:hidden">
                <button onClick={() => scrollPromo(-1)} aria-label="Offre précédente" className="flex h-11 w-11 items-center justify-center rounded-[5px] bg-djassa-black text-white active:scale-95"><ChevronLeft size={20} strokeWidth={3} /></button>
                <button onClick={() => scrollPromo(1)} aria-label="Offre suivante" className="flex h-11 w-11 items-center justify-center rounded-[5px] bg-djassa-red text-white active:scale-95"><ChevronRight size={20} strokeWidth={3} /></button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ===== Section des articles — recherche + grille ===== */}
      <section id="feed" className="bg-white py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-3 sm:px-6">
          {/* En-tête */}
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-[5px] bg-djassa-red/10 px-3 py-1.5 font-spacegrotesk text-[9px] font-extrabold uppercase tracking-[0.2em] text-djassa-red">
                <Tag size={20} strokeWidth={3} /> Le marché Djassa
              </span>
              <h2 className="mt-3 font-spacegrotesk text-[1.9rem] font-black leading-[1.05] tracking-tight text-djassa-black sm:text-4xl">
                Trouvez votre prochain<br className="hidden sm:block" /> coup de cœur<span className="text-djassa-red">.</span>
              </h2>
              <p className="mt-2 max-w-lg font-DM-Sans text-[12.5px] leading-relaxed text-djassa-black/70 sm:text-[13px]">
                Occasion, troc ou neuf boutique — des milliers d'annonces près de chez vous, en FCFA.
              </p>
            </div>

            {/* Panier + compteur */}
            <div className="flex shrink-0 items-center gap-3">
              <Link to="/panier" className="group relative hidden h-24 w-24 items-center justify-center rounded-[5px] bg-djassa-red/5 transition hover:bg-djassa-red/10 md:flex" aria-label={`Mon panier — ${cartCount} article${cartCount > 1 ? 's' : ''}`}>
                <img src="/images/cart-sale.webp" alt="Panier Djassa" className="h-20 w-20 object-contain"  loading="lazy" decoding="async" />
                {cartCount > 0 && (
                  <span key={cartCount} className="cart-badge-pop absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-[5px] bg-[#780000] px-1.5 font-spacegrotesk text-[10px] font-extrabold text-white shadow-md ring-2">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>
              <div className="flex items-center gap-2 rounded-[5px] bg-djassa-cloud border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] px-4 py-3">
                <span className="font-spacegrotesk text-xl font-extrabold text-djassa-black">{total}</span>
                <span className="font-DM-Sans text-[10px] font-semibold uppercase leading-tight tracking-wide text-djassa-black/70">annonces<br />disponibles</span>
              </div>
            </div>
          </div>

          {/* Barre de recherche */}
          <form onSubmit={submitSearch} className="mb-4 flex flex-col gap-2 rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] p-2.5 shadow-card sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-[5px] bg-djassa-cream border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] px-4 py-3 focus-within:ring-2 focus-within:ring-djassa-red/25">
              <Search size={18} className="shrink-0 text-djassa-black/70" strokeWidth={2.4} />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Rechercher un article, une marque, une catégorie…"
                aria-label="Rechercher des articles"
                className="w-full bg-transparent font-DM-Sans text-[13px] text-djassa-black outline-none placeholder:text-djassa-gray/70"
              />
              {searchInput && (
                <button type="button" onClick={() => { setSearchInput(''); if (q) clearQuery(); }} aria-label="Effacer la recherche" className="rounded-[5px] p-1 text-djassa-black/70 transition hover:bg-djassa-cloud hover:text-djassa-red">
                  <X size={24} strokeWidth={2.6} />
                </button>
              )}
            </div>
            <button type="submit" className="inline-flex h-[46px] items-center justify-center gap-2 rounded-[5px] bg-[#780000] border-solid border-[0.5px] border-[rgba(255,255,255,0.12)] px-6 font-spacegrotesk text-[11px] font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_6px_18px_rgba(120,0,0,0.3)] transition hover:bg-[#780000] active:scale-95">
              <Search size={24} strokeWidth={2.8} /> Rechercher
            </button>
          </form>

          {/* Filtres / tri + requête active */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {q && (
                <span className="inline-flex items-center gap-1.5 rounded-[5px] bg-djassa-black px-3 py-1.5 font-DM-Sans text-[10px] font-semibold text-white">
                  « {q} »
                  <button type="button" onClick={clearQuery} aria-label="Retirer la recherche" className="ml-0.5 rounded-[5px] p-0.5 transition hover:bg-white/20"><X size={20} strokeWidth={3} /></button>
                </span>
              )}
              {category && (
                <span className="inline-flex items-center gap-1.5 rounded-[5px] bg-djassa-red px-3 py-1.5 font-DM-Sans text-[10px] font-semibold text-white">
                  {category}
                  <button type="button" onClick={clearCategory} aria-label="Retirer le filtre catégorie" className="ml-0.5 rounded-[5px] p-0.5 transition hover:bg-white/20"><X size={20} strokeWidth={3} /></button>
                </span>
              )}
              {marche && (
                <span className="inline-flex items-center gap-1.5 rounded-[5px] bg-djassa-red px-3 py-1.5 font-DM-Sans text-[10px] font-semibold text-white">
                  {marche === 'neuf' ? 'Boutiques Pro' : 'Seconde main'}
                  <button type="button" onClick={clearMarche} aria-label="Retirer le filtre marché" className="ml-0.5 rounded-[5px] p-0.5 transition hover:bg-white/20"><X size={20} strokeWidth={3} /></button>
                </span>
              )}
              <span className="font-DM-Sans text-[10px] uppercase tracking-wide text-djassa-black/70">
                {isLoading ? 'Recherche…' : `${total} résultat${total > 1 ? 's' : ''}`}
              </span>
            </div>
            <label className="inline-flex items-center gap-2 font-DM-Sans text-[10px] font-semibold uppercase tracking-wide text-djassa-black/70">
              <SlidersHorizontal size={13} strokeWidth={2.4} /> Trier par
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-[5px] bg-white px-3 py-1.5 font-spacegrotesk text-[10px] font-bold text-djassa-black shadow-card outline-none transition focus:ring-2 focus:ring-djassa-red/25"
              >
                <option value="latest">Plus récents</option>
                <option value="popular">Populaires</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
              </select>
            </label>
          </div>

          {/* Grille */}
          {isLoading ? (
            <div ref={gridRef} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
              {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : isError ? (
            <EmptyState title="Impossible de charger les annonces" hint="Vérifiez que l'API Djassa est démarrée (:8899)." />
          ) : articles.length === 0 ? (
            <EmptyState
              art="search"
              title={q ? `Aucun article pour « ${q} »` : "Aucun article pour le moment"}
              hint={q ? 'Essayez un autre mot-clé ou parcourez le marché.' : 'Soyez le premier à publier dans ce rayon.'}
              action={<Link to="/publier" className="btn-red btn-sm">Publier un article</Link>}
            />
          ) : (
            <>
              <div ref={gridRef} className={`grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4 transition-opacity duration-200 ${isFetching && !isFetchingNextPage ? 'opacity-50' : 'opacity-100'}`}>
                {articles.map((article) => (
                  <div key={article.id} data-card>
                    <MemoProductCardWide article={article} />
                  </div>
                ))}
              </div>
              {(canLoadMore || visiblePages > 1) && (
                <div className="flex flex-wrap items-center justify-center gap-3 pt-5">
                  {canLoadMore && (
                    <button className="btn-outline btn-sm" onClick={loadMore} disabled={isFetchingNextPage}>
                      {isFetchingNextPage ? <><Spinner size={24} /> Chargement…</> : <><ChevronDown size={14} /> Charger plus d’annonces</>}
                    </button>
                  )}
                  {visiblePages > 1 && (
                    <button className="inline-flex items-center gap-1.5 rounded-[5px] bg-djassa-black px-4 py-2 font-spacegrotesk text-[11px] font-bold text-white transition hover:bg-djassa-red active:scale-95" onClick={collapseList}>
                      <ChevronUp size={14} /> Réduire la liste
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
