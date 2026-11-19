import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  Home, Heart, Plus, MessageCircle, User, ShoppingCart,
  Package, Store, X, ChevronRight, Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

/**
 * Menu burger mobile — regroupe tous les onglets de l'application.
 * S'ouvre depuis le hero de la page d'accueil.
 */
export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const { count: cartCount } = useCart();

  // Bloque le scroll du body quand le menu est ouvert
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Ferme avec Échap
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const navItems = [
    { to: '/', label: 'Accueil', Icon: Home, desc: 'Le marché Djassa' },
    { to: '/#feed', label: 'Catalogue', Icon: Package, desc: 'Toutes les annonces' },
    { to: '/publier', label: 'Publier', Icon: Plus, desc: 'Vendre ou troquer', accent: true },
    { to: '/souhaits', label: 'Souhaits', Icon: Heart, desc: 'Mur des souhaits' },
    { to: '/messages', label: 'Messages', Icon: MessageCircle, desc: 'Vos conversations' },
    { to: '/panier', label: 'Panier', Icon: ShoppingCart, desc: cartCount ? `${cartCount} article${cartCount > 1 ? 's' : ''}` : 'Vos achats', badge: cartCount },
    { to: '/moi', label: 'Mon Djassa', Icon: User, desc: user?.nom ?? 'Votre espace' },
  ];

  const close = () => setOpen(false);

  return (
    <>
      {/* Bouton burger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le menu"
        aria-expanded={open}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20 active:scale-95 lg:hidden"
      >
        <span className="flex flex-col gap-[5px]">
          <span className="block h-[2px] w-5 rounded-full bg-white" />
          <span className="block h-[2px] w-5 rounded-full bg-white" />
          <span className="block h-[2px] w-3.5 rounded-full bg-white" />
        </span>
        {cartCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E60023] px-1 text-[8px] font-extrabold text-white ring-2 ring-[#121212]">
            {cartCount > 9 ? '9+' : cartCount}
          </span>
        )}
      </button>

      {/* Drawer — rendu dans un portal pour échapper au hero (animations GSAP / pin) */}
      {open && createPortal(
        <div className="fixed inset-0 z-[100] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu de navigation">
          {/* Backdrop */}
          <button type="button" aria-label="Fermer le menu" onClick={close} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Panneau */}
          <div className="absolute right-0 top-0 flex h-full w-[82%] max-w-sm flex-col bg-white shadow-2xl">
            {/* En-tête */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#ff2d1f] via-[#ED0F02] to-[#b80b00] px-5 pb-6 pt-6 text-white">
              <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
              <button type="button" onClick={close} aria-label="Fermer" className="absolute right-4 top-4 rounded-full bg-white/15 p-1.5 transition hover:bg-white/25">
                <X size={18} />
              </button>
              <div className="flex items-center gap-2.5">
                <img src="/images/logo-256.png" alt="" className="h-10 w-10 rounded-xl object-contain" />
                <div>
                  <p className="font-jakarta text-sm font-extrabold uppercase tracking-tight">Djassa <span className="text-white/80">Online</span></p>
                  <p className="font-inter text-[10px] text-white/70">Le marché d'Abidjan</p>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20"><Sparkles size={16} /></span>
                <p className="font-jakarta text-sm font-bold">Achète. Vends. Troque.</p>
              </div>
            </div>

            {/* Liens */}
            <nav className="flex-1 overflow-y-auto px-3 py-3">
              {navItems.map(({ to, label, Icon, desc, accent, badge }) => (
                <Link
                  key={label}
                  to={to}
                  onClick={close}
                  className={`mb-1 flex items-center gap-3 rounded-2xl px-3 py-3 transition ${accent ? 'bg-[#ED0F02] text-white shadow-[0_6px_16px_rgba(237,15,2,0.25)]' : 'text-djassa-black hover:bg-djassa-cloud'}`}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent ? 'bg-white/20' : 'bg-djassa-red/10'}`}>
                    <Icon size={19} strokeWidth={2.3} className={accent ? 'text-white' : 'text-djassa-red'} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block font-jakarta text-[13px] font-extrabold ${accent ? 'text-white' : 'text-djassa-black'}`}>{label}</span>
                    <span className={`block truncate font-inter text-[10px] ${accent ? 'text-white/70' : 'text-djassa-slate'}`}>{desc}</span>
                  </span>
                  {badge > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ED0F02] px-1 text-[9px] font-extrabold text-white">{badge > 9 ? '9+' : badge}</span>}
                  {!accent && <ChevronRight size={15} className="text-djassa-slate" />}
                </Link>
              ))}
            </nav>

            {/* Pied : auth */}
            <div className="border-t border-djassa-black/8 bg-djassa-cloud/50 p-4">
              {isAuthenticated ? (
                <Link to="/moi" onClick={close} className="flex items-center gap-2 rounded-2xl bg-white p-3 shadow-card ring-1 ring-djassa-black/5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-djassa-red font-jakarta text-xs font-extrabold text-white">
                    {(user?.nom ?? 'D').slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-jakarta text-[12px] font-bold text-djassa-black">{user?.nom ?? 'Mon Djassa'}</span>
                  <ChevronRight size={15} className="text-djassa-slate" />
                </Link>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/login" onClick={close} className="rounded-xl border-2 border-djassa-black py-2.5 text-center font-jakarta text-[11px] font-extrabold text-djassa-black">Connexion</Link>
                  <Link to="/register" onClick={close} className="rounded-xl bg-[#ED0F02] py-2.5 text-center font-jakarta text-[11px] font-extrabold text-white">S'inscrire</Link>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
