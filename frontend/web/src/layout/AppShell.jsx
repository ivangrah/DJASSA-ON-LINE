import { useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { ShieldCheck, Wallet, ArrowLeftRight, Store, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import BottomTabBar from './BottomTabBar';

export default function AppShell() {
  const { pathname } = useLocation();
  const { dashboardPath } = useAuth();
  const isAuthPage = pathname === '/login' || pathname === '/register';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className={`min-h-screen ${isAuthPage || pathname === '/' || pathname === '/moi' ? '' : 'bg-djassa-cloud pb-20 md:pb-0'}`}>
      {!isAuthPage && pathname !== '/' && <Navbar />}
      <main className="route-enter" key={pathname}>
        <Outlet />
      </main>
      {!isAuthPage && <footer className="relative overflow-hidden bg-djassa-black text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-12 lg:gap-10">
            {/* Marque */}
            <div className="col-span-2 md:col-span-4 lg:col-span-4">
              <Link to="/" className="inline-flex items-center gap-2.5">
                <img src="/images/logo-mark.svg" alt="" aria-hidden="true" className="h-10 w-10 rounded-[5px] shadow-[0_4px_16px_rgba(120,0,0,0.45)]" />
                <span className="font-spacegrotesk text-lg font-extrabold uppercase leading-none tracking-tight text-white">
                  Djassa<span className="text-djassa-gray"> Online</span>
                </span>
              </Link>
              <p className="mt-3 max-w-sm font-DM-Sans text-[13px] leading-relaxed text-white/60">
                La marketplace de revente et de troc en Afrique de l'Ouest. Achetez, vendez et troquez en confiance, en FCFA.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-[5px] bg-white/5 px-3 py-1.5 font-spacegrotesk text-[10px] font-semibold uppercase tracking-wide text-white/80">
                  <ShieldCheck size={16} className="text-[#780000]" /> Escrow + PIN
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-[5px] bg-white/5 px-3 py-1.5 font-spacegrotesk text-[10px] font-semibold uppercase tracking-wide text-white/80">
                  <Wallet size={16} className="text-[#780000]" /> Mobile Money
                </span>
              </div>
            </div>

            {/* Marketplace */}
            <div className="col-span-1 lg:col-span-2">
              <h3 className="font-spacegrotesk text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/90">Marketplace</h3>
              <ul className="mt-3 space-y-2.5 font-DM-Sans text-[13px] text-white/60">
                <li><Link to="/" className="transition hover:text-white">Accueil</Link></li>
                <li><Link to="/#feed" className="transition hover:text-white">Catalogue</Link></li>
                <li><Link to="/publier" className="transition hover:text-white">Publier une annonce</Link></li>
                <li><Link to="/souhaits" className="inline-flex items-center gap-1.5 transition hover:text-white"><ArrowLeftRight size={24} className="lucide-nav text-[#780000]" /> Mur des souhaits</Link></li>
              </ul>
            </div>

            {/* Mon espace */}
            <div className="col-span-1 lg:col-span-2">
              <h3 className="font-spacegrotesk text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/90">Mon espace</h3>
              <ul className="mt-3 space-y-2.5 font-DM-Sans text-[13px] text-white/60">
                <li><Link to={dashboardPath || '/choisir-offre'} className="transition hover:text-white">Mon espace</Link></li>
                <li><Link to="/messages" className="transition hover:text-white">Messages</Link></li>
                <li><Link to="/login" className="transition hover:text-white">Connexion</Link></li>
                <li><Link to="/register" className="transition hover:text-white">Inscription</Link></li>
              </ul>
            </div>

            {/* Confiance & paiements */}
            <div className="col-span-2 md:col-span-2 lg:col-span-4">
              <h3 className="font-spacegrotesk text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/90">Paiements sécurisés</h3>
              <p className="mt-3 font-DM-Sans text-[13px] leading-relaxed text-white/60">
                Transactions protégées par séquestre : le vendeur est payé après remise et validation par <span className="font-semibold text-white/80">code PIN</span>.
              </p>
              <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 font-DM-Sans text-[12px] text-white/70">
                <li className="flex items-center gap-2"><ShieldCheck size={16} strokeWidth={2} className="text-[#780000]" /> Wave</li>
                <li className="flex items-center gap-2"><Wallet size={16} strokeWidth={2} className="text-[#780000]" /> Orange Money</li>
                <li className="flex items-center gap-2"><Wallet size={16} strokeWidth={2} className="text-[#780000]" /> MTN Money</li>
                <li className="flex items-center gap-2"><CreditCard size={16} strokeWidth={2} className="text-[#780000]" /> Moov Money</li>
              </ul>
              <div className="mt-4 inline-flex items-center gap-2 rounded-[5px] bg-white/5 px-3 py-2 font-DM-Sans text-[11px] text-white/60">
                <Store size={16} className="text-[#780000]" /> C2C, troc & Boutiques Pro — paiements en FCFA
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-3 pt-6 text-center sm:flex-row sm:text-left">
            <p className="font-DM-Sans text-[12px] text-white/45">
              © {new Date().getFullYear()} <span className="font-semibold text-white/70">Djassa Online</span>. Tous droits réservés.
            </p>
            <p className="font-DM-Sans text-[12px] text-white/45">
              Fait avec soin à Abidjan, Côte d'Ivoire.
            </p>
          </div>
        </div>
      </footer>}
      {!isAuthPage && pathname !== '/' && <BottomTabBar />}
    </div>
  );
}