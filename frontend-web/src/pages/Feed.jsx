import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Star, Package, ShieldCheck, ArrowRight, BadgeCheck, X, Tag, Zap, ChevronLeft, ChevronRight, ArrowLeftRight, ChevronDown } from 'lucide-react';
gsap.registerPlugin(ScrollTrigger);
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import ProductCardWide from '../components/ProductCardWide';
import { CONDITION_LABELS, formatFCFA } from '../lib/format';
import { ProductCardSkeleton, EmptyState, Spinner } from '../components/ui';

export default function Feed() {
  const heroRef = useRef(null);
  const promoRef = useRef(null);
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
          end: '+=120%',
          pin: true,
          pinType: 'transform',
          scrub: 1,
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
      if (veil) scrollTl.fromTo(veil, { opacity: 0 }, { opacity: 1, ease: 'power1.inOut' }, 0.55);

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
        promoTl.from(cards.slice(0, 4), {
          y: 44, opacity: 0, scale: 0.94, duration: 0.65, stagger: 0.1, ease: 'power3.out', clearProps: 'transform,opacity',
        }, 0.5);
      }
    }, heroRef);

    return () => { ctx.revert(); ctxScroll.revert(); };
  }, []);

  const clearQuery = () => setSearchParams({}, { replace: true });

  return (
    <div>
      {/* ===== HERO plein écran — photo immersive · Djassa Online ===== */}
      <section ref={heroRef} className="relative overflow-hidden bg-[#0c0c0c] text-white" aria-label="Djassa Online">
        <img
          data-hero-bg
          src="/images/hero-shopping-bags.jpg"
          alt="Sacs de shopping rouges et noirs sur fond noir"
          className="absolute inset-0 h-full w-full select-none object-cover object-[50%_34%]"
        />
        {/* Scrim global doux + voile bas pour la lisibilité du texte centré */}
        <div className="absolute inset-0 bg-[#0b0b0b]/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0b]/95 via-[#0b0b0b]/25 to-transparent" />

        {/* Barre de progression du scroll */}
        <div className="absolute inset-x-0 top-0 z-30 h-[3px] bg-white/10">
          <div data-hero-progress className="h-full w-full origin-left scale-x-0 bg-[#E60023]" />
        </div>

        <div className="relative flex min-h-[100svh] flex-col px-5 sm:px-6 md:min-h-[100svh] md:px-10 xl:px-16">
          {/* Nav intégrée — logo gauche · liens centre · Se connecter droite */}
          <div data-hero-nav className="flex items-center justify-between gap-4 border-b border-white/10 py-3 md:py-4">
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

          {/* Visuel e-commerce — mobile (au-dessus du titre) */}
          <img
            src="/images/hero-ecommerce.png"
            alt="Achats en ligne et livraison Djassa"
            data-hero-visual
            className="pointer-events-none relative z-0 mx-auto -mb-1 mt-0 w-[130px] select-none object-contain opacity-95 drop-shadow-[0_18px_30px_rgba(0,0,0,0.55)] sm:w-[170px] lg:hidden"
          />

          {/* Headline centré */}
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center pb-[224px] pt-2 text-center sm:pb-40 sm:pt-8 md:pb-44 md:pt-10">
            <h1 className="font-jakarta text-[15vw] font-extrabold leading-[0.95] tracking-tight text-white sm:text-[80px] md:text-[84px]">
              <span className="block overflow-hidden"><span data-hero-line className="block">Achète. Vends.</span></span>
              <span className="block overflow-hidden"><span data-hero-line className="block text-[#E60023]">Troque.</span></span>
            </h1>
            <p data-hero-sub className="mt-6 max-w-lg font-inter text-[13px] font-medium leading-6 tracking-wide text-white/85 sm:text-[14px] sm:leading-7">
              Tout le Djassa dans ta poche — occasion, troc malin, neuf au meilleur prix. Payé en confiance, remis en main propre.
            </p>
            <div data-hero-cta className="mt-8">
              <a href="#feed" className="inline-flex h-11 items-center gap-2 rounded-full bg-[#ED0F02] px-6 font-jakarta text-[11.5px] font-extrabold uppercase tracking-[0.16em] text-white shadow-[0_12px_30px_rgba(237,15,2,0.38)] transition hover:bg-[#ff1e12] active:scale-95 sm:h-12 sm:px-7 sm:text-[12px]">
                Explorer le marché <ArrowRight size={16} strokeWidth={2.8} />
              </a>
            </div>
          </div>

          {/* Visuels e-commerce — desktop (flottants + légendes) */}
          <div data-hero-visual className="pointer-events-none absolute right-[2%] top-[38%] z-0 hidden w-[clamp(300px,26vw,460px)] -translate-y-1/2 flex-col items-center xl:flex">
            <img src="/images/hero-ecommerce.png" alt="Achats en ligne et livraison Djassa" className="w-full select-none object-contain opacity-95 drop-shadow-[0_30px_60px_rgba(0,0,0,0.6)]" />
            <div className="mt-1 rounded-full border border-white/15 bg-black/55 px-3.5 py-1.5 text-center backdrop-blur-md">
              <p className="font-jakarta text-[10px] font-extrabold uppercase tracking-[0.14em] text-white">Livré en confiance</p>
              <p className="font-inter text-[9px] text-white/65">Paiement sécurisé · Escrow + PIN</p>
            </div>
          </div>
          <div data-hero-visual className="pointer-events-none absolute left-[0%] top-[40%] z-0 hidden w-[clamp(280px,25vw,440px)] -translate-y-1/2 flex-col items-center xl:flex">
            <img src="/images/hero-bags-burst.png" alt="Sacs de shopping et cadeaux Djassa" className="w-full select-none object-contain opacity-90 drop-shadow-[0_30px_60px_rgba(0,0,0,0.6)]" />
            <div className="mt-1 rounded-full border border-white/15 bg-black/70 px-3.5 py-1.5 text-center backdrop-blur-md">
              <p className="font-jakarta text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#E60023]">Occasion & Troc</p>
              <p className="font-inter text-[9px] text-white/65">Le bon plan seconde main</p>
            </div>
          </div>
          {/* Indicateur de scroll */}
          <div data-hero-cue className="pointer-events-none absolute bottom-[100px] left-1/2 z-20 hidden -translate-x-1/2 flex-col items-center gap-1.5 md:flex md:bottom-[96px]">
            <span className="font-jakarta text-[9px] font-extrabold uppercase tracking-[0.2em] text-white/65">Scroll pour découvrir</span>
            <ChevronDown size={16} className="text-[#E60023]" strokeWidth={3} />
          </div>

          {/* Barre de réassurance — 4 statistiques */}
          <div data-hero-stats className="absolute inset-x-3 bottom-[78px] sm:inset-x-4 md:inset-x-8 md:bottom-6 xl:inset-x-12">
            <div className="grid grid-cols-2 divide-white/10 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md md:grid-cols-4 md:divide-x">
              <div className="flex flex-col gap-1 px-4 py-3.5 sm:px-5">
                <span className="flex items-center gap-1.5 text-white">
                  <Star size={14} className="fill-[#ED0F02] text-[#ED0F02]" />
                  <span data-hero-count="4.8" data-decimals="1" data-suffix="/5" className="font-jakarta text-base font-extrabold sm:text-lg">4.8/5</span>
                </span>
                <span className="font-inter text-[8px] font-medium uppercase tracking-[0.16em] text-white/60 sm:text-[8.5px]">Vendeurs notés</span>
              </div>
              <div className="flex flex-col gap-1 border-l border-white/10 px-4 py-3.5 sm:px-5 md:border-l-0">
                <span className="flex items-center gap-1.5 text-white">
                  <BadgeCheck size={14} className="text-[#ED0F02]" strokeWidth={2.6} />
                  <span data-hero-count="50" data-suffix="+" className="font-jakarta text-base font-extrabold sm:text-lg">50+</span>
                </span>
                <span className="font-inter text-[8px] font-medium uppercase tracking-[0.16em] text-white/60 sm:text-[8.5px]">Boutiques vérifiées</span>
              </div>
              <div className="flex flex-col gap-1 border-t border-white/10 px-4 py-3.5 sm:px-5 md:border-t-0 md:border-l">
                <span className="flex items-center gap-1.5 text-white">
                  <Package size={14} className="text-[#ED0F02]" strokeWidth={2.2} />
                  <span data-hero-count="1500" data-suffix="+" data-thousands className="font-jakarta text-base font-extrabold sm:text-lg">1 500+</span>
                </span>
                <span className="font-inter text-[8px] font-medium uppercase tracking-[0.16em] text-white/60 sm:text-[8.5px]">Articles publiés</span>
              </div>
              <div className="flex flex-col gap-1 border-l border-t border-white/10 px-4 py-3.5 sm:px-5 md:border-l md:border-t-0">
                <span className="flex items-center gap-1.5 text-white">
                  <ShieldCheck size={14} className="text-[#ED0F02]" strokeWidth={2.2} />
                  <span className="font-jakarta text-[12px] font-extrabold leading-tight sm:text-base">Escrow + PIN</span>
                </span>
                <span className="font-inter text-[8px] font-medium uppercase tracking-[0.16em] text-white/60 sm:text-[8.5px]">Paiement sécurisé</span>
              </div>
            </div>
          </div>
        </div>

        {/* Voile crème — transition vers la section promo pendant le scroll pinné */}
        <div data-hero-veil className="pointer-events-none absolute inset-0 z-20 bg-[#F7F1E6] opacity-0" />
      </section>

      {/* ===== Section OFFRES — split 50/50 : promo (gauche) + vitrine (droite) ===== */}
      <section ref={promoRef} className="bg-[#F7F1E6] py-8 sm:py-12" aria-label="Offres spéciales Djassa">
        <div className="mx-auto max-w-7xl px-3 sm:px-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch lg:gap-5 lg:min-h-[440px] xl:min-h-[480px]">

            {/* Colonne gauche — Boostez vos économies */}
            <div data-promo-col className="relative flex h-full min-h-[300px] flex-col rounded-3xl bg-[#FFFDF6] p-5 shadow-card ring-1 ring-djassa-black/5 sm:p-6 lg:min-h-0 lg:overflow-hidden">
              <div data-promo-glow className="pointer-events-none absolute -left-14 top-8 h-36 w-36 rounded-full bg-djassa-red/5 blur-2xl" aria-hidden="true" />
              <div className="pointer-events-none absolute -right-10 bottom-6 h-40 w-40 rounded-full bg-yellow-400/10 blur-2xl" aria-hidden="true" />
              <div className="relative flex min-h-0 flex-1 flex-col justify-between gap-3">
                <div className="flex shrink-0 items-start justify-between gap-3">
                  <span data-promo-badge className="inline-flex w-fit items-center gap-2 rounded-full bg-djassa-red/10 px-3 py-1.5 text-[9px] font-jakarta font-extrabold uppercase tracking-[0.22em] text-djassa-red">
                    <Zap size={11} strokeWidth={3} fill="currentColor" /> Offre spéciale
                  </span>
                  <img data-promo-stamp src="/images/promo-stamp.jpg" alt="PROMO" aria-hidden="true" className="pointer-events-none h-12 w-auto shrink-0 -rotate-[10deg] select-none object-contain opacity-90 sm:h-14 lg:h-16" loading="lazy" />
                </div>

                <div className="flex min-h-0 flex-1 items-center justify-center py-1">
                  <div data-promo-illustration className="relative flex aspect-square h-full max-h-36 w-auto items-center justify-center sm:max-h-44 lg:max-h-44 xl:max-h-52">
                    <div className="absolute inset-0 rounded-full bg-[#FBEEDD]" aria-hidden="true" />
                    <img src="/images/promo-megaphone.jpg" alt="Mégaphone Special Promo illustrant les offres" className="relative h-[88%] w-[88%] object-contain mix-blend-multiply" />
                  </div>
                </div>

                <div className="shrink-0 text-center lg:text-left">
                  <h2 data-promo-title className="font-jakarta text-[1.7rem] font-black leading-[0.98] tracking-tighter text-djassa-black sm:text-4xl lg:text-[2.25rem] xl:text-[2.75rem]">
                    Boostez vos<br />économies<span className="text-djassa-red">.</span>
                  </h2>
                  <p data-promo-desc className="mx-auto mt-2 max-w-md font-inter text-[12px] leading-relaxed text-djassa-slate sm:text-[13px] lg:mx-0 lg:mt-2.5">
                    Ne ratez pas nos offres exclusives. Économisez sur l'occasion certifiée, le troc malin et le neuf boutique — directement sur le Djassa, en FCFA.
                  </p>
                  <div data-promo-buttons className="mt-3.5 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
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
            <div data-promo-col className="relative flex h-full min-h-[340px] flex-col overflow-hidden rounded-3xl bg-[#FFFDF6] shadow-card ring-1 ring-djassa-black/5 lg:min-h-0">
              <div data-promo-header className="flex items-center justify-between px-4 pt-4 sm:px-5 sm:pt-5">
                <h3 className="flex items-center gap-2 font-jakarta text-base font-extrabold tracking-tight text-djassa-black sm:text-lg">
                  <Zap size={16} className="text-[#ED0F02]" strokeWidth={2.6} fill="currentColor" />
                  Les offres à saisir
                  <span className="font-inter text-[9px] font-semibold uppercase tracking-[0.18em] text-djassa-slate">/ {promoItems.length}</span>
                </h3>
                <div data-promo-arrows className="hidden items-center gap-2 sm:flex">
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
                      className="group flex h-full w-[232px] shrink-0 cursor-pointer snap-start flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-djassa-black/6 transition hover:shadow-pop focus-visible:ring-djassa-red sm:w-[260px] lg:w-[300px]"
                    >
                      {/* Image produit — grande vitrine */}
                      <div className="relative min-h-0 flex-1 overflow-hidden bg-djassa-cloud">
                        <Link to={`/article/${offer.id}`} className="block h-full w-full" tabIndex={-1} aria-hidden="true">
                          {offer.image_principale ? (
                            <img src={offer.image_principale} alt={offer.titre} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center font-jakarta text-2xl font-extrabold text-djassa-black/15">Djassa</div>
                          )}
                        </Link>
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/55 to-transparent" />
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
                        <span className="absolute bottom-2 right-2 rounded-full bg-djassa-black px-2.5 py-1 font-inter text-[8.5px] font-semibold uppercase tracking-wide text-white shadow-sm">
                          {offer.categorie}
                        </span>
                      </div>

                      {/* Infos produit */}
                      <div className="flex flex-col px-4 py-3 sm:px-4 sm:py-3.5">
                        <Link to={`/article/${offer.id}`} className="block">
                          <h4 className="line-clamp-2 font-jakarta text-[13.5px] font-bold leading-snug tracking-[-0.01em] text-djassa-black transition group-hover:text-djassa-red sm:text-[14.5px]">{offer.titre}</h4>
                        </Link>
                        <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
                          <span className="font-jakarta text-[15px] font-extrabold tracking-tight text-[#E60023] sm:text-[17px]">{formatFCFA(offer.prix_actuel ?? offer.prix)}</span>
                          {isFlash && <span className="font-inter text-[11px] font-medium text-djassa-slate line-through">{formatFCFA(offer.prix)}</span>}
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-1.5">
                          <span className="truncate font-inter text-[9.5px] text-djassa-slate">{offer.boutique?.nom_boutique ?? offer.proprietaire?.nom ?? 'Particulier'}{offer.quartier ? ` · ${offer.quartier}` : ''}</span>
                          <button
                            type="button"
                            onClick={() => navigate(`/article/${offer.id}${trocable ? '?troc=1' : ''}`)}
                            className="inline-flex h-6 shrink-0 items-center justify-center gap-1 rounded-full bg-[#ED0F02] px-3 font-jakarta text-[8.5px] font-extrabold uppercase tracking-[0.1em] text-white transition hover:bg-[#ff1e12] active:scale-95"
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
      <div id="feed" className="mx-auto max-w-7xl space-y-3 px-3 py-4 sm:px-6 md:py-6">
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
