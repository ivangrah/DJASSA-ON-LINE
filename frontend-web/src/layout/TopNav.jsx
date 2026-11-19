import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle, PlusCircle, Search, ShoppingCart, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Avatar } from '../components/ui';
import { api } from '../lib/api';

/**
 * Barre de navigation Djassa.
 * Sur la landing (`/`), elle est SUPPRIMÉE : l'affiche hero porte elle-même
 * la navigation (liens typographiques + CTA), conformément à la DA « affiche ».
 * Sur les autres pages : barre noire sobre sticky.
 */
export default function TopNav() {
  const { isAuthenticated, user } = useAuth();
  const { count: cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [query, setQuery] = useState('');
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (isHome || !isAuthenticated) return undefined;
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
  }, [isHome, isAuthenticated, location.pathname]);

  const submitSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/?q=${encodeURIComponent(q)}` : '/');
  };

  // Landing : aucune barre de navigation — l'affiche parle d'elle-même
  if (isHome) return null;

  return (
    <header className="sticky top-0 z-50 bg-djassa-black text-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-3 sm:gap-4 sm:px-6">
        {/* Logo — carré rouge/noir Djassa + wordmark */}
        <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="Djassa Online — accueil">
          <img src="/images/logo-256.png" alt="Logo Djassa Online" className="h-8 w-8 rounded-[10px] shadow-[0_2px_10px_rgba(237,15,2,0.45)]" />
          <span className="font-jakarta text-[16px] font-extrabold leading-none tracking-tight text-white">
            Djassa<span className="text-djassa-red">&nbsp;Online</span>
          </span>
        </Link>

        {/* Recherche (desktop) */}
        <form onSubmit={submitSearch} className="hidden min-w-0 flex-1 items-center justify-center md:flex" role="search">
          <label className="flex h-10 w-full max-w-md items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-djassa-red">
            <Search size={17} className="shrink-0 text-white/60" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher : meuleuse, iPhone, groupe électrogène…"
              className={`w-full bg-transparent text-sm placeholder-white/50 outline-none focus-within:text-djassa-black placeholder:focus-within:text-djassa-slate ${
                isHome ? 'text-white' : 'text-white'
              }`}
              aria-label="Rechercher sur Djassa Online"
            />
          </label>
        </form>

        {/* Actions */}
        <nav className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2" aria-label="Actions principales">
          <Link to="/publier" className="btn-red btn-sm hidden sm:inline-flex shadow-[0_6px_20px_rgba(230,0,35,0.4)]">
            <PlusCircle size={16} /> Publier
          </Link>
          <NavLink to="/panier" className="relative rounded-full p-2 text-white/85 transition hover:bg-white/10 hover:text-white" aria-label={`Mon panier — ${cartCount} article${cartCount > 1 ? 's' : ''}`}>
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-djassa-red px-1 text-[9px] font-extrabold text-white">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </NavLink>

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

      {/* Recherche (mobile) — fondu sur le hero */}
      <form onSubmit={submitSearch} className="px-3 pb-2 pt-1 md:hidden" role="search">
        <label className="flex h-9 w-full items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3.5 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-djassa-red">
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
    </header>
  );
}
