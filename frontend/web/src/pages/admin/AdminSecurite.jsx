import { PageHead, Panel } from '../pro/ui';

export default function AdminSecurite() {
  return (
    <div className="space-y-5">
      <PageHead eyebrow="Administration" title="Sécurité & Webhooks" subtitle="Logs de sécurité, webhooks GeniusPay et audit." />
      <Panel title="Webhooks" subtitle="Journal d'idempotence">
        <p className="text-[12px] text-djassa-black/55">
          Les webhooks sont journalisés côté escrow (table webhook_logs). Consultez les logs service pour le détail.
        </p>
      </Panel>
      <Panel title="Logs de sécurité" subtitle="Audit">
        <p className="text-[11px] text-djassa-black/50">
          Les logs applicatifs sont disponibles dans storage/logs/laravel.log de chaque microservice.
        </p>
      </Panel>
    </div>
  );
}