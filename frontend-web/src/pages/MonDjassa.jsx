import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BadgeCheck, Bell, Boxes, Download, LayoutDashboard, LogOut, Menu,
  Package, Search, ShieldCheck, ShoppingBag, ShoppingCart, Trash2,
  TrendingUp, Wallet, X,
} from 'lucide-react';
import { api, downloadAuthenticated } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ARTICLE_STATUS, ESCROW_STATUS, formatFCFA, timeAgo } from '../lib/format';
import { Avatar, EmptyState, Modal, PinInput, Spinner } from '../components/ui';
import PinSuccess from '../components/PinSuccess';

export default function MonDjassa() {
  const { user, isPro, logout, isAuthenticated } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('annonces');
  const [pinFor, setPinFor] = useState(null);
  const [pinSuccessTx, setPinSuccessTx] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: mine, isLoading: loadingMine } = useQuery({
    queryKey: ['products', 'mine'],
    queryFn: async () => (await api.get('/products/mine')).data,
    enabled: isAuthenticated,
  });

  const { data: txData, isLoading: loadingTx } = useQuery({
    queryKey: ['transactions', 'mine'],
    queryFn: async () => (await api.get('/transactions')).data,
    enabled: isAuthenticated,
    refetchInterval: 10000,
  });

  const verifyPin = useMutation({
    mutationFn: async ({ transactionId, pin }) => (await api.post(`/transactions/${transactionId}/verify-pin`, { pin })).data,
    onSuccess: () => {
      setPinSuccessTx(pinFor);
      setPinFor(null);
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Code PIN incorrect.'),
  });

  const archive = useMutation({
    mutationFn: async (id) => api.delete(`/products/${id}`),
    onSuccess: () => { toast.info('Annonce archivée.'); queryClient.invalidateQueries({ queryKey: ['products', 'mine'] }); },
  });

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="font-jakarta text-lg font-extrabold">Connectez-vous à votre Djassa</p>
        <p className="mt-1 text-sm text-djassa-slate">Vos annonces, transactions et votre portefeuille vous attendent.</p>
        <Link to="/login" className="btn-red mt-5">Se connecter</Link>
      </div>
    );
  }

  const myArticles = mine?.data ?? [];
  const transactions = txData?.data ?? [];
  const ventes = transactions.filter((t) => t.role_utilisateur === 'vendeur');
  const achats = transactions.filter((t) => t.role_utilisateur === 'acheteur');
  const heldVentes = ventes.filter((t) => t.escrow_status === 'held');
  const score = user.score_confiance ?? 50;

  const kpis = [
    { label: 'Portefeuille', value: formatFCFA(user.solde_portefeuille ?? 0), Icon: Wallet, accent: true },
    { label: 'Mes annonces', value: myArticles.length, Icon: Package },
    { label: 'Ventes', value: ventes.length, Icon: ShoppingCart },
    { label: 'Score confiance', value: `${score}/100`, Icon: TrendingUp },
  ];

  const nav = [
    { key: 'annonces', label: 'Mes annonces', Icon: Package },
    { key: 'ventes', label: 'Mes ventes', Icon: ShoppingCart },
    { key: 'achats', label: 'Mes achats', Icon: ShoppingBag },
  ];

  const tabContent = () => {
    if (tab === 'annonces') {
      if (loadingMine) return <div className="flex justify-center p-8"><Spinner /></div>;
      if (!myArticles.length) return <EmptyState art="box" title="Aucune annonce publiée" hint="Publiez votre premier article en moins de 60 secondes." action={<Link to="/publier" className="btn-red btn-sm">Publier maintenant</Link>} />;
      return (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {myArticles.map((a) => {
            const meta = ARTICLE_STATUS[a.statut] ?? ARTICLE_STATUS.draft;
            return (
              <li key={a.id} className="flex items-center gap-3 rounded-2xl border border-djassa-black/8 bg-white p-2.5 shadow-card">
                <img src={a.image_principale} alt="" className="h-16 w-16 rounded-xl object-cover bg-djassa-cloud" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
                <div className="min-w-0 flex-1">
                  <Link to={`/article/${a.id}`} className="clamp-2 text-[11px] font-bold leading-snug text-djassa-black hover:text-djassa-red">{a.titre}</Link>
                  <p className="mt-0.5 font-jakarta text-xs font-extrabold">{formatFCFA(a.prix_actuel ?? a.prix)}</p>
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide ${meta.cls}`}>{meta.label}</span>
                </div>
                <button onClick={() => archive.mutate(a.id)} className="rounded-full p-2 text-djassa-slate transition hover:bg-red-50 hover:text-djassa-red" aria-label="Archiver l'annonce"><Trash2 size={16} /></button>
              </li>
            );
          })}
        </ul>
      );
    }
    const list = tab === 'ventes' ? ventes : achats;
    if (loadingTx) return <div className="flex justify-center p-8"><Spinner /></div>;
    if (!list.length) return <EmptyState title="Aucune transaction" hint="Les achats et trocs réglés via l'escrow GeniusPay apparaîtront ici." />;
    return (
      <ul className="space-y-2">
        {list.map((tx) => {
          const meta = ESCROW_STATUS[tx.escrow_status] ?? ESCROW_STATUS.initiated;
          const canRelease = tab === 'ventes' && tx.escrow_status === 'held';
          return (
            <li key={tx.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-djassa-black/8 bg-white p-3 shadow-card">
              <div className="min-w-0 flex-1">
                <p className="clamp-2 text-xs font-bold text-djassa-black">{tx.article?.titre ?? 'Article'}</p>
                <p className="mt-0.5 text-[10px] text-djassa-slate">{tx.type === 'troc_mixte' ? 'Troc mixte (soulte)' : 'Achat direct'} · {timeAgo(tx.created_at)}</p>
                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide ${meta.cls}`}>{meta.label}</span>
              </div>
              <div className="text-right">
                <p className="font-jakarta text-sm font-extrabold text-djassa-black">{formatFCFA(tx.montant)}</p>
                <div className="mt-1 flex items-center justify-end gap-1">
                  {canRelease && <button className="btn-red btn-sm !px-3 !py-1.5 text-[10px]" onClick={() => setPinFor(tx)}><ShieldCheck size={13} /> Valider PIN</button>}
                  <button className="rounded-full p-2 text-djassa-slate transition hover:bg-djassa-cloud hover:text-djassa-black" title="Reçu / facture PDF" onClick={() => downloadAuthenticated(`/transactions/${tx.id}/receipt`, `djassa-recu-${tx.id.slice(0, 8)}.pdf`)} aria-label="Télécharger le reçu PDF"><Download size={16} /></button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#f3f4f6] px-3 py-5 sm:px-6 sm:py-8">
      <div className="pointer-events-none fixed -left-20 top-1/4 h-64 w-64 rounded-full bg-djassa-red/10 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none fixed -right-20 bottom-10 h-72 w-72 rounded-full bg-djassa-red/10 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[28px] bg-white shadow-[0_20px_60px_rgba(18,18,18,0.1)]">
        {/* Header rouge */}
        <header className="relative overflow-hidden bg-gradient-to-r from-[#ED0F02] via-[#e00c00] to-[#b80b00] px-4 py-4 text-white sm:px-6">
          <div className="absolute -right-10 -top-16 h-40 w-40 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
          <div className="relative flex items-center gap-3">
            <button onClick={() => setMenuOpen((v) => !v)} className="rounded-lg bg-white/15 p-2 lg:hidden" aria-label="Menu"><Menu size={18} /></button>
            <Link to="/" className="flex items-center gap-2">
              <img src="/images/logo-256.png" alt="" className="h-8 w-8 rounded-lg" />
              <span className="font-jakarta text-[13px] font-extrabold uppercase tracking-tight">Djassa <span className="text-white/70">Online</span></span>
            </Link>
            <span className="ml-2 hidden rounded-full bg-white/15 px-2.5 py-1 font-jakarta text-[9px] font-extrabold uppercase tracking-widest ring-1 ring-white/20 sm:inline">Mon espace</span>
            <div className="ml-auto flex items-center gap-2">
              <label className="hidden items-center gap-2 rounded-full bg-black/20 px-3 py-2 ring-1 ring-white/15 md:flex">
                <Search size={14} className="text-white/70" />
                <input placeholder="Rechercher…" className="w-28 bg-transparent font-inter text-[11px] text-white outline-none placeholder:text-white/60 lg:w-40" />
              </label>
              <button className="relative rounded-full bg-white/15 p-2" aria-label="Notifications"><Bell size={16} /><span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-white" /></button>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white font-jakarta text-xs font-extrabold text-[#ED0F02]">{user.nom?.slice(0, 1).toUpperCase() ?? 'D'}</span>
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Sidebar */}
          <aside className={`${menuOpen ? 'block' : 'hidden'} w-56 shrink-0 border-r border-djassa-black/8 bg-white px-3 py-5 lg:block`}>
            <p className="mb-3 px-3 font-jakarta text-[9px] font-extrabold uppercase tracking-[0.2em] text-djassa-slate">Navigation</p>
            <nav className="space-y-1">
              {nav.map(({ key, label, Icon }) => (
                <button key={key} onClick={() => { setTab(key); setMenuOpen(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 font-jakarta text-[11px] font-bold transition ${tab === key ? 'bg-[#ED0F02] text-white shadow-[0_6px_16px_rgba(237,15,2,0.25)]' : 'text-djassa-slate hover:bg-djassa-cloud hover:text-djassa-black'}`}>
                  <Icon size={16} /> {label}
                </button>
              ))}
              {isPro && <Link to="/pro/dashboard" className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-jakarta text-[11px] font-bold text-djassa-slate transition hover:bg-djassa-cloud hover:text-djassa-black"><LayoutDashboard size={16} /> Dashboard Pro</Link>}
            </nav>
            <div className="mt-6 rounded-2xl bg-djassa-red/5 p-3 ring-1 ring-djassa-red/10">
              <img src="/images/dash-cart-sale.png" alt="" className="mx-auto h-16 object-contain" />
              <p className="mt-2 text-center font-jakarta text-[10px] font-extrabold text-djassa-black">Vendez plus vite</p>
              <p className="mt-1 text-center font-inter text-[9px] text-djassa-slate">Publiez vos articles et trouvez des acheteurs.</p>
              <Link to="/publier" className="mt-3 block rounded-lg bg-[#ED0F02] py-2 text-center font-jakarta text-[9px] font-extrabold text-white">Publier un article</Link>
            </div>
            <button onClick={logout} className="mt-4 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 font-jakarta text-[11px] font-bold text-djassa-slate transition hover:bg-red-50 hover:text-djassa-red"><LogOut size={16} /> Déconnexion</button>
          </aside>

          {/* Contenu */}
          <main className="min-w-0 flex-1 p-4 sm:p-6">
            {/* Profil */}
            <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-djassa-black/8 bg-white p-3 shadow-card sm:p-4">
              <Avatar name={user.nom} size={52} tone="red" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 font-jakarta text-sm font-extrabold text-djassa-black">
                  <span className="truncate">{user.nom}</span>
                  {user.kyc_status === 'verified' && <BadgeCheck size={15} className="shrink-0 fill-djassa-red text-white" />}
                </p>
                <p className="truncate font-inter text-[10px] text-djassa-slate">{user.email ?? user.telephone} · {user.ville}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-djassa-red/10 px-2 py-0.5 font-jakarta text-[9px] font-extrabold text-djassa-red">{isPro ? 'Vendeur Pro' : user.role === 'admin' ? 'Admin' : 'Particulier'}</span>
                  <span className="flex items-center gap-1.5 font-inter text-[9px] text-djassa-slate">Score
                    <span className="h-1.5 w-20 overflow-hidden rounded-full bg-djassa-cloud"><span className="block h-full rounded-full bg-[#ED0F02]" style={{ width: `${score}%` }} /></span>
                    <strong className="text-djassa-black">{score}</strong>
                  </span>
                </div>
              </div>
              {isPro && <Link to="/pro/dashboard" className="hidden rounded-full bg-djassa-black px-4 py-2 font-jakarta text-[10px] font-extrabold text-white sm:inline-flex">Dashboard Pro →</Link>}
            </div>

            {/* KPI */}
            <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {kpis.map(({ label, value, Icon, accent }) => (
                <div key={label} className={`relative overflow-hidden rounded-2xl p-4 shadow-card ${accent ? 'bg-gradient-to-br from-[#ff2d1f] to-[#ED0F02] text-white' : 'bg-white text-djassa-black ring-1 ring-djassa-black/6'}`}>
                  <div className="flex items-start justify-between">
                    <span className={`font-inter text-[10px] font-semibold uppercase tracking-wide ${accent ? 'text-white/80' : 'text-djassa-slate'}`}>{label}</span>
                    <Icon size={16} className={accent ? 'text-white' : 'text-djassa-red'} />
                  </div>
                  <p className="mt-2 font-jakarta text-lg font-extrabold tracking-tight sm:text-xl">{value}</p>
                </div>
              ))}
            </div>

            {/* Bannière illustration + onglets */}
            <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_280px]">
              <div className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-djassa-black/6">
                <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1" role="tablist">
                  {nav.map(({ key, label }) => (
                    <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={tab === key ? 'pill-black-active' : 'pill-idle'}>{label}</button>
                  ))}
                </div>
                <div className="mt-4">{tabContent()}</div>
              </div>
              <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-[#ED0F02] to-[#b80b00] p-4 text-white shadow-card">
                <div>
                  <p className="font-jakarta text-sm font-extrabold">{heldVentes.length ? `${heldVentes.length} vente${heldVentes.length > 1 ? 's' : ''} à valider` : 'Tout est à jour !'}</p>
                  <p className="mt-1 font-inter text-[10px] text-white/80">{heldVentes.length ? 'Retirez le code PIN de l’acheteur pour libérer les fonds.' : 'Vos transactions sont suivies en temps réel.'}</p>
                </div>
                <img src="/images/dash-phone.png" alt="Ventes mobile Djassa" className="mx-auto h-32 object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)]" />
                <Link to="/publier" className="inline-flex items-center justify-center gap-1 rounded-full bg-white py-2 font-jakarta text-[10px] font-extrabold text-[#ED0F02]">Publier un article →</Link>
              </div>
            </div>
          </main>
        </div>
      </div>

      {pinSuccessTx && <PinSuccess amount={pinSuccessTx.montant} onClose={() => setPinSuccessTx(null)} />}

      <Modal open={Boolean(pinFor)} onClose={() => setPinFor(null)} title="Valider la remise — code PIN">
        {pinFor && (
          <div className="text-center">
            <ShieldCheck size={40} className="mx-auto text-djassa-red" />
            <p className="mt-2 text-sm font-semibold text-djassa-black">{pinFor.article?.titre}</p>
            <p className="text-[11px] text-djassa-slate">Demandez le code PIN à 4 chiffres à l'acheteur et saisissez-le ci-dessous pour libérer {formatFCFA(pinFor.montant)}.</p>
            <div className="mt-4"><PinInput onComplete={(pin) => verifyPin.mutate({ transactionId: pinFor.id, pin })} key={pinFor.id} /></div>
            <p className="mt-3 text-[10px] text-djassa-slate">5 tentatives maximum — au-delà, le séquestre est bloqué.</p>
            {verifyPin.isPending && <div className="mt-2 flex justify-center"><Spinner /></div>}
          </div>
        )}
      </Modal>
    </div>
  );
}
