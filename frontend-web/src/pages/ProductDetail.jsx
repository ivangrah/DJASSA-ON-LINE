import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  ArrowLeftRight, BadgeCheck, ChevronRight, Eye, Flag, Heart, MapPin,
  MessageCircle, Share2, ShieldCheck, Store, Tag, Zap, PackageOpen,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CONDITION_LABELS, CONDITION_STYLES, formatFCFA, timeAgo } from '../lib/format';
import { Avatar, EmptyState } from '../components/ui';
import BarterModal from '../components/BarterModal';
import CheckoutModal from '../components/CheckoutModal';
import ProductCardWide from '../components/ProductCardWide';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeImage, setActiveImage] = useState(0);
  const [lastId, setLastId] = useState(id);
  const [barterOpen, setBarterOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [faved, setFaved] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => (await api.get(`/products/${id}`)).data,
    enabled: Boolean(id),
  });
  const article = data?.data;
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

  if (lastId !== id) {
    setLastId(id);
    setActiveImage(0);
  }

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

  const ready = !isLoading && !isError && Boolean(article);

  if (!ready && isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid gap-6 md:grid-cols-[6rem_1fr]">
          <div className="skeleton aspect-square w-24 sm:w-32" />
          <div className="space-y-4">
            <div className="skeleton h-5 w-3/4" />
            <div className="skeleton h-4 w-1/2" />
            <div className="skeleton h-24 w-full" />
            <div className="skeleton h-10 w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="font-jakarta text-lg font-extrabold text-djassa-black">Article introuvable</p>
        <p className="mt-1 text-sm text-djassa-slate">{error?.response?.data?.message ?? 'Cette annonce n’est plus disponible.'}</p>
        <Link to="/" className="btn-red btn-sm mt-5">Retour au fil</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-3 py-3 sm:px-5 md:py-4">
      {/* Fil d'Ariane */}
      <nav className="mb-3 flex items-center gap-1.5 text-[11px] text-djassa-slate" aria-label="Fil d'Ariane">
        <Link to="/" className="hover:text-djassa-black">Accueil</Link><ChevronRight size={12} />
        <Link to={`/?category=${encodeURIComponent(article.categorie)}`} className="hover:text-djassa-black">{article.categorie}</Link><ChevronRight size={12} />
        <span className="line-clamp-1 font-semibold text-djassa-black">{article.titre}</span>
      </nav>

      {/* Grille principale : galerie + détails */}
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,42%)_minmax(0,1fr)]">
        {/* Galerie */}
        <div>
          <div className="relative overflow-hidden rounded-[18px] ring-1 ring-djassa-black/5 bg-djassa-cloud">
            {images[activeImage] ? (
              <img src={images[activeImage]} alt={article.titre} className="aspect-square w-full object-cover" />
            ) : (
              <div className="flex aspect-square w-full flex-col items-center justify-center bg-djassa-mist"><span className="font-jakarta text-4xl font-extrabold text-djassa-black/15">Djassa</span></div>
            )}
            {isFlash && (
              <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-[#ED0F02] px-2.5 py-1.5 font-jakarta text-[10.5px] font-extrabold uppercase text-white shadow">
                <Zap size={11} strokeWidth={3} fill="currentColor" /> Vente flash
              </span>
            )}
            <button onClick={() => setFaved((v) => !v)} aria-pressed={faved} aria-label="Ajouter aux favoris" className="absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow ring-1 ring-djassa-black/8 transition hover:scale-105">
              <Heart size={19} className={faved ? 'fill-djassa-red text-djassa-red' : 'text-djassa-black'} strokeWidth={2.2} />
            </button>
          </div>
          {images.length > 1 && (
            <div className="no-scrollbar mt-2.5 flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button key={i} onClick={() => setActiveImage(i)} className={`h-14 w-14 shrink-0 overflow-hidden rounded-xl transition ${i === activeImage ? 'ring-2 ring-djassa-red' : 'ring-1 ring-djassa-black/10'}`} aria-label={`Photo ${i + 1}`}>
                  <img src={img} alt="" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
                </button>
              ))}
            </div>
          )}
          <div className="mt-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="badge-pro"><PackageOpen size={9} strokeWidth={2} /> {isFlash ? 'Vente flash' : 'Populaire'}</span>
              <h1 className="mt-2 font-jakarta text-[20px] font-extrabold leading-tight text-djassa-black sm:text-2xl">{article.titre}</h1>
            </div>
            {trocable && <span className="badge-troc"><ArrowLeftRight size={9} strokeWidth={2.5} /> En vente/Troc</span>}
          </div>
        </div>

        {/* Colonne détails */}
        <div className="space-y-4">
          {/* Vendeur */}
          <div className="rounded-2xl ring-1 ring-djassa-black/5 bg-white p-3">
            <div className="flex items-center gap-3">
              <Avatar name={article.boutique?.nom_boutique ?? article.proprietaire?.nom} size={40} tone={article.boutique ? 'red' : 'black'} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 font-jakarta text-sm font-bold text-djassa-black">
                  <span className="truncate">{article.boutique?.nom_boutique ?? article.proprietaire?.nom}</span>
                  {article.boutique?.verifie && <BadgeCheck size={15} className="shrink-0 fill-djassa-red text-white" aria-label="Vendeur vérifié" />}
                </p>
                <p className="text-[10px] text-djassa-slate">
                  {article.boutique ? 'Boutique Pro vérifiée · Neuf garanti' : 'Particulier · Remise en main propre'}
                  {article.boutique?.note_moyenne && Number(article.boutique.note_moyenne) > 0 && <> · ★ {Number(article.boutique.note_moyenne).toFixed(1)} ({article.boutique.nombre_avis} avis)</>}
                </p>
              </div>
              {article.boutique && (
                <Link to={`/boutique/${article.boutique.slug}`} className="btn-outline btn-sm shrink-0 !px-3">Voir la boutique</Link>
              )}
            </div>
          </div>

          {/* Badges + prix + actions */}
          <div className="rounded-2xl ring-1 ring-djassa-black/5 bg-white p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-inter font-bold uppercase tracking-wide ${CONDITION_STYLES[article.condition] ?? CONDITION_STYLES.bon_etat}`}>{CONDITION_LABELS[article.condition]}</span>
              {article.est_neuf_boutique && <span className="badge-pro"><Store size={10} strokeWidth={3} /> Neuf boutique pro</span>}
              {article.prix_negociable && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-emerald-700">Prix négociable</span>}
            </div>

            <div className="mt-2.5">
              <p className="font-jakarta text-[24px] font-extrabold tracking-tight text-[#E60023] sm:text-[26px]">{formatFCFA(prixActuel)}</p>
              {isFlash && <p className="font-inter text-[10px] font-medium text-djassa-slate line-through">{formatFCFA(article.prix)}</p>}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[10px] text-djassa-slate">
              <span className="flex items-center gap-1"><MapPin size={12} />{article.quartier ? `${article.quartier}, ` : ''}{article.ville}</span>
              <span className="flex items-center gap-1"><Eye size={12} />{article.vues} vue{article.vues > 1 ? 's' : ''}</span>
              <span>Publiée {timeAgo(article.created_at)}</span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-full bg-[#ED0F02] font-jakarta text-[10.5px] font-extrabold uppercase tracking-[0.1em] text-white transition hover:bg-[#ff1e12] active:scale-95" onClick={() => requireAuth() && setCheckoutOpen(true)}>
                <ShieldCheck size={15} strokeWidth={2.2} /> Acheter {formatFCFA(prixActuel)}
              </button>
              {trocable && (
                <button className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-full bg-djassa-black font-jakarta text-[10.5px] font-extrabold uppercase tracking-[0.1em] text-white transition hover:bg-djassa-red active:scale-95" onClick={() => requireAuth() && setBarterOpen(true)}>
                  <ArrowLeftRight size={15} strokeWidth={2.4} /> Proposer un troc
                </button>
              )}
              <button className="inline-flex h-9 items-center justify-center gap-2 rounded-full border-[1.5px] border-djassa-black font-jakarta text-[10.5px] font-extrabold uppercase tracking-[0.1em] text-djassa-black transition hover:bg-djassa-black hover:text-white active:scale-95" aria-label="Envoyer un message" onClick={() => requireAuth() && navigate(`/messages?to=${article.proprietaire?.id}&article=${article.id}`)}>
                <MessageCircle size={15} strokeWidth={2.3} /> Message
              </button>
              <button className="inline-flex h-9 items-center justify-center rounded-full border-[1.5px] border-djassa-black font-jakarta text-[10.5px] font-extrabold uppercase tracking-[0.1em] text-djassa-black transition hover:bg-djassa-black hover:text-white active:scale-95" aria-label="Partager" onClick={share}><Share2 size={15} strokeWidth={2.3} /> Partager</button>
            </div>
            {!trocable && <p className="mt-1.5 text-[10px] text-djassa-slate">Le troc n’est pas activé sur cet article.</p>}
          </div>

          {/* Description */}
          <section className="rounded-2xl ring-1 ring-djassa-black/5 bg-white p-3">
            <h2 className="section-title flex items-center gap-2 text-sm uppercase tracking-wide text-djassa-slate">
              <PackageOpen size={14} className="text-djassa-red" /> Description
            </h2>
            <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-djassa-black/90">{article.description || 'Aucune description fournie par le vendeur.'}</p>
          </section>

          {/* Caractéristiques */}
          {article.specs && Object.keys(article.specs).length > 0 && (
            <section className="rounded-2xl ring-1 ring-djassa-black/5 bg-white p-3">
              <h2 className="section-title flex items-center gap-2 text-sm uppercase tracking-wide text-djassa-slate">
                <Tag size={13} className="text-djassa-red" /> Caractéristiques
              </h2>
              <dl className="mt-2 grid grid-cols-2 gap-2">
                {Object.entries(article.specs).slice(0, 8).map(([key, value]) => (
                  <div key={key} className="rounded-xl bg-djassa-mist px-3 py-2">
                    <dt className="text-[9px] font-semibold uppercase tracking-wider text-djassa-slate">{String(key).replaceAll('_', ' ')}</dt>
                    <dd className="truncate text-xs font-bold text-djassa-black">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <button type="button" onClick={() => toast.success('Signalement transmis. Notre équipe va examiner cette annonce.')} className="inline-flex w-fit items-center gap-1 text-[10px] font-semibold text-djassa-slate transition hover:text-djassa-black"><Flag size={11} /> Signaler cette annonce</button>
        </div>
      </div>

      {/* Autres articles de la boutique */}
      {article.boutique && (
        <section className="mt-8 rounded-3xl ring-1 ring-djassa-black/5 bg-white p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="section-title flex items-center gap-2 font-jakarta text-[16px] font-extrabold tracking-tight text-djassa-black">
              <PackageOpen size={16} className="text-djassa-red" /> Autres articles de la boutique
            </h2>
            <Link to={`/boutique/${article.boutique.slug}`} className="btn-red btn-sm">Voir la boutique</Link>
          </div>
          {simLoading ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="djassa-card skeleton h-[260px] sm:h-[300px] rounded-[18px] lg:rounded-[22px]" />)}
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
            <button className="mt-4 w-full rounded-full border-[1.5px] border-djassa-black py-2 font-jakarta text-[10px] font-extrabold uppercase tracking-[0.1em] text-djassa-black transition hover:bg-djassa-black hover:text-white active:scale-95" onClick={() => fetchSimNext()} disabled={simLoading}>
              {simLoading ? <span className="inline-block h-4 w-20 animate-pulse rounded-full bg-djassa-black/10" /> : 'Charger plus'}
            </button>
          )}
        </section>
      )}

      <BarterModal open={barterOpen} onClose={() => setBarterOpen(false)} targetArticle={article} onSuccess={() => navigate(`/messages?to=${article.proprietaire?.id}&article=${article.id}`)} />
      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} article={article} onPaid={() => {}} />
    </div>
  );
}
