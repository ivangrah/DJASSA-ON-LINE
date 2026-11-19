import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Bell, MessageCircle, PlusCircle, Search, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/ui';
import { api } from '../lib/api';

/** Barre supérieure Djassa — noir profond, logo blanc + point rouge, recherche centrale. */
export default function TopNav() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
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
    const t = window.setInterval(poll, 15000);
    return () => { alive = false; window.clearInterval(t); };
  }, [isAuthenticated, location.pathname]);

  const submitSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/?q=${encodeURIComponent(q)}` : '/');
  };

  return (
    <header className="sticky top-0 z-50 bg-djassa-black text-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-3 sm:gap-4 sm:px-6">
        {/* Logo */}
        <Link to="/" className="flex shrink-0 items-center gap-1.5" aria-label="Djassa Online — accueil">
          <span className="relative font-jakarta text-[17px] font-extrabold leading-none tracking-tight text-white">
            Djassa<span className="text-djassa-red">&nbsp;Online</span>
            <span className="absolute -right-2 -top-0.5 h-1.5 w-1.5 rounded-full bg-djassa-red animate-pulseDot" aria-hidden="true" />
          </span>
        </Link>

        {/* Recherche (desktop) */}
        <form onSubmit={submitSearch} className="hidden min-w-0 flex-1 items-center md:flex" role="search">
          <label className="flex h-10 w-full max-w-xl items-center gap-2 rounded-full bg-white/10 px-4 ring-1 ring-white/10 transition focus-within:bg-white focus-within:ring-djassa-red">
            <Search size={17} className="shrink-0 text-white/60" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un article, une boutique, une catégorie…"
              className="w-full bg-transparent text-sm text-white placeholder-white/50 outline-none focus-within:text-djassa-black placeholder:focus-within:text-djassa-slate"
              aria-label="Rechercher sur Djassa Online"
            />
          </label>
        </form>

        {/* Actions */}
        <nav className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2" aria-label="Actions principales">
          <Link to="/publier" className="btn-red btn-sm hidden sm:inline-flex">
            <PlusCircle size={16} /> Publier
          </Link>

          {isAuthenticated ? (
            <>
              <NavLink to="/messages" className="relative rounded-full p-2 text-white/85 transition hover:bg-white/10 hover:text-white" aria-label="Messages">
                <MessageCircle size={20} />
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-djassa-red px-1 text-[9px] font-extrabold text-white">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </NavLink>
              <NavLink to="/moi" className="rounded-full p-0.5 transition hover:ring-2 hover:ring-djassa-red" aria-label="Mon Djassa">
                <Avatar name={user?.nom} size={32} tone="red" />
              </NavLink>
            </>
          ) : (
            <NavLink to="/login" className="btn-red btn-sm">
              <UserRound size={16} /> Connexion
            </NavLink>
          )}
        </nav>
      </div>

      {/* Recherche (mobile) */}
      <form onSubmit={submitSearch} className="border-t border-white/10 px-3 pb-2 pt-1.5 md:hidden" role="search">
        <label className="flex h-9 w-full items-center gap-2 rounded-full bg-white/10 px-3.5 ring-1 ring-white/10 focus-within:bg-white">
          <Search size={15} className="shrink-0 text-white/60" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher sur le Djassa…"
            className="w-full bg-transparent text-[13px] text-white placeholder-white/50 outline-none"
            aria-label="Rechercher un article"
          />
        </label>
      </form>

      {/* Fil d'Ariane ventes flash (lien discret) */}
      <Link to="/?flash=1" className="hidden items-center justify-center gap-1.5 bg-djassa-red py-1 text-[10px] font-jakarta font-bold uppercase tracking-[0.2em] text-white md:flex">
        <Bell size={10} strokeWidth={3} /> Ventes Flash Boutiques tous les jours
      </Link>
    </header>
  );
}
