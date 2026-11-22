import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ShieldCheck, Store, Users, AlertTriangle, Activity, ReceiptText, ArrowRight } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { EmptyState, Spinner } from '../../components/ui';
import { PageHead, Panel, StatCard } from '../pro/ui';

/** Tableau de bord administration — supervision plateforme. */
export default function AdminDashboard() {
  const { user } = useAuth();

  const { data: productsData } = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: async () => (await api.get('/products', { params: { per_page: 1 } })).data,
    staleTime: 30_000,
  });
  const { data: trocData } = useQuery({
    queryKey: ['admin', 'trocs'],
    queryFn: async () => (await api.get('/trocs')).data,
    staleTime: 30_000,
  });
  const { data: txData } = useQuery({
    queryKey: ['admin', 'transactions'],
    queryFn: async () => (await api.get('/transactions')).data,
    staleTime: 30_000,
  });

  const totalProducts = productsData?.meta?.total ?? 0;
  const totalTrocs = (trocData?.data ?? []).length;
  const totalTx = (txData?.data ?? []).length;
  const heldTx = (txData?.data ?? []).filter((t) => t.escrow_status === 'held').length;

  return (
    <div className="space-y-5">
      <PageHead
        eyebrow="Administration"
        title={<>Supervision <span className="text-djassa-red">plateforme.</span></>}
        subtitle={`Connecté en tant qu’administrateur — ${user?.email ?? ''}.`}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Store} label="Articles publiés" value={totalProducts} tone="red" />
        <StatCard icon={ArrowRight} label="Offres de troc" value={totalTrocs} tone="ink" />
        <StatCard icon={ReceiptText} label="Transactions" value={totalTx} tone="ink" />
        <StatCard icon={AlertTriangle} label="Séquestres actifs" value={heldTx} tone="amber" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Litiges & Escrow" subtitle="Transactions bloquées en séquestre">
          {heldTx === 0 ? (
            <p className="text-[12px] text-djassa-black/55">Aucun litige en cours. 🎉</p>
          ) : (
            <ul className="space-y-2">
              {(txData?.data ?? []).filter((t) => t.escrow_status === 'held').slice(0, 5).map((t) => (
                <li key={t.id} className="flex items-center justify-between rounded-[5px] bg-djassa-cloud px-3 py-2 text-[11px]">
                  <span className="font-semibold">{t.reference ?? t.id?.slice(0, 8)}</span>
                  <span className="font-DM-Sans text-djassa-black/60">{t.montant} FCFA · {t.escrow_status}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Actions rapides" subtitle="Administration de la plateforme">
          <div className="grid gap-2">
            <Link to="/admin" className="flex items-center justify-between rounded-[5px] bg-djassa-cloud px-3 py-2.5 text-[12px] font-bold transition hover:bg-djassa-red/10">
              <span className="flex items-center gap-2"><Users size={16} /> Utilisateurs</span>
              <ArrowRight size={14} />
            </Link>
            <Link to="/admin" className="flex items-center justify-between rounded-[5px] bg-djassa-cloud px-3 py-2.5 text-[12px] font-bold transition hover:bg-djassa-red/10">
              <span className="flex items-center gap-2"><Store size={16} /> Boutiques & Modération</span>
              <ArrowRight size={14} />
            </Link>
            <Link to="/admin" className="flex items-center justify-between rounded-[5px] bg-djassa-cloud px-3 py-2.5 text-[12px] font-bold transition hover:bg-djassa-red/10">
              <span className="flex items-center gap-2"><Activity size={16} /> Sécurité & Webhooks</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </Panel>
      </div>
    </div>
  );
}