import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeftRight, BadgeCheck, CheckCheck, ChevronLeft, ExternalLink, Image as ImageIcon,
  LockKeyhole, MessageCircle, Search, SendHorizonal, ShieldCheck, ShoppingBag, Tag, X, Zap,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BARTER_STATUS, CONDITION_LABELS, formatFCFA, timeAgo } from '../lib/format';
import { Avatar, EmptyState, Spinner } from '../components/ui';
import BarterModal from '../components/BarterModal';

export default function Messages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const partnerId = searchParams.get('to');
  const articleId = searchParams.get('article');

  const { data } = useQuery({
    queryKey: ['messages', 'conversations'],
    queryFn: async () => (await api.get('/messages/conversations')).data,
    refetchInterval: 8000,
  });
  const conversations = data?.conversations ?? [];

  const open = (to, article) => setSearchParams({ to, article: article ?? '' });
  const back = () => setSearchParams({});

  const active = conversations.find((c) => (
    c.with?.id === partnerId && (c.article?.id ?? '') === (articleId ?? '')
  ));

  return (
    <div className="mx-auto max-w-[1500px] md:my-4 md:h-[calc(100vh-7.5rem)] md:px-4">
      <div className="grid h-full overflow-hidden bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] md:rounded-[5px] md:shadow-card md:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
        {/* Inbox — masquée sur mobile quand un fil est ouvert */}
        <div className={`${partnerId ? 'hidden md:block' : 'block'} h-full min-h-0   bg-white`}>
          <Inbox conversations={conversations} isLoading={!data} partnerId={partnerId} articleId={articleId} onSelect={open} />
        </div>

        {/* Fil de discussion */}
        <div className={`${partnerId ? 'block' : 'hidden md:block'} h-full min-h-0 bg-djassa-red/[0.035]`}>
          {partnerId ? (
            <Thread
              partnerId={partnerId}
              articleId={articleId}
              conversation={active}
              onBack={back}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-[5px] bg-djassa-red border-solid border-[0.5px] border-[rgba(255,255,255,0.12)] text-white shadow-pop ring-4">
                <MessageCircle size={30} strokeWidth={1.7} />
              </span>
              <div>
                <h2 className="font-spacegrotesk text-[17px] font-extrabold tracking-tight text-djassa-black">
                  Vos négociations Djassa
                </h2>
                <p className="mx-auto mt-1 max-w-xs text-[12px] leading-relaxed text-djassa-black/55">
                  Sélectionnez une conversation pour reprendre l’échange, ou ouvrez une fiche article pour proposer un troc.
                </p>
              </div>
              <Link to="/" className="inline-flex items-center gap-1.5 rounded-[5px] bg-djassa-red border-solid border-[0.5px] border-[rgba(255,255,255,0.12)] px-4 py-2 font-spacegrotesk text-[11px] font-extrabold uppercase tracking-wide text-white shadow-pop transition hover:bg-djassa-black active:scale-95">
                Explorer le marché <ExternalLink size={24} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= Inbox ================= */

const PREVIEW_ICONS = {
  carte_troc: ArrowLeftRight,
  offre_prix: Tag,
  systeme: ShieldCheck,
  texte: MessageCircle,
};

function preview(conv) {
  const m = conv?.dernier_message;
  if (!m) return 'Aucun message pour le moment';
  if (m.type === 'carte_troc') return `Proposition de troc · ${formatFCFA(m.payload?.montant_soulte_fcfa ?? 0)} de soulte`;
  if (m.type === 'offre_prix') return `Offre de prix · ${formatFCFA(m.payload?.montant_fcfa ?? 0)}`;
  return m.contenu;
}

function Inbox({ conversations, isLoading, partnerId, articleId, onSelect }) {
  const [query, setQuery] = useState('');
  const [onlyUnread, setOnlyUnread] = useState(false);

  const totalUnread = conversations.reduce((sum, c) => sum + (c.non_lus ?? 0), 0);
  const visible = useMemo(() => conversations.filter((c) => {
    if (onlyUnread && !c.non_lus) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [c.with?.nom, c.article?.titre, c.dernier_message?.contenu]
      .some((value) => value?.toLowerCase().includes(q));
  }), [conversations, query, onlyUnread]);

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 bg-djassa-red px-4 pb-3 pt-4 text-white">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h1 className="font-spacegrotesk text-[17px] font-extrabold tracking-tight text-white">
              Messages <span className="text-white/80">& Négociations</span>
            </h1>
            <p className="mt-0.5 text-[10.5px] text-white/80">
              {conversations.length} conversation{conversations.length > 1 ? 's' : ''}
              {totalUnread > 0 && <> · {totalUnread} non lue{totalUnread > 1 ? 's' : ''}</>}
            </p>
          </div>
          {totalUnread > 0 && (
            <span className="mt-0.5 flex h-6 min-w-6 items-center justify-center rounded-[5px] bg-white px-1.5 font-spacegrotesk text-[10px] font-extrabold text-djassa-red shadow-sm">
              {totalUnread}
            </span>
          )}
        </div>

        <div className="mt-3 flex h-9 items-center gap-2 rounded-[5px] bg-white/15 px-3 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-white/70">
          <Search size={24} className="shrink-0 text-white/75" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une conversation…"
            aria-label="Rechercher une conversation"
            className="min-w-0 flex-1 bg-transparent text-[11.5px] text-white outline-none placeholder:text-white/75 focus:text-djassa-black focus:placeholder:text-djassa-black/40"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="rounded-[5px] p-1 text-white/75 transition hover:bg-white/15 hover:text-white" aria-label="Effacer la recherche">
              <X size={24} />
            </button>
          )}
        </div>

        <div className="mt-2.5 flex gap-1 rounded-[5px] bg-white/10 p-1" role="tablist" aria-label="Filtrer les conversations">
          {[
            [false, 'Toutes'],
            [true, `Non lues${totalUnread ? ` (${totalUnread})` : ''}`],
          ].map(([value, label]) => (
            <button
              key={String(value)}
              type="button"
              role="tab"
              aria-selected={onlyUnread === value}
              onClick={() => setOnlyUnread(value)}
              className={`flex-1 rounded-[5px] py-1.5 font-spacegrotesk text-[10px] font-extrabold transition ${
                onlyUnread === value ? 'bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] text-djassa-red shadow-sm' : 'text-white/80 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="skeleton h-10 w-10 shrink-0 rounded-[5px]" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="skeleton h-3 w-3/5" />
                  <div className="skeleton h-2.5 w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="px-4 py-10">
            <img src="/images/illustrations/chat-bubbles.webp" alt="" aria-hidden="true" className="art-warm pointer-events-none mx-auto mb-2 h-32 w-auto select-none object-contain opacity-80"  loading="lazy" decoding="async" />
            <EmptyState
              art={query ? 'search' : 'message'}
              title={query ? 'Aucun résultat' : onlyUnread ? 'Tout est lu' : 'Aucune conversation'}
              hint={query ? 'Essayez un autre nom ou un autre mot-clé.' : onlyUnread ? 'Vous n’avez aucun message non lu.' : 'Proposez un troc ou écrivez à un vendeur depuis une fiche article.'}
            />
          </div>
        ) : (
          visible.map((conv) => {
            const active = conv.with?.id === partnerId && (conv.article?.id ?? '') === (articleId ?? '');
            const unread = conv.non_lus ?? 0;
            const Icon = PREVIEW_ICONS[conv.dernier_message?.type] ?? MessageCircle;
            return (
              <button
                key={`${conv.with?.id}-${conv.article?.id ?? 'global'}`}
                type="button"
                onClick={() => onSelect(conv.with?.id, conv.article?.id)}
                aria-current={active ? 'true' : undefined}
                className={`flex w-full items-start gap-3   px-4 py-3 text-left transition ${
                  active ? 'bg-djassa-red/10 shadow-card' : 'hover:bg-djassa-red/[0.04]'
                }`}
              >
                <div className="relative shrink-0">
                  <Avatar name={conv.with?.nom} size={40} tone={conv.with?.is_pro ? 'black' : 'red'} />
                  {unread > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-[5px] bg-djassa-red px-1 font-spacegrotesk text-[9px] font-extrabold text-white ring-2">
                      {unread}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={`truncate font-spacegrotesk text-[12px] font-extrabold ${active ? 'text-djassa-red' : 'text-djassa-black'}`}>
                      {conv.with?.nom ?? 'Partenaire'}
                    </p>
                    <time className="shrink-0 text-[9px] text-djassa-black/45">
                      {timeAgo(conv.dernier_message?.created_at)}
                    </time>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    {conv.with?.is_pro && (
                      <span className="inline-flex items-center gap-0.5 rounded-[5px] bg-djassa-red/10 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wide text-djassa-red">
                        <BadgeCheck size={16} /> Pro
                      </span>
                    )}
                    {conv.article && (
                      <span className="truncate text-[9.5px] font-semibold text-djassa-black/55">{conv.article.titre}</span>
                    )}
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <Icon size={20} className={unread ? 'shrink-0 text-djassa-red' : 'shrink-0 text-djassa-black/35'} />
                    <p className={`truncate text-[11px] ${unread ? 'font-semibold text-djassa-black' : 'text-djassa-black/55'}`}>
                      {preview(conv)}
                    </p>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ================= Thread ================= */

function Thread({ partnerId, articleId, conversation, onBack }) {
  const { user, dashboardPath } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const endRef = useRef(null);
  const [text, setText] = useState('');
  const [offerMode, setOfferMode] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [trocOpen, setTrocOpen] = useState(false);

  const { data: thread, isLoading } = useQuery({
    queryKey: ['messages', 'thread', partnerId, articleId],
    queryFn: async () => (await api.get('/messages/thread', { params: { with: partnerId, article_id: articleId || undefined } })).data,
    refetchInterval: 4000,
  });

  const { data: articleData } = useQuery({
    queryKey: ['product', articleId],
    queryFn: async () => (await api.get(`/products/${articleId}`)).data,
    enabled: Boolean(articleId),
  });

  const article = articleData?.data ?? conversation?.article;
  const messages = thread?.data ?? [];
  const partner = conversation?.with;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  const send = useMutation({
    mutationFn: async (payload) => (await api.post('/messages', payload)).data,
    onSuccess: () => {
      setText(''); setOfferAmount(''); setOfferMode(false);
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
    onError: (error) => toast.error(error.response?.data?.message ?? 'Message non envoyé.'),
  });

  const respondOffer = useMutation({
    mutationFn: async ({ offerId, action, montant }) => (await api.patch(`/barter-offers/${offerId}/respond`, {
      action,
      ...(montant !== undefined ? { montant_contre_offre_fcfa: montant } : {}),
    })).data,
    onSuccess: (data, vars) => {
      const labels = {
        accept: 'Offre acceptée — articles verrouillés.',
        reject: 'Offre refusée.',
        counter: 'Contre-offre envoyée.',
        accept_counter: 'Contre-offre acceptée.',
        decline_counter: 'Contre-offre refusée.',
      };
      toast.success(labels[vars.action] ?? 'Réponse enregistrée.');
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['barter-offers'] });
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Action impossible.'),
  });

  const submit = () => {
    const value = text.trim();
    if (!value) return;
    send.mutate({ destinataire_id: partnerId, article_id: articleId || undefined, type: 'texte', contenu: value });
  };

  const submitOffer = () => {
    const amount = Number(offerAmount);
    if (!amount || amount <= 0) return;
    send.mutate({
      destinataire_id: partnerId,
      article_id: articleId || undefined,
      type: 'offre_prix',
      contenu: `Offre de prix : ${formatFCFA(amount)}`,
      payload: { montant_fcfa: amount },
    });
  };

  const dayLabel = messages.length
    ? new Date(messages[0].created_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    : '';

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* En-tête du fil */}
      <div className="flex shrink-0 items-center gap-3 bg-white px-3 py-2.5 sm:px-4">
        <button type="button" onClick={onBack} className="rounded-[5px] p-1.5 text-djassa-black/60 transition hover:bg-djassa-cloud hover:text-djassa-red md:hidden" aria-label="Retour aux conversations">
          <ChevronLeft size={20} />
        </button>
        <Avatar name={partner?.nom ?? partnerId?.slice(0, 2)} size={40} tone={partner?.is_pro ? 'black' : 'red'} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h2 className="truncate font-spacegrotesk text-[13px] font-extrabold tracking-tight text-djassa-black">
              {partner?.nom ?? 'Conversation'}
            </h2>
            {partner?.is_pro && (
              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-[5px] bg-djassa-red/10 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wide text-djassa-red">
                <BadgeCheck size={16} /> Pro
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-[10px] text-djassa-black/50">
            {article ? `Négociation · ${article.titre}` : 'Négociation Djassa Online'}
          </p>
        </div>
        {article && trocableHint(article) && (
          <button type="button" className="inline-flex shrink-0 items-center gap-1.5 rounded-[5px] bg-djassa-red border-solid border-[0.5px] border-[rgba(255,255,255,0.12)] px-3 py-2 font-spacegrotesk text-[10px] font-extrabold uppercase tracking-wide text-white shadow-pop transition hover:bg-djassa-black active:scale-95" onClick={() => setTrocOpen(true)}>
            <ArrowLeftRight size={20} /> <span className="hidden sm:inline">Proposer un</span> troc
          </button>
        )}
      </div>

      {/* Bandeau article — écrans moyens (l'aside le remplace en xl) */}
      {article && (
        <Link to={`/article/${article.id}`} className="flex shrink-0 items-center gap-2.5 bg-djassa-red/[0.06] px-3 py-2 transition hover:bg-djassa-red/10 xl:hidden">
          <ArticleThumb article={article} className="h-9 w-9" />
          <span className="min-w-0 flex-1 truncate text-[10.5px] font-semibold text-djassa-black/70">{article.titre}</span>
          <span className="shrink-0 font-spacegrotesk text-[11px] font-extrabold text-djassa-red">{formatFCFA(article.prix_actuel ?? article.prix)}</span>
          <ExternalLink size={24} className="shrink-0 text-djassa-red" />
        </Link>
      )}

      <div className="flex min-h-0 flex-1">
        {/* Colonne conversation */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="thread-scroll min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:px-5">
            {isLoading ? (
              <div className="space-y-4">
                <div className="skeleton mx-auto h-4 w-32 rounded-[5px]" />
                <div className="skeleton h-12 w-2/3 rounded-[5px]" />
                <div className="skeleton ml-auto h-16 w-3/5 rounded-[5px]" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <MessageCircle size={30} className="text-djassa-black/15" />
                <p className="font-spacegrotesk text-[12px] font-extrabold text-djassa-black">Aucun message dans ce fil</p>
                <p className="max-w-[260px] text-[10.5px] text-djassa-black/50">Écrivez le premier message pour lancer la négociation.</p>
              </div>
            ) : (
              <>
                {dayLabel && (
                  <div className="flex items-center gap-3 py-1">
                    <span className="h-px flex-1 bg-djassa-red/25" />
                    <time className="shrink-0 font-spacegrotesk text-[9px] font-extrabold uppercase tracking-[0.14em] text-djassa-red">{dayLabel}</time>
                    <span className="h-px flex-1 bg-djassa-red/25" />
                  </div>
                )}
                {messages.map((m) => {
                  const mine = m.expediteur_id === user?.id;
                  if (m.type === 'systeme') return <SystemNote key={m.id} message={m} />;
                  if (m.type === 'carte_troc') {
                    return <TrocCard key={m.id} message={m} mine={mine} onRespond={respondOffer} pending={respondOffer.isPending} />;
                  }
                  if (m.type === 'offre_prix') return <PriceCard key={m.id} message={m} mine={mine} />;
                  return <TextBubble key={m.id} message={m} mine={mine} partnerName={partner?.nom} />;
                })}
              </>
            )}
            <div ref={endRef} />
          </div>

          {/* Offre de prix (bandeau) */}
          {offerMode && (
            <div className="shrink-0 bg-amber-50 px-3 py-2.5 sm:px-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] bg-amber-100 text-amber-800"><Tag size={24} /></span>
                <input
                  autoFocus
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitOffer()}
                  placeholder="Montant proposé en FCFA"
                  aria-label="Montant de l'offre en FCFA"
                  className="h-9 min-w-0 flex-1 rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] px-3 text-[12px] text-djassa-black outline-none transition"
                />
                <button type="button" className="inline-flex h-9 items-center gap-1.5 rounded-[5px] bg-djassa-black border-solid border-[0.5px] border-[rgba(255,255,255,0.12)] px-3 font-spacegrotesk text-[10px] font-extrabold uppercase tracking-wide text-white transition hover:bg-djassa-red disabled:cursor-not-allowed disabled:opacity-40" disabled={!offerAmount || Number(offerAmount) <= 0 || send.isPending} onClick={submitOffer}>
                  Envoyer
                </button>
                <button type="button" className="rounded-[5px] p-1.5 text-amber-800 transition hover:bg-amber-100" onClick={() => setOfferMode(false)} aria-label="Annuler l'offre">
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Composer */}
          <div className="shrink-0 bg-white px-3 py-2.5 sm:px-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOfferMode((v) => !v)}
                aria-label="Faire une offre de prix"
                aria-pressed={offerMode}
                title="Faire une offre de prix"
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[5px] transition ${
                  offerMode ? 'bg-djassa-red border-solid border-[0.5px] border-[rgba(255,255,255,0.12)] text-white' : 'bg-djassa-cloud text-djassa-black/60 hover:bg-djassa-red/10 hover:text-djassa-red'
                }`}
              >
                <Tag size={18} />
              </button>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder="Écrire un message…"
                aria-label="Votre message"
                className="h-10 min-w-0 flex-1 rounded-[5px] bg-djassa-cloud border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] px-4 text-[12.5px] text-djassa-black outline-none transition placeholder:text-djassa-black/40 focus:bg-white focus:ring-2 focus:ring-djassa-red/25"
              />
              <button
                type="button"
                onClick={submit}
                disabled={!text.trim() || send.isPending}
                aria-label="Envoyer le message"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[5px] bg-djassa-red border-solid border-[0.5px] border-[rgba(255,255,255,0.12)] text-white shadow-pop transition hover:bg-djassa-black active:scale-95 disabled:cursor-not-allowed disabled:bg-djassa-gray disabled:text-djassa-black/40 disabled:shadow-none"
              >
                {send.isPending ? <Spinner size={16} className="" /> : <SendHorizonal size={18} />}
              </button>
            </div>
            <p className="mt-1.5 pl-12 text-[9px] text-djassa-black/35">Entrée pour envoyer · Les échanges restent dans votre fil Djassa.</p>
          </div>
        </div>

        {/* Contexte — grand écran */}
        <aside className="hidden w-[264px] shrink-0 flex-col bg-white xl:flex">
          <div className="p-4">
            <h3 className="font-spacegrotesk text-[10px] font-extrabold uppercase tracking-[0.16em] text-djassa-red">Article concerné</h3>
            {article ? (
              <div className="mt-3">
                <ArticleThumb article={article} className="aspect-[4/3] w-full rounded-[5px]" />
                <p className="mt-2.5 line-clamp-2 font-spacegrotesk text-[11.5px] font-extrabold leading-snug text-djassa-black">{article.titre}</p>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <span className="price-fcfa text-[14px] text-djassa-red">{formatFCFA(article.prix_actuel ?? article.prix)}</span>
                  {article.condition && (
                    <span className="rounded-[5px] bg-djassa-cloud px-2 py-0.5 text-[8.5px] font-extrabold uppercase tracking-wide text-djassa-black/55">
                      {CONDITION_LABELS[article.condition] ?? article.condition}
                    </span>
                  )}
                </div>
                <Link to={`/article/${article.id}`} className="mt-3 inline-flex items-center gap-1.5 font-spacegrotesk text-[10px] font-extrabold text-djassa-red transition hover:gap-2">
                  Voir l’annonce <ExternalLink size={20} />
                </Link>
              </div>
            ) : (
              <p className="mt-2 text-[11px] text-djassa-black/50">Aucun article lié à cette conversation.</p>
            )}
          </div>

          <div className="bg-djassa-red/[0.04] p-4">
            <h3 className="font-spacegrotesk text-[10px] font-extrabold uppercase tracking-[0.16em] text-djassa-red">Paiement sécurisé</h3>
            <ul className="mt-3 space-y-2.5 text-[10.5px] leading-snug text-djassa-black/60">
              <li className="flex gap-2"><ShieldCheck size={20} className="mt-0.5 shrink-0 text-djassa-red" /> Fonds bloqués en séquestre jusqu’à la remise.</li>
              <li className="flex gap-2"><LockKeyhole size={20} className="mt-0.5 shrink-0 text-djassa-red" /> Code PIN envoyé à l’acheteur par e-mail.</li>
              <li className="flex gap-2"><BadgeCheck size={20} className="mt-0.5 shrink-0 text-djassa-red" /> Libération après validation du vendeur.</li>
            </ul>
          </div>

          <div className="p-4">
            <h3 className="font-spacegrotesk text-[10px] font-extrabold uppercase tracking-[0.16em] text-djassa-red">Actions rapides</h3>
            <div className="mt-3 space-y-2">
              <button type="button" onClick={() => setOfferMode(true)} className="flex w-full items-center gap-2 rounded-[5px] px-3 py-2 text-left font-spacegrotesk text-[10.5px] font-bold text-djassa-black/70 transition hover:text-djassa-red">
                <Tag size={20} className="text-djassa-red" /> Faire une offre de prix
              </button>
              <button type="button" onClick={() => setTrocOpen(true)} disabled={!article || !trocableHint(article)} className="flex w-full items-center gap-2 rounded-[5px] px-3 py-2 text-left font-spacegrotesk text-[10.5px] font-bold text-djassa-black/70 transition hover:text-djassa-red disabled:cursor-not-allowed disabled:opacity-40">
                <ArrowLeftRight size={20} className="text-djassa-red" /> Proposer un troc
              </button>
              <Link to={dashboardPath === '/dashboard-pro' ? '/dashboard-pro/achats' : '/dashboard?onglet=achats'} className="flex w-full items-center gap-2 rounded-[5px] px-3 py-2 text-left font-spacegrotesk text-[10.5px] font-bold text-djassa-black/70 transition hover:text-djassa-red">
                <ShoppingBag size={20} className="text-djassa-red" /> Mes achats & PIN
              </Link>
            </div>
          </div>
        </aside>
      </div>

      <BarterModal open={trocOpen} onClose={() => setTrocOpen(false)} targetArticle={article} onSuccess={() => setTrocOpen(false)} />
    </div>
  );
}

/* ================= Briques de fil ================= */

function ArticleThumb({ article, className = 'h-12 w-12' }) {
  return (
    <div className={`${className} shrink-0 overflow-hidden bg-djassa-cloud`}>
      {article?.image_principale || article?.images?.[0] ? (
        <img src={article.image_principale ?? article.images[0]} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-djassa-black/25"><ImageIcon size={18} /></div>
      )}
    </div>
  );
}

function SystemNote({ message }) {
  return (
    <div className="flex justify-center py-1">
      <p className="inline-flex max-w-[90%] items-center gap-2 rounded-[5px] bg-djassa-red px-3.5 py-1.5 text-center text-[10px] font-medium leading-snug text-white shadow-pop">
        <ShieldCheck size={20} className="shrink-0 text-white" />
        {message.contenu}
      </p>
    </div>
  );
}

function TextBubble({ message, mine, partnerName }) {
  return (
    <div className={`flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
      {!mine && <Avatar name={partnerName} size={26} tone="black" />}
      <div className={`max-w-[78%] rounded-[5px] px-3.5 py-2.5 text-[12.5px] leading-relaxed shadow-sm ${
        mine ? 'rounded-[5px] bg-djassa-black border-solid border-[0.5px] border-[rgba(255,255,255,0.12)] text-white' : 'rounded-[5px] bg-white text-djassa-black  '
      }`}>
        <p className="whitespace-pre-wrap break-words">{message.contenu}</p>
        <span className={`mt-1.5 flex items-center justify-end gap-1 text-[8.5px] ${mine ? 'text-white/50' : 'text-djassa-black/40'}`}>
          {timeAgo(message.created_at)}
          {mine && message.lu_at && <CheckCheck size={16} className="text-djassa-red" />}
        </span>
      </div>
    </div>
  );
}

function PriceCard({ message, mine }) {
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div className={`w-full max-w-[320px] overflow-hidden rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)]   shadow-card ${mine ? 'ring-djassa-black/15' : ''}`}>
        <div className="flex items-center gap-2 bg-djassa-red/[0.07] px-3 py-2">
          <Tag size={24} className="text-djassa-red" />
          <p className="font-spacegrotesk text-[9px] font-extrabold uppercase tracking-[0.14em] text-djassa-red">Offre de prix formelle</p>
        </div>
        <div className="p-3">
          <p className="price-fcfa text-[20px] tracking-tight text-djassa-red">{formatFCFA(message.payload?.montant_fcfa ?? 0)}</p>
          <p className="mt-1 text-[10px] leading-relaxed text-djassa-black/50">
            {mine ? 'En attente de réponse de votre interlocuteur.' : 'Vous pouvez accepter ou refuser cette offre depuis la fiche article.'}
          </p>
        </div>
      </div>
    </div>
  );
}

const trocableHint = (a) => Boolean(a?.est_trocable || ['troc', 'mixte'].includes(a?.mode_transaction));

function TrocCard({ message, mine, onRespond, pending }) {
  const { user } = useAuth();
  const [counter, setCounter] = useState('');
  const { data: offerData } = useQuery({
    queryKey: ['barter-offer', message.offre_troc_id],
    queryFn: async () => (await api.get(`/barter-offers/${message.offre_troc_id}`)).data,
    enabled: Boolean(message.offre_troc_id),
    refetchInterval: 5000,
  });

  const offer = offerData?.data;
  const payload = message.payload ?? {};
  const iAmSeller = offer ? offer.vendeur?.id === user?.id : false;
  const canRespond = iAmSeller && ['pending', 'countered'].includes(offer?.statut);
  const status = offer?.statut ?? payload.statut_offre ?? 'pending';
  const statusMeta = BARTER_STATUS[status] ?? BARTER_STATUS.pending;
  const soulte = offer?.soulte_effective ?? payload.montant_soulte_fcfa ?? 0;
  const offered = offer?.articles_offerts?.map((a) => a.titre ?? a) ?? payload.articles_offerts ?? [];

  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div className="w-full max-w-[420px] overflow-hidden rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] shadow-card">
        <div className="flex items-center gap-2 bg-djassa-red px-3.5 py-2.5 text-white">
          <ArrowLeftRight size={24} className="text-white" strokeWidth={2.5} />
          <p className="font-spacegrotesk text-[9.5px] font-extrabold uppercase tracking-[0.15em]">Proposition de troc</p>
          <span className="ml-auto rounded-[5px] bg-white/10 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide text-white">
            {statusMeta.label}
          </span>
        </div>

        <div className="p-3.5">
          <p className="font-spacegrotesk text-[9px] font-extrabold uppercase tracking-[0.14em] text-djassa-black/45">
            {mine ? 'Vous proposez' : 'L’acheteur propose'}
          </p>
          {offered.length > 0 ? (
            <ul className="mt-2 space-y-1.5">
              {offered.map((item, i) => (
                <li key={`${item}-${i}`} className="flex items-start gap-2 text-[11.5px] font-semibold leading-snug text-djassa-black">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] bg-djassa-red/10 text-djassa-red"><Zap size={16} /></span>
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-[11px] text-djassa-black/50">Article proposé sans détail complémentaire.</p>
          )}

          <div className="mt-3 flex items-center justify-between gap-3 rounded-[5px] bg-djassa-red/[0.06] px-3 py-2.5">
            <div>
              <p className="text-[8.5px] font-extrabold uppercase tracking-wide text-djassa-red/70">Soulte proposée</p>
              <p className="price-fcfa mt-0.5 text-[17px] leading-none text-djassa-red">{formatFCFA(soulte)}</p>
            </div>
            <span className="rounded-[5px] bg-white px-2.5 py-1 text-[9px] font-extrabold text-djassa-red ring-djassa-red/25">
              {Number(soulte) === 0 ? 'Troc pur' : 'Troc mixte'}
            </span>
          </div>

          {offer?.message && (
            <p className="mt-2.5 rounded-[5px] bg-djassa-red/[0.05] px-2.5 py-2 text-[10.5px] italic leading-relaxed text-djassa-black/60">“{offer.message}”</p>
          )}

          {canRespond ? (
            <div className="mt-3.5 space-y-2 pt-3">
              <div className="flex gap-2">
                <button type="button" disabled={pending} onClick={() => onRespond.mutate({ offerId: offer.id, action: 'accept' })} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[5px] bg-djassa-red border-solid border-[0.5px] border-[rgba(255,255,255,0.12)] px-3 py-2 font-spacegrotesk text-[10px] font-extrabold uppercase tracking-wide text-white shadow-pop transition hover:bg-djassa-black active:scale-95 disabled:cursor-not-allowed disabled:opacity-50">
                  <CheckCheck size={24} /> Accepter
                </button>
                <button type="button" disabled={pending} onClick={() => onRespond.mutate({ offerId: offer.id, action: 'reject' })} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[5px] px-3 py-2 font-spacegrotesk text-[10px] font-extrabold uppercase tracking-wide text-djassa-black/60 transition hover:text-djassa-red disabled:cursor-not-allowed disabled:opacity-50">
                  <X size={24} /> Refuser
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={counter}
                  onChange={(e) => setCounter(e.target.value)}
                  placeholder="Contre-offre en FCFA…"
                  aria-label="Montant de la contre-offre"
                  className="h-9 min-w-0 flex-1 rounded-[5px] px-2.5 text-[11px] outline-none transition"
                />
                <button type="button" disabled={pending || !counter || Number(counter) < 0} onClick={() => onRespond.mutate({ offerId: offer.id, action: 'counter', montant: Number(counter) })} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[5px] bg-djassa-black border-solid border-[0.5px] border-[rgba(255,255,255,0.12)] px-3 font-spacegrotesk text-[9.5px] font-extrabold uppercase tracking-wide text-white transition hover:bg-djassa-red disabled:cursor-not-allowed disabled:opacity-40">
                  Contre-offrir
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-3 pt-2.5 text-[10px] text-djassa-red/70">
              {mine ? 'En attente de la réponse du vendeur.' : 'Cette proposition ne nécessite plus votre action.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
