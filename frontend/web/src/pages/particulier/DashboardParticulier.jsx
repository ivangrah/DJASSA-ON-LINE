import { useMemo, useRef, useState } from 'react';
import { usePageReveal } from '../../hooks/usePageReveal';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftRight, ArrowRight, ArrowUpRight, BadgeCheck, Check, Clock3, Download,
  Eye, Heart, Inbox, LayoutList, LockKeyhole, Package, PlusCircle,
  ShoppingBag, Store, Trash2, X,
} from 'lucide-react';
import { api, downloadAuthenticated } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  ARTICLE_STATUS, BARTER_STATUS, CONDITION_LABELS, ESCROW_STATUS, formatFCFA, timeAgo,
} from '../../lib/format';
import { EmptyState, Spinner } from '../../components/ui';

const TABS = ['articles', 'propositions', 'achats', 'souhaits'];
const TAB_LABELS = {
  articles: 'Mes articles à troquer',
  propositions: 'Mes propositions de troc',
  achats: 'Mes achats & Codes PIN',
  souhaits: 'Mes souhaits',
};

function StatCard({ icon: Icon, label, value, hint, tone = 'light' }) {
  const dark = tone === 'dark';
  return (
    <div className={`relative overflow-hidden rounded-[5px]  p-4 ${dark ? ' bg-djassa-black border-solid border-[0.5px] border-[rgba(255,255,255,0.12)] text-white' : ' bg-white text-djassa-black'}`}>
      <div className={`flex h-9 w-9 items-center justify-center rounded-[5px] ${dark ? 'bg-white/10 text-djassa-red' : 'bg-djassa-red/10 text-djassa-red'}`}>
        <Icon size={17} />
      </div>
      <p className={`mt-3 font-spacegrotesk text-[25px] font-extrabold leading-none tracking-tight ${dark ? 'text-white' : ''}`}>{value}</p>
      <p className={`mt-1 text-[10px] font-semibold uppercase tracking-wide ${dark ? 'text-white/45' : 'text-djassa-black/45'}`}>{label}</p>
      {hint && <p className={`mt-1.5 text-[10px] ${dark ? 'text-white/40' : 'text-djassa-black/40'}`}>{hint}</p>}
    </div>
  );
}

function SectionHead({ title, count, action }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="font-spacegrotesk text-[18px] font-extrabold tracking-tight">{title}</h2>
        <p className="mt-0.5 text-[11px] text-djassa-black/45">
          {count} élément{count > 1 ? 's' : ''}
        </p>
      </div>
      {action}
    </div>
  );
}

function TinyBadge({ children, tone = 'gray' }) {
  const tones = {
    gray: 'bg-djassa-cloud text-djassa-black/60',
    red: 'bg-djassa-red/10 text-djassa-red',
    dark: 'bg-djassa-black text-white',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-800',
    sky: 'bg-sky-50 text-sky-700',
  };
  return <span className={`inline-flex items-center gap-1 rounded-[5px] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${tones[tone] ?? tones.gray}`}>{children}</span>;
}

function ProductThumb({ article, className = 'h-14 w-14' }) {
  return (
    <div className={`${className} shrink-0 overflow-hidden rounded-[5px] bg-djassa-cloud border-solid border-[0.5px] border-[rgba(18,18,18,0.08)]`}>
      {article?.image_principale ? (
        <img src={article.image_principale} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-djassa-black/25"><Package size={20} /></div>
      )}
    </div>
  );
}

