import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeftRight, BadgeCheck, ChevronRight, Eye, Flag, Heart, MapPin,
  MessageCircle, Share2, ShieldCheck, Store, Zap,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CONDITION_LABELS, CONDITION_STYLES, formatFCFA, timeAgo } from '../lib/format';
import { Avatar, FlashCountdown } from '../components/ui';
import BarterModal from '../components/BarterModal';
import CheckoutModal from '../components/CheckoutModal';

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

  // Réinitialise la galerie quand on change d'article (état dérivé pendant le rendu)
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
    if (trocable) {
      setBarterOpen(true);
    } else {
      toast.info('Ce vendeur n’accepte pas le troc sur cet article.');
    }
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

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="skeleton aspect-square w-full" />
          <div className="space-y-4"><div className="skeleton h-6 w-3/4" /><div className="skeleton h-10 w-1/2" /><div className="skeleton h-32 w-full" /></div>
        </div>
      </div>
    );
  }

  if (isError || !article) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="font-jakarta text-lg font-extrabold text-djassa-black">Article introuvable</p>
        <p className="mt-1 text-sm text-djassa-slate">{error?.response?.data?.message ?? 'Cette annonce n’est plus disponible.'}</p>
        <Link to="/" className="btn-red btn-sm mt-5">Retour au fil</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-3 pb-28 pt-4 sm:px-6 md:pb-12">
      {/* Fil d'Ariane */}
      <nav className="mb-3 flex items-center gap-1.5 text-[11px] text-djassa-slate" aria-label="Fil d'Ariane">
        <Link to="/" className="hover:text-djassa-black">Accueil</Link><ChevronRight size={12} />
        <Link to={`/?category=${encodeURIComponent(article.categorie)}`} className="hover:text-djassa-black">{article.categorie}</Link><ChevronRight size={12} />
        <span className="line-clamp-1 font-semibold text-djassa-black">{article.titre}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
        {/* Galerie */}
        <div>
          <div className="relative overflow-hidden rounded-3xl border border-djassa-black/8 bg-white">
            {images[activeImage] ? (
              <img src={images[activeImage]} alt={article.titre} className="aspect-square w-full object-cover md:aspect-[4/3]" />
            ) : (
              <div className="flex aspect-square w-full flex-col items-center justify-center bg-djassa-mist"><span className="font-jakarta text-4xl font-extrabold text-djassa-black/15">Djassa</span></div>
            )}
            {isFlash && (
              <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-djassa-red px-3 py-1.5 text-[11px] font-jakarta font-extrabold uppercase text-white shadow">
                <Zap size={12} strokeWidth={3} /> Vente flash <FlashCountdown targetIso={article.flash_fin_at} className="text-yellow-300" />
              </div>
            )}
            <button onClick={() => setFaved((v) => !v)} aria-pressed={faved} aria-label="Ajouter aux favoris" className="absolute right-3 top-3 rounded-full bg-white/90 p-2.5 shadow backdrop-blur transition hover:scale-105">
              <Heart size={19} className={faved ? 'fill-djassa-red text-djassa-red' : 'text-djassa-black'} strokeWidth={2.2} />
            </button>
          </div>
          {images.length > 1 && (
            <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button key={i} onClick={() => setActiveImage(i)} className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition ${i === activeImage ? 'border-djassa-red' : 'border-transparent opacity-70'}`} aria-label={`Photo ${i + 1}`}>
                  <img src={img} alt="" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Fiche / achat */}
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-inter font-bold uppercase tracking-wide ${CONDITION_STYLES[article.condition] ?? CONDITION_STYLES.bon_etat}`}>{CONDITION_LABELS[article.condition]}</span>
            {trocable && <span className="badge-troc"><ArrowLeftRight size={10} strokeWidth={3} /> Troc possible</span>}
            {article.est_neuf_boutique && <span className="badge-pro"><Store size={10} strokeWidth={3} /> Neuf boutique pro</span>}
          </div>

          <h1 className="mt-2 font-jakarta text-xl font-extrabold leading-tight text-djassa-black sm:text-2xl">{article.titre}</h1>

          {/* Prix */}
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <p className="font-jakarta text-3xl font-extrabold tracking-tight text-djassa-black">{formatFCFA(isFlash ? article.prix_flash : article.prix)}</p>
            {isFlash && <p className="pb-1 font-jakarta text-lg font-bold text-djassa-slate line-through">{formatFCFA(article.prix)}</p>}
            {article.prix_negociable && <span className="mb-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">Prix négociable</span>}
          </div>

          {/* Métadonnées */}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-djassa-slate">
            <span className="flex items-center gap-1"><MapPin size={12} />{article.quartier ? `${article.quartier}, ` : ''}{article.ville}</span>
            <span className="flex items-center gap-1"><Eye size={12} />{article.vues} vue{article.vues > 1 ? 's' : ''}</span>
            <span>Publiée {timeAgo(article.created_at)}</span>
          </div>

          {/* Vendeur / Boutique */}
          <div className="mt-4 rounded-2xl border border-djassa-black/8 bg-white p-3">
            <div className="flex items-center gap-3">
              <Avatar name={article.boutique?.nom_boutique ?? article.proprietaire?.nom} size={46} tone={article.boutique ? 'red' : 'black'} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 font-jakarta text-sm font-bold text-djassa-black">
                  <span className="truncate">{article.boutique?.nom_boutique ?? article.proprietaire?.nom}</span>
                  {article.boutique?.verifie && <BadgeCheck size={16} className="shrink-0 fill-djassa-red text-white" aria-label="Vendeur vérifié" />}
                </p>
                <p className="text-[10px] text-djassa-slate">{article.boutique ? 'Boutique Pro vérifiée · Neuf garanti' : 'Particulier · Remise en main propre'}{article.boutique?.note_moyenne && Number(article.boutique.note_moyenne) > 0 && <> · ★ {Number(article.boutique.note_moyenne).toFixed(1)} ({article.boutique.nombre_avis} avis)</>}</p>
              </div>
              {article.boutique && (
                <Link to={`/boutique/${article.boutique.slug}`} className="btn-outline btn-sm shrink-0 !px-3">Voir la boutique</Link>
              )}
            </div>
          </div>

          {/* CTA — desktop dans le flux, mobile sticky */}
          <div className="mt-4 hidden gap-2 md:flex">
            <button className="btn-black flex-1" onClick={() => requireAuth() && setCheckoutOpen(true)}>
              <ShieldCheck size={18} /> Acheter maintenant
            </button>
            <button className="btn-red flex-1" disabled={!trocable} title={trocable ? '' : 'Ce vendeur n’accepte pas le troc sur cet article'} onClick={() => requireAuth() && setBarterOpen(true)}>
              <ArrowLeftRight size={18} /> Proposer un troc
            </button>
            <button className="btn-outline !px-4" aria-label="Envoyer un message" onClick={() => requireAuth() && navigate(`/messages?to=${article.proprietaire?.id}&article=${article.id}`)}>
              <MessageCircle size={18} />
            </button>
            <button className="btn-outline !px-4" aria-label="Partager" onClick={share}><Share2 size={18} /></button>
          </div>
          {!trocable && <p className="mt-1.5 hidden text-[10px] text-djassa-slate md:block">Le troc n’est pas activé sur cet article.</p>}

          {/* Description */}
          <section className="mt-5">
            <h2 className="section-title text-sm uppercase tracking-wide text-djassa-slate">Description</h2>
            <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-djassa-black/90">{article.description || 'Aucune description fournie par le vendeur.'}</p>
          </section>

          {/* Specs JSONB */}
          {article.specs && Object.keys(article.specs).length > 0 && (
            <section className="mt-4">
              <h2 className="section-title text-sm uppercase tracking-wide text-djassa-slate">Caractéristiques</h2>
              <dl className="mt-1.5 grid grid-cols-2 gap-2">
                {Object.entries(article.specs).slice(0, 8).map(([key, value]) => (
                  <div key={key} className="rounded-xl bg-djassa-mist px-3 py-2">
                    <dt className="text-[9px] font-semibold uppercase tracking-wider text-djassa-slate">{String(key).replaceAll('_', ' ')}</dt>
                    <dd className="truncate text-xs font-bold text-djassa-black">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
          <button type="button" onClick={() => toast.success('Signalement transmis. Notre équipe va examiner cette annonce.')} className="mt-4 inline-flex w-fit items-center gap-1 text-[10px] font-semibold text-djassa-slate transition hover:text-djassa-black"><Flag size={11} /> Signaler cette annonce</button>
        </div>
      </div>

      {/* CTA sticky mobile */}
      <div className="fixed inset-x-0 bottom-16 z-40 border-t border-djassa-black/8 bg-white/95 p-3 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-lg gap-2">
          <button className="btn-black flex-1 !py-2.5 text-[13px]" onClick={() => requireAuth() && setCheckoutOpen(true)}>
            <ShieldCheck size={16} /> Acheter {formatFCFA(prixActuel)}
          </button>
          <button className="btn-red !px-4" disabled={!trocable} aria-label="Proposer un troc" onClick={() => requireAuth() && setBarterOpen(true)}>
            <ArrowLeftRight size={18} />
          </button>
        </div>
      </div>

      <BarterModal open={barterOpen} onClose={() => setBarterOpen(false)} targetArticle={article} onSuccess={() => navigate(`/messages?to=${article.proprietaire?.id}&article=${article.id}`)} />
      <CheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} article={article} onPaid={() => {}} />
    </div>
  );
}
