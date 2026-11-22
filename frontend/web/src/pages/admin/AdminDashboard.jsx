import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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

function AnimatedNumber({ value, prefix = '', suffix = '' }) {
  const el = useRef(null);
  const prev = useRef(0);
  useEffect(() => {
    if (el.current == null) return;
    const obj = { v: prev.current };
    const tween = gsap.to(obj, {
      v: Number(value) || 0, duration: 0.9, ease: 'power2.out',
      onUpdate: () => { if (el.current) el.current.textContent = prefix + Math.round(obj.v).toLocaleString('fr-FR') + suffix; },
    });
    prev.current = Number(value) || 0;
    return () => tween.kill();
  }, [value, prefix, suffix]);
  return <span ref={el} className="tabular-nums">{prefix}{Number(value || 0).toLocaleString('fr-FR')}{suffix}</span>;
}

/** Super Dashboard Admin — 6 onglets, charte Djassa. */
export default function AdminDashboard() {
  const { user, authResolved } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const scope = useRef(null);
  const [tab, setTab] = useState('overview');
  const [period, setPeriod] = useState('30j');
  usePageReveal(scope);

  // Aucune requête protégée tant que l'utilisateur n'est pas authentifié et résolu.
  const canFetch = Boolean(user && authResolved);
  const { data: usersData, isLoading: loadingUsers } = useQuery({ queryKey: ['admin', 'users'], queryFn: () => adminApi.users(), enabled: canFetch, retry: false, staleTime: 30_000 });
  const { data: auditData } = useQuery({ queryKey: ['admin', 'audit'], queryFn: () => adminApi.audit(), enabled: canFetch, retry: false, staleTime: 30_000 });
  const { data: finances } = useQuery({ queryKey: ['admin', 'finances'], queryFn: () => adminApi.finances(), enabled: canFetch, retry: false, staleTime: 30_000 });
  const { data: boutiquesData } = useQuery({ queryKey: ['admin', 'boutiques'], queryFn: () => adminApi.boutiques(), enabled: canFetch, retry: false, staleTime: 30_000 });
  const { data: offresData } = useQuery({ queryKey: ['admin', 'offres'], queryFn: () => adminApi.offres(), enabled: canFetch, retry: false, staleTime: 30_000 });
  const { data: maintenanceData } = useQuery({ queryKey: ['admin', 'maintenance'], queryFn: () => adminApi.maintenance(), enabled: canFetch, retry: false, staleTime: 10_000 });

  const users = Array.isArray(usersData?.data) ? usersData.data : [];
  const audit = Array.isArray(auditData?.data) ? auditData.data : [];
  const financesRows = Array.isArray(finances?.data) ? financesData.data : [];
  const boutiques = Array.isArray(boutiquesData?.data) ? boutiquesData.data : [];
  const offres = Array.isArray(offresData?.data) ? offresData.data : [];

  const [maintenanceOn, setMaintenanceOn] = useState(Boolean(maintenanceData?.data?.enabled));
  const [maintenanceMsg, setMaintenanceMsg] = useState(maintenanceData?.data?.message ?? '');
  const [maintenanceDuration, setMaintenanceDuration] = useState(maintenanceData?.data?.duration_minutes ?? 60);
  const [campaign, setCampaign] = useState({ audience: 'all', titre: '', corps: '', email: false });
  const [newUser, setNewUser] = useState({ nom: '', email: '', telephone: '', role: 'particulier', password: '' });
  const [profile, setProfile] = useState({ nom: user?.nom ?? '', email: user?.email ?? '', telephone: user?.telephone ?? '' });

  const toggleMaintenance = async (enabled) => {
    try {
      await adminApi.setMaintenance({ enabled, message: enabled ? maintenanceMsg : '', duration_minutes: enabled ? Number(maintenanceDuration) : null });
      setMaintenanceOn(enabled);
      qc.invalidateQueries({ queryKey: ['admin', 'maintenance'] });
      toast.success(enabled ? 'Mode maintenance activé.' : 'Mode maintenance désactivé.');
    } catch { toast.error('Impossible de basculer la maintenance.'); }
  };

  const sendCampaign = async (e) => {
    e.preventDefault();
    try {
      const res = await adminApi.broadcast(campaign);
      toast.success(res.data?.message ?? 'Campagne envoyée.');
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        import('canvas-confetti').then(({ default: confetti }) => confetti({
          particleCount: 60, spread: 60, origin: { y: 0.7 }, colors: ['#780000', '#9E2A2B', '#E5E5E5'],
        }));
      }
      setCampaign({ audience: 'all', titre: '', corps: '', email: false });
    } catch (err) { toast.error(err.response?.data?.message ?? 'Échec de l’envoi.'); }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    try { await adminApi.updateProfile(profile); toast.success('Profil mis à jour.'); }
    catch (err) { toast.error(err.response?.data?.message ?? 'Échec de la mise à jour.'); }
  };

  const resetPwd = async (id) => {
    try {
      const res = await adminApi.resetPassword(id);
      toast.success('Mot de passe réinitialisé.', { description: `Temporaire : ${res.data.temporary_password}` });
    } catch { toast.error('Réinitialisation impossible.'); }
  };

  const createUser = async (e) => {
    e.preventDefault();
    try {
      const res = await adminApi.createUser({ nom: newUser.nom, email: newUser.email, telephone: newUser.telephone || undefined, role: newUser.role, password: newUser.password });
      toast.success(`Utilisateur « ${res.data?.data?.nom ?? newUser.nom} » créé.`);
      setNewUser({ nom: '', email: '', telephone: '', role: 'particulier', password: '' });
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    } catch (err) { toast.error(err.response?.data?.message ?? 'Création impossible.'); }
  };

  const deleteUser = async (id) => {
    try {
      const res = await adminApi.deleteUser(id);
      toast.success(res.data?.deleted ? 'Utilisateur supprimé.' : 'Utilisateur supprimé.');
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    } catch (err) { toast.error(err.response?.data?.message ?? 'Suppression impossible.'); }
  };

  const totalCA = Number(finances?.totaux?.chiffre_affaires ?? 0) || 0;
  const activeUsers = users.filter((u) => u?.statut === 'actif').length;

  return (
    <div ref={scope} className="space-y-5">
      <PageHead
        eyebrow="Administration"
        title={<>Super Dashboard <span className="text-djassa-red">Djassa.</span></>}
        subtitle="Supervision plateforme, utilisateurs, finances, offres et sécurité."
        action={<img src="/images/admin-text.webp" alt="" aria-hidden="true" className="hidden h-14 w-auto object-contain lg:block" />}
      />

      {/* Onglets */}
      <div className="flex flex-wrap gap-1.5 rounded-[5px] bg-white p-1.5 shadow-card" role="tablist">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
            className={`inline-flex items-center gap-1.5 rounded-[5px] px-3 py-2 font-spacegrotesk text-[10.5px] font-extrabold transition ${tab === id ? 'bg-djassa-red text-white shadow-pop' : 'text-djassa-black/60 hover:bg-djassa-cloud'}`}>
            <Icon size={15} /> <span className="hidden sm:inline">{label}</span><span className="sm:hidden">{label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* ===== VUE GLOBALE ===== */}
      {tab === 'overview' && (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div data-reveal><StatCard icon={Users} label="Utilisateurs" value={<AnimatedNumber value={users.length} />} tone="red" /></div>
            <div data-reveal><StatCard icon={Activity} label="Comptes actifs" value={<AnimatedNumber value={activeUsers} />} tone="ink" /></div>
            <div data-reveal><StatCard icon={Store} label="Boutiques Pro" value={<AnimatedNumber value={boutiques.length} />} tone="ink" /></div>
            <div data-reveal><StatCard icon={Wallet} label="CA séquestre" value={<AnimatedNumber value={totalCA} prefix="FCFA " />} tone="amber" /></div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Évolution du CA & inscriptions" subtitle="Vue FCFA — 30 derniers jours">
              <div className="mb-2 flex gap-1.5">
                {['7j', '30j', '12m'].map((p) => (
                  <button key={p} type="button" onClick={() => setPeriod(p)}
                    className={`rounded-[5px] px-2 py-1 font-spacegrotesk text-[9px] font-bold ${period === p ? 'bg-djassa-red text-white' : 'bg-djassa-cloud text-djassa-black/60'}`}>{p}</button>
                ))}
              </div>
              <Suspense fallback={<div className="skeleton h-[230px]" />}><EvolutionChart period={period} /></Suspense>
            </Panel>
            <Panel title="Ventes B2C vs Échanges C2C" subtitle="Boutiques Pro vs Troc">
              <Suspense fallback={<div className="skeleton h-[230px]" />}><SalesChart /></Suspense>
            </Panel>
            <Panel title="Répartition Escrow" subtitle="Statuts des fonds séquestrés">
              <div className="flex items-center gap-3">
                <div className="flex-1"><Suspense fallback={<div className="skeleton h-[230px]" />}><EscrowDonut stats={finances?.totaux} /></Suspense></div>
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
                  <li key={a.id} className="flex items-center justify-between rounded-[5px] bg-djassa-cloud px-2.5 py-2 text-[10px]">
                    <span className="font-semibold">{a.action}</span>
                    <span className="text-djassa-black/50">{a.created_at ? new Date(a.created_at).toLocaleDateString('fr-FR') : '—'}</span>
                  </li>
                ))}
                {audit.length === 0 && (
                  <li className="flex flex-col items-center gap-2 rounded-[5px] bg-djassa-cloud px-3 py-6 text-center">
                    <Activity size={20} className="text-djassa-red/60" aria-hidden="true" />
                    <span className="text-[11px] font-semibold text-djassa-black/60">Aucune activité récente</span>
                    <span className="text-[10px] text-djassa-black/45">Les actions d’administration s’afficheront ici.</span>
                  </li>
                )}
              </ul>
            </Panel>
            <Panel title="Santé plateforme" subtitle="Services microservices">
              <div className="space-y-1.5 text-[11px]">
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
              <label className="block text-[10px] font-bold text-djassa-black/60">Nom
                <input required value={newUser.nom} onChange={(e) => setNewUser({ ...newUser, nom: e.target.value })} className="mt-1 w-full rounded-[5px] border-none bg-djassa-cloud px-3 py-2 text-[12px]" placeholder="Nom complet" />
              </label>
              <label className="block text-[10px] font-bold text-djassa-black/60">Email
                <input required type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="mt-1 w-full rounded-[5px] border-none bg-djassa-cloud px-3 py-2 text-[12px]" placeholder="user@djassa.ci" />
              </label>
              <label className="block text-[10px] font-bold text-djassa-black/60">Téléphone
                <input value={newUser.telephone} onChange={(e) => setNewUser({ ...newUser, telephone: e.target.value })} className="mt-1 w-full rounded-[5px] border-none bg-djassa-cloud px-3 py-2 text-[12px]" placeholder="+225 07 00 00 00 00" />
              </label>
              <label className="block text-[10px] font-bold text-djassa-black/60">Rôle
                <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="mt-1 w-full rounded-[5px] border-none bg-djassa-cloud px-3 py-2 text-[12px]">
                  <option value="particulier">particulier</option>
                  <option value="vendeur_pro">vendeur_pro</option>
                  <option value="admin">admin</option>
                </select>
              </label>
              <label className="block text-[10px] font-bold text-djassa-black/60">Mot de passe
                <input required type="text" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className="mt-1 w-full rounded-[5px] border-none bg-djassa-cloud px-3 py-2 text-[12px]" placeholder="Min. 8 caractères" />
              </label>
              <div className="sm:col-span-2">
                <button type="submit" className="inline-flex items-center gap-2 rounded-[5px] bg-djassa-red px-4 py-2 font-spacegrotesk text-[11px] font-extrabold text-white active:scale-95">
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
                  <td className="px-3 py-2.5 font-semibold">{u.nom}</td>
                  <td className="px-3 py-2.5 text-djassa-black/60">{u.email}</td>
                  <td className="px-3 py-2.5"><span className="rounded-[5px] bg-djassa-cloud px-2 py-0.5 text-[9px] font-bold">{u.role}</span></td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex items-center gap-1 ${u.statut === 'actif' ? 'text-emerald-700' : 'text-djassa-red'}`}>
                      {u.statut === 'actif' ? <CheckCircle2 size={13} /> : <XCircle size={13} />}{u.statut}
                    </span>
                    <button type="button" onClick={() => deleteUser(u.id)} className="ml-3 inline-flex items-center gap-1 text-[9px] text-djassa-red hover:underline" title="Supprimer l'utilisateur">
                      <Trash2 size={12} /> Supprimer
                    </button>
                    <button type="button" onClick={() => resetPwd(u.id)} className="ml-3 inline-flex items-center gap-1 text-[9px] text-djassa-red hover:underline" title="Réinitialiser le mot de passe">
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
            <StatCard icon={Lock} label="Fonds bloqués" value={<AnimatedNumber value={finances?.totaux?.fonds_held ?? 0} prefix="FCFA " />} tone="ink" />
            <StatCard icon={Unlock} label="Fonds libérés" value={<AnimatedNumber value={finances?.totaux?.fonds_released ?? 0} prefix="FCFA " />} tone="ink" />
          </div>
          <AdminTable
            title="Chiffre d'affaires par boutique" totalLabel={`CA ${formatFCFA(totalCA)}`}
            columns={[{ key: 'nom_boutique', label: 'Boutique' }, { key: 'chiffre_affaires', label: 'CA (FCFA)' }, { key: 'fonds_held', label: 'Bloqué' }, { key: 'fonds_released', label: 'Libéré' }, { key: 'volume_ventes', label: 'Ventes' }]}
            rows={financesRows}
            renderRow={(r) => (
              <>
                <td className="px-3 py-2.5 font-semibold">{r.nom_boutique}</td>
                <td className="px-3 py-2.5 font-bold text-djassa-red">{formatFCFA(r.chiffre_affaires)}</td>
                <td className="px-3 py-2.5">{formatFCFA(r.fonds_held)}</td>
                <td className="px-3 py-2.5">{formatFCFA(r.fonds_released)}</td>
                <td className="px-3 py-2.5">{r.volume_ventes}</td>
              </>
            )}
          />
          <img src="/images/admin-ecommerce.webp" alt="" aria-hidden="true" className="mx-auto h-40 w-auto object-contain" />
        </div>
      )}

      {/* ===== OFFRES & PLANS ===== */}
      {tab === 'offres' && (
        <AdminTable
          title="Offres & plans d'abonnement" totalLabel={`${offres.length} offres`}
          columns={[{ key: 'code', label: 'Code' }, { key: 'nom', label: 'Nom' }, { key: 'montant_fcfa', label: 'Tarif (FCFA)' }, { key: 'duree_jours', label: 'Durée (j)' }, { key: 'actif', label: 'Actif' }]}
          rows={offres}
          renderRow={(o) => (
            <>
              <td className="px-3 py-2.5 font-mono text-[10px]">{o.code}</td>
              <td className="px-3 py-2.5 font-semibold">{o.nom}</td>
              <td className="px-3 py-2.5 text-djassa-red">{formatFCFA(o.montant_fcfa)}</td>
              <td className="px-3 py-2.5">{o.duree_jours}</td>
              <td className="px-3 py-2.5">{o.actif ? <CheckCircle2 size={15} className="text-emerald-600" /> : <XCircle size={15} className="text-djassa-red" />}</td>
            </>
          )}
        />
      )}

      {/* ===== NOTIFICATIONS & EMAIL ===== */}
      {tab === 'notifications' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Campagne d'envoi" subtitle="Notifications in-app + emails via file Brevo">
            <form onSubmit={sendCampaign} className="space-y-3">
              <label className="block text-[10px] font-bold text-djassa-black/60">Audience
                <select value={campaign.audience} onChange={(e) => setCampaign({ ...campaign, audience: e.target.value })} className="mt-1 w-full rounded-[5px] border-none bg-djassa-cloud px-3 py-2 text-[12px]">
                  <option value="all">Tous les utilisateurs</option><option value="vendeur_pro">Vendeurs Pro</option><option value="particulier">Particuliers</option><option value="user">Un utilisateur précis</option>
                </select>
              </label>
              {campaign.audience === 'user' && (
                <input type="text" placeholder="UUID utilisateur" value={campaign.user_id ?? ''} onChange={(e) => setCampaign({ ...campaign, user_id: e.target.value })} className="w-full rounded-[5px] border-none bg-djassa-cloud px-3 py-2 text-[12px]" />
              )}
              <input type="text" placeholder="Titre" required value={campaign.titre} onChange={(e) => setCampaign({ ...campaign, titre: e.target.value })} className="w-full rounded-[5px] border-none bg-djassa-cloud px-3 py-2 text-[12px]" />
              <textarea placeholder="Message" required rows={4} value={campaign.corps} onChange={(e) => setCampaign({ ...campaign, corps: e.target.value })} className="w-full rounded-[5px] border-none bg-djassa-cloud px-3 py-2 text-[12px]" />
              <label className="flex items-center gap-2 text-[11px]"><input type="checkbox" checked={campaign.email} onChange={(e) => setCampaign({ ...campaign, email: e.target.checked })} /> Envoyer aussi par email</label>
              <button type="submit" className="inline-flex items-center gap-2 rounded-[5px] bg-djassa-red px-4 py-2 font-spacegrotesk text-[11px] font-extrabold text-white active:scale-95"><Send size={15} /> Envoyer la campagne</button>
            </form>
          </Panel>
          <Panel title="Centre de notifications" subtitle="File d'attente Redis">
            <img src="/images/admin-analytics.webp" alt="" aria-hidden="true" className="mx-auto h-56 w-auto object-contain" />
            <p className="mt-2 text-center text-[11px] text-djassa-black/55">Les campagnes sont traitées de façon asynchrone par la file Redis Brevo.</p>
          </Panel>
        </div>
      )}

      {/* ===== MAINTENANCE & PROFIL ===== */}
      {tab === 'system' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Mode Maintenance" subtitle="Bloque les non-admins avec un message personnalisé">
            <div className="flex items-center justify-between rounded-[5px] bg-djassa-cloud px-3 py-3">
              <div className="flex items-center gap-2">
                {maintenanceOn ? <Lock size={18} className="text-djassa-red" /> : <Unlock size={18} className="text-emerald-600" />}
                <span className="font-spacegrotesk text-[12px] font-extrabold">{maintenanceOn ? 'Activé' : 'Désactivé'}</span>
              </div>
              <button type="button" onClick={() => toggleMaintenance(!maintenanceOn)}
                className={`rounded-[5px] px-4 py-2 font-spacegrotesk text-[10px] font-extrabold text-white active:scale-95 ${maintenanceOn ? 'bg-djassa-black' : 'bg-djassa-red'}`}>
                {maintenanceOn ? 'Désactiver' : 'Activer'}
              </button>
            </div>
            <textarea rows={3} placeholder="Message affiché aux utilisateurs" value={maintenanceMsg} onChange={(e) => setMaintenanceMsg(e.target.value)} className="mt-3 w-full rounded-[5px] border-none bg-djassa-cloud px-3 py-2 text-[12px]" />
            <label className="mt-3 block font-DM-Sans text-[10px] font-bold text-djassa-black/60">Durée estimée (minutes)
              <input type="number" min={1} max={10080} value={maintenanceDuration} onChange={(e) => setMaintenanceDuration(e.target.value)}
                className="mt-1 w-full rounded-[5px] border-none bg-djassa-cloud px-3 py-2 text-[12px]" />
            </label>
            {maintenanceData?.data?.ends_at && (
              <p className="mt-2 font-DM-Sans text-[10px] text-djassa-black/55">
                Fin prévue : {new Date(maintenanceData.data.ends_at).toLocaleString('fr-FR')}
              </p>
            )}
            <img src="/images/admin-gears.webp" alt="" aria-hidden="true" className="mx-auto mt-3 h-24 w-auto object-contain" />
          </Panel>
          <Panel title="Mon profil admin" subtitle="Modifier mes informations">
            <form onSubmit={saveProfile} className="space-y-3">
              {['nom', 'email', 'telephone'].map((k) => (
                <label key={k} className="block text-[10px] font-bold capitalize text-djassa-black/60">{k}
                  <input type="text" value={profile[k] ?? ''} onChange={(e) => setProfile({ ...profile, [k]: e.target.value })} className="mt-1 w-full rounded-[5px] border-none bg-djassa-cloud px-3 py-2 text-[12px]" />
                </label>
              ))}
              <button type="submit" className="rounded-[5px] bg-djassa-red px-4 py-2 font-spacegrotesk text-[11px] font-extrabold text-white active:scale-95">Enregistrer</button>
            </form>
          </Panel>
        </div>
      )}
    </div>
  );
}
