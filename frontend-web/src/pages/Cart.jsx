import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, ShoppingCart,
  Trash2, X, Wallet, Loader2, PackageOpen,
} from 'lucide-react';
import { api } from '../lib/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatFCFA } from '../lib/format';
import { EmptyState, Spinner } from '../components/ui';

export default function Cart() {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { items, count, subtotal, fees, total, remove, clear } = useCart();
  const [phase, setPhase] = useState('idle'); // idle | processing | done
  const [results, setResults] = useState([]);
  const [errors, setErrors] = useState([]);

  const checkout = async () => {
    if (!items.length) return;
    setPhase('processing');
    setErrors([]);
    const ok = [];
    const failed = [];
    const paymentLinks = [];

    for (const item of items) {
      try {
        const { data: session } = await api.post('/payments/geniuspay/init', {
          type: 'achat', article_id: item.id,
        });

        if (session.mock) {
          await api.post('/webhooks/geniuspay', { reference: session.geniuspay_ref, status: 'success' });
          const { data: txData } = await api.get(`/transactions/${session.transaction_id}`);
          const status = txData?.data?.escrow_status ?? txData?.escrow_status;
          if (status === 'held') ok.push({ ...item, transactionId: session.transaction_id, ref: session.geniuspay_ref });
          else failed.push({ ...item, error: 'Paiement non confirmé' });
        } else {
          paymentLinks.push({ ...item, url: session.payment_url, ref: session.geniuspay_ref, transactionId: session.transaction_id });
        }
      } catch (err) {
        failed.push({ ...item, error: err.response?.data?.message ?? 'Impossible d’initier le paiement' });
      }
    }

    setResults(ok);
    setErrors([...failed, ...paymentLinks]);
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });

    if (ok.length) {
      ok.forEach((r) => remove(r.id));
      toast.success(`${ok.length} article${ok.length > 1 ? 's' : ''} payé${ok.length > 1 ? 's' : ''} — fonds bloqués en séquestre.`);
    }
    setPhase('done');
  };

  if (phase === 'done') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-3xl bg-white p-6 text-center shadow-card ring-1 ring-djassa-black/5 sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 size={34} className="text-emerald-600" strokeWidth={2.2} />
          </div>
          <h1 className="mt-4 font-jakarta text-2xl font-extrabold text-djassa-black">Paiement confirmé !</h1>
          <p className="mx-auto mt-2 max-w-md font-inter text-[13px] leading-relaxed text-djassa-slate">
            {results.length > 0
              ? `${results.length} article${results.length > 1 ? 's' : ''} payé${results.length > 1 ? 's' : ''}. Les fonds sont bloqués en séquestre — le vendeur recevra un code PIN par e-mail pour finaliser la remise.`
              : 'Aucun paiement confirmé pour le moment.'}
          </p>

          {results.length > 0 && (
            <div className="mt-5 space-y-2 text-left">
              {results.map((r) => (
                <div key={r.id} className="flex items-center gap-3 rounded-xl bg-djassa-mist px-3 py-2.5">
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                  <span className="min-w-0 flex-1 truncate font-inter text-xs font-semibold text-djassa-black">{r.titre}</span>
                  <span className="font-inter text-[10px] text-djassa-slate">{r.ref}</span>
                </div>
              ))}
            </div>
          )}

          {errors.length > 0 && (
            <div className="mt-4 rounded-xl bg-amber-50 p-3 text-left">
              <p className="font-jakarta text-[11px] font-extrabold text-amber-800">À traiter :</p>
              {errors.map((e) => (
                <p key={e.id} className="mt-1 font-inter text-[11px] text-amber-900">
                  • {e.titre} — {e.url ? <a href={e.url} target="_blank" rel="noreferrer" className="underline">ouvrir le paiement</a> : e.error}
                </p>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link to="/moi" className="btn-red btn-sm">Voir mes achats <ArrowRight size={14} /></Link>
            <button onClick={() => { setPhase('idle'); setResults([]); setErrors([]); }} className="btn-outline btn-sm">Retour au panier</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:py-10">
      <Link to="/" className="inline-flex items-center gap-1.5 font-inter text-[11px] text-djassa-slate transition hover:text-djassa-black">
        <ArrowLeft size={13} /> Continuer mes achats
      </Link>

      <div className="mt-3 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-djassa-red/10">
          <ShoppingCart size={21} className="text-djassa-red" strokeWidth={2.3} />
        </span>
        <div>
          <h1 className="font-jakarta text-2xl font-extrabold tracking-tight text-djassa-black sm:text-3xl">Mon panier</h1>
          <p className="font-inter text-[11px] text-djassa-slate">{count} article{count > 1 ? 's' : ''} · paiement sécurisé par séquestre</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={PackageOpen}
            title="Votre panier est vide"
            hint="Ajoutez des articles depuis le marché pour les acheter ensemble."
            action={<Link to="/#feed" className="btn-red btn-sm">Explorer le marché <ArrowRight size={14} /></Link>}
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* Articles */}
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3 rounded-2xl bg-white p-3 shadow-card ring-1 ring-djassa-black/5">
                <Link to={`/article/${item.id}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-djassa-cloud sm:h-24 sm:w-24">
                  {item.image ? (
                    <img src={item.image} alt={item.titre} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-jakarta text-sm font-extrabold text-djassa-black/15">Djassa</div>
                  )}
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <Link to={`/article/${item.id}`} className="line-clamp-2 font-jakarta text-[13px] font-bold leading-snug text-djassa-black transition hover:text-djassa-red">
                    {item.titre}
                  </Link>
                  <p className="mt-0.5 truncate font-inter text-[10px] text-djassa-slate">
                    {item.boutique ?? 'Particulier'}{item.quartier ? ` · ${item.quartier}` : item.ville ? ` · ${item.ville}` : ''}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                    <span className="font-jakarta text-[16px] font-extrabold text-[#E60023]">{formatFCFA(item.prix)}</span>
                    <button type="button" onClick={() => remove(item.id)} aria-label={`Retirer ${item.titre}`} className="rounded-full p-2 text-djassa-slate transition hover:bg-red-50 hover:text-djassa-red">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Récapitulatif */}
          <aside className="h-fit rounded-3xl bg-white p-5 shadow-card ring-1 ring-djassa-black/5 lg:sticky lg:top-20">
            <h2 className="font-jakarta text-base font-extrabold text-djassa-black">Récapitulatif</h2>
            <dl className="mt-4 space-y-2.5 font-inter text-[12px]">
              <div className="flex justify-between text-djassa-slate">
                <dt>Sous-total ({count} article{count > 1 ? 's' : ''})</dt>
                <dd className="font-semibold text-djassa-black">{formatFCFA(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-djassa-slate">
                <dt>Frais de séquestre (3%)</dt>
                <dd className="font-semibold text-djassa-black">{formatFCFA(fees)}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-djassa-black/10 pt-3">
                <dt className="font-jakarta text-sm font-extrabold text-djassa-black">Total</dt>
                <dd className="font-jakarta text-xl font-extrabold text-[#E60023]">{formatFCFA(total)}</dd>
              </div>
            </dl>

            <div className="mt-4 flex gap-2 rounded-xl bg-djassa-mist p-3">
              <ShieldCheck size={16} className="mt-0.5 shrink-0 text-djassa-red" />
              <p className="font-inter text-[10px] leading-relaxed text-djassa-slate">
                Chaque article est payé séparément. Les fonds restent bloqués jusqu'à la remise en main propre et la validation par code PIN.
              </p>
            </div>

            {phase === 'processing' ? (
              <button disabled className="btn mt-4 w-full !bg-djassa-black !text-white">
                <Loader2 size={16} className="animate-spin" /> Traitement en cours…
              </button>
            ) : (
              <button onClick={checkout} className="btn-red mt-4 w-full">
                <Wallet size={16} /> Payer {formatFCFA(total)}
              </button>
            )}
            <button onClick={clear} className="mt-2 w-full font-inter text-[10px] font-semibold text-djassa-slate transition hover:text-djassa-red">
              Vider le panier
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