export default function DashboardParticulier() {
  const { user } = useAuth();
  const scope = useRef(null);
  usePageReveal(scope);
  const toast = useToast();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const rawTab = searchParams.get('onglet');
  const tab = TABS.includes(rawTab) ? rawTab : 'articles';
  const [articleFilter, setArticleFilter] = useState('tous');
  const [sens, setSens] = useState('recues');

  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ['my-products'],
    queryFn: async () => (await api.get('/products/mine')).data,
    staleTime: 30_000,
  });

  const { data: receivedData } = useQuery({
    queryKey: ['barter-offers', 'recues'],
    queryFn: async () => (await api.get('/barter-offers', { params: { sens: 'recues' } })).data,
    staleTime: 30_000,
  });

  const { data: sentData } = useQuery({
    queryKey: ['barter-offers', 'envoyees'],
    queryFn: async () => (await api.get('/barter-offers', { params: { sens: 'envoyees' } })).data,
    staleTime: 30_000,
  });

  const { data: txData, isLoading: loadingTx } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => (await api.get('/transactions')).data,
    staleTime: 30_000,
  });

  const { data: wishesData, isLoading: loadingWishes } = useQuery({
    queryKey: ['souhaits', 'mine'],
    queryFn: async () => (await api.get('/souhaits/mine')).data,
    staleTime: 30_000,
  });

  const products = productsData?.data ?? [];
  const received = receivedData?.data ?? [];
  const sent = sentData?.data ?? [];
  const transactions = txData?.data ?? [];
  const wishes = wishesData?.data ?? [];

  const trocProducts = useMemo(
    () => (articleFilter === 'troc' ? products.filter((p) => p.est_trocable || ['troc', 'mixte'].includes(p.mode_transaction)) : products),
    [products, articleFilter]
  );

  const achats = useMemo(
    () => transactions.filter((tx) => tx.role_utilisateur === 'acheteur'),
    [transactions]
  );

  const propositions = sens === 'recues' ? received : sent;

  const respond = useMutation({
    mutationFn: async ({ id, action }) => (await api.patch(`/barter-offers/${id}/respond`, { action })).data,
    onSuccess: () => {
      toast.success('Réponse enregistrée.');
      queryClient.invalidateQueries({ queryKey: ['barter-offers'] });
    },
    onError: (error) => toast.error(error.response?.data?.message ?? 'Impossible de répondre à cette offre.'),
  });

  const closeWish = useMutation({
    mutationFn: async (id) => (await api.delete(`/souhaits/${id}`)).data,
    onSuccess: () => {
      toast.success('Souhait clôturé.');
      queryClient.invalidateQueries({ queryKey: ['souhaits', 'mine'] });
    },
    onError: (error) => toast.error(error.response?.data?.message ?? 'Impossible de clôturer ce souhait.'),
  });

  const pendingReceived = received.filter((o) => o.statut === 'pending').length;

  return (
    <div ref={scope} data-reveal className="space-y-5">
      {/* En-tête */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-spacegrotesk text-[9px] font-extrabold uppercase tracking-[0.2em] text-djassa-red">
            Mon espace particulier
          </p>
          <h1 className="mt-1 font-spacegrotesk text-[27px] font-extrabold leading-tight tracking-tight sm:text-[32px]">
            Bonjour {user?.nom?.split(' ')[0] ?? 'à vous'}<span className="text-djassa-red">.</span>
          </h1>
          <p className="mt-1 max-w-lg text-[12px] leading-relaxed text-djassa-black/50">
            Retrouvez vos articles, vos trocs et vos achats sécurisés. Tout votre Djassa, au même endroit.
          </p>
        </div>
        <Link to="/publier" className="inline-flex items-center gap-2 rounded-[5px] bg-djassa-red border-solid border-[0.5px] border-[rgba(255,255,255,0.12)] px-4 py-2.5 font-spacegrotesk text-[11px] font-extrabold uppercase tracking-wide text-white shadow-pop transition hover:bg-djassa-red-dark active:scale-95">
          <PlusCircle size={15} /> Publier une annonce
        </Link>
        <img src="/images/illustrations/ecommerce-laptop-iso.webp" alt="" aria-hidden="true" className="art-warm pointer-events-none hidden h-28 w-auto select-none object-contain lg:block"  loading="lazy" decoding="async" />
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={LayoutList} label="Articles en ligne" value={products.length} hint="Occasion, troc & vente" tone="dark" />
        <StatCard icon={Inbox} label="Propositions reçues" value={received.length} hint={`${pendingReceived} en attente`} />
        <StatCard icon={ShoppingBag} label="Achats sécurisés" value={achats.length} hint="Escrow & codes PIN" />
        <StatCard icon={Heart} label="Souhaits publiés" value={wishes.length} hint="Mur des souhaits" />
      </div>

      {/* Encart Pro discret */}
      <div className="flex flex-wrap items-center gap-3 rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] shadow-card px-4 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-djassa-red/10 text-djassa-red"><Store size={15} /></span>
        <div className="min-w-0 flex-1">
          <p className="font-spacegrotesk text-[11.5px] font-extrabold">Vous voulez vendre du neuf ?</p>
          <p className="text-[10.5px] text-djassa-black/45">Ouvrez une Boutique officielle avec l’offre Pro.</p>
        </div>
        <Link to="/choisir-offre" className="inline-flex items-center gap-1.5 rounded-[5px] px-3 py-1.5 font-spacegrotesk text-[10px] font-extrabold text-djassa-red transition hover:bg-djassa-red hover:text-white">
          Passer Pro <ArrowUpRight size={12} />
        </Link>
      </div>

      {/* Contenu de l'onglet */}
      <section className="rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] p-4 shadow-card sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2 pb-3">
          <span className="font-spacegrotesk text-[10px] font-extrabold uppercase tracking-[0.16em] text-djassa-black/35">Onglet actif</span>
          <span className="rounded-[5px] bg-djassa-red/10 px-3 py-1 font-spacegrotesk text-[10px] font-extrabold text-djassa-red">{TAB_LABELS[tab]}</span>
        </div>

        {tab === 'articles' && (
          <div>
            <SectionHead
              title="Mes articles"
              count={trocProducts.length}
              action={
                <div className="flex rounded-[5px] bg-djassa-cloud p-1">
                  {[['tous', 'Tous'], ['troc', 'Trocables']].map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setArticleFilter(key)}
                      className={`rounded-[5px] px-3 py-1.5 font-spacegrotesk text-[10px] font-extrabold transition ${articleFilter === key ? 'bg-djassa-black text-white' : 'text-djassa-black/50 hover:text-djassa-black'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              }
            />

            {loadingProducts ? (
              <div className="flex justify-center py-12"><Spinner /></div>
            ) : trocProducts.length === 0 ? (
              <EmptyState
                art="box"
                title={articleFilter === 'troc' ? 'Aucun article trocable' : 'Aucun article publié'}
                hint="Publiez une annonce d’occasion pour commencer à vendre ou à troquer."
                action={<Link to="/publier" className="btn-red btn-sm"><PlusCircle size={14} /> Publier</Link>}
              />
            ) : (
              <div className="divide-y divide-djassa-gray/20">
                {trocProducts.map((article) => {
                  const status = ARTICLE_STATUS[article.statut] ?? ARTICLE_STATUS.published;
                  return (
                    <article key={article.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <ProductThumb article={article} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3 className="truncate font-spacegrotesk text-[12.5px] font-extrabold">{article.titre}</h3>
                          <span className={`rounded-[5px] px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide ${status.cls}`}>{status.label}</span>
                        </div>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-djassa-black/45">
                          <span>{formatFCFA(article.prix)}</span>
                          <span>·</span>
                          <span>{CONDITION_LABELS[article.condition] ?? article.condition}</span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-0.5"><Eye size={16} /> {article.vues ?? 0}</span>
                          <span>·</span>
                          <span>{timeAgo(article.created_at)}</span>
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {article.est_trocable || ['troc', 'mixte'].includes(article.mode_transaction) ? <TinyBadge tone="red"><ArrowLeftRight size={16} /> Troc</TinyBadge> : <TinyBadge>Vente</TinyBadge>}
                          {article.condition === 'neuf' && <TinyBadge tone="dark"><BadgeCheck size={16} /> Boutique</TinyBadge>}
                        </div>
                      </div>
                      <Link to={`/article/${article.id}`} className="inline-flex shrink-0 items-center gap-1 rounded-[5px] px-2.5 py-1.5 font-spacegrotesk text-[9.5px] font-extrabold text-djassa-black/60 transition hover:text-djassa-red">
                        Voir <ArrowRight size={20} />
                      </Link>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'propositions' && (
          <div>
            <SectionHead
              title="Propositions de troc"
              count={propositions.length}
              action={
                <div className="flex rounded-[5px] bg-djassa-cloud p-1">
                  {[['recues', `Reçues ${received.length}`], ['envoyees', `Envoyées ${sent.length}`]].map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSens(key)}
                      className={`rounded-[5px] px-3 py-1.5 font-spacegrotesk text-[10px] font-extrabold transition ${sens === key ? 'bg-djassa-red text-white' : 'text-djassa-black/50 hover:text-djassa-black'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              }
            />

            {propositions.length === 0 ? (
              <EmptyState
                art="message"
                title={sens === 'recues' ? 'Aucune proposition reçue' : 'Aucune proposition envoyée'}
                hint={sens === 'recues' ? 'Les offres de troc sur vos articles apparaîtront ici.' : 'Proposez un troc depuis la fiche d’un article.'}
                action={<Link to="/" className="btn-outline btn-sm">Explorer le marché <ArrowRight size={13} /></Link>}
              />
            ) : (
              <div className="space-y-3">
                {propositions.map((offre) => {
                  const statut = BARTER_STATUS[offre.statut] ?? BARTER_STATUS.pending;
                  const isReceived = sens === 'recues';
                  const canRespond = isReceived && offre.statut === 'pending';
                  const canRespondCounter = !isReceived && offre.statut === 'countered';
                  return (
                    <article key={offre.id} className="rounded-[5px] bg-djassa-cloud/40 p-3.5">
                      <div className="flex flex-wrap items-start gap-3">
                        <ProductThumb article={offre.article_cible} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="truncate font-spacegrotesk text-[12px] font-extrabold">{offre.article_cible?.titre ?? 'Article'}</p>
                            <span className={`rounded-[5px] px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide ${statut.cls}`}>{statut.label}</span>
                          </div>
                          <p className="mt-0.5 text-[10px] text-djassa-black/45">
                            {isReceived ? `De ${offre.acheteur?.nom ?? 'un particulier'}` : `À ${offre.vendeur?.nom ?? 'un vendeur'}`} · {timeAgo(offre.created_at)}
                          </p>
                          <p className="mt-1 text-[10.5px] text-djassa-black/60">
                            <span className="font-semibold">Offre :</span>{' '}
                            {(offre.articles_offerts ?? []).map((a) => a.titre).join(', ') || 'Article proposé'}
                            {Number(offre.montant_soulte_fcfa) > 0 && <> + <span className="font-semibold text-djassa-red">{formatFCFA(offre.montant_soulte_fcfa)}</span></>}
                          </p>
                          {offre.message && <p className="mt-1 line-clamp-2 rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] px-2.5 py-1.5 text-[10px] italic text-djassa-black/55">“{offre.message}”</p>}
                        </div>
                      </div>
                      {(canRespond || canRespondCounter) && (
                        <div className="mt-3 flex flex-wrap gap-2 pt-3">
                          <button
                            type="button"
                            disabled={respond.isPending}
                            onClick={() => respond.mutate({ id: offre.id, action: canRespond ? 'accept' : 'accept_counter' })}
                            className="inline-flex items-center gap-1.5 rounded-[5px] bg-djassa-black border-solid border-[0.5px] border-[rgba(255,255,255,0.12)] px-3 py-1.5 font-spacegrotesk text-[9.5px] font-extrabold uppercase tracking-wide text-white transition hover:bg-black disabled:opacity-50"
                          >
                            <Check size={20} /> {canRespond ? 'Accepter' : 'Accepter la contre-offre'}
                          </button>
                          <button
                            type="button"
                            disabled={respond.isPending}
                            onClick={() => respond.mutate({ id: offre.id, action: canRespond ? 'reject' : 'decline_counter' })}
                            className="inline-flex items-center gap-1.5 rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] px-3 py-1.5 font-spacegrotesk text-[9.5px] font-extrabold uppercase tracking-wide text-djassa-black/55 transition hover:text-djassa-red disabled:opacity-50"
                          >
                            <X size={20} /> Refuser
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'achats' && (
          <div>
            <SectionHead title="Mes achats & Codes PIN" count={achats.length} />
            {loadingTx ? (
              <div className="flex justify-center py-12"><Spinner /></div>
            ) : achats.length === 0 ? (
              <EmptyState
                art="box"
                title="Aucun achat pour le moment"
                hint="Vos commandes sécurisées et leurs codes PIN apparaîtront ici."
                action={<Link to="/" className="btn-red btn-sm">Explorer le marché <ArrowRight size={13} /></Link>}
              />
            ) : (
              <div className="space-y-3">
                {achats.map((tx) => {
                  const statut = ESCROW_STATUS[tx.escrow_status] ?? ESCROW_STATUS.initiated;
                  const held = tx.escrow_status === 'held';
                  const released = tx.escrow_status === 'released';
                  return (
                    <article key={tx.id} className="rounded-[5px] p-3.5">
                      <div className="flex flex-wrap items-start gap-3">
                        <ProductThumb article={tx.article} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="truncate font-spacegrotesk text-[12px] font-extrabold">{tx.article?.titre ?? 'Article'}</p>
                            <span className={`rounded-[5px] px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide ${statut.cls}`}>{statut.label}</span>
                          </div>
                          <p className="mt-0.5 text-[10px] text-djassa-black/45">
                            {formatFCFA(tx.montant)} · Vendeur {tx.vendeur?.nom ?? 'Djassa'} · {timeAgo(tx.created_at)}
                          </p>
                        </div>
                        {tx.can_view_receipt && (
                          <button
                            type="button"
                            onClick={() => downloadAuthenticated(`/api/v1/transactions/${tx.id}/receipt`, `recu-djassa-${tx.id.slice(0, 8)}.pdf`).catch(() => toast.error('Reçu indisponible.'))}
                            className="inline-flex shrink-0 items-center gap-1 rounded-[5px] px-2.5 py-1.5 font-spacegrotesk text-[9.5px] font-extrabold text-djassa-black/60 transition hover:text-djassa-red"
                          >
                            <Download size={20} /> Reçu PDF
                          </button>
                        )}
                      </div>

                      <div className={`mt-3 flex items-start gap-2 rounded-[5px] px-3 py-2 text-[10px] leading-relaxed ${held ? 'bg-amber-50 text-amber-800' : released ? 'bg-emerald-50 text-emerald-700' : 'bg-djassa-cloud border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] text-djassa-black/55'}`}>
                        {held ? <LockKeyhole size={14} className="mt-0.5 shrink-0" /> : released ? <Check size={14} className="mt-0.5 shrink-0" /> : <Clock3 size={14} className="mt-0.5 shrink-0" />}
                        <span>
                          {held && <>Vos fonds sont bloqués en séquestre. Présentez le <strong>code PIN reçu par e-mail</strong> au vendeur lors de la remise pour libérer le paiement.</>}
                          {released && <>Remise validée — le paiement a été libéré au vendeur. Votre reçu PDF reste disponible.</>}
                          {tx.escrow_status === 'initiated' && <>Paiement en attente de confirmation. Votre code PIN sera envoyé dès réception des fonds.</>}
                          {tx.escrow_status === 'refunded' && <>Cette transaction a été remboursée.</>}
                          {tx.escrow_status === 'failed' && <>Le paiement a échoué. Aucun montant n’a été débité.</>}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'souhaits' && (
          <div>
            <SectionHead
              title="Mes souhaits"
              count={wishes.length}
              action={<Link to="/souhaits" className="btn-outline btn-sm"><PlusCircle size={13} /> Publier un souhait</Link>}
            />
            {loadingWishes ? (
              <div className="flex justify-center py-12"><Spinner /></div>
            ) : wishes.length === 0 ? (
              <EmptyState
                art="wishlist"
                title="Aucun souhait publié"
                hint="Dites au Djassa ce que vous cherchez : les vendeurs viendront à vous."
                action={<Link to="/souhaits" className="btn-red btn-sm">Publier un souhait <ArrowRight size={13} /></Link>}
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {wishes.map((souhait) => (
                  <article key={souhait.id} className="flex flex-col rounded-[5px] p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-spacegrotesk text-[12.5px] font-extrabold leading-snug">{souhait.titre}</h3>
                      <TinyBadge tone={souhait.statut === 'active' ? 'green' : 'gray'}>
                        {souhait.statut === 'active' ? 'Actif' : 'Clôturé'}
                      </TinyBadge>
                    </div>
                    {souhait.description && <p className="mt-1 line-clamp-2 text-[10.5px] leading-relaxed text-djassa-black/50">{souhait.description}</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[9.5px] text-djassa-black/45">
                      {souhait.budget_max && <span className="font-semibold text-djassa-red">{formatFCFA(souhait.budget_max)}</span>}
                      {souhait.categorie && <span>· {souhait.categorie}</span>}
                      {souhait.ville && <span>· {souhait.ville}</span>}
                      <span>· {souhait.vues ?? 0} vues</span>
                    </div>
                    <div className="mt-auto flex items-center gap-2 pt-3">
                      {souhait.accepte_troc && <TinyBadge tone="red"><ArrowLeftRight size={16} /> Troc accepté</TinyBadge>}
                      {souhait.statut === 'active' && (
                        <button
                          type="button"
                          disabled={closeWish.isPending}
                          onClick={() => closeWish.mutate(souhait.id)}
                          className="ml-auto inline-flex items-center gap-1 rounded-[5px] px-2 py-1 font-spacegrotesk text-[9px] font-extrabold text-djassa-black/40 transition hover:bg-djassa-red/10 hover:text-djassa-red"
                        >
                          <Trash2 size={20} /> Clôturer
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
