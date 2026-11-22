import { useQuery } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import { api } from '../../lib/api';
import { EmptyState } from '../../components/ui';
import { PageHead, Panel } from '../pro/ui';

export default function AdminLitiges() {
  const { data } = useQuery({
    queryKey: ['admin', 'transactions'],
    queryFn: async () => (await api.get('/transactions')).data,
    staleTime: 30_000,
  });
  const held = (Array.isArray(data?.data) ? data.data : []).filter((t) => t.escrow_status === 'held');

  return (
    <div className="space-y-5">
      <PageHead eyebrow="Administration" title="Litiges & Escrow" subtitle="Transactions bloquées en séquestre à traiter." />
      <Panel title="Séquestres actifs" subtitle={`${held.length} litige(s) en cours`}>
        {held.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="Aucun litige en cours"
            hint="Toutes les transactions en séquestre sont sous contrôle. Les nouveaux litiges apparaîtront ici."
          />
        ) : (
          <ul className="space-y-2">
            {held.map((t) => (
              <li key={t.id} className="flex items-center justify-between rounded-[5px] bg-djassa-cloud px-3 py-2 text-[11px]">
                <span className="font-semibold">{t.reference ?? t.id?.slice(0, 8)}</span>
                <span className="font-DM-Sans text-djassa-black/60">{t.montant} FCFA · vendeur {t.vendeur_id?.slice(0, 8)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}