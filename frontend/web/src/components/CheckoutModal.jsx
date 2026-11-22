import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight, ExternalLink, Lock, ShieldCheck, Smartphone, Wallet } from 'lucide-react';
import { api } from '../lib/api';
import { formatFCFA } from '../lib/format';
import { Modal, Spinner } from './ui';
import { useToast } from '../context/ToastContext';

/**
 * CheckoutModal — achat direct : récapitulatif → session GeniusPay → séquestre.
 * Mode MOCK (sans clés) : bouton « Simuler le paiement réussi » pour dérouler tout le flux.
 */
export default function CheckoutModal({ open, onClose, article, onPaid }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState('recap'); // recap → paying → held
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState(null);

  if (!article) return null;

  const prix = Number(article.prix_actuel ?? article.prix);
  const frais = Math.round(prix * 0.03);
  const total = prix + frais;

  const startPayment = async () => {
    setBusy(true);
    try {
      const { data } = await api.post('/payments/geniuspay/init', { type: 'achat', article_id: article.id });
      setSession(data);
      setStep('paying');
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Impossible d’initialiser le paiement.');
      setStep('recap');
    } finally {
      setBusy(false);
    }
  };

  const simulateWebhook = async () => {
    setBusy(true);
    try {
      await api.post('/webhooks/geniuspay', { reference: session.geniuspay_ref, status: 'success' });
      // Relecture de la transaction pour confirmer le passage held
      const { data } = await api.get(`/transactions/${session.transaction_id}`);
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      if ((data?.data?.escrow_status ?? data?.escrow_status) === 'held') {
        setStep('held');
        toast.success('Paiement confirmé — fonds bloqués en séquestre.');
        onPaid?.();
      } else {
        toast.info('Webhook traité — vérifiez vos transactions.');
      }
    } catch {
      toast.error('Échec de la simulation du webhook.');
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setStep('recap');
    setSession(null);
    setBusy(false);
    onClose?.();
  };

  return (
    <Modal open={open} onClose={reset} title={step === 'held' ? 'Paiement sécurisé' : 'Récapitulatif de commande'}>
      {step === 'recap' && (
        <>
          <div className="flex items-center gap-3 rounded-[5px] bg-djassa-gray/15 p-3">
            <img src={article.image_principale} alt="" className="h-16 w-16 rounded-[5px] object-cover bg-djassa-cloud border-solid border-[0.5px] border-[rgba(18,18,18,0.08)]" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} loading="lazy" decoding="async" />
            <div className="min-w-0 flex-1">
              <p className="clamp-2 text-xs font-bold text-djassa-black">{article.titre}</p>
              <p className="text-[10px] uppercase tracking-wide text-djassa-black/70">{article.boutique ? article.boutique.nom_boutique : 'Vendeur particulier'}</p>
            </div>
          </div>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between"><dt className="text-djassa-black/70">Prix article</dt><dd className="font-semibold text-djassa-black">{formatFCFA(prix)}</dd></div>
            <div className="flex items-center justify-between"><dt className="text-djassa-black/70">Frais de sécurisation Djassa (3%)</dt><dd className="font-semibold text-djassa-black">{formatFCFA(frais)}</dd></div>
            <div className="my-2" />
            <div className="flex items-center justify-between"><dt className="font-spacegrotesk font-extrabold text-djassa-black">Total</dt><dd className="font-spacegrotesk text-lg font-extrabold text-djassa-red">{formatFCFA(total)}</dd></div>
          </dl>

          <div className="mt-3 flex items-start gap-2 rounded-[5px] bg-djassa-cloud border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] px-3 py-2.5 text-[11px] text-djassa-black/70">
            <Lock size={14} className="mt-0.5 shrink-0 text-djassa-black" />
            <span><strong className="text-djassa-black">Séquestre Djassa</strong> — le vendeur ne reçoit rien tant que vous n’avez pas validé la remise avec votre code PIN à 4 chiffres.</span>
          </div>

          <button className="btn-red mt-4 w-full" onClick={startPayment} disabled={busy}>
            {busy ? <Spinner size={18} /> : <Smartphone size={18} />}
            Payer via Mobile Money (Wave, OM, MTN, Moov)
          </button>
          <div className="mt-2 flex items-center justify-center gap-2 opacity-70">
            <span className="text-[10px] font-bold uppercase tracking-widest text-djassa-black/70">Wave</span>
            <span className="text-djassa-black/20">•</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-djassa-black/70">Orange Money</span>
            <span className="text-djassa-black/20">•</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-djassa-black/70">MTN MoMo</span>
            <span className="text-djassa-black/20">•</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-djassa-black/70">Moov</span>
          </div>
        </>
      )}

      {step === 'paying' && session && (
        <>
          <div className="flex flex-col items-center py-2 text-center">
            <Wallet size={44} className="text-djassa-red" />
            <h4 className="mt-3 font-spacegrotesk text-base font-extrabold text-djassa-black">Session GeniusPay créée</h4>
            <p className="mt-1 text-xs text-djassa-black/70">Référence : <span className="font-mono font-semibold text-djassa-black">{session.geniuspay_ref}</span> · {formatFCFA(session.total)}</p>

            {session.mock ? (
              <div className="mt-4 w-full rounded-[5px] bg-amber-50 p-3 text-left text-[11px] text-amber-900">
                <p className="font-spacegrotesk font-bold">Mode démonstration (sans clés GeniusPay)</p>
                <p className="mt-1">Sur un vrai appareil, vous seriez redirigé vers le widget Mobile Money. Ici, simulez la confirmation de paiement :</p>
              </div>
            ) : (
              <a href={session.payment_url} target="_blank" rel="noreferrer" className="btn-black mt-4 w-full">
                Ouvrir le widget GeniusPay <ExternalLink size={16} />
              </a>
            )}
          </div>

          {session.mock && (
            <button className="btn-red mt-4 w-full" onClick={simulateWebhook} disabled={busy}>
              {busy ? <Spinner size={18} /> : <ShieldCheck size={18} />}
              Simuler le paiement réussi (dev)
            </button>
          )}
        </>
      )}

      {step === 'held' && (
        <div className="flex flex-col items-center py-2 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-[5px] bg-emerald-50">
            <ShieldCheck size={42} className="text-emerald-600" />
          </span>
          <h4 className="mt-4 font-spacegrotesk text-lg font-extrabold text-djassa-black">Fonds bloqués en séquestre</h4>
          <p className="mt-1 max-w-xs text-sm text-djassa-black/70">Votre code PIN à 4 chiffres vous a été envoyé par e-mail. Au moment de la remise physique, communiquez-le au vendeur — c'est lui qui le saisit pour libérer les fonds.</p>
          <a href="http://127.0.0.1:8025" target="_blank" rel="noreferrer" className="btn-outline btn-sm mt-4">
            Voir l'e-mail dans Mailpit (dev) <ExternalLink size={14} />
          </a>
          <button className="btn-black mt-2 w-full" onClick={reset}>C'est compris <ArrowRight size={16} /></button>
        </div>
      )}
    </Modal>
  );
}
