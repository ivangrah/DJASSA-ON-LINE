import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import TopNav from './TopNav';
import BottomTabBar from './BottomTabBar';

export default function AppShell() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-djassa-cloud pb-20 md:pb-0">
      <TopNav />
      <main>
        <Outlet />
      </main>
      <footer className="hidden border-t border-djassa-black/8 bg-djassa-black py-6 text-center text-xs text-white/50 md:block">
        <p className="font-jakarta font-bold text-white/80">Djassa <span className="text-djassa-red">Online</span> — la marketplace de revente et de troc en Afrique de l'Ouest</p>
        <p className="mt-1">Wave · Orange Money · MTN Money · Moov Money — paiements séquestrés par code PIN</p>
      </footer>
      <BottomTabBar />
    </div>
  );
}
