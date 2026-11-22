import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import {
  ArrowLeftRight, Heart, LayoutGrid, MessageCircle, Package, Plus,
  Search, ShoppingCart, Store, UserRound, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Avatar } from './ui';
import SoundToggle from './SoundToggle';
import { api } from '../lib/api';
import { playNotificationChime } from '../utils/soundEffects';

const LINKS = [
  { to: '/#feed', label: 'Catalogue', icon: LayoutGrid },
  { to: '/publier', label: 'Vendre', icon: Plus },
  { to: '/souhaits', label: 'Souhaits', icon: Heart },
  { to: '/?marche=neuf', label: 'Boutiques Pro', icon: Store },
];

/**
 * Barre de navigation publique Djassa — composant autonome réutilisable.
 * Import : `import Navbar from '../components/Navbar'` puis `<Navbar />`.
 * Le fond rouge et les liens sont identiques sur toutes les pages qui l'utilisent.
 */
export default function Navbar() {
  const { isAuthenticated, user, dashboardPath } = useAuth();
  const { count: cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [unread, setUnread] = useState(0);
  const [drawer, setDrawer] = useState(false);
  const prevUnreadRef = useRef(0);
  const unreadInitRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let alive = true;
    const poll = async () => {
      try {
        const { data } = await api.get('/messages/unread-count');
        if (!alive) return;
        const next = data.unread ?? 0;
        if (unreadInitRef.current && next > prevUnreadRef.current) {
          playNotificationChime();
          const bells = document.querySelectorAll('[data-notification-bell]');
          if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            bells.forEach((bell) => gsap.fromTo(bell, { rotation: -18 }, { rotation: 0, duration: 0.7, ease: 'elastic.out(1, 0.3)', overwrite: 'auto', transformOrigin: 'top center' }));
          }
        }
        unreadInitRef.current = true;
        prevUnreadRef.current = next;
        setUnread(next);
      } catch { /* silencieux */ }
    };
    poll();
    const t = window.setInterval(poll, 15_000);
    return () => { alive = false; window.clearInterval(t); };
  }, [isAuthenticated, location.pathname]);

  useEffect(() => {
    if (!drawer) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') setDrawer(false); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [drawer]);

  const submitSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    setDrawer(false);
    navigate(q ? `/?q=${encodeURIComponent(q)}` : '/');
  };

  return (
    <header
      className="sticky top-0 z-50 text-white shadow-card"
      style={{ background: 'linear-gradient(135deg, #780000 0%, #4A0000 60%, #140505 100%)' }}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
        {/* Marque */}
        <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="Djassa Online — accueil">
          <img src="/images/logo-mark.svg" alt="" className="h-9 w-9 rounded-[5px] shadow-[0_4px_14px_rgba(0,0,0,0.35)]" />
          <span className="font-spacegrotesk text-[15px] font-extrabold tracking-tight sm:text-[16px]">
            Djassa <span className="text-white/60">Online</span>
          </span>
        </Link>

        {/* Liens desktop */}
        <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Navigation principale">
          {LINKS.map(({ to, label, icon: Icon }) => (
            <Link key={label} to={to} className="inline-flex items-center gap-1.5 rounded-[5px] px-3 py-2 font-DM-Sans text-[11px] font-semibold text-white/75 transition hover:bg-white/10 hover:text-white">
              <Icon size={16} /> {label}
            </Link>
          ))}
        </nav>

        {/* Recherche desktop */}
        <form onSubmit={submitSearch} className="ml-auto hidden min-w-0 flex-1 justify-center md:flex" role="search">
          <label className="flex h-9 w-full max-w-sm items-center gap-2 rounded-[5px] bg-white/10 px-3.5 transition focus-within:bg-white/20">
            <Search size={18} className="shrink-0 text-white/70" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un article, une marque…"
              aria-label="Rechercher sur Djassa Online"
              className="w-full bg-transparent font-DM-Sans text-[12px] text-white outline-none placeholder:text-white/50"
            />
          </label>
        </form>

        {/* Actions */}
        <div className={`flex shrink-0 items-center gap-1.5 ${query || !isAuthenticated ? 'ml-auto md:ml-0' : ''}`}>
          <Link to="/publier" className="hidden items-center gap-1.5 rounded-[5px] bg-white px-3 py-2 font-spacegrotesk text-[10px] font-extrabold uppercase tracking-wide text-[#780000] shadow-card transition hover:bg-white/85 active:scale-[0.98] sm:inline-flex">
            <Plus size={16} /> Publier
          </Link>
          <SoundToggle className="bg-white/10 text-white/85 hover:bg-white/20 hover:text-white" />
          <Link to="/panier" data-cart-target className="relative flex h-9 w-9 items-center justify-center rounded-[5px] bg-white/10 transition hover:bg-white/20 active:scale-[0.98]" aria-label={`Mon panier — ${cartCount} article${cartCount > 1 ? 's' : ''}`}>
            <ShoppingCart size={19} />
            {cartCount > 0 && <span data-cart-badge className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-[5px] bg-white px-1 font-spacegrotesk text-[9px] font-extrabold tabular-nums text-[#780000]">{cartCount > 9 ? '9+' : cartCount}</span>}
          </Link>
          {isAuthenticated ? (
            <>
              <Link to="/messages" data-notification-bell className="relative flex h-9 w-9 items-center justify-center rounded-[5px] bg-white/10 transition hover:bg-white/20" aria-label="Messages">
                <MessageCircle size={19} />
                {unread > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-[5px] bg-white px-1 font-spacegrotesk text-[9px] font-extrabold tabular-nums text-[#780000]">{unread > 9 ? '9+' : unread}</span>}
              </Link>
              <Link to={dashboardPath || '/choisir-offre'} className="rounded-[5px] p-0.5 transition hover:bg-white/10" aria-label="Mon espace">
                <Avatar name={user?.nom} size={32} tone="red" />
              </Link>
            </>
          ) : (
            <Link to="/login" className="inline-flex items-center gap-1.5 rounded-[5px] bg-white px-3 py-2 font-spacegrotesk text-[10px] font-extrabold uppercase tracking-wide text-[#780000] shadow-card transition hover:bg-white/85">
              <UserRound size={16} /> Connexion
            </Link>
          )}
          <button type="button" onClick={() => setDrawer(true)} className="flex h-9 w-9 items-center justify-center rounded-[5px] bg-white/10 lg:hidden" aria-label="Ouvrir le menu">
            <LayoutGrid size={19} />
          </button>
        </div>
      </div>

      {/* Recherche mobile */}
      <form onSubmit={submitSearch} className="px-4 pb-2 md:hidden" role="search">
        <label className="flex h-9 items-center gap-2 rounded-[5px] bg-white/10 px-3.5 transition focus-within:bg-white/20">
          <Search size={18} className="shrink-0 text-white/70" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher sur le Djassa…"
            aria-label="Rechercher un article"
            className="w-full bg-transparent font-DM-Sans text-[12px] text-white outline-none placeholder:text-white/50"
          />
        </label>
      </form>

      {/* Tiroir mobile */}
      {drawer && createPortal(
        <div className="fixed inset-0 z-[100] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu de navigation">
          <button type="button" className="absolute inset-0 bg-[#0A0A0A]/60" onClick={() => setDrawer(false)} aria-label="Fermer le menu" />
          <div className="absolute right-0 top-0 flex h-full w-[82%] max-w-sm flex-col bg-[#780000] text-white">
            <div className="flex items-center justify-between px-4 py-4">
              <span className="font-spacegrotesk text-[13px] font-extrabold uppercase tracking-[0.16em]">Menu</span>
              <button type="button" onClick={() => setDrawer(false)} className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-white/10" aria-label="Fermer">
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-2">
              {LINKS.map(({ to, label, icon: Icon }) => (
                <Link key={label} to={to} onClick={() => setDrawer(false)} className="mb-1 flex items-center gap-3 rounded-[5px] px-3 py-3 font-spacegrotesk text-[13px] font-bold text-white/85 transition hover:bg-white/10 hover:text-white">
                  <Icon size={18} /> {label}
                </Link>
              ))}
              <Link to="/panier" onClick={() => setDrawer(false)} className="mb-1 flex items-center gap-3 rounded-[5px] px-3 py-3 font-spacegrotesk text-[13px] font-bold text-white/85 transition hover:bg-white/10 hover:text-white">
                <ShoppingCart size={18} /> Panier {cartCount > 0 && `(${cartCount})`}
              </Link>
              <Link to={dashboardPath || '/choisir-offre'} onClick={() => setDrawer(false)} className="mb-1 flex items-center gap-3 rounded-[5px] px-3 py-3 font-spacegrotesk text-[13px] font-bold text-white/85 transition hover:bg-white/10 hover:text-white">
                <UserRound size={18} /> Mon espace
              </Link>
            </nav>
            <div className="px-4 py-4">
              {isAuthenticated ? (
                <button type="button" onClick={() => setDrawer(false)} className="w-full rounded-[5px] bg-white/10 px-3 py-2.5 font-spacegrotesk text-[11px] font-extrabold text-white">Fermer le menu</button>
              ) : (
                <Link to="/login" onClick={() => setDrawer(false)} className="block w-full rounded-[5px] bg-white px-3 py-2.5 text-center font-spacegrotesk text-[11px] font-extrabold text-[#780000]">Se connecter</Link>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </header>
  );
}
