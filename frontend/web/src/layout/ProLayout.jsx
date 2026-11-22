import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Activity, BadgeCheck, Bell, BellRing, LayoutDashboard,
  LogOut, Menu, ReceiptText, Server, Settings, Settings2, ShieldCheck, ShoppingBag, Sparkles, Store, Users, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/ui';
import { api } from '../lib/api';

const NAV = [
  { to: '/dashboard-pro', end: true, label: 'Vue d’ensemble & ventes', short: 'Vue', icon: LayoutDashboard },
  { to: '/dashboard-pro/ma-boutique', end: true, label: 'Ma boutique & stocks neufs', short: 'Boutique', icon: Store },
  { to: '/dashboard-pro/ma-boutique/infos', label: 'Modifier ma boutique', short: 'Infos', icon: Settings2, desktopOnly: true },
  { to: '/dashboard-pro/trocs', label: 'Mes trocs (envois & reçus)', short: 'Trocs', icon: ArrowLeftRight, key: 'trocs' },
  { to: '/dashboard-pro/achats', label: 'Mes achats', short: 'Achats', icon: ShoppingBag, key: 'achats' },
  { to: '/dashboard-pro/factures', label: 'Factures & reçus PDF', short: 'Factures', icon: ReceiptText },
];

const ADMIN_NAV = [
  { to: '/admin?tab=overview', tab: 'overview', end: true, label: 'Vue globale', short: 'Vue', icon: Activity },
  { to: '/admin?tab=users', tab: 'users', label: 'Utilisateurs & Audit', short: 'Users', icon: Users },
  { to: '/admin?tab=boutiques', tab: 'boutiques', label: 'Boutiques & CA', short: 'Boutiques', icon: Store },
  { to: '/admin?tab=offres', tab: 'offres', label: 'Offres & Plans', short: 'Offres', icon: ReceiptText },
  { to: '/admin?tab=notifications', tab: 'notifications', label: 'Notifications & Email', short: 'Notif', icon: BellRing },
  { to: '/admin?tab=system', tab: 'system', label: 'Maintenance & Profil', short: 'Système', icon: Settings },
];

