import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeftRight, BadgeCheck, Check, ChevronLeft, MessageCircle,
  SendHorizonal, Tag, X, Zap,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatFCFA, timeAgo, BARTER_STATUS } from '../lib/format';
import { Avatar, Spinner, EmptyState } from '../components/ui';
import BarterModal from '../components/BarterModal';

export default function Messages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const partnerId = searchParams.get('to');
  const articleId = searchParams.get('article');

  return (
    <div className="mx-auto grid max-w-7xl md:grid-cols-[340px_1fr] md:gap-0">
      {/* Inbox — masquée sur mobile quand un fil est ouvert */}
      <div className={`${partnerId ? 'hidden md:block' : 'block'} border-r border-djassa-black/8 bg-white md:h-[calc(100vh-3.5rem)] md:overflow-y-auto`}>
        <Inbox partnerId={partnerId} articleId={articleId} onSelect={(p, a) => setSearchParams({ to: p, article: a ?? '' })} />
      </div>

      {/* Fil de discussion */}
      <div className={`${partnerId ? 'block' : 'hidden md:block'} bg-djassa-mist/50 md:h-[calc(100vh-3.5rem)]`}>
        {partnerId ? (
          <Thread partnerId={partnerId} articleId={articleId} onBack={() => setSearchParams({})} />
        ) : (
          <div className="hidden h-full flex-col items-center justify-center gap-3 text-center md:flex">
            <MessageCircle size={44} className="text-djassa-black/15" />
            <p className="font-jakarta font-bold text-djassa-black">Vos négociations Djassa</p>
            <p className="max-w-xs text-sm text-djassa-slate">Sélectionnez une conversation, ou proposez un troc depuis une fiche article.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= Inbox ================= */

function Inbox({ partnerId, articleId, onSelect }) {
  const { data, isLoading } = useQuery({
    queryKey: ['messages', 'conversations'],
    queryFn: async () => (await api.get('/messages/conversations')).data,
    refetchInterval: 8000,
  });

  const conversations = data?.conversations ?? [];

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-djassa-black/8 px-4 py-3">
        <h1 className="font-jakarta text-base font-extrabold text-djassa-black">Messages <span className="text-djassa-red">& Négociations</span></h1>
        <p className="text-[11px] text-djassa-slate">{conversations.length} conversation{conversations.length > 1 ? 's' : ''}</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center p-6"><Spinner /></div>
        ) : conversations.length === 0 ? (
          <EmptyState art="message" title="Aucune conversation" hint="Proposez un troc ou écrivez à un vendeur depuis une fiche article." />
        ) : (
          conversations.map((conv) => {
            const active = conv.with?.id === partnerId && (conv.article?.id ?? '') === (articleId ?? '');
            return (
              <button
                key={`${conv.with?.id}-${conv.article?.id ?? 'global'}`}
                onClick={() => onSelect(conv.with?.id, conv.article?.id)}
                className={`flex w-full items-start gap-3 border-b border-djassa-black/5 px-4 py-3 text-left transition hover:bg-djassa-mist ${active ? 'bg-djassa-red/5 ring-1 ring-inset ring-djassa-red/30' : ''}`}
              >
                <Avatar name={conv.with?.nom} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-jakarta text-xs font-bold text-djassa-black">{conv.with?.nom}</p>
                    <span className="shrink-0 text-[9px] text-djassa-slate">{timeAgo(conv.dernier_message?.created_at)}</span>
                  </div>
                  {conv.article && <p className="truncate text-[10px] font-semibold text-djassa-red">{conv.article.titre}</p>}
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <p className="truncate text-[11px] text-djassa-slate">{conv.dernier_message?.contenu}</p>
                    {conv.non_lus > 0 && <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-djassa-red px-1.5 text-[9px] font-extrabold text-white">{conv.non_lus}</span>}
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

function Thread({ partnerId, articleId, onBack }) {
  const { user } = useAuth();
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
  const article = articleData?.data;

  const messages = thread?.data ?? [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  const send = useMutation({
    mutationFn: async (payload) => (await api.post('/messages', payload)).data,
    onSuccess: () => {
      setText(''); setOfferAmount(''); setOfferMode(false);
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
    onError: () => toast.error('Message non envoyé.'),
  });

  const respondOffer = useMutation({
    mutationFn: async ({ offerId, action, montant }) => (await api.patch(`/barter-offers/${offerId}/respond`, { action, montant_contre_offre_fcfa: montant })).data,
    onSuccess: (data, vars) => {
      toast.success(vars.action === 'accept' ? 'Offre acceptée — articles verrouillés.' : vars.action === 'reject' ? 'Offre refusée.' : 'Contre-offre envoyée.');
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

  return (
    <div className="flex h-full flex-col">
      {/* En-tête du fil */}
      <div className="flex items-center gap-2 border-b border-djassa-black/8 bg-white px-3 py-2.5">
        <button onClick={onBack} className="rounded-full p-1.5 hover:bg-djassa-cloud md:hidden" aria-label="Retour aux conversations"><ChevronLeft size={20} /></button>
        <Avatar name={partnerId?.slice(0, 2).toUpperCase()} size={38} tone="black" />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 font-jakarta text-xs font-bold text-djassa-black">Conversation <BadgeCheck size={12} className="text-djassa-red" /></p>
          {article && <Link to={`/article/${article.id}`} className="block truncate text-[10px] font-semibold text-djassa-red hover:underline">{article.titre} · {formatFCFA(article.prix_actuel ?? article.prix)}</Link>}
        </div>
        {article && trocableHint(article) && (
          <button className="btn-red btn-sm" onClick={() => setTrocOpen(true)}><ArrowLeftRight size={14} /> Troc</button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {isLoading && <div className="flex justify-center py-8"><Spinner /></div>}
        {messages.map((m) => {
          const mine = m.expediteur_id === user?.id;
          if (m.type === 'systeme') {
            return <p key={m.id} className="mx-auto w-fit max-w-[85%] rounded-full bg-djassa-black/85 px-4 py-1.5 text-center text-[10px] font-medium text-white/90">{m.contenu}</p>;
          }
          if (m.type === 'carte_troc') {
            return <TrocCard key={m.id} message={m} onRespond={respondOffer} pending={respondOffer.isPending} />;
          }
          if (m.type === 'offre_prix') {
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl border-2 px-4 py-2.5 ${mine ? 'border-djassa-black bg-djassa-black text-white' : 'border-djassa-red bg-white'}`}>
                  <p className="flex items-center gap-1.5 text-[9px] font-jakarta font-extrabold uppercase tracking-wider opacity-80"><Tag size={10} /> Offre de prix formelle</p>
                  <p className="mt-0.5 font-jakarta text-lg font-extrabold">{formatFCFA(m.payload?.montant_fcfa ?? 0)}</p>
                  <p className="text-[10px] opacity-75">Le vendeur peut accepter ou refuser depuis sa fiche article.</p>
                </div>
              </div>
            );
          }
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-[13px] leading-snug shadow-sm ${mine ? 'rounded-br-md bg-djassa-black text-white' : 'rounded-bl-md bg-white text-djassa-black ring-1 ring-djassa-black/8'}`}>
                {m.contenu}
                <span className={`mt-1 block text-[8px] ${mine ? 'text-white/50' : 'text-djassa-slate'}`}>{timeAgo(m.created_at)}</span>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Offre de prix (bandeau) */}
      {offerMode && (
        <div className="flex items-center gap-2 border-t border-djassa-black/8 bg-amber-50 px-3 py-2">
          <Tag size={16} className="text-amber-700" />
          <input autoFocus type="number" min="0" inputMode="numeric" value={offerAmount} onChange={(e) => setOfferAmount(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitOffer()} placeholder="Montant proposé en FCFA" className="h-9 flex-1 rounded-lg border border-amber-200 bg-white px-3 text-sm outline-none focus:border-amber-400" />
          <button className="btn-black btn-sm" onClick={submitOffer}><Check size={14} /> Envoyer</button>
          <button className="rounded-full p-1.5 text-amber-800 hover:bg-amber-100" onClick={() => setOfferMode(false)} aria-label="Annuler"><X size={16} /></button>
        </div>
      )}

      {/* Composer */}
      <div className="flex items-center gap-1.5 border-t border-djassa-black/8 bg-white px-2 py-2">
        <button className="rounded-full p-2 text-djassa-slate transition hover:bg-djassa-cloud hover:text-djassa-black" onClick={() => setOfferMode((v) => !v)} aria-label="Faire une offre de prix" title="Faire une offre de prix"><Tag size={20} /></button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Écrire un message…"
          className="h-11 min-w-0 flex-1 rounded-full bg-djassa-cloud px-4 text-sm outline-none focus:ring-2 focus:ring-djassa-red/40"
          aria-label="Votre message"
        />
        <button className="flex h-11 w-11 items-center justify-center rounded-full bg-djassa-red text-white transition hover:bg-djassa-red-strong disabled:opacity-40" onClick={submit} disabled={!text.trim() || send.isPending} aria-label="Envoyer">
          {send.isPending ? <Spinner size={16} className="!border-white/40 !border-t-white" /> : <SendHorizonal size={19} />}
        </button>
      </div>

      <BarterModal open={trocOpen} onClose={() => setTrocOpen(false)} targetArticle={article} onSuccess={() => setTrocOpen(false)} />
    </div>
  );
}

const trocableHint = (a) => Boolean(a?.est_trocable || ['troc', 'mixte'].includes(a?.mode_transaction));

/* ================= Carte de troc interactive ================= */

function TrocCard({ message, onRespond, pending }) {
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
  const canVendeurAct = iAmSeller && ['pending', 'countered'].includes(offer?.statut);
  const status = offer?.statut ?? payload.statut_offre ?? 'pending';
  const statusMeta = BARTER_STATUS[status] ?? BARTER_STATUS.pending;
  const soulte = offer?.soulte_effective ?? payload.montant_soulte_fcfa ?? 0;

  return (
    <div className="flex justify-start">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border-2 border-djassa-red/70 bg-white shadow-pop">
        <div className="flex items-center gap-2 bg-djassa-red px-3 py-1.5 text-white">
          <ArrowLeftRight size={14} strokeWidth={2.5} />
          <p className="font-jakarta text-[10px] font-extrabold uppercase tracking-[0.16em]">Proposition de troc</p>
          <span className={`ml-auto rounded-full px-2 py-0.5 text-[8px] font-bold uppercase ${statusMeta.cls}`}>{statusMeta.label}</span>
        </div>
        <div className="p-3">
          {payload.articles_offerts?.length > 0 && (
            <ul className="space-y-1.5">
              {payload.articles_offerts.map((a, i) => (
                <li key={i} className="flex items-center gap-2 text-[11px] font-semibold text-djassa-black">
                  <Zap size={10} className="text-djassa-red" /> {a.titre ?? a}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-2 flex items-center justify-between rounded-xl bg-djassa-cloud px-3 py-2">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-wide text-djassa-slate">Soulte proposée</p>
              <p className="font-jakarta text-base font-extrabold text-djassa-black">{formatFCFA(soulte)}</p>
            </div>
            <p className="text-[10px] font-bold text-djassa-slate">{Number(soulte) === 0 ? 'Troc pur' : 'Troc mixte'}</p>
          </div>

          {/* Actions rapides — vendeur */}
          {canVendeurAct && (
            <div className="mt-3 space-y-2">
              <div className="flex gap-2">
                <button className="btn-black flex-1 btn-sm" disabled={pending} onClick={() => onRespond.mutate({ offerId: offer.id, action: 'accept' })}><Check size={14} /> Accepter</button>
                <button className="btn-outline flex-1 btn-sm !border-red-600 !text-red-600 hover:!bg-red-600 hover:!text-white" disabled={pending} onClick={() => onRespond.mutate({ offerId: offer.id, action: 'reject' })}><X size={14} /> Refuser</button>
              </div>
              <div className="flex items-center gap-1.5">
                <input type="number" min="0" inputMode="numeric" value={counter} onChange={(e) => setCounter(e.target.value)} placeholder="Contre-offre en FCFA…" className="h-9 flex-1 rounded-lg border border-djassa-black/12 px-2.5 text-xs outline-none focus:border-djassa-red" />
                <button className="btn-red btn-sm" disabled={pending || !counter} onClick={() => onRespond.mutate({ offerId: offer.id, action: 'counter', montant: Number(counter) })}>Contre-offrir</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
