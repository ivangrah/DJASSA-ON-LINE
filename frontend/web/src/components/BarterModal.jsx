import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftRight, BadgeCheck, Check, ChevronRight, Info, PackageOpen } from 'lucide-react';
import { api } from '../lib/api';
import { formatFCFA, CONDITION_LABELS } from '../lib/format';
import { Modal, Spinner } from './ui';
import { useToast } from '../context/ToastContext';

/**
 * Modale « Proposer un troc » (PRD §3.3, App Flow §5).
 * L'utilisateur coche 1..N de ses articles publiés + soulte FCFA optionnelle.
 */
export default function BarterModal({ open, onClose, targetArticle, onSuccess }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState([]);
  const [soulte, setSoulte] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(null); // offre créée → écran succès

  const { data: mine, isLoading } = useQuery({
    queryKey: ['products', 'mine'],
    queryFn: async () => (await api.get('/products/mine')).data,
    enabled: open,
  });

  const myArticles = useMemo(
    () => (mine?.data ?? []).filter((a) => a.statut === 'published' && a.id !== targetArticle?.id),
    [mine, targetArticle]
  );

  const toggle = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const propose = useMutation({
    mutationFn: async () => {
      const body = {
        article_cible_id: targetArticle.id,
        articles_offerts: selected,
        montant_soulte_fcfa: Number(soulte || 0),
        message: message || undefined,
      };
      const { data } = await api.post('/barter-offers', body);
      return data;
    },
    onSuccess: (data) => {
      setSent(data?.data ?? data);
      queryClient.invalidateQueries({ queryKey: ['barter-offers'] });
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] });
      toast.success('Proposition de troc envoyée au vendeur.');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message ?? 'Impossible d’envoyer la proposition.');
    },
  });

  const selectedTotal = myArticles.filter((a) => selected.includes(a.id))
    .reduce((acc, a) => acc + Number(a.prix), 0);
  const soulteNum = Number(soulte || 0);
  const targetPrice = Number(targetArticle?.prix_actuel ?? targetArticle?.prix ?? 0);
  const difference = selectedTotal + soulteNum - targetPrice;

  const reset = () => {
    setSelected([]); setSoulte(''); setMessage(''); setSent(null); onClose?.();
  };

  if (sent) {
    return (
      <Modal open={open} onClose={reset} title="Proposition envoyée">
        <div className="flex flex-col items-center py-2 text-center">
          <div className="flex h-28 w-28 items-center justify-center">
            <svg viewBox="0 0 120 120" className="h-full w-full" role="img" aria-label="Proposition envoyée">
              <circle className="circle-draw" cx="60" cy="60" r="52" fill="none" stroke="#780000" strokeWidth="9" strokeLinecap="round" pathLength="100" />
              <path className="check-draw" d="M38 63 L54 79 L86 45" fill="none" stroke="#121212" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" pathLength="100" />
            </svg>
          </div>
          <h4 className="mt-4 font-spacegrotesk text-lg font-extrabold text-djassa-black">C'est envoyé !</h4>
          <p className="mt-1 max-w-xs text-sm text-djassa-black/70">
            Le vendeur reçoit votre offre dans la messagerie avec une carte interactive. Vous serez notifié dès sa réponse.
          </p>
          <button className="btn-red mt-5 w-full" onClick={() => { reset(); onSuccess?.(sent); }}>
            Ouvrir la conversation <ChevronRight size={18} />
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={reset}
      wide
      title="Proposer un troc"
      footer={
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-djassa-black/70">Votre offre</p>
            <p className="truncate font-spacegrotesk text-sm font-extrabold text-djassa-black">
              {formatFCFA(selectedTotal + soulteNum)}
              {difference >= 0
                ? <span className="ml-2 text-[10px] font-bold text-emerald-600">(+{formatFCFA(difference)} au-dessus)</span>
                : <span className="ml-2 text-[10px] font-bold text-amber-700">({formatFCFA(-difference)} en dessous)</span>}
            </p>
          </div>
          <button className="btn-red" disabled={selected.length === 0 || propose.isPending} onClick={() => propose.mutate()}>
            {propose.isPending ? <Spinner size={18} /> : <ArrowLeftRight size={18} />}
            Envoyer
          </button>
        </div>
      }
    >
      {/* Article cible */}
      {targetArticle && (
        <div className="mb-4 flex items-center gap-3 rounded-[5px] bg-djassa-gray/15 p-3">
          <img src={targetArticle.image_principale} alt="" className="h-14 w-14 rounded-[5px] object-cover bg-djassa-cloud border-solid border-[0.5px] border-[rgba(18,18,18,0.08)]" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} loading="lazy" decoding="async" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-djassa-black/70">Vous voulez obtenir</p>
            <p className="clamp-2 text-xs font-bold text-djassa-black">{targetArticle.titre}</p>
            <p className="font-spacegrotesk text-sm font-extrabold text-djassa-red">{formatFCFA(targetPrice)}</p>
          </div>
        </div>
      )}

      {/* Mes articles publiés */}
      <p className="label">Choisissez vos articles à proposer</p>
      {isLoading ? (
        <div className="flex justify-center py-6"><Spinner /></div>
      ) : myArticles.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[5px] bg-djassa-cloud/50 px-6 py-8 text-center">
          <PackageOpen size={34} className="text-djassa-black/70" />
          <p className="font-spacegrotesk text-sm font-bold text-djassa-black">Aucune annonce publiée</p>
          <p className="text-xs text-djassa-black/70">Publiez d'abord un article en troc pour pouvoir proposer un échange.</p>
        </div>
      ) : (
        <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
          {myArticles.map((a) => {
            const checked = selected.includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => toggle(a.id)}
                aria-pressed={checked}
                className={`flex w-full items-center gap-3 rounded-[5px]  p-2 text-left transition ${checked ? ' bg-djassa-red/5' : ' bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] '}`}
              >
                <img src={a.image_principale} alt="" className="h-16 w-16 rounded-[5px] object-cover bg-djassa-cloud border-solid border-[0.5px] border-[rgba(18,18,18,0.08)]" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} loading="lazy" decoding="async" />
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-djassa-black/70">{CONDITION_LABELS[a.condition]}</p>
                  <p className="clamp-2 text-xs font-bold leading-snug text-djassa-black">{a.titre}</p>
                  <p className="font-spacegrotesk text-xs font-extrabold text-djassa-black">{formatFCFA(a.prix)}</p>
                </div>
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[5px]  transition ${checked ? ' bg-djassa-red text-white' : ' text-transparent'}`}>
                  <Check size={14} strokeWidth={3.5} />
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Soulte */}
      <div className="mt-4">
        <label htmlFor="soulte" className="label">Soulte (complément en FCFA) — optionnelle</label>
        <div className="relative">
          <input
            id="soulte"
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="Ex : 15 000"
            value={soulte}
            onChange={(e) => setSoulte(e.target.value)}
            className="input pr-16 font-spacegrotesk font-bold"
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-spacegrotesk text-xs font-extrabold text-djassa-black/70">FCFA</span>
        </div>
        <p className="mt-1.5 flex items-start gap-1.5 text-[11px] text-djassa-black/70"><Info size={12} className="mt-0.5 shrink-0" /> La soulte est bloquée en séquestre GeniusPay jusqu'à la remise physique (code PIN).</p>
      </div>

      {/* Message libre */}
      <div className="mt-3">
        <label htmlFor="troc-message" className="label">Petit mot au vendeur (facultatif)</label>
        <textarea id="troc-message" rows={2} maxLength={1000} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="État réel, emplacement pour la remise…" className="input" />
      </div>

      {targetArticle?.boutique && (
        <p className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-djassa-black">
          <BadgeCheck size={14} className="text-djassa-red" /> Boutique vérifiée — accepte le troc partiel sur {targetArticle.boutique.nom_boutique}
        </p>
      )}
    </Modal>
  );
}
