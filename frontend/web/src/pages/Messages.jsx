import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { gsap } from 'gsap';
import {
  ArrowLeftRight, BadgeCheck, Camera, CheckCheck, ChevronLeft, ChevronRight, ExternalLink,
  Handshake, Image as ImageIcon, LockKeyhole, MessageCircle, Plus, Search, SendHorizonal, ShoppingBag,
  ShieldCheck, Tag, X, Zap,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BARTER_STATUS, CONDITION_LABELS, formatFCFA, timeAgo } from '../lib/format';
import { Avatar, EmptyState, Modal, PinInput, Spinner } from '../components/ui';
import BarterModal from '../components/BarterModal';
import {
  playButtonClick, playErrorThud, playMessageReceived, playMessageSent, playSuccessChord,
} from '../utils/soundEffects';

/* Charte Djassa — Space Grotesk (titres) + DM Sans (corps), auto-hébergées. */
const FONT_TITLE = "'Space Grotesk', sans-serif";
const FONT_BODY = "'DM Sans', sans-serif";

/* Surfaces charte : #780000 accent · #121212 encre · #FFFFFF · #F7F7F7 / #EFEFEF. */
const STATUS_META = {
  'En cours': { pill: 'bg-[#EFEFEF] text-[#121212]', dot: 'bg-[#780000]' },
  'Troc proposé': { pill: 'bg-[#780000] text-white', dot: 'bg-white' },
  'Séquestre actif': { pill: 'bg-[#121212] text-white', dot: 'bg-[#780000]' },
  'Résolu': { pill: 'bg-[#EFEFEF] text-[#121212]/60', dot: 'bg-[#121212]/35' },
};
const STATUS_PROGRESS = { 'En cours': 20, 'Troc proposé': 45, 'Séquestre actif': 72, 'Résolu': 100 };

const PREVIEW_ICONS = {
  carte_troc: ArrowLeftRight,
  offre_prix: Tag,
  deal: Handshake,
  systeme: ShieldCheck,
  texte: MessageCircle,
};

const DEAL_STATUS = {
  proposed: { label: 'Proposé', className: 'bg-[#EFEFEF] text-[#121212]' },
  countered: { label: 'Contre-proposition', className: 'bg-[#780000] text-white' },
  accepted: { label: 'Accepté', className: 'bg-[#121212] text-white' },
  rejected: { label: 'Refusé', className: 'bg-[#EFEFEF] text-[#121212]/60' },
};

function reduceMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Entrée étagée, sans bloquer l'interaction (clearProps). */
function animateEntrance(scope, selector = '[data-reveal-item]') {
  if (!scope) return undefined;
  const els = Array.from(scope.querySelectorAll(selector));
  if (!els.length || reduceMotion()) return undefined;
  const ctx = gsap.context(() => {
    gsap.from(els, {
      y: 12, opacity: 0, duration: 0.4, stagger: 0.055, ease: 'power2.out',
      clearProps: 'transform,opacity',
    });
  }, scope);
  return () => ctx.revert();
}

/** Impulsion sur une icône d'action (retour tactile visuel). */
function pulseIcon(el) {
  if (!el || reduceMotion()) return;
  gsap.fromTo(el, { rotate: -14, scale: 0.82 }, { rotate: 0, scale: 1, duration: 0.42, ease: 'back.out(2.4)' });
}

function preview(conv) {
  if (conv?.dernier_deal) {
    return `Deal : ${formatFCFA(conv.dernier_deal.montant_fcfa)} · ${conv.dernier_deal.lieu_remise}`;
  }
  const m = conv?.dernier_message;
  if (!m) return 'Aucun message pour le moment';
  if (m.type === 'carte_troc') return `Proposition de troc · ${formatFCFA(m.payload?.montant_soulte_fcfa ?? 0)} de soulte`;
  if (m.type === 'offre_prix') return `Offre de prix · ${formatFCFA(m.payload?.montant_fcfa ?? 0)}`;
  return m.contenu;
}

/** Statut affiché déduit des champs réellement exposés par l'API (aucun champ inventé). */
function conversationStatus(conv) {
  const last = conv?.dernier_message;
  const text = last?.contenu ?? '';
  if (conv?.statut === 'resolu' || /résolu|libér|terminé|clôtur/i.test(text)) return 'Résolu';
  if (last?.payload?.statut_escrow || /séquestre|escrow/i.test(text)) return 'Séquestre actif';
  if (last?.type === 'carte_troc') return 'Troc proposé';
  return 'En cours';
}

function partnerBadge(partner, conv) {
  if (partner?.role === 'livreur' || conv?.livreur_id || partner?.livreur === true) {
    return { label: 'Livreur', short: 'Livreur', verified: false, className: 'bg-[#780000] text-white' };
  }
  if (partner?.is_pro || partner?.role === 'vendeur_pro') {
    const verified = partner?.boutique?.verifie === true || partner?.verifie === true;
    return verified
      ? { label: 'Boutique Pro vérifiée', short: 'Pro vérifié', verified: true, className: 'bg-[#121212] text-white' }
      : { label: 'Boutique Pro', short: 'Pro', verified: false, className: 'bg-[#121212] text-white' };
  }
  return { label: 'Particulier', short: 'Particulier', verified: false, className: 'bg-[#EFEFEF] text-[#121212]/70' };
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const max = 480;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.62));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function Messages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const partnerId = searchParams.get('to');
  const articleId = searchParams.get('article');
  const [summaryOpen, setSummaryOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ['messages', 'conversations'],
    queryFn: async () => (await api.get('/messages/conversations')).data,
    refetchInterval: 8000,
  });
  const conversations = data?.conversations ?? [];

  const open = (to, article) => { setSearchParams({ to, article: article ?? '' }); setSummaryOpen(false); };
  const back = () => { setSearchParams({}); setSummaryOpen(false); };

  const active = conversations.find((c) => (
    c.with?.id === partnerId && (c.article?.id ?? '') === (articleId ?? '')
  ));
  const status = active ? conversationStatus(active) : 'En cours';

  return (
    <div className="mx-auto max-w-[1500px] md:my-4 md:h-[calc(100vh-7.5rem)] md:px-4" style={{ fontFamily: FONT_BODY }}>
      <div className="grid h-full overflow-hidden bg-white shadow-card md:rounded-[5px] md:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_296px]">
        {/* Colonne gauche — liste des discussions */}
        <div className={`${partnerId ? 'hidden md:flex' : 'flex'} h-full min-h-0 min-w-0`}>
          <Inbox conversations={conversations} isLoading={!data} partnerId={partnerId} articleId={articleId} onSelect={open} />
        </div>

        {/* Zone centrale — fil de discussion */}
        <div className={`${partnerId ? 'flex' : 'hidden md:flex'} h-full min-h-0 min-w-0 bg-[#F7F7F7]`}>
          {partnerId ? (
            <Thread
              partnerId={partnerId}
              articleId={articleId}
              conversation={active}
              status={status}
              onBack={back}
              onToggleSummary={() => setSummaryOpen(true)}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-[5px] bg-[#780000] text-white shadow-pop">
                <MessageCircle size={30} strokeWidth={1.7} />
              </span>
              <div>
                <h2 className="text-[17px] font-extrabold tracking-tight text-[#121212]" style={{ fontFamily: FONT_TITLE }}>
                  Vos négociations Djassa
                </h2>
                <p className="mx-auto mt-1 max-w-xs text-[12px] leading-relaxed text-[#121212]/55">
                  Sélectionnez une conversation pour reprendre l’échange, ou ouvrez une fiche article pour proposer un troc.
                </p>
              </div>
              <Link to="/" className="inline-flex items-center gap-1.5 rounded-[5px] bg-[#780000] px-4 py-2 text-[11px] font-extrabold uppercase tracking-wide text-white transition hover:bg-[#121212]">
                Explorer le marché <ExternalLink size={16} />
              </Link>
            </div>
          )}
        </div>

        {/* Panneau droit — récapitulatif (desktop, uniquement si un fil est ouvert) */}
        {active && (
          <div className="hidden min-h-0 xl:flex">
            <Summary conversation={active} status={status} onClose={() => {}} embedded />
          </div>
        )}
      </div>

      {/* Tiroir récapitulatif (mobile / tablette) */}
      {summaryOpen && (
        <SummaryDrawer conversation={active} status={status} onClose={() => setSummaryOpen(false)} />
      )}
    </div>
  );
}

