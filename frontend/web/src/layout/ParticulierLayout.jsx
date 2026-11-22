import { useEffect } from 'react';
import { Link, Outlet, useLocation, useSearchParams } from 'react-router-dom';
import {
  ArrowLeftRight, ArrowRight, Bell, Heart, LayoutList, LogOut, MessageCircle,
  PackageCheck, PlusCircle, ShieldCheck, ShoppingBag, Sparkles, Store, Wallet,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/ui';

const TABS = [
  { key: 'articles', label: 'Mes articles à troquer', short: 'Articles', icon: LayoutList },
  { key: 'propositions', label: 'Mes propositions de troc', short: 'Propositions', icon: ArrowLeftRight },
  { key: 'achats', label: 'Mes achats & Codes PIN', short: 'Achats & PIN', icon: ShoppingBag },
  { key: 'souhaits', label: 'Mes souhaits', short: 'Souhaits', icon: Heart },
];

export default function ParticulierLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const active = searchParams.get('onglet') ?? 'articles';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-djassa-cloud font-DM-Sans text-djassa-black">
      {/* Barre supérieure */}
      <header className="sticky top-0 z-50 backdrop-blur-xl" style={{ background: 'linear-gradient(135deg, #780000 0%, #4A0000 60%, #140505 100%)' }}>
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="Djassa Online — accueil">
            <img src="/images/logo-mark.svg" alt="" className="h-9 w-9 rounded-[5px] shadow-[0_4px_14px_rgba(120,0,0,0.3)]" />
            <span className="font-spacegrotesk text-[17px] font-extrabold tracking-tight">
              Djassa<span className="text-white/55"> Online</span>
            </span>
          </Link>

          <span className="ml-1 hidden rounded-[5px] bg-white/15 px-2.5 py-1 font-spacegrotesk text-[9px] font-extrabold uppercase tracking-[0.16em] text-white sm:inline-flex">
            Espace particulier
          </span>

          <nav className="ml-auto hidden items-center gap-1 md:flex" aria-label="Navigation rapide">
            <Link to="/" className="rounded-[5px] px-3 py-2 text-[13px] font-semibold text-white/75 transition hover:bg-white/10 hover:text-white">
              Marché
            </Link>
            <Link to="/souhaits" className="rounded-[5px] px-3 py-2 text-[13px] font-semibold text-white/75 transition hover:bg-white/10 hover:text-white">
              Mur des souhaits
            </Link>
            <Link to="/messages" className="rounded-[5px] p-2 text-white/80 transition hover:bg-white/10 hover:text-white" aria-label="Messages">
              <MessageCircle size={24} />
            </Link>
            <Link to="/publier" className="ml-1 inline-flex items-center gap-1.5 rounded-[5px] bg-white px-3.5 py-2 font-spacegrotesk text-[12px] font-extrabold text-[#780000] shadow-card transition hover:bg-white/85 active:scale-95">
              <PlusCircle size={20} /> Publier
            </Link>
          </nav>

          <Link to="/messages" className="ml-auto rounded-[5px] p-2 text-white/80 md:hidden" aria-label="Messages">
            <Bell size={20} />
          </Link>
          <Link to="/publier" className="inline-flex items-center gap-1 rounded-[5px] bg-white px-3 py-2 font-spacegrotesk text-[11px] font-extrabold text-[#780000] md:hidden">
            <PlusCircle size={20} /> Publier
          </Link>
          <Link to="/dashboard" className="shrink-0 rounded-[5px] ring-2 transition" aria-label="Mon profil">
            <Avatar name={user?.nom} size={34} tone="red" />
          </Link>
          <button
            type="button"
            onClick={logout}
            aria-label="Se déconnecter"
            title="Se déconnecter"
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-[5px] bg-white/10 px-2.5 font-spacegrotesk text-[10px] font-extrabold uppercase tracking-wide text-white transition hover:bg-white/20"
          >
            <LogOut size={18} /> <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>

        {/* Onglets mobile / tablette */}
        <div className="bg-black/15 lg:hidden">
          <nav className="no-scrollbar mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 py-2" aria-label="Onglets de mon espace">
            {TABS.map(({ key, short, icon: Icon }) => {
              const isActive = active === key;
              return (
                <Link
                  key={key}
                  to={`/dashboard?onglet=${key}`}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-[5px] px-3 py-1.5 text-[11px] font-bold transition ${
                    isActive ? 'bg-white text-[#780000] shadow-card' : 'bg-white/10 text-white/75 hover:text-white'
                  }`}
                >
                  <Icon size={13} /> {short}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:grid lg:grid-cols-[264px_minmax(0,1fr)] lg:gap-8 lg:px-8 lg:pt-8">
        {/* Colonne latérale desktop */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <div className="overflow-hidden rounded-[5px] p-5 text-white shadow-card" style={{ background: 'linear-gradient(135deg, #780000 0%, #4A0000 60%, #140505 100%)' }}>
              <div className="flex items-start justify-between gap-2">
                <Avatar name={user?.nom} size={56} tone="red" className="ring-2 ring-white/25" />
                <span className="rounded-[5px] bg-white/15 px-2.5 py-1 font-spacegrotesk text-[8px] font-extrabold uppercase tracking-[0.16em] text-white">Gratuit</span>
              </div>
              <div className="mt-3">
                <p className="font-spacegrotesk text-[15px] font-extrabold leading-tight">{user?.nom}</p>
                <p className="mt-0.5 truncate text-[11px] text-white/55">{user?.email ?? user?.telephone}</p>
                <div className="mt-3 flex items-center gap-2 rounded-[5px] bg-white/10 px-3 py-2">
                  <ShieldCheck size={14} className="text-white" />
                  <div className="min-w-0">
                    <p className="text-[9px] uppercase tracking-wide text-white/40">Confiance Djassa</p>
                    <p className="font-spacegrotesk text-[12px] font-extrabold">{user?.score_confiance ?? 50}/100</p>
                  </div>
                </div>
              </div>
            </div>

            <nav className="rounded-[5px] bg-[#780000] p-2 shadow-card" aria-label="Navigation de mon espace">
              {TABS.map(({ key, label, icon: Icon }) => {
                const isActive = active === key;
                return (
                  <Link
                    key={key}
                    to={`/dashboard?onglet=${key}`}
                    className={`flex items-center gap-3 rounded-[5px] px-3.5 py-3 text-[12.5px] font-bold transition ${
                      isActive
                        ? 'bg-white text-[#780000] shadow-card'
                        : 'text-white/75 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon size={17} strokeWidth={isActive ? 2.6 : 2} />
                    <span className="flex-1">{label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Encart Pro discret */}
            <div className="relative overflow-hidden rounded-[5px] bg-gradient-to-br from-djassa-red to-djassa-red-dark p-5 text-white shadow-pop">
              <Sparkles size={18} className="text-white/80" />
              <p className="mt-2 font-spacegrotesk text-[15px] font-extrabold leading-tight">
                Passer à l’offre Pro pour ouvrir une boutique
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-white/80">
                Vendez du neuf, gérez vos stocks et éditez vos factures PDF.
              </p>
              <Link
                to="/choisir-offre"
                className="mt-3 inline-flex items-center gap-1.5 rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] shadow-card px-3 py-2 font-spacegrotesk text-[11px] font-extrabold text-djassa-red transition hover:bg-djassa-red-soft active:scale-95"
              >
                Découvrir Pro <ArrowRight size={24} />
              </Link>
            </div>

            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-2 rounded-[5px] px-3.5 py-3 text-[12px] font-bold text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <LogOut size={20} /> Se déconnecter
            </button>
          </div>
        </aside>

        <main key={location.pathname} className="route-enter min-w-0">
          <Outlet />

          {/* Liens mobiles de secours */}
          <div className="mt-8 grid grid-cols-3 gap-2 lg:hidden">
            <Link to="/" className="flex flex-col items-center gap-1 rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] shadow-card px-2 py-3 text-[10px] font-bold text-djassa-black/65">
              <Store size={16} className="text-djassa-red" /> Marché
            </Link>
            <Link to="/publier" className="flex flex-col items-center gap-1 rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] shadow-card px-2 py-3 text-[10px] font-bold text-djassa-black/65">
              <PackageCheck size={16} className="text-djassa-red" /> Publier
            </Link>
            <Link to="/choisir-offre" className="flex flex-col items-center gap-1 rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] shadow-card px-2 py-3 text-[10px] font-bold text-djassa-black/65">
              <Wallet size={16} className="text-djassa-red" /> Offre Pro
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
