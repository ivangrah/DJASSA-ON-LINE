import { useRef, useState } from 'react';
import { usePageReveal } from '../../hooks/usePageReveal';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftRight, ArrowRight, Check, Clock3, Inbox, MessageCircle, Send, X,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { BARTER_STATUS, formatFCFA, timeAgo } from '../../lib/format';
import { EmptyState, Spinner } from '../../components/ui';
import { PageHead, Panel, ProductThumb, StatCard, TinyBadge } from './ui';

export default function TrocsPro() {
  const toast = useToast();
  const scope = useRef(null);
  usePageReveal(scope);
  const queryClient = useQueryClient();
  const [sens, setSens] = useState('recues');
  const [counterFor, setCounterFor] = useState(null);
  const [counterAmount, setCounterAmount] = useState('');

  const { data: receivedData, isLoading: loadingReceived } = useQuery({
    queryKey: ['barter-offers', 'recues'],
    queryFn: async () => (await api.get('/barter-offers', { params: { sens: 'recues' } })).data,
  });

  const { data: sentData, isLoading: loadingSent } = useQuery({
    queryKey: ['barter-offers', 'envoyees'],
    queryFn: async () => (await api.get('/barter-offers', { params: { sens: 'envoyees' } })).data,
  });

  const respond = useMutation({
    mutationFn: async ({ id, action, montant }) => (await api.patch(`/barter-offers/${id}/respond`, {
      action,
      ...(montant !== undefined ? { montant_contre_offre_fcfa: Number(montant) } : {}),
    })).data,
    onSuccess: (data, variables) => {
      const messages = {
        accept: 'Offre de troc acceptée.',
        reject: 'Offre refusée.',
        counter: 'Contre-offre envoyée.',
        accept_counter: 'Contre-offre acceptée.',
        decline_counter: 'Contre-offre refusée.',
      };
      toast.success(messages[variables.action] ?? 'Réponse enregistrée.');
      setCounterFor(null);
      setCounterAmount('');
      queryClient.invalidateQueries({ queryKey: ['barter-offers'] });
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Impossible de répondre à cette offre.'),
  });

  const received = receivedData?.data ?? [];
  const sent = sentData?.data ?? [];
  const offers = sens === 'recues' ? received : sent;
  const pendingReceived = received.filter((o) => o.statut === 'pending').length;
  const accepted = [...received, ...sent].filter((o) => ['accepted', 'completed'].includes(o.statut)).length;
  const isLoading = sens === 'recues' ? loadingReceived : loadingSent;

  return (
    <div ref={scope} data-reveal className="space-y-5">
      <PageHead
        eyebrow="Mes trocs"
        title="Envois & réceptions"
        subtitle="Gérez vos échanges pur et mixte : offres reçues sur vos articles, propositions envoyées et contre-offres."
        action={
          <Link to="/" className="inline-flex items-center gap-2 rounded-[5px] bg-djassa-red border-solid border-[0.5px] border-[rgba(255,255,255,0.12)] px-4 py-2.5 font-spacegrotesk text-[11px] font-extrabold uppercase tracking-wide text-white shadow-pop transition hover:bg-djassa-red-dark active:scale-95">
            <ArrowLeftRight size={24} /> Explorer les trocables
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Inbox} label="Offres reçues" value={received.length} hint={`${pendingReceived} en attente`} tone="dark" />
        <StatCard icon={Send} label="Offres envoyées" value={sent.length} hint="Sur le marché Djassa" />
        <StatCard icon={Check} label="Tocs aboutis" value={accepted} hint="Acceptés ou terminés" />
        <StatCard icon={Clock3} label="À traiter" value={pendingReceived} hint="Réponse attendue de votre part" />
      </div>

      <Panel
        title="Propositions de troc"
        hint="Acceptez, refusez ou proposez une contre-offre avec soulte FCFA"
        action={
          <div className="flex rounded-[5px] bg-djassa-cloud p-1">
            {[
              ['recues', `Reçues (${received.length})`],
              ['envoyees', `Envoyées (${sent.length})`],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSens(key)}
                className={`rounded-[5px] px-3 py-1.5 font-spacegrotesk text-[10px] font-extrabold transition ${
                  sens === key ? 'bg-djassa-red text-white shadow-pop' : 'text-djassa-black/50 hover:text-djassa-black'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        }
      >
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : offers.length === 0 ? (
          <EmptyState
            icon={Repeat2}
            title={sens === 'recues' ? 'Aucune proposition reçue' : 'Aucune proposition envoyée'}
            hint={sens === 'recues' ? 'Les offres de troc sur vos articles apparaîtront ici.' : 'Ouvrez un article trocable et proposez un échange.'}
            action={<Link to="/" className="btn-outline btn-sm">Explorer le marché <ArrowRight size={13} /></Link>}
          />
        ) : (
          <div className="space-y-3">
            {offers.map((offre) => {
              const statut = BARTER_STATUS[offre.statut] ?? BARTER_STATUS.pending;
              const isReceived = sens === 'recues';
              const canRespond = isReceived && offre.statut === 'pending';
              const canRespondCounter = !isReceived && offre.statut === 'countered';
              const isCountering = counterFor === offre.id;

              return (
                <article key={offre.id} className="rounded-[5px] bg-djassa-cloud/40 p-3.5">
                  <div className="flex flex-wrap items-start gap-3">
                    <ProductThumb article={offre.article_cible} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate font-spacegrotesk text-[12px] font-extrabold">
                          {offre.article_cible?.titre ?? 'Article ciblé'}
                        </p>
                        <span className={`rounded-[5px] px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide ${statut.cls}`}>
                          {statut.label}
                        </span>
                        {offre.est_troc_pur && <TinyBadge tone="red">Troc pur</TinyBadge>}
                      </div>
                      <p className="mt-0.5 text-[10px] text-djassa-black/45">
                        {isReceived ? `De ${offre.acheteur?.nom ?? 'un acheteur'}` : `À ${offre.vendeur?.nom ?? 'un vendeur'}`}
                        {' · '}
                        {timeAgo(offre.created_at)}
                      </p>
                      <p className="mt-1 text-[10.5px] text-djassa-black/60">
                        <span className="font-semibold">Vous offrez :</span>{' '}
                        {(offre.articles_offerts ?? []).map((a) => a.titre).join(', ') || 'Article proposé'}
                        {Number(offre.montant_soulte_fcfa) > 0 && (
                          <> + <span className="font-bold text-djassa-red">{formatFCFA(offre.montant_soulte_fcfa)}</span></>
                        )}
                      </p>
                      {offre.montant_contre_offre_fcfa !== null && (
                        <p className="mt-0.5 text-[10.5px] font-semibold text-djassa-red">
                          Contre-offre : {formatFCFA(offre.montant_contre_offre_fcfa)}
                        </p>
                      )}
                      {offre.message && (
                        <p className="mt-1.5 line-clamp-2 rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] px-2.5 py-1.5 text-[10px] italic text-djassa-black/55">
                          “{offre.message}”
                        </p>
                      )}
                    </div>
                    <Link to={offre.article_cible?.id ? `/article/${offre.article_cible.id}` : '/'} className="shrink-0 rounded-[5px] px-2.5 py-1.5 font-spacegrotesk text-[9.5px] font-extrabold text-djassa-black/55 transition hover:text-djassa-red">
                      Voir l’article
                    </Link>
                  </div>

                  {(canRespond || canRespondCounter) && (
                    <div className="mt-3 space-y-2 pt-3">
                      <div className="flex flex-wrap gap-2">
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
                        {canRespond && (
                          <button
                            type="button"
                            onClick={() => { setCounterFor(isCountering ? null : offre.id); setCounterAmount(''); }}
                            className="inline-flex items-center gap-1.5 rounded-[5px] px-3 py-1.5 font-spacegrotesk text-[9.5px] font-extrabold uppercase tracking-wide text-djassa-red transition hover:bg-djassa-red hover:text-white"
                          >
                            <MessageCircle size={20} /> Contre-offrir
                          </button>
                        )}
                      </div>
                      {isCountering && (
                        <div className="flex flex-wrap items-center gap-2 rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] shadow-card px-3 py-2">
                          <label htmlFor={`counter-${offre.id}`} className="font-spacegrotesk text-[10px] font-extrabold text-djassa-black/60">
                            Soulte proposée (FCFA)
                          </label>
                          <input
                            id={`counter-${offre.id}`}
                            type="number"
                            min="0"
                            className="input !w-36 !py-1.5 text-[11px]"
                            placeholder="10 000"
                            value={counterAmount}
                            onChange={(e) => setCounterAmount(e.target.value)}
                          />
                          <button
                            type="button"
                            disabled={!counterAmount || Number(counterAmount) < 0 || respond.isPending}
                            onClick={() => respond.mutate({ id: offre.id, action: 'counter', montant: counterAmount })}
                            className="inline-flex items-center gap-1.5 rounded-[5px] bg-djassa-red border-solid border-[0.5px] border-[rgba(255,255,255,0.12)] px-3 py-1.5 font-spacegrotesk text-[9.5px] font-extrabold text-white transition hover:bg-djassa-red-dark disabled:opacity-50"
                          >
                            Envoyer <ArrowRight size={20} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
