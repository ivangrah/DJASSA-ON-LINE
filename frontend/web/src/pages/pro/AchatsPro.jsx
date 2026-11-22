import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight, Boxes, Check, Clock3, Download, LockKeyhole, ShoppingBag, Wallet,
} from 'lucide-react';
import { api, downloadAuthenticated } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { ESCROW_STATUS, formatFCFA, timeAgo } from '../../lib/format';
import { EmptyState, Spinner } from '../../components/ui';
import { PageHead, Panel, ProductThumb, StatCard, TinyBadge } from './ui';

export default function AchatsPro() {
  const toast = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', 'pro-achats'],
    queryFn: async () => (await api.get('/transactions')).data,
  });

  const transactions = data?.data ?? [];
  const achats = transactions.filter((tx) => tx.role_utilisateur === 'acheteur');
  const enCours = achats.filter((tx) => ['initiated', 'held'].includes(tx.escrow_status));
  const liberes = achats.filter((tx) => tx.escrow_status === 'released');
  const total = achats.reduce((sum, tx) => sum + Number(tx.montant ?? 0), 0);

  const download = (tx) => {
    downloadAuthenticated(`/api/v1/transactions/${tx.id}/receipt`, `recu-djassa-${tx.id.slice(0, 8)}.pdf`)
      .catch(() => toast.error('Reçu indisponible pour cette transaction.'));
  };

  return (
    <div className="space-y-5">
      <PageHead
        eyebrow="Mes achats"
        title="Achats & Codes PIN"
        subtitle="Suivez vos commandes sécurisées : fonds bloqués en séquestre, code PIN à la remise et reçus PDF."
        action={
          <Link to="/" className="inline-flex items-center gap-2 rounded-[5px] bg-djassa-red border-solid border-[0.5px] border-[rgba(255,255,255,0.12)] px-4 py-2.5 font-spacegrotesk text-[11px] font-extrabold uppercase tracking-wide text-white shadow-pop transition hover:bg-djassa-red-dark active:scale-95">
            <ShoppingBag size={24} /> Explorer le marché
          </Link>
        }
      />

      <img src="/images/illustrations/calendar-clock-basket.webp" alt="" aria-hidden="true" className="art-warm pointer-events-none mx-auto -mb-1 hidden h-24 w-auto select-none object-contain sm:block"  loading="lazy" decoding="async" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={ShoppingBag} label="Achats" value={achats.length} hint="Toutes périodes" tone="dark" />
        <StatCard icon={Clock3} label="En cours" value={enCours.length} hint="Séquestre ou paiement" />
        <StatCard icon={Check} label="Libérés" value={liberes.length} hint="Remises validées" />
        <StatCard icon={Wallet} label="Total dépensé" value={formatFCFA(total)} hint="Montants FCFA" />
      </div>

      <div className="flex items-start gap-2.5 rounded-[5px] bg-djassa-red/5 px-4 py-3">
        <LockKeyhole size={17} className="mt-0.5 shrink-0 text-djassa-red" />
        <p className="text-[11px] leading-relaxed text-djassa-black/65">
          <span className="font-spacegrotesk font-extrabold text-djassa-black">Comment ça marche ?</span> Votre paiement est bloqué en séquestre.
          Vous recevez un <strong>code PIN par e-mail</strong> : ne le communiquez au vendeur qu’au moment de la remise en main propre.
          Le vendeur le saisit pour libérer les fonds.
        </p>
      </div>

      <Panel title="Mes commandes" hint={`${achats.length} achat${achats.length > 1 ? 's' : ''} enregistré${achats.length > 1 ? 's' : ''}`}>
        {isLoading ? (
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
                        <p className="truncate font-spacegrotesk text-[12.5px] font-extrabold">{tx.article?.titre ?? 'Article'}</p>
                        <span className={`rounded-[5px] px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide ${statut.cls}`}>{statut.label}</span>
                        {tx.boutique && <TinyBadge tone="dark">Boutique Pro</TinyBadge>}
                      </div>
                      <p className="mt-0.5 text-[10px] text-djassa-black/45">
                        {formatFCFA(tx.montant)} · Vendeur {tx.vendeur?.nom ?? 'Djassa'} · {timeAgo(tx.created_at)}
                      </p>
                      {tx.geniuspay_ref && (
                        <p className="mt-0.5 font-mono text-[9px] text-djassa-black/35">Réf. {tx.geniuspay_ref}</p>
                      )}
                    </div>
                    {tx.can_view_receipt && (
                      <button
                        type="button"
                        onClick={() => download(tx)}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-[5px] px-2.5 py-1.5 font-spacegrotesk text-[9.5px] font-extrabold text-djassa-black/60 transition hover:text-djassa-red"
                      >
                        <Download size={20} /> Reçu PDF
                      </button>
                    )}
                  </div>

                  <div className={`mt-3 flex items-start gap-2 rounded-[5px] px-3 py-2 text-[10.5px] leading-relaxed ${
                    held
                      ? 'bg-amber-50 text-amber-800'
                      : released
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-djassa-cloud border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] text-djassa-black/55'
                  }`}>
                    {held ? <LockKeyhole size={14} className="mt-0.5 shrink-0" /> : released ? <Check size={14} className="mt-0.5 shrink-0" /> : <Clock3 size={14} className="mt-0.5 shrink-0" />}
                    <span>
                      {held && <>Fonds bloqués en séquestre. Présentez le <strong>code PIN reçu par e-mail</strong> au vendeur lors de la remise.</>}
                      {released && <>Remise validée — les fonds ont été libérés au vendeur. Votre reçu PDF est disponible.</>}
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
      </Panel>

      <div className="flex items-center gap-2 text-[10px] text-djassa-black/40">
        <Boxes size={13} className="text-djassa-red" />
        Tous les montants sont exprimés en FCFA. Les reçus sont générés au format PDF officiel Djassa Online.
      </div>
    </div>
  );
}
