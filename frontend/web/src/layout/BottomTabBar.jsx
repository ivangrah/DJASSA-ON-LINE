import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Heart, MessageCircle, Plus, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

/**
 * Barre d'onglets mobile (5 piliers PRD) :
 * Accueil · Souhaits · Publier (+, rouge) · Messages · Mon Djassa
 */
export default function BottomTabBar() {
  const location = useLocation();
  const { isAuthenticated, isPro, dashboardPath } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let alive = true;
    const poll = async () => {
      try {
        const { data } = await api.get('/messages/unread-count');
        if (alive) setUnread(data.unread ?? 0);
      } catch { /* silencieux */ }
    };
    poll();
    const t = window.setInterval(poll, 10000);
    return () => { alive = false; window.clearInterval(t); };
  }, [isAuthenticated, location.pathname]);

  const path = location.pathname;
  const is = (prefix) => (prefix === '/' ? path === '/' : path.startsWith(prefix));

  const item = (to, label, Icon, active, badge = 0) => (
    <Link to={to} className="flex min-w-0 flex-1 flex-col items-center gap-0.5 py-1.5" aria-current={active ? 'page' : undefined}>
      <span className="relative">
        <Icon size={21} strokeWidth={active ? 2.6 : 2} className={active ? 'text-djassa-red' : 'text-djassa-gray'} />
        {badge > 0 && (
          <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-[5px] bg-djassa-red px-1 text-[8px] font-extrabold text-white">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </span>
      <span className={`text-[9px] font-DM-Sans font-semibold ${active ? 'text-djassa-red' : 'text-djassa-black/70'}`}>{label}</span>
    </Link>
  );

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden"
      aria-label="Navigation principale"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1">
        {item('/', 'Accueil', Home, is('/'))}
        {item('/souhaits', 'Souhaits', Heart, is('/souhaits'))}

        {/* Bouton central Publier */}
        <Link to="/publier" aria-label="Publier une annonce" className="flex flex-1 flex-col items-center">
          <span className="-mt-5 flex h-14 w-14 items-center justify-center rounded-[5px] bg-djassa-red text-white shadow-pop ring-4 transition-transform active:scale-95 animate-floaty">
            <Plus size={28} strokeWidth={3} />
          </span>
          <span className="mt-0.5 text-[9px] font-DM-Sans font-semibold text-djassa-red">Publier</span>
        </Link>

        {item('/messages', 'Messages', MessageCircle, is('/messages'), unread)}
        {item(dashboardPath || '/choisir-offre', isPro ? 'Espace Pro' : 'Mon Djassa', User, is(dashboardPath || '/choisir-offre'))}
      </div>
    </nav>
  );
}