function SidebarContent({ onNavigate, counts }) {
  const { user, boutique, logout } = useAuth();
  const location = useLocation();

  const isAdmin = user?.role === 'admin';
  const nav = isAdmin ? ADMIN_NAV : NAV;
  const activeTab = new URLSearchParams(location.search).get('tab') || 'overview';

  // Correction défensive d'une ancienne valeur mal orthographiée en base.
  const nomBoutique = (boutique?.nom_boutique ?? 'Boutique à créer').replace('Quincallierie', 'Quincaillerie');
  const nomUser = (user?.nom ?? '').replace('Quincallierie', 'Quincaillerie');
  const finPro = user?.abonnement_actif_jusqu_au ? new Date(user.abonnement_actif_jusqu_au) : null;
  const joursRestants = finPro ? Math.max(0, Math.ceil((finPro.getTime() - Date.now()) / 86_400_000)) : null;

  return (
    <div className="flex h-full flex-col text-white" style={{ background: 'linear-gradient(180deg, #780000 0%, #4A0000 55%, #140505 100%)' }}>
      {/* ===== MARQUE ===== */}
      <div className="px-5 pb-4 pt-5">
        <Link to="/" className="group flex items-center gap-3" onClick={onNavigate} aria-label="Djassa Online — accueil">
          <img src="/images/logo-mark.svg" alt="" className="h-11 w-11 shrink-0 rounded-[5px] shadow-[0_6px_20px_rgba(120,0,0,0.55)] transition group-hover:shadow-[0_8px_26px_rgba(120,0,0,0.75)]" />
          <div className="min-w-0">
            <p className="font-spacegrotesk text-[17px] font-extrabold leading-none tracking-tight">
              Djassa <span className="text-white/45">Online</span>
            </p>
            <p className="mt-1.5 font-spacegrotesk text-[8px] font-extrabold uppercase tracking-[0.24em] text-djassa-red">
              {isAdmin ? 'Supervision plateforme' : 'Espace vendeur'}
            </p>
          </div>
        </Link>
      </div>

      {/* ===== IDENTITÉ / BADGE ADMIN ===== */}
      <div className="px-4">
        <div className="relative overflow-hidden rounded-[5px] bg-white/10 px-3.5 py-3.5">
          <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-[5px] bg-white/10 blur-2xl" aria-hidden="true" />
          <div className="relative flex items-center gap-3">
            <Avatar name={isAdmin ? 'SA' : nomBoutique} size={42} tone="red" />
            <div className="min-w-0 flex-1">
              {isAdmin ? (
                <>
                  <p className="font-spacegrotesk text-[11px] font-extrabold uppercase tracking-[0.14em] text-white">SUPER ADMIN</p>
                  <p className="mt-1 inline-flex items-center gap-1 rounded-[5px] bg-white/12 px-2 py-1 font-spacegrotesk text-[9px] font-extrabold uppercase tracking-[0.12em] text-white/90">
                    <ShieldCheck size={12} aria-hidden="true" /> Accès Total
                  </p>
                </>
              ) : (
                <>
                  <p className="truncate font-spacegrotesk text-[13px] font-extrabold">{nomBoutique}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-white/55">
                    {boutique?.verifie ? (
                      <><BadgeCheck size={14} className="text-white" /> Vendeur vérifié</>
                    ) : (
                      <><Sparkles size={14} className="text-white" /> Offre Pro active</>
                    )}
                  </p>
                </>
              )}
            </div>
          </div>
          {!isAdmin && !boutique && (
            <Link
              to="/dashboard-pro/ma-boutique"
              onClick={onNavigate}
              className="relative mt-3 flex items-center justify-center rounded-[5px] bg-white px-3 py-2 font-spacegrotesk text-[10px] font-extrabold text-[#780000] transition hover:bg-white/85"
            >
              Créer ma boutique
            </Link>
          )}
        </div>
      </div>

      {/* ===== NAVIGATION ===== */}
      <nav className="mt-6 flex-1 space-y-1 overflow-y-auto px-3" aria-label="Navigation espace Pro">
        <p className="mb-2 px-3 font-spacegrotesk text-[8px] font-extrabold uppercase tracking-[0.24em] text-white/50">Pilotage</p>

        {nav.map(({ to, end, label, icon: Icon, key, tab }) => {
          const active = isAdmin ? activeTab === tab : undefined;
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onNavigate}
              className={({ isActive }) => {
                const isItemActive = isAdmin ? active : isActive;
                return `group flex items-center gap-3 rounded-[5px] px-3 py-2.5 text-[12px] font-bold transition-all duration-200 ${
                  isItemActive
                    ? 'bg-[#0A0A0A] text-white shadow-[0_8px_22px_rgba(0,0,0,0.35)]'
                    : 'text-white/70 hover:bg-black/20 hover:text-white'
                }`;
              }}
            >
              {({ isActive }) => {
                const isItemActive = isAdmin ? active : isActive;
                return (
                  <>
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] transition ${
                      isItemActive
                        ? 'bg-white/15 text-white'
                        : 'bg-white/10 text-white/80 group-hover:bg-white/20'
                    }`}>
                      <Icon size={18} strokeWidth={isItemActive ? 2.6 : 2} />
                    </span>
                    <span className="min-w-0 flex-1 leading-tight">{label}</span>
                    {key && counts[key] > 0 && (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-[5px] bg-white px-1 font-spacegrotesk text-[9px] font-extrabold tabular-nums text-[#780000]">
                        {counts[key] > 9 ? '9+' : counts[key]}
                      </span>
                    )}
                  </>
                );
              }}
            </NavLink>
          );
        })}
      </nav>

      {/* ===== ÉTAT SYSTÈME / SANTÉ BOUTIQUE ===== */}
      <div className="px-4 pb-2">
        <div className="relative overflow-hidden rounded-[5px] bg-white/[0.04] p-3.5">
          {isAdmin ? (
            <>
              <p className="font-spacegrotesk text-[9px] font-extrabold uppercase tracking-[0.2em] text-white/40">État Système</p>
              <div className="mt-2.5 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-[5px] bg-emerald-500/15 text-emerald-300">
                  <Server size={14} aria-hidden="true" />
                </span>
                <span className="text-[10.5px] font-bold text-white/90">5 Microservices Actifs</span>
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-[9px] text-white/50">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" /> Gateway, Auth, Catalogue, Troc, Escrow
              </p>
            </>
          ) : (
            <>
              <p className="font-spacegrotesk text-[9px] font-extrabold uppercase tracking-[0.2em] text-white/40">Santé boutique</p>
              <div className="mt-2.5 flex items-center justify-between gap-2">
                <span className="text-[10.5px] font-bold text-white/85">Offre Pro active</span>
                {joursRestants !== null && (
                  <span className="font-spacegrotesk text-[9px] font-extrabold tabular-nums text-white/60">{joursRestants} j restants</span>
                )}
              </div>
              <p className="mt-2 text-[9px] text-white/45">Compte vérifié · Paiements sécurisés</p>
            </>
          )}
        </div>
      </div>

      {/* ===== PROFIL ===== */}
      <div className="px-5 pb-4 pt-3">
        <div className="flex items-center gap-3">
          <Avatar name={nomUser} size={34} tone="red" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-spacegrotesk text-[11px] font-extrabold">{nomUser}</p>
            <p className="truncate text-[9px] text-white/40">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="shrink-0 rounded-[5px] p-1.5 text-white/50 transition hover:bg-black/25 hover:text-white"
            aria-label="Se déconnecter"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProLayout() {
  const { user, authResolved } = useAuth();
  const isAdmin = user?.role === 'admin';
  const nav = isAdmin ? ADMIN_NAV : NAV;
  const location = useLocation();
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    setDrawer(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const { data: txData } = useQuery({
    queryKey: ['transactions', 'pro', 'sidebar'],
    queryFn: async () => (await api.get('/transactions')).data,
    enabled: Boolean(user && authResolved),
    retry: false,
    staleTime: 30_000,
  });
  const { data: trocData } = useQuery({
    queryKey: ['barter-offers', 'sidebar'],
    queryFn: async () => (await api.get('/barter-offers')).data,
    enabled: Boolean(user && authResolved),
    retry: false,
    staleTime: 30_000,
  });

  const counts = {
    achats: (txData?.data ?? []).filter((tx) => tx.role_utilisateur === 'acheteur' && tx.escrow_status === 'held').length,
    trocs: (trocData?.data ?? []).filter((o) => o.statut === 'pending').length,
  };

  return (
    <div className="min-h-screen bg-djassa-cream font-DM-Sans text-djassa-black">
      {/* Sidebar desktop (visible dès la tablette pour éviter le drawer superposé) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 md:block">
        <SidebarContent counts={counts} />
      </aside>

      {/* Drawer mobile (uniquement sous md) */}
      {drawer && (
        <div className="fixed inset-0 z-[80] md:hidden">
          <button className="absolute inset-0 bg-[#0A0A0A]/40" onClick={() => setDrawer(false)} aria-label="Fermer le menu" />
          <div className="absolute inset-y-0 left-0 w-[290px] max-w-[86vw] animate-[drawerIn_.28s_cubic-bezier(.22,1,.36,1)] shadow-2xl">
            <SidebarContent onNavigate={() => setDrawer(false)} counts={counts} />
            <button onClick={() => setDrawer(false)} className="absolute right-3 top-4 rounded-[5px] bg-white/10 p-1.5 text-white" aria-label="Fermer">
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      <div className="md:pl-72">
        {/* Barre supérieure */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button onClick={() => setDrawer(true)} className="rounded-[5px] p-2 text-djassa-black/70 transition hover:bg-djassa-cloud md:hidden" aria-label="Ouvrir le menu">
              <Menu size={22} />
            </button>
            <div className="min-w-0">
              <p className="font-spacegrotesk text-[9px] font-extrabold uppercase tracking-[0.2em] text-djassa-red">
                {isAdmin ? 'Administration' : 'Espace vendeur Pro'}
              </p>
              <p className="truncate font-spacegrotesk text-[14px] font-extrabold">
                {isAdmin ? 'Supervision de la plateforme' : 'Pilotage de votre activité'}
              </p>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Link to="/messages" className="hidden rounded-[5px] p-2 text-djassa-black/60 transition hover:bg-djassa-cloud hover:text-djassa-black sm:inline-flex" aria-label="Notifications — mes messages">
                <Bell size={24} />
              </Link>
              <Link to="/" className="hidden rounded-[5px] px-3 py-2 font-spacegrotesk text-[11px] font-extrabold text-djassa-black/70 transition hover:text-djassa-red sm:inline-flex">
                Marché
              </Link>
              <Link to={isAdmin ? '/admin' : '/dashboard-pro/ma-boutique'} className="rounded-[5px] ring-2 ring-transparent transition hover:ring-djassa-red/40" aria-label={isAdmin ? 'Mon profil admin' : 'Mon profil Pro'}>
                <Avatar name={user?.nom} size={34} tone="red" />
              </Link>
            </div>
          </div>
        </header>

        <main className="route-enter mx-auto max-w-[1400px] px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-12 lg:pt-7">
          <Outlet />
        </main>
      </div>

      {/* Barre mobile (masquée si le drawer est ouvert ou sur grand écran) */}
      <nav className={`fixed inset-x-0 bottom-0 z-50 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden ${drawer ? 'hidden' : ''}`} aria-label="Navigation Pro mobile">
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-1">
          {nav.filter((item) => !item.desktopOnly).map(({ to, end, short, icon: Icon, key, tab }) => {
            const activeTab = new URLSearchParams(location.search).get('tab') || 'overview';
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => {
                  const isItemActive = isAdmin ? activeTab === tab : isActive;
                  return `relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[9px] font-bold transition ${
                    isItemActive ? 'text-djassa-red' : 'text-djassa-black/50'
                  }`;
                }}
              >
                {({ isActive }) => {
                  const activeTabNow = new URLSearchParams(location.search).get('tab') || 'overview';
                  const isItemActive = isAdmin ? activeTabNow === tab : isActive;
                  return (
                    <>
                      <span className="relative">
                        <Icon size={20} strokeWidth={isItemActive ? 2.6 : 2} />
                        {key && counts[key] > 0 && (
                          <span className="absolute -right-2 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-[5px] bg-djassa-red px-0.5 font-spacegrotesk text-[7px] font-extrabold text-white">
                            {counts[key] > 9 ? '9+' : counts[key]}
                          </span>
                        )}
                      </span>
                      {short}
                    </>
                  );
                }}
              </NavLink>
            );
          })}
        </div>
      </nav>

      <style>{`@keyframes drawerIn { from { transform: translateX(-100%) } to { transform: translateX(0) } }`}</style>
    </div>
  );
}
