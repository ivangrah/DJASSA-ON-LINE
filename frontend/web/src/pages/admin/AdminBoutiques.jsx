import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { EmptyState } from '../../components/ui';
import { PageHead, Panel } from '../pro/ui';

export default function AdminBoutiques() {
  const { data } = useQuery({
    queryKey: ['admin', 'boutiques'],
    queryFn: async () => (await api.get('/boutiques')).data,
    staleTime: 30_000,
  });
  const boutiques = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);

  return (
    <div className="space-y-5">
      <PageHead eyebrow="Administration" title="Boutiques & Modération" subtitle="Supervision des boutiques Pro de la plateforme." />
      <Panel title="Boutiques" subtitle={`${boutiques.length} boutique(s)`}>
        {boutiques.length === 0 ? (
          <p className="text-[12px] text-djassa-black/55">Aucune boutique pour le moment.</p>
        ) : (
          <ul className="space-y-2">
            {boutiques.map((b) => (
              <li key={b.id ?? b.slug} className="flex items-center justify-between rounded-[5px] bg-djassa-cloud px-3 py-2 text-[11px]">
                <span className="font-semibold">{b.nom_boutique ?? b.nom}</span>
                <span className="font-DM-Sans text-djassa-black/60">{b.ville} · {b.verifie ? 'Vérifiée' : 'En attente'}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}