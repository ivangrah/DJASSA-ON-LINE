import { useEffect, useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { ArrowUp, ShieldCheck, Wallet, ArrowLeftRight, Store } from 'lucide-react';
import TopNav from './TopNav';
import BottomTabBar from './BottomTabBar';

export default function AppShell() {
  const { pathname } = useLocation();
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setShowTop(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 640);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className={`min-h-screen ${isAuthPage || pathname === '/' ? '' : 'bg-djassa-cloud pb-20 md:pb-0'}`}>
      {!isAuthPage && <TopNav />}
      <main className="route-enter" key={pathname}>
        <Outlet />
      </main>
      {!isAuthPage && <footer className="relative overflow-hidden border-t border-white/10 bg-djassa-black text-white">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ED0F02]/70 to-transparent" aria-hidden="true" />
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-12 lg:gap-10">
            {/* Marque */}
            <div className="col-span-2 md:col-span-4 lg:col-span-4">
              <Link to="/" className="inline-flex items-center gap-2.5">
                <img src="/images/logo-256.png" alt="" aria-hidden="true" className="h-10 w-10 rounded-xl shadow-[0_4px_16px_rgba(237,15,2,0.45)]" />
                <span className="font-jakarta text-lg font-extrabold uppercase leading-none tracking-tight text-white">
                  Djassa<span className="text-[#ED0F02]"> Online</span>
                </span>
              </Link>
              <p className="mt-3 max-w-sm font-inter text-[13px] leading-relaxed text-white/60">
                La marketplace de revente et de troc en Afrique de l'Ouest. Achetez, vendez et troquez en confiance, en FCFA.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 font-jakarta text-[10px] font-semibold uppercase tracking-wide text-white/80 ring-1 ring-white/10">
                  <ShieldCheck size={12} className="text-[#ED0F02]" /> Escrow + PIN
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 font-jakarta text-[10px] font-semibold uppercase tracking-wide text-white/80 ring-1 ring-white/10">
                  <Wallet size={12} className="text-[#ED0F02]" /> Mobile Money
                </span>
              </div>
            </div>

            {/* Marketplace */}
            <div className="col-span-1 lg:col-span-2">
              <h3 className="font-jakarta text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/90">Marketplace</h3>
              <ul className="mt-3 space-y-2.5 font-inter text-[13px] text-white/60">
                <li><Link to="/" className="transition hover:text-white">Accueil</Link></li>
                <li><a href="/#feed" className="transition hover:text-white">Catalogue</a></li>
                <li><Link to="/publier" className="transition hover:text-white">Publier une annonce</Link></li>
                <li><Link to="/souhaits" className="inline-flex items-center gap-1.5 transition hover:text-white"><ArrowLeftRight size={12} className="text-[#ED0F02]" /> Mur des souhaits</Link></li>
              </ul>
            </div>

            {/* Mon espace */}
            <div className="col-span-1 lg:col-span-2">
              <h3 className="font-jakarta text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/90">Mon espace</h3>
              <ul className="mt-3 space-y-2.5 font-inter text-[13px] text-white/60">
                <li><Link to="/moi" className="transition hover:text-white">Mon Djassa</Link></li>
                <li><Link to="/messages" className="transition hover:text-white">Messages</Link></li>
                <li><Link to="/login" className="transition hover:text-white">Connexion</Link></li>
                <li><Link to="/register" className="transition hover:text-white">Inscription</Link></li>
              </ul>
            </div>

            {/* Confiance & paiements */}
            <div className="col-span-2 md:col-span-2 lg:col-span-4">
              <h3 className="font-jakarta text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/90">Paiements sécurisés</h3>
              <p className="mt-3 font-inter text-[13px] leading-relaxed text-white/60">
                Transactions protégées par séquestre : le vendeur est payé après remise et validation par <span className="font-semibold text-white/80">code PIN</span>.
              </p>
              <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 font-inter text-[12px] text-white/70">
                <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#ED0F02]" /> Wave</li>
                <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#ED0F02]" /> Orange Money</li>
                <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#ED0F02]" /> MTN Money</li>
                <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#ED0F02]" /> Moov Money</li>
              </ul>
              <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 font-inter text-[11px] text-white/60">
                <Store size={13} className="text-[#ED0F02]" /> C2C, troc & Boutiques Pro — paiements en FCFA
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-center sm:flex-row sm:text-left">
            <p className="font-inter text-[12px] text-white/45">
              © {new Date().getFullYear()} <span className="font-semibold text-white/70">Djassa Online</span>. Tous droits réservés.
            </p>
            <p className="font-inter text-[12px] text-white/45">
              Fait avec soin à Abidjan, Côte d’Ivoire.
            </p>
          </div>
        </div>
      </footer>}
      {!isAuthPage && pathname !== '/' && <BottomTabBar />}

      {/* Retour haut discret sur longs feeds */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Retour en haut de page"
          className="fixed bottom-24 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-djassa-black text-white shadow-card transition-transform hover:-translate-y-1 md:bottom-6"
        >
          <ArrowUp size={18} />
        </button>
      )}
    </div>
  );
}
