import { useAuth } from '../../context/AuthContext';
import { PageHead, Panel } from '../pro/ui';

export default function AdminUtilisateurs() {
  const { user } = useAuth();
  return (
    <div className="space-y-5">
      <PageHead eyebrow="Administration" title="Utilisateurs" subtitle="Gestion des comptes et des rôles plateforme." />
      <Panel title="Compte connecté" subtitle="Supervision">
        <p className="text-[12px] text-djassa-black/60">
          Administrateur : <span className="font-semibold text-djassa-black">{user?.nom}</span> ({user?.email})
        </p>
        <p className="mt-2 text-[11px] text-djassa-black/50">
          La liste complète des utilisateurs nécessite un endpoint dédié côté backend (à venir).
        </p>
      </Panel>
    </div>
  );
}