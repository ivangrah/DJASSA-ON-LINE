import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight, BadgeCheck, Download, FileText, ReceiptText, ShoppingBag, TrendingUp,
} from 'lucide-react';
import { api, downloadAuthenticated } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { ESCROW_STATUS, formatFCFA, timeAgo } from '../../lib/format';
import { EmptyState, Spinner } from '../../components/ui';
import { PageHead, Panel, ProductThumb, StatCard, TinyBadge } from './ui';

const FILTERS = [
  { key: 'toutes', label: 'Toutes' },
  { key: 'ventes', label: 'Mes ventes' },
  { key: 'achats', label: 'Mes achats' },
];

export default function FacturesPro() {
  const toast = useToast();
  const [filter, setFilter] = useState('ventes');

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', 'factures'],
    queryFn: async () => (await api.get('/transactions')).data,
  });

  const transactions = data?.data ?? [];
  const ventes = transactions.filter((tx) => tx.role_utilisateur === 'vendeur');
  const achats = transactions.filter((tx) => tx.role_utilisateur === 'acheteur');
  const visible = filter === 'ventes' ? ventes : filter === 'achats' ? achats : transactions;

  const caLibere = ventes
    .filter((tx) => tx.escrow_status === 'released')
    .reduce((sum, tx) => sum + Number(tx.montant ?? 0), 0);
  const enSequestre = transactions
    .filter((tx) => tx.escrow_status === 'held')
    .reduce((sum, tx) => sum + Number(tx.montant ?? 0), 0);

  const download = (tx) => {
    const kind = tx.role_utilisateur === 'vendeur' ? 'facture' : 'recu';
    downloadAuthenticated(`/api/v1/transactions/${tx.id}/receipt`, `${kind}-djassa-${tx.id.slice(0, 8)}.pdf`)
      .catch(() => toast.error('Document indisponible pour cette transaction.'));
  };

  return (
    <div className="space-y-5">
      <PageHead
        eyebrow="Factures & reçus PDF"
        title="Ma comptabilité Djassa"
        subtitle="Téléchargez vos factures de vente et vos reçus d’achat au format PDF, à chaque transaction sécurisée."
        action={
          <Link to="/dashboard-pro" className="inline-flex items-center gap-2 rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] shadow-card px-4 py-2.5 font-spacegrotesk text-[11px] font-extrabold text-djassa-black/65 transition hover:text-djassa-red">
            Retour à la vue d’ensemble <ArrowRight size={14} />
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={TrendingUp} label="CA facturé" value={formatFCFA(caLibere)} hint="Ventes libérées" tone="dark" />
        <StatCard icon={ReceiptText} label="Factures de vente" value={ventes.length} hint="Tout statut confondu" />
        <StatCard icon={ShoppingBag} label="Reçus d’achat" value={achats.length} hint="Sur le marché Djassa" />
        <StatCard icon={FileText} label="En séquestre" value={formatFCFA(enSequestre)} hint="En attente de validation" />
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] shadow-card px-4 py-3">
        <BadgeCheck size={16} className="text-djassa-red" />
        <p className="text-[10.5px] text-djassa-black/55">
          Les documents sont édités avec l’identité Djassa Online et les montants en FCFA. Un reçu est généré dès qu’une transaction vous concerne.
        </p>
      </div>

      <Panel
        title="Documents disponibles"
        hint="Cliquez sur « Télécharger » pour obtenir le PDF"
        action={
          <div className="flex rounded-[5px] bg-djassa-cloud p-1">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`rounded-[5px] px-3 py-1.5 font-spacegrotesk text-[10px] font-extrabold transition ${
                  filter === key ? 'bg-djassa-red text-white shadow-pop' : 'text-djassa-black/50 hover:text-djassa-black'
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
        ) : visible.length === 0 ? (
          <EmptyState
            art="box"
            title="Aucun document disponible"
            hint="Vos factures et reçus apparaîtront ici dès votre première transaction."
            action={<Link to="/dashboard-pro" className="btn-outline btn-sm">Retour au dashboard <ArrowRight size={13} /></Link>}
          />
        ) : (
          <>
            {/* Tableau desktop */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr className="font-spacegrotesk text-[9px] font-extrabold uppercase tracking-wide text-djassa-black/40">
                    <th className="pb-2 pr-3">Article</th>
                    <th className="pb-2 pr-3">Type</th>
                    <th className="pb-2 pr-3">Montant</th>
                    <th className="pb-2 pr-3">Statut</th>
                    <th className="pb-2 pr-3">Date</th>
                    <th className="pb-2 text-right">PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-djassa-gray/20">
                  {visible.map((tx) => {
                    const statut = ESCROW_STATUS[tx.escrow_status] ?? ESCROW_STATUS.initiated;
                    return (
                      <tr key={tx.id}>
                        <td className="py-2.5 pr-3">
                          <div className="flex items-center gap-2">
                            <ProductThumb article={tx.article} className="h-9 w-9" />
                            <span className="max-w-[220px] truncate font-spacegrotesk text-[11px] font-extrabold">{tx.article?.titre ?? 'Article'}</span>
                          </div>
                        </td>
                        <td className="py-2.5 pr-3">
                          <TinyBadge tone={tx.role_utilisateur === 'vendeur' ? 'red' : 'dark'}>
                            {tx.role_utilisateur === 'vendeur' ? 'Vente' : 'Achat'}
                          </TinyBadge>
                        </td>
                        <td className="py-2.5 pr-3 font-spacegrotesk text-[11px] font-extrabold">{formatFCFA(tx.montant)}</td>
                        <td className="py-2.5 pr-3">
                          <span className={`rounded-[5px] px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide ${statut.cls}`}>{statut.label}</span>
                        </td>
                        <td className="py-2.5 pr-3 text-[10px] text-djassa-black/45">{timeAgo(tx.created_at)}</td>
                        <td className="py-2.5 text-right">
                          {tx.can_view_receipt && (
                            <button
                              type="button"
                              onClick={() => download(tx)}
                              className="inline-flex items-center gap-1.5 rounded-[5px] px-2.5 py-1.5 font-spacegrotesk text-[9.5px] font-extrabold text-djassa-black/60 transition hover:text-djassa-red"
                            >
                              <Download size={20} /> Télécharger
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Cartes mobile */}
            <div className="space-y-3 md:hidden">
              {visible.map((tx) => {
                const statut = ESCROW_STATUS[tx.escrow_status] ?? ESCROW_STATUS.initiated;
                return (
                  <article key={tx.id} className="rounded-[5px] p-3.5">
                    <div className="flex items-start gap-3">
                      <ProductThumb article={tx.article} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-spacegrotesk text-[12px] font-extrabold">{tx.article?.titre ?? 'Article'}</p>
                        <p className="mt-0.5 text-[10px] text-djassa-black/45">{formatFCFA(tx.montant)} · {timeAgo(tx.created_at)}</p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <TinyBadge tone={tx.role_utilisateur === 'vendeur' ? 'red' : 'dark'}>
                            {tx.role_utilisateur === 'vendeur' ? 'Vente' : 'Achat'}
                          </TinyBadge>
                          <span className={`rounded-[5px] px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide ${statut.cls}`}>{statut.label}</span>
                        </div>
                      </div>
                    </div>
                    {tx.can_view_receipt && (
                      <button
                        type="button"
                        onClick={() => download(tx)}
                        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-[5px] bg-djassa-black border-solid border-[0.5px] border-[rgba(255,255,255,0.12)] py-2 font-spacegrotesk text-[10px] font-extrabold text-white transition hover:bg-black"
                      >
                        <Download size={12} /> Télécharger le PDF
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          </>
        )}
      </Panel>
    </div>
  );
}
