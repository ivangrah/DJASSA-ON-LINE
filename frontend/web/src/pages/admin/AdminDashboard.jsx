import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { gsap } from 'gsap';
import {
  Users, Store, ReceiptText, ShieldAlert, Activity, Settings, BellRing,
  TrendingUp, Wallet, CheckCircle2, XCircle, RefreshCw, RotateCcw, Trash2,
  Plus, Send, Lock, Unlock, Eye,
} from 'lucide-react';
import { adminApi } from '../../lib/adminApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatFCFA } from '../../lib/format';
import { usePageReveal } from '../../hooks/usePageReveal';
import AdminTable from '../../components/admin/AdminTable';
import { ConfirmModal } from '../../components/ui';
import { PageHead, Panel, StatCard } from '../pro/ui';

const EvolutionChart = lazy(() => import('../../components/admin/AdminCharts').then((m) => ({ default: m.EvolutionChart })));
const SalesChart = lazy(() => import('../../components/admin/AdminCharts').then((m) => ({ default: m.SalesChart })));
const EscrowDonut = lazy(() => import('../../components/admin/AdminCharts').then((m) => ({ default: m.EscrowDonut })));
const FunnelChart = lazy(() => import('../../components/admin/AdminCharts').then((m) => ({ default: m.FunnelChart })));

const TABS = [
  { id: 'overview', label: 'Vue globale', short: 'Vue', icon: Activity },
  { id: 'users', label: 'Utilisateurs & Audit', short: 'Users', icon: Users },
  { id: 'boutiques', label: 'Boutiques & CA', short: 'Boutiques', icon: Store },
  { id: 'offres', label: 'Offres & Plans', short: 'Offres', icon: ReceiptText },
  { id: 'notifications', label: 'Notifications & Email', short: 'Notif', icon: BellRing },
  { id: 'system', label: 'Maintenance & Profil', short: 'Système', icon: Settings },
];
const TAB_IDS = new Set(TABS.map((t) => t.id));

function ToggleSwitch({ checked, onChange, label, compact = false }) {
  return (
    <label className={`inline-flex cursor-pointer items-center gap-2 ${compact ? '' : 'font-DM-Sans text-[0.9375rem] font-semibold text-djassa-black/75'}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-none transition-colors duration-200 ${checked ? 'bg-djassa-red' : 'bg-djassa-black/20'}`}
      >
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
      {!compact && <span>{label}</span>}
      {compact && <span className={`text-[0.8125rem] font-bold ${checked ? 'text-emerald-700' : 'text-djassa-black/45'}`}>{label}</span>}
    </label>
  );
}

function AnimatedNumber({ value, prefix = '', suffix = '' }) {
  const el = useRef(null);
  const prev = useRef(null);
  useEffect(() => {
    if (el.current == null) return;
    const next = Number(value) || 0;
    const from = prev.current == null ? next : prev.current;
    const obj = { v: from };
    const tween = gsap.to(obj, {
      v: next, duration: prev.current == null ? 0 : 0.9, ease: 'power2.out',
      onUpdate: () => { if (el.current) el.current.textContent = prefix + Math.round(obj.v).toLocaleString('fr-FR') + suffix; },
    });
    prev.current = next;
    return () => tween.kill();
  }, [value, prefix, suffix]);
  const initial = Number(value) || 0;
  return <span ref={el} className="tabular-nums">{prefix}{initial.toLocaleString('fr-FR')}{suffix}</span>;
}