/* ================================================================
   Inbox — liste des discussions
   ================================================================ */

function Inbox({ conversations, isLoading, partnerId, articleId, onSelect }) {
  const listRef = useRef(null);
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

  useLayoutEffect(() => animateEntrance(listRef.current, '[data-reveal-item]'), [query, onlyUnread]);

  return (
    <div ref={listRef} className="flex h-full w-full flex-col">
      <div className="shrink-0 bg-[#780000] px-4 pb-3 pt-4 text-white">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-[17px] font-extrabold tracking-tight text-white" style={{ fontFamily: FONT_TITLE }}>
              Messages <span className="text-white/80">& Négociations</span>
            </h1>
            <p className="mt-0.5 text-[10.5px] text-white/80">
              {conversations.length} conversation{conversations.length > 1 ? 's' : ''}
              {totalUnread > 0 && <> · {totalUnread} non lue{totalUnread > 1 ? 's' : ''}</>}
            </p>
          </div>
          {totalUnread > 0 && (
            <span className="mt-0.5 flex h-6 min-w-6 items-center justify-center rounded-[5px] bg-white px-1.5 text-[10px] font-extrabold text-[#780000] shadow-sm">
              {totalUnread}
            </span>
          )}
        </div>

        <div className="mt-3 flex h-9 items-center gap-2 rounded-[5px] bg-white/15 px-3 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-white/70">
          <Search size={16} className="shrink-0 text-white/75" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une conversation…"
            aria-label="Rechercher une conversation"
            className="min-w-0 flex-1 bg-transparent text-[11.5px] text-white outline-none placeholder:text-white/75 focus:text-[#121212] focus:placeholder:text-[#121212]/40"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="rounded-[5px] p-1 text-white/75 transition hover:bg-white/15 hover:text-white" aria-label="Effacer la recherche">
              <X size={16} />
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
              onClick={() => { setOnlyUnread(value); playButtonClick(); }}
              className={`flex-1 rounded-[5px] py-1.5 text-[10px] font-extrabold transition ${
                onlyUnread === value ? 'bg-white text-[#780000] shadow-sm' : 'text-white/80 hover:text-white'
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
            <img src="/images/illustrations/chat-bubbles.webp" alt="" aria-hidden="true" className="art-warm pointer-events-none mx-auto mb-2 h-32 w-auto select-none object-contain opacity-80" loading="lazy" decoding="async" />
            <EmptyState
              art={query ? 'search' : 'message'}
              title={query ? 'Aucun résultat' : onlyUnread ? 'Tout est lu' : 'Aucune conversation'}
              hint={query ? 'Essayez un autre nom ou un autre mot-clé.' : onlyUnread ? 'Vous n’avez aucun message non lu.' : 'Proposez un troc ou écrivez à un vendeur depuis une fiche article.'}
            />
          </div>
        ) : (
          visible.map((conv) => {
            const activeRow = conv.with?.id === partnerId && (conv.article?.id ?? '') === (articleId ?? '');
            const unread = conv.non_lus ?? 0;
            const Icon = PREVIEW_ICONS[conv.dernier_message?.type] ?? MessageCircle;
            const status = conversationStatus(conv);
            const meta = STATUS_META[status];
            return (
              <button
                key={`${conv.with?.id}-${conv.article?.id ?? 'global'}`}
                type="button"
                data-reveal-item
                onClick={() => onSelect(conv.with?.id, conv.article?.id)}
                aria-current={activeRow ? 'true' : undefined}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition ${
                  activeRow ? 'bg-[#F7F7F7] shadow-card' : 'hover:bg-[#F7F7F7]'
                }`}
              >
                <div className="relative shrink-0">
                  <Avatar name={conv.with?.nom} size={40} tone={conv.with?.is_pro ? 'black' : 'red'} />
                  {unread > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-[5px] bg-[#780000] px-1 text-[9px] font-extrabold text-white ring-2 ring-white">
                      {unread}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={`truncate text-[12px] font-extrabold ${activeRow ? 'text-[#780000]' : 'text-[#121212]'}`} style={{ fontFamily: FONT_TITLE }}>
                      {conv.with?.nom ?? 'Partenaire'}
                    </p>
                    <time className="shrink-0 text-[9px] text-[#121212]/45">
                      {timeAgo(conv.dernier_message?.created_at)}
                    </time>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className={`inline-flex items-center gap-1 rounded-[5px] px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wide ${meta.pill}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} /> {status}
                    </span>
                    {conv.with?.is_pro && (
                      <span className="inline-flex items-center gap-0.5 rounded-[5px] bg-[#EFEFEF] px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wide text-[#121212]/70">
                        <BadgeCheck size={16} /> Pro
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <Icon size={16} className={unread ? 'shrink-0 text-[#780000]' : 'shrink-0 text-[#121212]/35'} />
                    <p className={`truncate text-[11px] ${unread ? 'font-semibold text-[#121212]' : 'text-[#121212]/55'}`}>
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

/* ================================================================
   Fil de discussion
   ================================================================ */

function Thread({ partnerId, articleId, conversation, status, onBack, onToggleSummary }) {
  const { user, dashboardPath } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const endRef = useRef(null);
  const threadRef = useRef(null);
  const sendIconRef = useRef(null);
  const fileRef = useRef(null);
  const [text, setText] = useState('');
  const [offerMode, setOfferMode] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [trocOpen, setTrocOpen] = useState(false);
  const [trocSoulte, setTrocSoulte] = useState('');
  const [attachedPhoto, setAttachedPhoto] = useState(null);
  const [pinOpen, setPinOpen] = useState(false);
  const [dealOpen, setDealOpen] = useState(false);
  const [dealMontant, setDealMontant] = useState('');
  const [dealLieu, setDealLieu] = useState('');

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

  const { data: dealsData } = useQuery({
    queryKey: ['deals', conversation?.id],
    queryFn: async () => (await api.get('/deals', { params: { conversation_id: conversation.id } })).data,
    enabled: Boolean(conversation?.id),
    refetchInterval: 6000,
  });
  const deals = dealsData?.data ?? [];

  const article = articleData?.data ?? conversation?.article;
  const messages = thread?.data ?? [];
  const partner = conversation?.with;
  const badge = partnerBadge(partner, conversation);
  const meta = STATUS_META[status];
  const knownMsgIdsRef = useRef(new Set());
  const msgInitRef = useRef(false);
  const animatedThreadRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'end' });
  }, [messages.length]);

  /* Entrée étagée du fil au changement de conversation / de filtre. */
  useEffect(() => {
    if (isLoading) return undefined;
    const key = `${partnerId}|${articleId ?? ''}`;
    if (animatedThreadRef.current === key) return undefined;
    animatedThreadRef.current = key;
    return animateEntrance(threadRef.current, '[data-thread-item]');
  }, [partnerId, articleId, isLoading, messages.length]);

  /* Glissement doux des nouveaux messages + son de réception. */
  useEffect(() => {
    if (!messages.length) return;
    if (!msgInitRef.current) {
      messages.forEach((m) => knownMsgIdsRef.current.add(m.id));
      msgInitRef.current = true;
      return;
    }
    const newIds = messages.filter((m) => !knownMsgIdsRef.current.has(m.id)).map((m) => m.id);
    const hasNewIncoming = messages.some((m) => !knownMsgIdsRef.current.has(m.id) && m.expediteur_id !== user?.id);
    messages.forEach((m) => knownMsgIdsRef.current.add(m.id));
    if (hasNewIncoming) playMessageReceived();
    if (newIds.length && !reduceMotion()) {
      requestAnimationFrame(() => {
        newIds.forEach((id) => {
          const el = document.querySelector(`[data-msg-id="${CSS.escape(String(id))}"]`);
          if (el) gsap.fromTo(el, { opacity: 0, y: 14, x: 6 }, { opacity: 1, y: 0, x: 0, duration: 0.34, ease: 'power2.out', clearProps: 'transform,opacity' });
        });
      });
    }
  }, [messages, user?.id]);

  const send = useMutation({
    mutationFn: async (payload) => (await api.post('/messages', payload)).data,
    onSuccess: () => {
      playMessageSent();
      pulseIcon(sendIconRef.current);
      setText(''); setOfferAmount(''); setOfferMode(false); setAttachedPhoto(null);
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
    onError: (error) => toast.error(error.response?.data?.message ?? 'Message non envoyé.'),
  });

  const markRead = useMutation({
    mutationFn: (id) => api.post(`/messages/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['messages'] }),
    onError: () => toast.error('Lecture du message non enregistrée.'),
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

  const proposeDeal = useMutation({
    mutationFn: async ({ montant, lieu }) => (await api.post('/deals', {
      conversation_id: conversation.id,
      article_id: articleId || undefined,
      montant_fcfa: Number(montant),
      lieu_remise: lieu,
    })).data,
    onSuccess: () => {
      toast.success('Deal proposé — en attente de l\'autre partie.');
      setDealOpen(false); setDealMontant(''); setDealLieu('');
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Proposition impossible.'),
  });

  const respondDeal = useMutation({
    mutationFn: async ({ id, action, montant, lieu }) => (await api.patch(`/deals/${id}/respond`, {
      action,
      ...(action === 'counter' ? { montant_fcfa: Number(montant), lieu_remise: lieu } : {}),
    })).data,
    onSuccess: (data, vars) => {
      const labels = { accept: 'Deal accepté — accord sur le prix et le lieu.', reject: 'Deal refusé.', counter: 'Contre-proposition envoyée.' };
      toast.success(labels[vars.action] ?? 'Réponse enregistrée.');
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Action impossible.'),
  });

  const submit = () => {
    const value = text.trim();
    if (!value && !attachedPhoto) return;
    send.mutate({
      destinataire_id: partnerId,
      article_id: articleId || undefined,
      type: 'texte',
      contenu: value || 'Photo jointe',
      ...(attachedPhoto ? { payload: { photo: attachedPhoto.dataUrl, photo_nom: attachedPhoto.name } } : {}),
    });
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

  const onPhotoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Seules les images sont acceptées.'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Image trop volumineuse (2 Mo maximum).'); return; }
    try {
      const dataUrl = await compressImage(file);
      setAttachedPhoto({ dataUrl, name: file.name });
      playButtonClick();
    } catch {
      toast.error('Impossible de lire cette image.');
    }
  };

  const dayLabel = messages.length
    ? new Date(messages[0].created_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    : '';

  return (
    <div className="flex h-full min-h-0 w-full flex-col" ref={threadRef}>
      {/* En-tête de conversation */}
      <div className="flex shrink-0 items-center gap-3 bg-white px-3 py-2.5 sm:px-4">
        <button type="button" onClick={onBack} className="rounded-[5px] p-1.5 text-[#121212]/60 transition hover:bg-[#EFEFEF] hover:text-[#780000] md:hidden" aria-label="Retour aux conversations">
          <ChevronLeft size={20} />
        </button>
        <div className="relative shrink-0">
          <Avatar name={partner?.nom ?? partnerId?.slice(0, 2)} size={40} tone={partner?.is_pro ? 'black' : 'red'} />
          <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white ${partner?.en_ligne === true ? 'bg-[#780000]' : 'bg-[#121212]/25'}`} aria-label={partner?.en_ligne === true ? 'En ligne' : 'Hors ligne'} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h2 className="truncate text-[13px] font-extrabold tracking-tight text-[#121212]" style={{ fontFamily: FONT_TITLE }}>
              {partner?.nom ?? 'Conversation'}
            </h2>
            <span className={`inline-flex shrink-0 items-center gap-0.5 rounded-[5px] px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wide ${badge.className}`}>
              {badge.verified && <BadgeCheck size={16} />}
              <span className="sm:hidden">{badge.short}</span>
              <span className="hidden sm:inline">{badge.label}</span>
            </span>
          </div>
          <p className="mt-0.5 truncate text-[10px] text-[#121212]/50">
            {partner?.en_ligne === true ? 'En ligne' : 'Hors ligne'} · {article ? `Négociation · ${article.titre}` : 'Négociation Djassa Online'}
          </p>
        </div>
        <button type="button" onClick={onToggleSummary} className="rounded-[5px] bg-[#EFEFEF] p-2 text-[#121212]/70 transition hover:bg-[#121212] hover:text-white xl:hidden" aria-label="Ouvrir le récapitulatif">
          <ChevronRight size={18} />
        </button>
        {article && trocableHint(article) && (
          <button type="button" onClick={() => { setTrocSoulte(''); setTrocOpen(true); playButtonClick(); }} aria-label="Proposer un troc" className="inline-flex shrink-0 items-center gap-1.5 rounded-[5px] bg-[#780000] p-2 text-[10px] font-extrabold uppercase tracking-wide text-white transition hover:bg-[#121212] sm:px-3 sm:py-2">
            <ArrowLeftRight size={16} /> <span className="hidden lg:inline">Proposer un troc</span>
          </button>
        )}
      </div>

      {/* Bandeau article — écrans moyens (l'aside le remplace en xl) */}
      {article && (
        <Link to={`/article/${article.id}`} className="flex shrink-0 items-center gap-2.5 bg-[#EFEFEF] px-3 py-2 transition hover:bg-[#F7F7F7] xl:hidden">
          <ArticleThumb article={article} className="h-9 w-9" />
          <span className="min-w-0 flex-1 truncate text-[10.5px] font-semibold text-[#121212]/70">{article.titre}</span>
          <span className="shrink-0 text-[11px] font-extrabold text-[#780000]">{formatFCFA(article.prix_actuel ?? article.prix)}</span>
          <ExternalLink size={16} className="shrink-0 text-[#780000]" />
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
                <MessageCircle size={30} className="text-[#121212]/15" />
                <p className="text-[12px] font-extrabold text-[#121212]" style={{ fontFamily: FONT_TITLE }}>Aucun message dans ce fil</p>
                <p className="max-w-[260px] text-[10.5px] text-[#121212]/50">Écrivez le premier message pour lancer la négociation.</p>
              </div>
            ) : (
              <>
                {dayLabel && (
                  <div data-thread-item className="flex items-center gap-3 py-1">
                    <span className="h-px flex-1 bg-[#780000]/25" />
                    <time className="shrink-0 text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#780000]" style={{ fontFamily: FONT_TITLE }}>{dayLabel}</time>
                    <span className="h-px flex-1 bg-[#780000]/25" />
                  </div>
                )}

                {/* Cartes d'action rapide intégrées au fil */}
                <ActionCards
                  article={article}
                  status={status}
                  onTroc={(soulte) => { setTrocSoulte(soulte); setTrocOpen(true); }}
                  onPhoto={() => fileRef.current?.click()}
                  onPin={() => setPinOpen(true)}
                  onDeal={() => setDealOpen(true)}
                />

                {deals.length > 0 && (
                  <div className="grid gap-2" data-deals-list>
                    {deals.map((deal) => (
                      <DealCard
                        key={deal.id}
                        deal={deal}
                        mine={deal.propose_par === user?.id}
                        onRespond={respondDeal}
                        pending={respondDeal.isPending}
                      />
                    ))}
                  </div>
                )}

                {messages.map((m) => {
                  const mine = m.expediteur_id === user?.id;
                  const wrap = (node) => <div key={m.id} data-msg-id={m.id} data-thread-item>{node}</div>;
                  if (m.type === 'systeme') return wrap(<SystemNote message={m} />);
                  if (m.type === 'carte_troc') return wrap(<TrocCard message={m} mine={mine} onRespond={respondOffer} pending={respondOffer.isPending} />);
                  if (m.type === 'offre_prix') return wrap(<PriceCard message={m} mine={mine} />);
                  return wrap(<TextBubble message={m} mine={mine} partnerName={partner?.nom} onRead={() => markRead.mutate(m.id)} />);
                })}
              </>
            )}
            {(thread?.partner_typing || thread?.is_typing) && <TypingDots />}
            <div ref={endRef} />
          </div>

          {/* Offre de prix */}
          {offerMode && (
            <div className="shrink-0 bg-[#EFEFEF] px-3 py-2.5 sm:px-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] bg-[#780000] text-white"><Tag size={16} /></span>
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
                  className="h-9 min-w-0 flex-1 rounded-[5px] bg-white px-3 text-[12px] text-[#121212] outline-none focus:ring-2 focus:ring-[#780000]/30"
                />
                <button type="button" className="inline-flex h-9 items-center gap-1.5 rounded-[5px] bg-[#121212] px-3 text-[10px] font-extrabold uppercase tracking-wide text-white transition hover:bg-[#780000] disabled:cursor-not-allowed disabled:opacity-40" disabled={!offerAmount || Number(offerAmount) <= 0 || send.isPending} onClick={submitOffer}>
                  Envoyer
                </button>
                <button type="button" className="rounded-[5px] p-1.5 text-[#121212]/60 transition hover:bg-white" onClick={() => setOfferMode(false)} aria-label="Annuler l'offre">
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Zone de saisie */}
          <div className="shrink-0 bg-white px-3 py-2.5 sm:px-4">
            {attachedPhoto && (
              <div className="mb-2 flex items-center gap-2 rounded-[5px] bg-[#EFEFEF] px-2.5 py-2">
                <img src={attachedPhoto.dataUrl} alt="Aperçu de la photo jointe" className="h-9 w-9 rounded-[5px] object-cover" />
                <span className="min-w-0 flex-1 truncate text-[10.5px] font-semibold text-[#121212]/70">{attachedPhoto.name}</span>
                <button type="button" onClick={() => setAttachedPhoto(null)} className="rounded-[5px] p-1 text-[#121212]/55 hover:bg-white hover:text-[#780000]" aria-label="Retirer la photo">
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input ref={fileRef} type="file" accept="image/*" onChange={onPhotoChange} className="hidden" aria-label="Joindre une photo" />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                aria-label="Joindre une photo ou une offre"
                title="Joindre une photo"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[5px] bg-[#EFEFEF] text-[#121212]/70 transition hover:bg-[#780000]/10 hover:text-[#780000]"
              >
                <Plus size={18} />
              </button>
              <button
                type="button"
                onClick={() => setOfferMode((v) => !v)}
                aria-label="Faire une offre de prix"
                aria-pressed={offerMode}
                title="Faire une offre de prix"
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[5px] transition ${
                  offerMode ? 'bg-[#780000] text-white' : 'bg-[#EFEFEF] text-[#121212]/70 hover:bg-[#780000]/10 hover:text-[#780000]'
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
                className="h-10 min-w-0 flex-1 rounded-[5px] bg-[#F7F7F7] px-4 text-[12.5px] text-[#121212] outline-none transition placeholder:text-[#121212]/40 focus:bg-white focus:ring-2 focus:ring-[#780000]/25"
              />
              <button
                type="button"
                onClick={submit}
                disabled={(!text.trim() && !attachedPhoto) || send.isPending}
                aria-label="Envoyer le message"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[5px] bg-[#780000] text-white shadow-card transition hover:bg-[#121212] disabled:cursor-not-allowed disabled:bg-[#EFEFEF] disabled:text-[#121212]/35"
              >
                {send.isPending ? <Spinner size={16} /> : <span ref={sendIconRef} className="inline-flex"><SendHorizonal size={18} /></span>}
              </button>
            </div>
            <p className="mt-1.5 pl-12 text-[9px] text-[#121212]/35">Entrée pour envoyer · Les échanges restent dans votre fil Djassa.</p>
          </div>
        </div>
      </div>

      <BarterModal
        open={trocOpen}
        onClose={() => setTrocOpen(false)}
        targetArticle={article}
        initialSoulte={trocSoulte}
        onSuccess={() => setTrocOpen(false)}
      />
      <PinSheet
        open={pinOpen}
        onClose={() => setPinOpen(false)}
        transactionId={conversation?.transaction_id ?? article?.transaction_id}
        dashboardPath={dashboardPath}
      />

      <Modal
        open={dealOpen}
        onClose={() => setDealOpen(false)}
        title="Proposer un deal"
      >
        <div className="grid gap-3">
          <label className="grid gap-1">
            <span className="text-[11px] font-semibold text-[#121212]/70">Prix proposé (FCFA)</span>
            <input
              type="number" min="0" value={dealMontant}
              onChange={(e) => setDealMontant(e.target.value)}
              placeholder="Ex. 45 000"
              className="h-11 rounded-xl border-0 bg-[#F6F6F6] px-3 text-sm text-[#121212] outline-none focus:ring-2 focus:ring-[#780000]"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-[11px] font-semibold text-[#121212]/70">Lieu de remise</span>
            <input
              type="text" value={dealLieu}
              onChange={(e) => setDealLieu(e.target.value)}
              placeholder="Ex. Abidjan Cocody, devant la station Total"
              className="h-11 rounded-xl border-0 bg-[#F6F6F6] px-3 text-sm text-[#121212] outline-none focus:ring-2 focus:ring-[#780000]"
            />
          </label>
          <button
            type="button"
            disabled={!dealMontant || !dealLieu || proposeDeal.isPending}
            onClick={() => proposeDeal.mutate({ montant: dealMontant, lieu: dealLieu })}
            className="mt-1 h-11 rounded-xl bg-[#780000] text-sm font-bold text-white transition disabled:opacity-40"
          >
            {proposeDeal.isPending ? 'Envoi…' : 'Envoyer la proposition'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

/* ================================================================
   Cartes d'action rapide (dans le fil)
   ================================================================ */

function ActionCards({ article, status, onTroc, onPhoto, onPin, onDeal }) {
  const cardRef = useRef(null);
  useLayoutEffect(() => animateEntrance(cardRef.current, '[data-action-card]'), [article?.id, status]);

  return (
    <section ref={cardRef} className="grid gap-2 sm:grid-cols-2" aria-label="Actions rapides de négociation">
      <ArticleActionCard article={article} status={status} />

      <ActionCard icon={Handshake} title="Proposer un deal" hint="Prix et lieu de remise" onClick={onDeal} />
      <ActionCard icon={ArrowLeftRight} title="Troc pur" hint="Échanger sans soulte" onClick={() => onTroc('0')} />
      <ActionCard icon={Tag} title="Troc + soulte" hint="Ajouter un montant FCFA" onClick={() => onTroc('')} />
      <ActionCard icon={Camera} title="Joindre une photo" hint="Article ou preuve de remise" onClick={onPhoto} />
      <ActionCard icon={ShieldCheck} title="Code PIN de remise" hint="Valider la remise sécurisée" onClick={onPin} />
    </section>
  );
}

function ActionCard({ icon: Icon, title, hint, onClick, to }) {
  const iconRef = useRef(null);
  const activate = (e) => {
    if (to) return;
    e.preventDefault();
    pulseIcon(iconRef.current);
    playButtonClick();
    onClick?.();
  };
  const inner = (
    <>
      <span ref={iconRef} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] bg-[#780000]/10 text-[#780000]">
        <Icon size={16} />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-[11px] font-extrabold text-[#121212]" style={{ fontFamily: FONT_TITLE }}>{title}</span>
        <span className="mt-0.5 block truncate text-[9.5px] text-[#121212]/55">{hint}</span>
      </span>
      <ChevronRight size={16} className="shrink-0 text-[#121212]/35" />
    </>
  );
  const className = 'flex w-full items-center gap-2.5 rounded-[5px] bg-white px-3 py-2.5 shadow-card transition hover:shadow-pop';
  return to ? (
    <Link data-action-card to={to} className={className} onClick={() => playButtonClick()}>{inner}</Link>
  ) : (
    <button data-action-card type="button" onClick={activate} className={className}>{inner}</button>
  );
}

function ArticleActionCard({ article, status }) {
  const meta = STATUS_META[status] ?? STATUS_META['En cours'];
  return (
    <div data-action-card className="flex items-center gap-3 rounded-[5px] bg-white px-3 py-2.5 shadow-card sm:col-span-2">
      <ArticleThumb article={article} className="h-12 w-12" />
      <div className="min-w-0 flex-1">
        <p className="text-[8.5px] font-extrabold uppercase tracking-[0.14em] text-[#780000]" style={{ fontFamily: FONT_TITLE }}>Article concerné</p>
        <p className="mt-0.5 truncate text-[11.5px] font-extrabold text-[#121212]" style={{ fontFamily: FONT_TITLE }}>
          {article?.titre ?? 'Aucun article lié à ce fil'}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-extrabold text-[#780000]">{article ? formatFCFA(article.prix_actuel ?? article.prix) : '—'}</span>
          <span className={`inline-flex items-center gap-1 rounded-[5px] px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wide ${meta.pill}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} /> {status}
          </span>
        </div>
      </div>
      {article && (
        <Link to={`/article/${article.id}`} onClick={() => playButtonClick()} className="inline-flex shrink-0 items-center gap-1 rounded-[5px] bg-[#EFEFEF] px-2.5 py-2 text-[9.5px] font-extrabold text-[#121212]/75 transition hover:bg-[#121212] hover:text-white" aria-label="Voir l'article">
          Voir <ExternalLink size={16} />
        </Link>
      )}
    </div>
  );
}

/* ================================================================
   Récapitulatif de transaction (desktop + tiroir mobile)
   ================================================================ */

function Summary({ conversation, status, onClose, embedded = false }) {
  const article = conversation?.article;
  const last = conversation?.dernier_message;
  const amount = article ? (article.prix_actuel ?? article.prix ?? 0) : (last?.payload?.montant_fcfa ?? 0);
  const soulte = last?.payload?.montant_soulte_fcfa ?? 0;
  const progress = STATUS_PROGRESS[status] ?? 20;
  const meta = STATUS_META[status] ?? STATUS_META['En cours'];
  const nextStep = {
    'En cours': 'Répondre au message pour avancer la négociation.',
    'Troc proposé': 'Examiner les articles proposés et répondre à l’offre.',
    'Séquestre actif': 'Remettre l’article en main propre, puis saisir le code PIN.',
    'Résolu': 'Transaction finalisée — fonds libérés au vendeur.',
  }[status];

  return (
    <aside className={`${embedded ? 'h-full w-full' : 'h-full w-[min(88vw,340px)]'} flex flex-col overflow-y-auto bg-[#F7F7F7]`} aria-label="Récapitulatif de transaction">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <h3 className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#780000]" style={{ fontFamily: FONT_TITLE }}>Récapitulatif</h3>
        {!embedded && (
          <button type="button" onClick={onClose} className="rounded-[5px] bg-white p-1.5 text-[#121212]/60 transition hover:bg-[#121212] hover:text-white" aria-label="Fermer le récapitulatif">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="px-4 pb-3">
        <div className="rounded-[5px] bg-white p-3 shadow-card">
          <div className="flex items-center gap-2.5">
            <ArticleThumb article={article} className="h-12 w-12" />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-[11.5px] font-extrabold leading-snug text-[#121212]" style={{ fontFamily: FONT_TITLE }}>
                {article?.titre ?? 'Aucun article lié'}
              </p>
              <p className="mt-1 text-[13px] font-extrabold text-[#780000]">{formatFCFA(amount)}</p>
            </div>
          </div>
          {soulte > 0 && (
            <div className="mt-2.5 flex items-center justify-between rounded-[5px] bg-[#EFEFEF] px-2.5 py-2 text-[10px]">
              <span className="text-[#121212]/60">Soulte proposée</span>
              <span className="font-extrabold text-[#780000]">{formatFCFA(soulte)}</span>
            </div>
          )}
          {article?.condition && (
            <p className="mt-2 text-[8.5px] font-extrabold uppercase tracking-wide text-[#121212]/55">
              {CONDITION_LABELS[article.condition] ?? article.condition}
            </p>
          )}
        </div>
      </div>

      {/* Carte séquestre — fort contraste #121212, barre #780000 */}
      <div className="px-4 pb-3">
        <div className="rounded-[5px] bg-[#121212] p-4 text-white shadow-card">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em]" style={{ fontFamily: FONT_TITLE }}>
              <LockKeyhole size={16} className="text-white" /> Séquestre Djassa
            </span>
            <span className="rounded-[5px] bg-[#780000] px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide text-white">{status}</span>
          </div>
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/15" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Progression de la transaction">
            <div className="h-full rounded-full bg-[#780000]" style={{ width: `${progress}%` }} />
          </div>
          <ol className="mt-3 space-y-1.5">
            {['Paiement bloqué', 'Remise en main propre', 'Code PIN', 'Fonds libérés'].map((step, i) => {
              const done = progress >= 100 || i < Math.floor(progress / 25);
              return (
                <li key={step} className="flex items-center gap-2 text-[10px]">
                  <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] ${done ? 'bg-[#780000] text-white' : 'bg-white/15 text-white/60'}`}>
                    {done ? <CheckCheck size={16} /> : <span className="h-1.5 w-1.5 rounded-full bg-white/50" />}
                  </span>
                  <span className={done ? 'text-white/90' : 'text-white/55'}>{step}</span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <div className="px-4 pb-3">
        <div className="rounded-[5px] bg-white p-3 shadow-card">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#780000]" style={{ fontFamily: FONT_TITLE }}>Prochaine étape</p>
          <p className="mt-1.5 text-[10.5px] leading-relaxed text-[#121212]/65">{nextStep}</p>
          <span className={`mt-2 inline-flex items-center gap-1 rounded-[5px] px-2 py-1 text-[8.5px] font-extrabold uppercase tracking-wide ${meta.pill}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} /> {status}
          </span>
        </div>
      </div>

      <div className="mt-auto px-4 pb-4">
        <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#780000]" style={{ fontFamily: FONT_TITLE }}>Actions rapides</p>
        <div className="mt-2 grid gap-1.5">
          <Link to={conversation?.article ? `/article/${conversation.article.id}` : '/'} onClick={() => playButtonClick()} className="flex items-center gap-2 rounded-[5px] bg-white px-3 py-2 text-[10.5px] font-bold text-[#121212]/75 transition hover:bg-[#EFEFEF]">
            <ShoppingBag size={16} className="text-[#780000]" /> Voir l’annonce
          </Link>
          <Link to="/dashboard?onglet=achats" onClick={() => playButtonClick()} className="flex items-center gap-2 rounded-[5px] bg-white px-3 py-2 text-[10.5px] font-bold text-[#121212]/75 transition hover:bg-[#EFEFEF]">
            <ShieldCheck size={16} className="text-[#780000]" /> Mes achats & PIN
          </Link>
        </div>
      </div>
    </aside>
  );
}

function SummaryDrawer({ conversation, status, onClose }) {
  const panelRef = useRef(null);
  useEffect(() => {
    if (reduceMotion() || !panelRef.current) return undefined;
    const tween = gsap.fromTo(panelRef.current, { xPercent: 100 }, { xPercent: 0, duration: 0.32, ease: 'power3.out' });
    return () => tween.kill();
  }, []);
  return (
    <div className="fixed inset-0 z-[80] flex justify-end" role="dialog" aria-modal="true" aria-label="Récapitulatif de transaction">
      <button type="button" className="absolute inset-0 bg-[#121212]/60" onClick={onClose} aria-label="Fermer le récapitulatif" />
      <div ref={panelRef} className="relative h-full shadow-pop">
        <Summary conversation={conversation} status={status} onClose={onClose} />
      </div>
    </div>
  );
}

/* ================================================================
   PIN — validation de remise
   ================================================================ */

function PinSheet({ open, onClose, transactionId, dashboardPath }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [error, setError] = useState(false);
  const verify = useMutation({
    mutationFn: async (pin) => (await api.post(`/transactions/${transactionId}/verify-pin`, { pin })).data,
    onSuccess: () => {
      playSuccessChord();
      toast.success('Remise validée — fonds libérés au vendeur.');
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      onClose();
    },
    onError: (e) => {
      playErrorThud();
      toast.error(e.response?.data?.message ?? 'Code PIN invalide.');
      setError(true);
      setTimeout(() => setError(false), 400);
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="Code PIN de remise">
      {transactionId ? (
        <div className="space-y-3">
          <p className="text-[11.5px] leading-relaxed text-[#121212]/65">
            Saisissez le code PIN à 4 chiffres transmis par l’acheteur au moment de la remise en main propre.
          </p>
          <PinInput onComplete={(pin) => { setError(false); verify.mutate(pin); }} error={error} />
          {verify.isPending && <p className="text-center text-[10px] text-[#121212]/50">Validation en cours…</p>}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-[11.5px] leading-relaxed text-[#121212]/65">
            Aucune transaction en séquestre n’est liée à ce fil. Retrouvez vos codes et transactions depuis votre espace achats.
          </p>
          <Link to={dashboardPath === '/dashboard-pro' ? '/dashboard-pro/achats' : '/dashboard?onglet=achats'} onClick={onClose} className="inline-flex items-center gap-1.5 rounded-[5px] bg-[#780000] px-3 py-2 text-[10px] font-extrabold uppercase tracking-wide text-white transition hover:bg-[#121212]">
            Voir mes achats <ExternalLink size={16} />
          </Link>
        </div>
      )}
    </Modal>
  );
}

/* ================================================================
   Briques de fil
   ================================================================ */

function TypingDots() {
  const dotsRef = useRef(null);
  useEffect(() => {
    if (reduceMotion()) return undefined;
    const dots = dotsRef.current?.querySelectorAll('[data-dot]');
    if (!dots?.length) return undefined;
    const tl = gsap.timeline({ repeat: -1 });
    dots.forEach((dot, i) => {
      tl.to(dot, { y: -5, opacity: 1, duration: 0.22, ease: 'power2.out' }, i * 0.12)
        .to(dot, { y: 0, opacity: 0.45, duration: 0.22, ease: 'power2.in' }, i * 0.12 + 0.22);
    });
    return () => tl.kill();
  }, []);
  return (
    <div className="flex items-end gap-2 justify-start" aria-live="polite" aria-label="En train d’écrire">
      <div ref={dotsRef} className="inline-flex items-center gap-1.5 rounded-[5px] bg-white px-3.5 py-3 shadow-sm">
        {[0, 1, 2].map((i) => <span key={i} data-dot className="h-2 w-2 rounded-full bg-[#780000]/60 opacity-45" />)}
      </div>
    </div>
  );
}

function ArticleThumb({ article, className = 'h-12 w-12' }) {
  return (
    <div className={`${className} shrink-0 overflow-hidden bg-[#EFEFEF]`}>
      {article?.image_principale || article?.images?.[0] ? (
        <img src={article.image_principale ?? article.images[0]} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[#121212]/25"><ImageIcon size={16} /></div>
      )}
    </div>
  );
}

function SystemNote({ message }) {
  return (
    <div className="flex justify-center py-1">
      <p className="inline-flex max-w-[90%] items-center gap-2 rounded-[5px] bg-[#780000] px-3.5 py-1.5 text-center text-[10px] font-medium leading-snug text-white shadow-card">
        <ShieldCheck size={16} className="shrink-0 text-white" />
        {message.contenu}
      </p>
    </div>
  );
}

function TextBubble({ message, mine, partnerName, onRead }) {
  const unreadIncoming = !mine && !message.lu_at && typeof onRead === 'function';
  const photo = message.payload?.photo;
  const inner = (
    <>
      {photo && <img src={photo} alt={message.payload?.photo_nom ?? 'Photo jointe'} className="mb-2 max-h-48 w-full rounded-[5px] object-cover" loading="lazy" decoding="async" />}
      <p className="whitespace-pre-wrap break-words">{message.contenu}</p>
      <span className={`mt-1.5 flex items-center justify-end gap-1 text-[8.5px] ${mine ? 'text-white/50' : 'text-[#121212]/40'}`}>
        {timeAgo(message.created_at)}
        {mine && message.lu_at && <CheckCheck size={16} className="text-[#780000]" />}
      </span>
    </>
  );
  return (
    <div className={`flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
      {!mine && <Avatar name={partnerName} size={26} tone="black" />}
      {unreadIncoming ? (
        <button
          type="button"
          onClick={onRead}
          title="Marquer comme lu"
          aria-label={`Marquer le message de ${partnerName ?? ' votre interlocuteur'} comme lu`}
          className={`max-w-[78%] rounded-[5px] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-left shadow-card transition hover:shadow-pop ${
            mine ? 'bg-[#121212] text-white' : 'bg-white text-[#121212]'
          }`}
        >
          {inner}
        </button>
      ) : (
        <div className={`max-w-[78%] rounded-[5px] px-3.5 py-2.5 text-[12.5px] leading-relaxed shadow-card ${
          mine ? 'bg-[#121212] text-white' : 'bg-white text-[#121212]'
        }`}>
          {inner}
        </div>
      )}
    </div>
  );
}

function PriceCard({ message, mine }) {
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div className="w-full max-w-[320px] overflow-hidden rounded-[5px] bg-white shadow-card">
        <div className="flex items-center gap-2 bg-[#EFEFEF] px-3 py-2">
          <Tag size={16} className="text-[#780000]" />
          <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#780000]" style={{ fontFamily: FONT_TITLE }}>Offre de prix formelle</p>
        </div>
        <div className="p-3">
          <p className="text-[20px] font-extrabold tracking-tight text-[#780000]" style={{ fontFamily: FONT_TITLE }}>
            {formatFCFA(message.payload?.montant_fcfa ?? 0)}
          </p>
          <p className="mt-1 text-[10px] leading-relaxed text-[#121212]/50">
            {mine ? 'En attente de réponse de votre interlocuteur.' : 'Vous pouvez accepter ou refuser cette offre depuis la fiche article.'}
          </p>
        </div>
      </div>
    </div>
  );
}

function DealCard({ deal, mine, onRespond, pending }) {
  const [counterOpen, setCounterOpen] = useState(false);
  const [counterMontant, setCounterMontant] = useState(String(deal.montant_fcfa ?? ''));
  const [counterLieu, setCounterLieu] = useState(deal.lieu_remise ?? '');
  const meta = DEAL_STATUS[deal.statut] ?? DEAL_STATUS.proposed;
  const canRespond = !mine && ['proposed', 'countered'].includes(deal.statut);

  return (
    <div className="rounded-2xl bg-white p-3 shadow-[0_2px_10px_rgba(18,18,18,0.06)]" data-deal-id={deal.id}>
      <div className="flex items-center gap-2">
        <Handshake size={18} className="text-[#780000]" />
        <span className="text-[11px] font-bold text-[#121212]" style={{ fontFamily: FONT_TITLE }}>Deal de remise</span>
        <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.className}`}>{meta.label}</span>
      </div>
      <p className="mt-2 text-[20px] font-extrabold tracking-tight text-[#780000]" style={{ fontFamily: FONT_TITLE }}>
        {formatFCFA(Number(deal.montant_fcfa ?? 0))}
      </p>
      <p className="mt-1 text-[11px] text-[#121212]/60">📍 {deal.lieu_remise}</p>
      {canRespond && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" disabled={pending} onClick={() => onRespond.mutate({ id: deal.id, action: 'accept' })}
            className="h-9 rounded-xl bg-[#780000] px-3 text-[11px] font-bold text-white disabled:opacity-40">Accepter</button>
          <button type="button" disabled={pending} onClick={() => onRespond.mutate({ id: deal.id, action: 'reject' })}
            className="h-9 rounded-xl bg-[#EFEFEF] px-3 text-[11px] font-bold text-[#121212] disabled:opacity-40">Refuser</button>
          <button type="button" disabled={pending} onClick={() => setCounterOpen((v) => !v)}
            className="h-9 rounded-xl bg-[#121212] px-3 text-[11px] font-bold text-white disabled:opacity-40">Contre-proposer</button>
        </div>
      )}
      {canRespond && counterOpen && (
        <div className="mt-3 grid gap-2 rounded-xl bg-[#F6F6F6] p-3">
          <input type="number" min="0" value={counterMontant} onChange={(e) => setCounterMontant(e.target.value)} placeholder="Montant FCFA"
            className="h-10 rounded-lg border-0 bg-white px-3 text-xs outline-none focus:ring-2 focus:ring-[#780000]" />
          <input type="text" value={counterLieu} onChange={(e) => setCounterLieu(e.target.value)} placeholder="Lieu de remise"
            className="h-10 rounded-lg border-0 bg-white px-3 text-xs outline-none focus:ring-2 focus:ring-[#780000]" />
          <button type="button" disabled={pending || !counterMontant || !counterLieu}
            onClick={() => { onRespond.mutate({ id: deal.id, action: 'counter', montant: counterMontant, lieu: counterLieu }); setCounterOpen(false); }}
            className="h-10 rounded-lg bg-[#780000] text-xs font-bold text-white disabled:opacity-40">Envoyer la contre-proposition</button>
        </div>
      )}
    </div>
  );
}

function trocableHint(a) {
  return Boolean(a?.est_trocable || ['troc', 'mixte'].includes(a?.mode_transaction));
}

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
      <div className="w-full max-w-[420px] overflow-hidden rounded-[5px] bg-white shadow-card">
        <div className="flex items-center gap-2 bg-[#121212] px-3.5 py-2.5 text-white">
          <ArrowLeftRight size={16} className="text-white" strokeWidth={2.5} />
          <p className="text-[9.5px] font-extrabold uppercase tracking-[0.15em]" style={{ fontFamily: FONT_TITLE }}>Proposition de troc</p>
          <span className="ml-auto rounded-[5px] bg-[#780000] px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide text-white">
            {statusMeta.label}
          </span>
        </div>

        <div className="p-3.5">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#121212]/45" style={{ fontFamily: FONT_TITLE }}>
            {mine ? 'Vous proposez' : 'L’acheteur propose'}
          </p>
          {offered.length > 0 ? (
            <ul className="mt-2 space-y-1.5">
              {offered.map((item, i) => (
                <li key={`${item}-${i}`} className="flex items-start gap-2 text-[11.5px] font-semibold leading-snug text-[#121212]">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] bg-[#780000]/10 text-[#780000]"><Zap size={16} /></span>
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-[11px] text-[#121212]/50">Article proposé sans détail complémentaire.</p>
          )}

          <div className="mt-3 flex items-center justify-between gap-3 rounded-[5px] bg-[#F7F7F7] px-3 py-2.5">
            <div>
              <p className="text-[8.5px] font-extrabold uppercase tracking-wide text-[#780000]/75" style={{ fontFamily: FONT_TITLE }}>Soulte proposée</p>
              <p className="mt-0.5 text-[17px] font-extrabold leading-none text-[#780000]" style={{ fontFamily: FONT_TITLE }}>{formatFCFA(soulte)}</p>
            </div>
            <span className="rounded-[5px] bg-[#EFEFEF] px-2.5 py-1 text-[9px] font-extrabold text-[#121212]/70">
              {Number(soulte) === 0 ? 'Troc pur' : 'Troc mixte'}
            </span>
          </div>

          {offer?.message && (
            <p className="mt-2.5 rounded-[5px] bg-[#F7F7F7] px-2.5 py-2 text-[10.5px] italic leading-relaxed text-[#121212]/60">“{offer.message}”</p>
          )}

          {canRespond ? (
            <div className="mt-3.5 space-y-2">
              <div className="flex gap-2">
                <button type="button" disabled={pending} onClick={() => onRespond.mutate({ offerId: offer.id, action: 'accept' })} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[5px] bg-[#780000] px-3 py-2 text-[10px] font-extrabold uppercase tracking-wide text-white transition hover:bg-[#121212] disabled:cursor-not-allowed disabled:opacity-50">
                  <CheckCheck size={16} /> Accepter
                </button>
                <button type="button" disabled={pending} onClick={() => onRespond.mutate({ offerId: offer.id, action: 'reject' })} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[5px] bg-[#EFEFEF] px-3 py-2 text-[10px] font-extrabold uppercase tracking-wide text-[#121212]/70 transition hover:bg-[#121212] hover:text-white disabled:cursor-not-allowed disabled:opacity-50">
                  <X size={16} /> Refuser
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
                  className="h-9 min-w-0 flex-1 rounded-[5px] bg-[#F7F7F7] px-2.5 text-[11px] text-[#121212] outline-none"
                />
                <button type="button" disabled={pending || !counter || Number(counter) < 0} onClick={() => onRespond.mutate({ offerId: offer.id, action: 'counter', montant: Number(counter) })} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[5px] bg-[#121212] px-3 text-[9.5px] font-extrabold uppercase tracking-wide text-white transition hover:bg-[#780000] disabled:cursor-not-allowed disabled:opacity-40">
                  Contre-offrir
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-[10px] text-[#780000]/75">
              {mine ? 'En attente de la réponse du vendeur.' : 'Cette proposition ne nécessite plus votre action.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
