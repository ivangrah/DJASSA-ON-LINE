import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import TopNav from './TopNav';
import BottomTabBar from './BottomTabBar';

export default function AppShell() {
  const { pathname } = useLocation();
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
    <div className="min-h-screen bg-djassa-cloud pb-20 md:pb-0">
      <TopNav />
      <main className="route-enter" key={pathname}>
        <Outlet />
      </main>
      <footer className="hidden border-t border-djassa-black/8 bg-djassa-black py-6 text-center text-xs text-white/50 md:block">
        <p className="font-jakarta font-bold text-white/80">Djassa <span className="text-djassa-red">Online</span> — la marketplace de revente et de troc en Afrique de l'Ouest</p>
        <p className="mt-1">Wave · Orange Money · MTN Money · Moov Money — paiements séquestrés par code PIN</p>
      </footer>
      <BottomTabBar />

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