/** Super Dashboard Admin — 6 onglets, charte Djassa. */
export default function AdminDashboard() {
  const { user, authResolved } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const scope = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const tab = TAB_IDS.has(tabFromUrl) ? tabFromUrl : 'overview';
  const [period, setPeriod] = useState('30j');
  usePageReveal(scope);

  useEffect(() => {
    if (tabFromUrl && !TAB_IDS.has(tabFromUrl)) {
      setSearchParams({ tab: 'overview' }, { replace: true });
    }
  }, [tabFromUrl, setSearchParams]);

  const setTab = (next) => setSearchParams({ tab: next });

  // Aucune requête protégée tant que l'utilisateur n'est pas authentifié et résolu.
  const canFetch = Boolean(user && authResolved);
  const { data: usersData, isLoading: loadingUsers } = useQuery({ queryKey: ['admin', 'users'], queryFn: () => adminApi.users(), enabled: canFetch, retry: false, staleTime: 30_000 });
  const { data: auditData } = useQuery({ queryKey: ['admin', 'audit'], queryFn: () => adminApi.audit(), enabled: canFetch, retry: false, staleTime: 30_000 });
  const { data: finances } = useQuery({ queryKey: ['admin', 'finances'], queryFn: () => adminApi.finances(), enabled: canFetch, retry: false, staleTime: 30_000 });
  const { data: boutiquesData } = useQuery({ queryKey: ['admin', 'boutiques'], queryFn: () => adminApi.boutiques(), enabled: canFetch, retry: false, staleTime: 30_000 });
  const { data: offresData } = useQuery({ queryKey: ['admin', 'offres'], queryFn: () => adminApi.offres(), enabled: canFetch, retry: false, staleTime: 30_000 });
  const { data: maintenanceData } = useQuery({ queryKey: ['admin', 'maintenance'], queryFn: () => adminApi.maintenance(), enabled: canFetch, retry: false, staleTime: 10_000 });
  const { data: campaignsData } = useQuery({ queryKey: ['admin', 'campaigns'], queryFn: () => adminApi.campaigns(), enabled: canFetch && tab === 'notifications', retry: false, staleTime: 15_000 });

  const users = Array.isArray(usersData?.data?.data) ? usersData.data.data : (Array.isArray(usersData?.data) ? usersData.data : []);
  const audit = Array.isArray(auditData?.data?.data) ? auditData.data.data : (Array.isArray(auditData?.data) ? auditData.data : []);
  const financesRows = Array.isArray(finances?.data?.data) ? finances.data.data : (Array.isArray(finances?.data) ? finances.data : []);
  const boutiques = Array.isArray(boutiquesData?.data?.data) ? boutiquesData.data.data : (Array.isArray(boutiquesData?.data) ? boutiquesData.data : []);
  const offres = Array.isArray(offresData?.data?.data) ? offresData.data.data : (Array.isArray(offresData?.data) ? offresData.data : []);
  const usersTotal = Number(usersData?.data?.meta?.total ?? users.length);
  const boutiquesTotal = Number(boutiquesData?.data?.meta?.total ?? boutiques.length);

  const maintenance = maintenanceData?.data?.data ?? maintenanceData?.data ?? {};
  const maintenanceOn = Boolean(maintenance.enabled);
  const [maintenanceMsg, setMaintenanceMsg] = useState('');
  const [maintenanceDuration, setMaintenanceDuration] = useState(60);

  useEffect(() => {
    if (maintenance.message != null && maintenance.message !== '') setMaintenanceMsg(maintenance.message);
    if (maintenance.duration_minutes != null) setMaintenanceDuration(maintenance.duration_minutes);
  }, [maintenance.enabled, maintenance.message, maintenance.duration_minutes, maintenance.updated_at]);
  const [campaign, setCampaign] = useState({ audience: 'all', user_id: '', titre: '', corps: '', email: false, priorite: 'info' });
  const [campaignEstimate, setCampaignEstimate] = useState(null);
  const [newUser, setNewUser] = useState({ nom: '', email: '', telephone: '', role: 'particulier', password: '' });
  const [profile, setProfile] = useState({ nom: user?.nom ?? '', email: user?.email ?? '', telephone: user?.telephone ?? '', password: '', password_confirmation: '' });
  const [confirmState, setConfirmState] = useState(null);
  const campaigns = Array.isArray(campaignsData?.data?.data) ? campaignsData.data.data : (Array.isArray(campaignsData?.data) ? campaignsData.data : []);
  const campaignTemplates = [
    { key: 'maintenance', titre: 'Maintenance imminente', corps: 'Une maintenance de la plateforme Djassa est prévue prochainement. Certains services pourront être temporairement indisponibles. Merci de votre compréhension.', priorite: 'warning' },
    { key: 'security', titre: 'Alerte sécurité', corps: 'Par mesure de sécurité, nous vous recommandons de vérifier votre compte et de mettre à jour votre mot de passe. N\'hésitez pas à contacter le support en cas d\'activité suspecte.', priorite: 'urgent' },
    { key: 'feature', titre: 'Nouvelle fonctionnalité', corps: 'Djassa évolue ! Découvrez notre nouvelle fonctionnalité dès maintenant sur votre tableau de bord. Merci de faire partie de la communauté.', priorite: 'info' },
  ];
  const emptyOffre = { code: '', nom: '', role_cible: 'tous', description: '', montant_fcfa: '', duree_jours: 30, max_articles: '', avantagesText: '', actif: true, is_featured: false };
  const [newOffre, setNewOffre] = useState(emptyOffre);
  const [editingOffreId, setEditingOffreId] = useState(null);
  const [newBoutique, setNewBoutique] = useState({ utilisateur_id: '', nom_boutique: '', telephone: '', categorie: 'general', ville: 'Abidjan' });

  const apiError = (err, fallback) => {
    const data = err?.response?.data;
    if (data?.errors) return Object.values(data.errors).flat().join(' · ');
    return data?.message ?? fallback;
  };

  const doToggleMaintenance = async (enabled) => {
    const duration = Number(maintenanceDuration) || 60;
    try {
      await adminApi.setMaintenance({ enabled, message: maintenanceMsg, duration_minutes: duration });
      qc.invalidateQueries({ queryKey: ['admin', 'maintenance'] });
      toast.success(enabled ? (maintenanceOn ? 'Maintenance mise à jour.' : 'Mode maintenance activé.') : 'Mode maintenance désactivé.');
    } catch (err) { toast.error(apiError(err, 'Impossible de basculer la maintenance.')); }
  };

  const toggleMaintenance = (enabled) => {
    const duration = Number(maintenanceDuration) || 60;
    if (enabled && !maintenanceOn) {
      setConfirmState({
        title: 'Activer le mode maintenance',
        message: `Durée estimée : ${duration} min.\n\nLes utilisateurs non-admin verront une page 503/maintenance et l'accès public sera coupé.`,
        confirmLabel: 'Activer la maintenance',
        onConfirm: () => doToggleMaintenance(enabled),
      });
      return;
    }
    doToggleMaintenance(enabled);
  };

  const estimateCampaign = async () => {
    try {
      const res = await adminApi.estimateCampaign({ audience: campaign.audience, user_id: campaign.audience === 'user' ? campaign.user_id : undefined });
      setCampaignEstimate(Number(res.data?.count ?? 0));
      return Number(res.data?.count ?? 0);
    } catch (err) { toast.error(apiError(err, 'Impossible d’estimer les destinataires.')); return null; }
  };

  const doSendCampaign = async (count) => {
    try {
      const res = await adminApi.broadcast({ ...campaign, user_id: campaign.audience === 'user' ? campaign.user_id : undefined, confirm_mass: campaign.audience === 'all' });
      toast.success(res.data?.message ?? 'Campagne mise en file d’attente.', { description: `${res.data?.destinataires_count ?? count} destinataire(s) ciblé(s).` });
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        import('canvas-confetti').then(({ default: confetti }) => confetti({
          particleCount: 80, spread: 70, origin: { y: 0.7 }, colors: ['#780000', '#121212', '#E5E5E5'],
        })).catch(() => {});
      }
      setCampaign({ audience: 'all', user_id: '', titre: '', corps: '', email: false, priorite: 'info' });
      setCampaignEstimate(null);
      qc.invalidateQueries({ queryKey: ['admin', 'campaigns'] });
    } catch (err) { toast.error(apiError(err, 'Échec de l’envoi de la campagne.')); }
  };

  const sendCampaign = async (e) => {
    e.preventDefault();
    let count = campaignEstimate;
    if (count == null) count = await estimateCampaign();
    if (count == null) return;
    if (campaign.audience === 'all') {
      setConfirmState({
        title: 'Confirmer l’envoi massif',
        message: `Envoyer cette campagne à TOUS les utilisateurs (${count} destinataire(s)) ?\n\nCette action est massive et sera traitée via la file Redis/Brevo.`,
        confirmLabel: 'Envoyer à tous',
        onConfirm: () => doSendCampaign(count),
      });
      return;
    }
    await doSendCampaign(count);
  };

  const exportCampaignsPdf = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold'); doc.setTextColor(120, 0, 0); doc.text('Djassa — Historique campagnes', 14, 16);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(18, 18, 18); doc.setFontSize(10);
    let y = 28;
    campaigns.forEach((c, i) => {
      const line = `${i + 1}. [${(c.priorite || 'info').toUpperCase()}] ${c.titre} — ${c.audience} — ${c.destinataires_count ?? 0} dest. — ${c.send_email ? 'Email+InApp' : 'In-App'} — ${new Date(c.created_at).toLocaleString('fr-FR')}`;
      const split = doc.splitTextToSize(line, 180);
      if (y > 275) { doc.addPage(); y = 16; }
      doc.text(split, 14, y); y += split.length * 5 + 2;
    });
    doc.save('djassa-campagnes.pdf');
    toast.success('Export PDF généré.');
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    if (profile.password && profile.password !== profile.password_confirmation) {
      toast.error('La confirmation du mot de passe ne correspond pas.');
      return;
    }
    const payload = { nom: profile.nom, email: profile.email, telephone: profile.telephone };
    if (profile.password) payload.password = profile.password;
    try {
      await adminApi.updateProfile(payload);
      setProfile((p) => ({ ...p, password: '', password_confirmation: '' }));
      toast.success('Profil admin mis à jour.', { description: payload.password ? 'Mot de passe modifié.' : undefined });
    } catch (err) { toast.error(apiError(err, 'Échec de la mise à jour du profil.')); }
  };

  const resetPwd = async (id) => {
    try {
      const res = await adminApi.resetPassword(id);
      toast.success('Mot de passe réinitialisé.', { description: `Temporaire : ${res.data.temporary_password}` });
    } catch (err) { toast.error(apiError(err, 'Réinitialisation impossible.')); }
  };

  const createUser = async (e) => {
    e.preventDefault();
    try {
      const res = await adminApi.createUser({ nom: newUser.nom, email: newUser.email, telephone: newUser.telephone || undefined, role: newUser.role, password: newUser.password });
      toast.success(`Utilisateur « ${res.data?.data?.nom ?? newUser.nom} » créé.`);
      setNewUser({ nom: '', email: '', telephone: '', role: 'particulier', password: '' });
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    } catch (err) { toast.error(apiError(err, 'Création utilisateur impossible.')); }
  };

  const deleteUser = (id) => {
    setConfirmState({
      title: 'Supprimer l’utilisateur',
      message: 'Supprimer cet utilisateur ? Cette action est irréversible.',
      confirmLabel: 'Supprimer',
      onConfirm: async () => {
        try {
          const res = await adminApi.deleteUser(id);
          toast.success(res.data?.deleted ? 'Utilisateur supprimé.' : 'Utilisateur supprimé.');
          qc.invalidateQueries({ queryKey: ['admin', 'users'] });
        } catch (err) { toast.error(apiError(err, 'Suppression utilisateur impossible.')); }
      },
    });
  };

  const normalizeOffrePayload = (o) => ({
    code: o.code.trim(),
    nom: o.nom.trim(),
    role_cible: o.role_cible || 'tous',
    description: o.description?.trim() || null,
    montant_fcfa: Number(o.montant_fcfa || 0),
    duree_jours: Number(o.duree_jours || 30),
    max_articles: o.max_articles === '' || o.max_articles === null ? null : Number(o.max_articles),
    avantages: String(o.avantagesText || '').split('\n').map((s) => s.trim()).filter(Boolean),
    actif: Boolean(o.actif),
    is_featured: Boolean(o.is_featured),
  });

  const editOffre = (o) => {
    setEditingOffreId(o.id);
    setNewOffre({
      code: o.code ?? '', nom: o.nom ?? '', role_cible: o.role_cible ?? 'tous',
      description: o.description ?? '', montant_fcfa: o.montant_fcfa ?? 0, duree_jours: o.duree_jours ?? 30,
      max_articles: o.max_articles ?? '', avantagesText: Array.isArray(o.avantages) ? o.avantages.join('\n') : '',
      actif: Boolean(o.actif), is_featured: Boolean(o.is_featured),
    });
  };

  const saveOffre = async (e) => {
    e.preventDefault();
    const payload = normalizeOffrePayload(newOffre);
    try {
      if (editingOffreId) {
        const { code, ...patch } = payload;
        await adminApi.updateOffre(editingOffreId, patch);
        toast.success(`Offre « ${payload.nom} » mise à jour.`);
      } else {
        await adminApi.createOffre(payload);
        toast.success(`Offre « ${payload.nom} » créée.`);
      }
      setNewOffre(emptyOffre);
      setEditingOffreId(null);
      qc.invalidateQueries({ queryKey: ['admin', 'offres'] });
    } catch (err) { toast.error(apiError(err, 'Enregistrement offre impossible.')); }
  };

  const toggleOffreActif = async (o) => {
    try {
      await adminApi.updateOffre(o.id, { actif: !o.actif });
      toast.success(!o.actif ? `Offre « ${o.nom} » activée.` : `Offre « ${o.nom} » désactivée.`);
      qc.invalidateQueries({ queryKey: ['admin', 'offres'] });
    } catch (err) { toast.error(apiError(err, 'Impossible de changer le statut de l’offre.')); }
  };

  const deleteOffre = (id) => {
    setConfirmState({
      title: 'Supprimer l’offre',
      message: 'Supprimer cette offre ? Cette action est irréversible.',
      confirmLabel: 'Supprimer',
      onConfirm: async () => {
        try {
          await adminApi.deleteOffre(id);
          toast.success('Offre supprimée.');
          qc.invalidateQueries({ queryKey: ['admin', 'offres'] });
        } catch (err) { toast.error(apiError(err, 'Suppression offre impossible.')); }
      },
    });
  };

  const createBoutique = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createBoutique(newBoutique);
      toast.success('Boutique créée.');
      setNewBoutique({ utilisateur_id: '', nom_boutique: '', telephone: '', categorie: 'general', ville: 'Abidjan' });
      qc.invalidateQueries({ queryKey: ['admin', 'boutiques'] });
      qc.invalidateQueries({ queryKey: ['admin', 'finances'] });
    } catch (err) { toast.error(apiError(err, 'Création boutique impossible.')); }
  };

  const deleteBoutique = (id) => {
    setConfirmState({
      title: 'Supprimer la boutique',
      message: 'Supprimer cette boutique ? Cette action est irréversible.',
      confirmLabel: 'Supprimer',
      onConfirm: async () => {
        try {
          await adminApi.deleteBoutique(id);
          toast.success('Boutique supprimée.');
          qc.invalidateQueries({ queryKey: ['admin', 'boutiques'] });
          qc.invalidateQueries({ queryKey: ['admin', 'finances'] });
        } catch (err) { toast.error(apiError(err, 'Suppression boutique impossible.')); }
      },
    });
  };

  const financesTotals = finances?.data?.totaux ?? finances?.totaux ?? finances?.data?.meta?.totaux ?? {};
  const totalCA = Number(financesTotals?.chiffre_affaires ?? 0) || 0;
  const activeUsers = users.filter((u) => u?.statut === 'actif').length;

  return (
    <div ref={scope} className="space-y-5">
      <PageHead
        eyebrow="Administration"
        title={<>Super Dashboard <span className="text-djassa-red">Djassa.</span></>}
        subtitle="Supervision plateforme, utilisateurs, finances, offres et sécurité."
        action={<img src="/images/admin-text.webp" alt="" aria-hidden="true" className="hidden h-14 w-auto object-contain lg:block" />}
      />

      {/* Onglets (mobile uniquement, sidebar pilote sur desktop) */}
      <div className="flex flex-wrap gap-1.5 rounded-[5px] bg-white p-1.5 shadow-card md:hidden" role="tablist">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
            className={`inline-flex items-center gap-1.5 rounded-[5px] min-h-[2.875rem] px-4 py-2.5 font-spacegrotesk text-[10.5px] font-extrabold transition ${tab === id ? 'bg-djassa-red text-white shadow-pop' : 'text-djassa-black/60 hover:bg-djassa-cloud'}`}>
            <Icon size={15} /> <span className="hidden sm:inline">{label}</span><span className="sm:hidden">{label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* ===== VUE GLOBALE ===== */}
      {tab === 'overview' && (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div data-reveal><StatCard icon={Users} label="Utilisateurs" value={<AnimatedNumber value={usersTotal} />} tone="red" /></div>
            <div data-reveal><StatCard icon={Activity} label="Comptes actifs" value={<AnimatedNumber value={activeUsers} />} tone="ink" /></div>
            <div data-reveal><StatCard icon={Store} label="Boutiques Pro" value={<AnimatedNumber value={boutiquesTotal} />} tone="ink" /></div>
            <div data-reveal><StatCard icon={Wallet} label="CA séquestre" value={<AnimatedNumber value={totalCA} prefix="FCFA " />} tone="amber" /></div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Évolution du CA & inscriptions" subtitle="Vue FCFA — 30 derniers jours">
              <div className="mb-2 flex gap-1.5">
                {['7j', '30j', '12m'].map((p) => (
                  <button key={p} type="button" onClick={() => setPeriod(p)}
                    className={`rounded-[5px] px-2 py-1 font-spacegrotesk text-[0.8125rem] font-bold ${period === p ? 'bg-djassa-red text-white' : 'bg-djassa-cloud text-djassa-black/60'}`}>{p}</button>
                ))}
              </div>
              <Suspense fallback={<div className="skeleton h-[230px]" />}><EvolutionChart period={period} /></Suspense>
            </Panel>
            <Panel title="Ventes B2C vs Échanges C2C" subtitle="Boutiques Pro vs Troc">
              <Suspense fallback={<div className="skeleton h-[230px]" />}><SalesChart /></Suspense>
            </Panel>
            <Panel title="Répartition Escrow" subtitle="Statuts des fonds séquestrés">
              <div className="flex items-center gap-3">
                <div className="flex-1"><Suspense fallback={<div className="skeleton h-[230px]" />}><EscrowDonut stats={financesTotals} /></Suspense></div>
                <img src="/images/admin-coins.webp" alt="" aria-hidden="true" className="hidden h-28 w-auto object-contain md:block" />
              </div>
            </Panel>
            <Panel title="Pyramide de conversion" subtitle="Visiteurs → transactions">
              <Suspense fallback={<div className="skeleton h-[230px]" />}><FunnelChart /></Suspense>
            </Panel>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Panel title="Activité récente" subtitle="Journal d'audit">
              <ul className="space-y-1.5">
                {audit.slice(0, 5).map((a) => (
                  <li key={a.id} className="flex items-center justify-between rounded-[5px] bg-djassa-cloud px-2.5 py-2 text-[0.8125rem]">
                    <span className="font-semibold">{a.action}</span>
                    <span className="text-djassa-black/50">{a.created_at ? new Date(a.created_at).toLocaleDateString('fr-FR') : '—'}</span>
                  </li>
                ))}
                {audit.length === 0 && (
                  <li className="flex flex-col items-center gap-2 rounded-[5px] bg-djassa-cloud px-3 py-6 text-center">
                    <Activity size={20} className="text-djassa-red/60" aria-hidden="true" />
                    <span className="text-[0.9375rem] font-semibold text-djassa-black/60">Aucune activité récente</span>
                    <span className="text-[0.8125rem] text-djassa-black/45">Les actions d’administration s’afficheront ici.</span>
                  </li>
                )}
              </ul>
            </Panel>
            <Panel title="Santé plateforme" subtitle="Services microservices">
              <div className="space-y-1.5 text-[0.9375rem]">
                {['Gateway', 'Auth', 'Catalogue', 'Troc', 'Escrow', 'Chat'].map((s) => (
                  <div key={s} className="flex items-center justify-between"><span>{s}</span><CheckCircle2 size={15} className="text-emerald-600" /></div>
                ))}
              </div>
            </Panel>
            <Panel title="Accès rapide" subtitle="Illustrations">
              <img src="/images/admin-analytics.webp" alt="" aria-hidden="true" className="mx-auto h-32 w-auto object-contain" />
            </Panel>
          </div>
        </div>
      )}

      {/* ===== UTILISATEURS & AUDIT ===== */}
      {tab === 'users' && (
        <div className="space-y-5">
          <Panel title="Créer un utilisateur" subtitle="Compte admin / onboarding plateforme">
            <form onSubmit={createUser} className="grid gap-3 sm:grid-cols-2">
              <label className="block text-[0.8125rem] font-bold text-djassa-black/60">Nom
                <input required value={newUser.nom} onChange={(e) => setNewUser({ ...newUser, nom: e.target.value })} className="mt-1 w-full rounded-[5px] border-none bg-djassa-cloud min-h-[2.875rem] px-4 py-2.5 text-[0.95rem]" placeholder="Nom complet" />
              </label>
              <label className="block text-[0.8125rem] font-bold text-djassa-black/60">Email
                <input required type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="mt-1 w-full rounded-[5px] border-none bg-djassa-cloud min-h-[2.875rem] px-4 py-2.5 text-[0.95rem]" placeholder="user@djassa.ci" />
              </label>
              <label className="block text-[0.8125rem] font-bold text-djassa-black/60">Téléphone
                <input value={newUser.telephone} onChange={(e) => setNewUser({ ...newUser, telephone: e.target.value })} className="mt-1 w-full rounded-[5px] border-none bg-djassa-cloud min-h-[2.875rem] px-4 py-2.5 text-[0.95rem]" placeholder="+225 07 00 00 00 00" />
              </label>
              <label className="block text-[0.8125rem] font-bold text-djassa-black/60">Rôle
                <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="mt-1 w-full rounded-[5px] border-none bg-djassa-cloud min-h-[2.875rem] px-4 py-2.5 text-[0.95rem]">
                  <option value="particulier">particulier</option>
                  <option value="vendeur_pro">vendeur_pro</option>
                  <option value="admin">admin</option>
                </select>
              </label>
              <label className="block text-[0.8125rem] font-bold text-djassa-black/60">Mot de passe
                <input required type="text" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className="mt-1 w-full rounded-[5px] border-none bg-djassa-cloud min-h-[2.875rem] px-4 py-2.5 text-[0.95rem]" placeholder="Min. 8 caractères" />
              </label>
              <div className="sm:col-span-2">
                <button type="submit" className="inline-flex items-center gap-2 rounded-[5px] bg-djassa-red min-h-[2.875rem] px-4 py-2.5 font-spacegrotesk text-[0.9375rem] font-extrabold text-white active:scale-95">
                  <Plus size={15} /> Créer l'utilisateur
                </button>
              </div>
            </form>
          </Panel>
          {loadingUsers ? <div className="skeleton h-64" /> : (
            <AdminTable
              title="Utilisateurs" totalLabel={`${users.length} comptes`}
              columns={[{ key: 'nom', label: 'Nom' }, { key: 'email', label: 'Email' }, { key: 'role', label: 'Rôle' }, { key: 'statut', label: 'Statut' }]}
              rows={users}
              renderRow={(u) => (
                <>
                  <td className="px-4 py-3.5 font-semibold">{u.nom}</td>
                  <td className="px-4 py-3.5 text-djassa-black/60">{u.email}</td>
                  <td className="px-4 py-3.5"><span className="rounded-[5px] bg-djassa-cloud px-2 py-0.5 text-[0.8125rem] font-bold">{u.role}</span></td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1 ${u.statut === 'actif' ? 'text-emerald-700' : 'text-djassa-red'}`}>
                      {u.statut === 'actif' ? <CheckCircle2 size={13} /> : <XCircle size={13} />}{u.statut}
                    </span>
                    <button type="button" onClick={() => deleteUser(u.id)} className="ml-3 inline-flex items-center gap-1 text-[0.8125rem] text-djassa-red hover:underline" title="Supprimer l'utilisateur">
                      <Trash2 size={12} /> Supprimer
                    </button>
                    <button type="button" onClick={() => resetPwd(u.id)} className="ml-3 inline-flex items-center gap-1 text-[0.8125rem] text-djassa-red hover:underline" title="Réinitialiser le mot de passe">
                      <RotateCcw size={12} /> Reset
                    </button>
                  </td>
                </>
              )}
            />
          )}
          <AdminTable
            title="Journal d'audit" totalLabel={`${audit.length} événements`}
            columns={[{ key: 'action', label: 'Action' }, { key: 'user_id', label: 'User' }, { key: 'ip', label: 'IP' }, { key: 'created_at', label: 'Date' }]}
            rows={audit}
          />
        </div>
      )}

      {/* ===== BOUTIQUES & CA ===== */}
      {tab === 'boutiques' && (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard icon={Wallet} label="CA total" value={<AnimatedNumber value={totalCA} prefix="FCFA " />} tone="red" />
            <StatCard icon={Lock} label="Fonds bloqués" value={<AnimatedNumber value={financesTotals?.fonds_held ?? 0} prefix="FCFA " />} tone="ink" />
            <StatCard icon={Unlock} label="Fonds libérés" value={<AnimatedNumber value={financesTotals?.fonds_released ?? 0} prefix="FCFA " />} tone="ink" />
          </div>
          <Panel title="Créer une boutique" subtitle="CRUD admin catalogue">
            <form onSubmit={createBoutique} className="grid gap-3 sm:grid-cols-2">
              <label className="block text-[0.8125rem] font-bold text-djassa-black/60">ID utilisateur vendeur (UUID)
                <input required value={newBoutique.utilisateur_id} onChange={(e) => setNewBoutique({ ...newBoutique, utilisateur_id: e.target.value })} className="mt-1 w-full rounded-[5px] border-none bg-djassa-cloud min-h-[2.875rem] px-4 py-2.5 text-[0.95rem]" placeholder="uuid vendeur_pro" />
              </label>
              <label className="block text-[0.8125rem] font-bold text-djassa-black/60">Nom boutique
                <input required value={newBoutique.nom_boutique} onChange={(e) => setNewBoutique({ ...newBoutique, nom_boutique: e.target.value })} className="mt-1 w-full rounded-[5px] border-none bg-djassa-cloud min-h-[2.875rem] px-4 py-2.5 text-[0.95rem]" />
              </label>
              <label className="block text-[0.8125rem] font-bold text-djassa-black/60">Téléphone
                <input required value={newBoutique.telephone} onChange={(e) => setNewBoutique({ ...newBoutique, telephone: e.target.value })} className="mt-1 w-full rounded-[5px] border-none bg-djassa-cloud min-h-[2.875rem] px-4 py-2.5 text-[0.95rem]" />
              </label>
              <label className="block text-[0.8125rem] font-bold text-djassa-black/60">Ville
                <input value={newBoutique.ville} onChange={(e) => setNewBoutique({ ...newBoutique, ville: e.target.value })} className="mt-1 w-full rounded-[5px] border-none bg-djassa-cloud min-h-[2.875rem] px-4 py-2.5 text-[0.95rem]" />
              </label>
              <div className="sm:col-span-2"><button type="submit" className="inline-flex items-center gap-2 rounded-[5px] bg-djassa-red min-h-[2.875rem] px-4 py-2.5 font-spacegrotesk text-[0.9375rem] font-extrabold text-white"><Plus size={15} /> Créer la boutique</button></div>
            </form>
          </Panel>
          <AdminTable
            title="Chiffre d'affaires par boutique" totalLabel={`CA ${formatFCFA(totalCA)}`}
            columns={[{ key: 'nom_boutique', label: 'Boutique' }, { key: 'chiffre_affaires', label: 'CA (FCFA)' }, { key: 'fonds_held', label: 'Bloqué' }, { key: 'fonds_released', label: 'Libéré' }, { key: 'volume_ventes', label: 'Ventes' }]}
            rows={financesRows}
            renderRow={(r) => (
              <>
                <td className="px-4 py-3.5 font-semibold">{r.nom_boutique}</td>
                <td className="px-4 py-3.5 font-bold text-djassa-red">{formatFCFA(r.chiffre_affaires)}</td>
                <td className="px-4 py-3.5">{formatFCFA(r.fonds_held)}</td>
                <td className="px-4 py-3.5">{formatFCFA(r.fonds_released)}</td>
                <td className="px-4 py-3.5">{r.volume_ventes}</td>
              </>
            )}
          />
          <AdminTable
            title="Boutiques" totalLabel={`${boutiquesTotal} boutique(s)`}
            columns={[{ key: 'nom_boutique', label: 'Nom' }, { key: 'ville', label: 'Ville' }, { key: 'verifie', label: 'Vérifiée' }, { key: 'actions', label: 'Actions' }]}
            rows={boutiques}
            renderRow={(b) => (
              <>
                <td className="px-4 py-3.5 font-semibold">{b.nom_boutique}</td>
                <td className="px-4 py-3.5">{b.ville ?? '—'}</td>
                <td className="px-4 py-3.5">{b.verifie ? <CheckCircle2 size={15} className="text-emerald-600" /> : <XCircle size={15} className="text-djassa-red" />}</td>
                <td className="px-4 py-3.5"><button type="button" onClick={() => deleteBoutique(b.id)} className="inline-flex items-center gap-1 text-[0.8125rem] text-djassa-red hover:underline"><Trash2 size={12} /> Supprimer</button></td>
              </>
            )}
          />
        </div>
      )}

      {/* ===== OFFRES & PLANS ===== */}
      {tab === 'offres' && (
        <div className="space-y-5">
          <Panel title={editingOffreId ? 'Modifier l’offre' : 'Créer une offre'} subtitle="Catalogue d’abonnement administrable (affiché à l’inscription/onboarding)">
            <form onSubmit={saveOffre} className="grid gap-3 sm:grid-cols-2">
              <label className="block text-[0.8125rem] font-bold text-djassa-black/60">Code
                <input required disabled={Boolean(editingOffreId)} value={newOffre.code} onChange={(e) => setNewOffre({ ...newOffre, code: e.target.value.toUpperCase() })} placeholder="PRO_MENSUEL" className="mt-1 w-full rounded-[5px] border-none bg-djassa-cloud min-h-[2.875rem] px-4 py-2.5 font-DM-Sans text-[0.95rem] disabled:opacity-60" />
              </label>
              <label className="block text-[0.8125rem] font-bold text-djassa-black/60">Nom
                <input required value={newOffre.nom} onChange={(e) => setNewOffre({ ...newOffre, nom: e.target.value })} placeholder="Pack Boutique Pro" className="mt-1 w-full rounded-[5px] border-none bg-djassa-cloud min-h-[2.875rem] px-4 py-2.5 font-DM-Sans text-[0.95rem]" />
              </label>
              <label className="block text-[0.8125rem] font-bold text-djassa-black/60">Cible / Rôle
                <select value={newOffre.role_cible} onChange={(e) => setNewOffre({ ...newOffre, role_cible: e.target.value })} className="mt-1 w-full rounded-[5px] border-none bg-djassa-cloud min-h-[2.875rem] px-4 py-2.5 font-DM-Sans text-[0.95rem]">
                  <option value="vendeur_pro">Vendeur Pro — Boutique Pro Neuf</option>
                  <option value="particulier">Particulier — Occasion/Troc</option>
                  <option value="tous">Tous</option>
                </select>
              </label>
              <label className="block text-[0.8125rem] font-bold text-djassa-black/60">Montant (FCFA)
                <input required type="number" min={0} value={newOffre.montant_fcfa} onChange={(e) => setNewOffre({ ...newOffre, montant_fcfa: e.target.value })} placeholder="15000" className="mt-1 w-full rounded-[5px] border-none bg-djassa-cloud min-h-[2.875rem] px-4 py-2.5 font-DM-Sans text-[0.95rem]" />
              </label>
              <label className="block text-[0.8125rem] font-bold text-djassa-black/60">Durée (jours)
                <input required type="number" min={1} value={newOffre.duree_jours} onChange={(e) => setNewOffre({ ...newOffre, duree_jours: e.target.value })} placeholder="30" className="mt-1 w-full rounded-[5px] border-none bg-djassa-cloud min-h-[2.875rem] px-4 py-2.5 font-DM-Sans text-[0.95rem]" />
              </label>
              <label className="block text-[0.8125rem] font-bold text-djassa-black/60">Limite d’articles (vide = illimité)
                <input type="number" min={1} value={newOffre.max_articles} onChange={(e) => setNewOffre({ ...newOffre, max_articles: e.target.value })} placeholder="Illimité" className="mt-1 w-full rounded-[5px] border-none bg-djassa-cloud min-h-[2.875rem] px-4 py-2.5 font-DM-Sans text-[0.95rem]" />
              </label>
              <label className="block text-[0.8125rem] font-bold text-djassa-black/60 sm:col-span-2">Description courte
                <textarea rows={2} value={newOffre.description} onChange={(e) => setNewOffre({ ...newOffre, description: e.target.value })} placeholder="Idéal pour lancer votre boutique et vendre en toute confiance." className="mt-1 w-full rounded-[5px] border-none bg-djassa-cloud min-h-[2.875rem] px-4 py-2.5 font-DM-Sans text-[0.95rem]" />
              </label>
              <label className="block text-[0.8125rem] font-bold text-djassa-black/60 sm:col-span-2">Avantages inclus (un par ligne)
                <textarea rows={4} value={newOffre.avantagesText} onChange={(e) => setNewOffre({ ...newOffre, avantagesText: e.target.value })} placeholder={"Boutique vérifiée\nArticles neufs illimités\nStatistiques de vente"} className="mt-1 w-full rounded-[5px] border-none bg-djassa-cloud min-h-[2.875rem] px-4 py-2.5 font-DM-Sans text-[0.95rem]" />
              </label>
              <div className="flex flex-wrap items-center gap-6 sm:col-span-2">
                <ToggleSwitch checked={newOffre.actif} onChange={(v) => setNewOffre({ ...newOffre, actif: v })} label="Offre active" />
                <ToggleSwitch checked={newOffre.is_featured} onChange={(v) => setNewOffre({ ...newOffre, is_featured: v })} label="Mise en avant (Populaire)" />
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <button type="submit" className="inline-flex items-center gap-2 rounded-[5px] bg-djassa-red min-h-[2.875rem] px-4 py-2.5 font-spacegrotesk text-[0.9375rem] font-extrabold text-white active:scale-95"><Plus size={15} /> {editingOffreId ? 'Mettre à jour' : 'Créer l’offre'}</button>
                {editingOffreId && <button type="button" onClick={() => { setEditingOffreId(null); setNewOffre(emptyOffre); }} className="rounded-[5px] bg-djassa-cloud min-h-[2.875rem] px-4 py-2.5 font-spacegrotesk text-[0.9375rem] font-extrabold text-djassa-black">Annuler</button>}
              </div>
            </form>
          </Panel>
          <AdminTable
            title="Offres & plans d'abonnement" totalLabel={`${offres.length} offres`}
            columns={[{ key: 'code', label: 'Offre' }, { key: 'cible', label: 'Cible' }, { key: 'montant_fcfa', label: 'Tarif' }, { key: 'duree_jours', label: 'Durée' }, { key: 'avantages', label: 'Avantages' }, { key: 'actif', label: 'Actif' }, { key: 'actions', label: 'Actions' }]}
            rows={offres}
            renderRow={(o) => (
              <>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <p className="font-spacegrotesk text-[0.9375rem] font-extrabold text-djassa-black">{o.nom}</p>
                    {o.is_featured && <span className="rounded-[5px] bg-djassa-red/10 px-1.5 py-0.5 text-[0.8125rem] font-bold text-djassa-red">Populaire</span>}
                  </div>
                  <p className="font-mono text-[0.8125rem] text-djassa-black/45">{o.code}</p>
                  {o.description && <p className="mt-0.5 max-w-[220px] text-[0.8125rem] text-djassa-black/55">{o.description}</p>}
                </td>
                <td className="px-4 py-3.5"><span className="rounded-[5px] bg-djassa-cloud px-2 py-0.5 text-[0.8125rem] font-bold text-djassa-black">{o.role_cible === 'vendeur_pro' ? 'Vendeur Pro' : o.role_cible === 'particulier' ? 'Particulier' : 'Tous'}</span></td>
                <td className="px-4 py-3.5 font-bold text-djassa-red">{formatFCFA(o.montant_fcfa)}</td>
                <td className="px-4 py-3.5 text-[0.9375rem]">{o.duree_jours} j{o.max_articles ? ` · ${o.max_articles} art.` : ' · illimité'}</td>
                <td className="px-4 py-3.5">
                  <div className="flex max-w-[260px] flex-wrap gap-1">
                    {(Array.isArray(o.avantages) ? o.avantages : []).slice(0, 3).map((a) => <span key={a} className="rounded-[5px] bg-djassa-cloud px-1.5 py-0.5 text-[0.8125rem] text-djassa-black/70">{a}</span>)}
                    {Array.isArray(o.avantages) && o.avantages.length > 3 && <span className="text-[0.8125rem] text-djassa-black/45">+{o.avantages.length - 3}</span>}
                  </div>
                </td>
                <td className="px-4 py-3.5"><ToggleSwitch checked={Boolean(o.actif)} onChange={() => toggleOffreActif(o)} label={o.actif ? 'Actif' : 'Inactif'} compact /></td>
                <td className="px-4 py-3.5">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => editOffre(o)} className="text-[0.8125rem] font-bold text-djassa-black hover:underline">Modifier</button>
                    <button type="button" onClick={() => deleteOffre(o.id)} className="text-[0.8125rem] font-bold text-djassa-red hover:underline">Supprimer</button>
                  </div>
                </td>
              </>
            )}
          />
        </div>
      )}

      {/* ===== NOTIFICATIONS & EMAIL ===== */}
      {tab === 'notifications' && (
        <div className="space-y-5">
          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <Panel title="Campagne d'envoi" subtitle="Notifications in-app + emails via file Redis/Brevo">
              <div className="mb-3 flex flex-wrap gap-2">
                {campaignTemplates.map((tpl) => (
                  <button key={tpl.key} type="button"
                    onClick={() => { setCampaign((c) => ({ ...c, titre: tpl.titre, corps: tpl.corps, priorite: tpl.priorite })); setCampaignEstimate(null); }}
                    className="rounded-[5px] bg-djassa-cloud px-3 py-1.5 font-spacegrotesk text-[0.8125rem] font-extrabold text-djassa-black hover:bg-djassa-red/10 hover:text-djassa-red">
                    {tpl.titre}
                  </button>
                ))}
              </div>
              <form onSubmit={sendCampaign} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-[0.8125rem] font-bold text-djassa-black/60">Audience
                    <select value={campaign.audience} onChange={(e) => { setCampaign({ ...campaign, audience: e.target.value, user_id: '' }); setCampaignEstimate(null); }} className="mt-1 w-full rounded-[5px] border-none bg-djassa-cloud min-h-[2.875rem] px-4 py-2.5 text-[0.95rem]">
                      <option value="all">Tous les utilisateurs</option>
                      <option value="vendeur_pro">Vendeurs Pro</option>
                      <option value="particulier">Particuliers</option>
                      <option value="user">Utilisateur spécifique</option>
                    </select>
                  </label>
                  <label className="block text-[0.8125rem] font-bold text-djassa-black/60">Priorité
                    <select value={campaign.priorite} onChange={(e) => setCampaign({ ...campaign, priorite: e.target.value })} className="mt-1 w-full rounded-[5px] border-none bg-djassa-cloud min-h-[2.875rem] px-4 py-2.5 text-[0.95rem]">
                      <option value="info">Info — Information</option>
                      <option value="warning">Warning — Important</option>
                      <option value="urgent">Urgent — Urgence</option>
                    </select>
                  </label>
                </div>
                {campaign.audience === 'user' && (
                  <label className="block text-[0.8125rem] font-bold text-djassa-black/60">Email ou ID utilisateur
                    <input type="text" placeholder="uuid-utilisateur ou email@djassa.ci" value={campaign.user_id ?? ''} onChange={(e) => { setCampaign({ ...campaign, user_id: e.target.value }); setCampaignEstimate(null); }} className="mt-1 w-full rounded-[5px] border-none bg-djassa-cloud min-h-[2.875rem] px-4 py-2.5 text-[0.95rem]" />
                  </label>
                )}
                <label className="block text-[0.8125rem] font-bold text-djassa-black/60">Titre
                  <input type="text" placeholder="Titre de la notification" required value={campaign.titre} onChange={(e) => setCampaign({ ...campaign, titre: e.target.value })} className="mt-1 w-full rounded-[5px] border-none bg-djassa-cloud min-h-[2.875rem] px-4 py-2.5 text-[0.95rem]" />
                </label>
                <label className="block text-[0.8125rem] font-bold text-djassa-black/60">Message
                  <textarea placeholder="Votre message aux utilisateurs..." required rows={4} value={campaign.corps} onChange={(e) => setCampaign({ ...campaign, corps: e.target.value })} className="mt-1 w-full rounded-[5px] border-none bg-djassa-cloud min-h-[2.875rem] px-4 py-2.5 text-[0.95rem]" />
                </label>
                <div className="flex flex-wrap items-center gap-4 rounded-[5px] bg-djassa-cloud px-4 py-3.5">
                  <ToggleSwitch checked={campaign.email} onChange={(v) => setCampaign({ ...campaign, email: v })} label="Envoyer aussi par email Brevo" />
                  <button type="button" onClick={estimateCampaign} className="font-spacegrotesk text-[0.8125rem] font-extrabold text-djassa-red underline">Estimer les destinataires</button>
                </div>
                <div className="rounded-[5px] border-l-4 border-djassa-red bg-djassa-red/5 min-h-[2.875rem] px-4 py-2.5 text-[0.9375rem] text-djassa-black/75">
                  {campaignEstimate != null ? (
                    <span><strong>{campaignEstimate}</strong> destinataire(s) ciblé(s). {campaign.audience === 'all' && <span className="font-bold text-djassa-red">Confirmation obligatoire avant envoi massif.</span>}</span>
                  ) : (
                    <span>Estimez les destinataires avant l’envoi pour sécuriser la campagne.</span>
                  )}
                </div>
                <button type="submit" className="inline-flex items-center gap-2 rounded-[5px] bg-djassa-red min-h-[2.875rem] px-4 py-2.5 font-spacegrotesk text-[0.9375rem] font-extrabold text-white active:scale-95"><Send size={15} /> Envoyer la campagne</button>
              </form>
            </Panel>
            <Panel title="Centre de notifications" subtitle="Aperçu sécurité & file Redis">
              <div className="space-y-3">
                <div className="rounded-[5px] bg-djassa-cloud p-3">
                  <p className="font-spacegrotesk text-[0.8125rem] font-extrabold uppercase tracking-[0.12em] text-djassa-red">Aperçu</p>
                  <p className="mt-1 font-spacegrotesk text-[1.25rem] font-extrabold text-djassa-black">{campaign.titre || 'Titre de la campagne'}</p>
                  <p className="mt-1 text-[0.9375rem] text-djassa-black/65">{campaign.corps || 'Le message apparaîtra ici avant envoi.'}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className={`rounded-[5px] px-2 py-0.5 text-[0.8125rem] font-bold ${campaign.priorite === 'urgent' ? 'bg-red-100 text-red-700' : campaign.priorite === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>{campaign.priorite}</span>
                    <span className="rounded-[5px] bg-white px-2 py-0.5 text-[0.8125rem] font-bold text-djassa-black/70">{campaign.email ? 'In-App + Email Brevo' : 'In-App'}</span>
                  </div>
                </div>
                <div className="rounded-[5px] bg-emerald-50 p-3 text-[0.9375rem] text-emerald-900">
                  <p className="font-bold">File Redis asynchrone</p>
                  <p className="mt-1 text-emerald-800/80">Les campagnes sont mises en file et traitées en arrière-plan. Le succès d’envoi affiche un toast + confettis.</p>
                </div>
              </div>
            </Panel>
          </div>

          <AdminTable
            title="Historique des campagnes" totalLabel={`${campaigns.length} campagnes`}
            action={<button type="button" onClick={exportCampaignsPdf} className="rounded-[5px] bg-djassa-black min-h-[2.875rem] px-4 py-2.5 font-spacegrotesk text-[0.8125rem] font-extrabold text-white">Exporter en PDF</button>}
            columns={[{ key: 'date', label: 'Date' }, { key: 'titre', label: 'Campagne' }, { key: 'priorite', label: 'Priorité' }, { key: 'audience', label: 'Audience' }, { key: 'canal', label: 'Canal' }, { key: 'dest', label: 'Destinataires' }, { key: 'statut', label: 'Statut' }]}
            rows={campaigns}
            renderRow={(c) => (
              <>
                <td className="px-4 py-3.5 text-[0.8125rem] text-djassa-black/60">{c.created_at ? new Date(c.created_at).toLocaleString('fr-FR') : '—'}</td>
                <td className="px-4 py-3.5"><p className="font-spacegrotesk text-[0.9375rem] font-extrabold text-djassa-black">{c.titre}</p><p className="max-w-[280px] truncate text-[0.8125rem] text-djassa-black/50">{c.message}</p></td>
                <td className="px-4 py-3.5"><span className={`rounded-[5px] px-2 py-0.5 text-[0.8125rem] font-bold ${c.priorite === 'urgent' ? 'bg-red-100 text-red-700' : c.priorite === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>{c.priorite || 'info'}</span></td>
                <td className="px-4 py-3.5 text-[0.8125rem] font-bold text-djassa-black/70">{c.audience}</td>
                <td className="px-4 py-3.5 text-[0.8125rem]">{c.send_email ? 'In-App + Email Brevo' : 'In-App'}</td>
                <td className="px-4 py-3.5 font-bold text-djassa-black">{c.destinataires_count ?? 0}</td>
                <td className="px-4 py-3.5"><span className={`rounded-[5px] px-2 py-0.5 text-[0.8125rem] font-bold ${c.statut === 'failed' ? 'bg-red-100 text-red-700' : c.statut === 'queued' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{c.statut}</span></td>
              </>
            )}
          />
        </div>
      )}

      {/* ===== MAINTENANCE & PROFIL ===== */}
      {tab === 'system' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Mode Maintenance" subtitle="Coupez l’accès public en toute sécurité (503/maintenance)">
            <div className={`flex items-center justify-between rounded-[5px] px-4 py-3.5 ${maintenanceOn ? 'bg-red-50' : 'bg-emerald-50'}`}>
              <div className="flex items-center gap-2">
                {maintenanceOn ? <Lock size={18} className="text-djassa-red" /> : <Unlock size={18} className="text-emerald-600" />}
                <div>
                  <span className="font-spacegrotesk text-[0.95rem] font-extrabold">{maintenanceOn ? 'Maintenance activée' : 'Plateforme opérationnelle'}</span>
                  <p className="text-[0.8125rem] text-djassa-black/55">{maintenanceOn ? 'Les non-admins sont redirigés vers /maintenance.' : 'Aucune coupure publique en cours.'}</p>
                </div>
              </div>
              <button type="button" onClick={() => toggleMaintenance(!maintenanceOn)}
                className={`rounded-[5px] min-h-[2.875rem] px-4 py-2.5 font-spacegrotesk text-[0.8125rem] font-extrabold text-white active:scale-95 ${maintenanceOn ? 'bg-djassa-black' : 'bg-djassa-red'}`}>
                {maintenanceOn ? 'Désactiver' : 'Activer'}
              </button>
            </div>

            <div className="mt-3 grid gap-3 rounded-[5px] bg-djassa-cloud p-3 sm:grid-cols-2">
              <div>
                <p className="font-spacegrotesk text-[0.8125rem] font-extrabold uppercase tracking-[0.12em] text-djassa-black/45">État Redis</p>
                <p className="mt-1 text-[0.9375rem] font-bold text-djassa-black">{maintenanceOn ? 'Verrou maintenance actif' : 'Aucun verrou actif'}</p>
              </div>
              <div>
                <p className="font-spacegrotesk text-[0.8125rem] font-extrabold uppercase tracking-[0.12em] text-djassa-black/45">Dernière bascule</p>
                <p className="mt-1 text-[0.9375rem] font-bold text-djassa-black">{maintenance.updated_at ? new Date(maintenance.updated_at).toLocaleString('fr-FR') : '—'}</p>
                <p className="text-[0.8125rem] text-djassa-black/50">{maintenance.updated_by ? `Par ${maintenance.updated_by}` : 'Auteur non renseigné'}</p>
              </div>
              <div>
                <p className="font-spacegrotesk text-[0.8125rem] font-extrabold uppercase tracking-[0.12em] text-djassa-black/45">Début</p>
                <p className="mt-1 text-[0.9375rem] text-djassa-black">{maintenance.started_at ? new Date(maintenance.started_at).toLocaleString('fr-FR') : '—'}</p>
              </div>
              <div>
                <p className="font-spacegrotesk text-[0.8125rem] font-extrabold uppercase tracking-[0.12em] text-djassa-black/45">Reprise estimée</p>
                <p className="mt-1 text-[0.9375rem] font-bold text-djassa-red">{maintenance.ends_at ? new Date(maintenance.ends_at).toLocaleString('fr-FR') : '—'}</p>
              </div>
            </div>

            <label className="mt-3 block font-DM-Sans text-[0.8125rem] font-bold text-djassa-black/60">Message affiché aux utilisateurs
              <textarea rows={3} placeholder="Nous effectuons une maintenance. Merci de revenir bientôt." value={maintenanceMsg} onChange={(e) => setMaintenanceMsg(e.target.value)} className="mt-1 w-full rounded-[5px] border-none bg-djassa-cloud min-h-[2.875rem] px-4 py-2.5 text-[0.95rem]" />
            </label>
            <label className="mt-3 block font-DM-Sans text-[0.8125rem] font-bold text-djassa-black/60">Durée estimée (minutes)
              <input type="number" min={1} max={10080} value={maintenanceDuration} onChange={(e) => setMaintenanceDuration(e.target.value)}
                className="mt-1 w-full rounded-[5px] border-none bg-djassa-cloud min-h-[2.875rem] px-4 py-2.5 text-[0.95rem]" />
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => toggleMaintenance(true)} className="rounded-[5px] bg-djassa-red min-h-[2.875rem] px-4 py-2.5 font-spacegrotesk text-[0.8125rem] font-extrabold text-white active:scale-95">{maintenanceOn ? 'Sauvegarder le message/durée' : 'Activer avec confirmation'}</button>
              <a href="/maintenance" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-[5px] bg-djassa-black min-h-[2.875rem] px-4 py-2.5 font-spacegrotesk text-[0.8125rem] font-extrabold text-white"><Eye size={14} /> Prévisualiser la page /maintenance</a>
            </div>
            <p className="mt-2 text-[0.8125rem] text-djassa-black/50">L’activation coupe l’accès public (503). La sauvegarde à chaud met à jour message/durée sans désactiver.</p>
          </Panel>
          <Panel title="Mon profil admin" subtitle="Nom, email, téléphone et mot de passe optionnel">
            <form onSubmit={saveProfile} className="space-y-3">
              <label className="block text-[0.8125rem] font-bold text-djassa-black/60">Nom
                <input type="text" value={profile.nom ?? ''} onChange={(e) => setProfile({ ...profile, nom: e.target.value })} className="mt-1 w-full rounded-[5px] border-none bg-djassa-cloud min-h-[2.875rem] px-4 py-2.5 text-[0.95rem]" />
              </label>
              <label className="block text-[0.8125rem] font-bold text-djassa-black/60">Email
                <input type="email" value={profile.email ?? ''} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="mt-1 w-full rounded-[5px] border-none bg-djassa-cloud min-h-[2.875rem] px-4 py-2.5 text-[0.95rem]" />
              </label>
              <label className="block text-[0.8125rem] font-bold text-djassa-black/60">Téléphone
                <input type="text" value={profile.telephone ?? ''} onChange={(e) => setProfile({ ...profile, telephone: e.target.value })} className="mt-1 w-full rounded-[5px] border-none bg-djassa-cloud min-h-[2.875rem] px-4 py-2.5 text-[0.95rem]" />
              </label>
              <div className="rounded-[5px] bg-djassa-cloud p-3">
                <p className="font-spacegrotesk text-[0.8125rem] font-extrabold text-djassa-black/70">Changer le mot de passe (optionnel)</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <input type="password" autoComplete="new-password" placeholder="Nouveau mot de passe" value={profile.password ?? ''} onChange={(e) => setProfile({ ...profile, password: e.target.value })} className="w-full rounded-[5px] border-none bg-white min-h-[2.875rem] px-4 py-2.5 text-[0.95rem]" />
                  <input type="password" autoComplete="new-password" placeholder="Confirmer" value={profile.password_confirmation ?? ''} onChange={(e) => setProfile({ ...profile, password_confirmation: e.target.value })} className="w-full rounded-[5px] border-none bg-white min-h-[2.875rem] px-4 py-2.5 text-[0.95rem]" />
                </div>
              </div>
              <button type="submit" className="rounded-[5px] bg-djassa-red min-h-[2.875rem] px-4 py-2.5 font-spacegrotesk text-[0.9375rem] font-extrabold text-white active:scale-95">Enregistrer</button>
            </form>
          </Panel>
        </div>
      )}

      <ConfirmModal
        open={Boolean(confirmState)}
        title={confirmState?.title}
        message={confirmState?.message}
        confirmLabel={confirmState?.confirmLabel}
        onCancel={() => setConfirmState(null)}
        onConfirm={async () => {
          const action = confirmState?.onConfirm;
          setConfirmState(null);
          if (action) await action();
        }}
      />
    </div>
  );
}
