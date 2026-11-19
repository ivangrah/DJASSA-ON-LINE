import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, ArrowRight, BadgeCheck, Bell, Boxes, ChevronRight, Eye, Heart,
  LayoutDashboard, Menu, Package, Search, Settings, ShoppingCart, Store,
  TrendingUp, X, Zap, AlertTriangle,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatFCFA, formatNumberFR } from '../lib/format';
import { Modal, Spinner } from '../components/ui';

export default function ProDashboard() {
  const { isPro, boutique } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [flashArticleId, setFlashArticleId] = useState('');
  const [flashPrix, setFlashPrix] = useState('');
  const [flashDuree, setFlashDuree] = useState('24');
  const [flashOpen, setFlashOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['boutique', 'dashboard'],
    queryFn: async () => (await api.get('/boutiques/me/dashboard')).data,
    enabled: isPro,
    refetchInterval: 15000,
  });

  const startFlash = useMutation({
    mutationFn: ({ id, prix, duree }) => api.post(`/products/${id}/flash`, { prix_flash: Number(prix), duree_heures: Number(duree) }),
    onSuccess: () => {
      toast.success('Vente flash lancée !');
      queryClient.invalidateQueries({ queryKey: ['boutique', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'flash'] });
      setFlashOpen(false);
    },
    onError: (error) => toast.error(error.response?.data?.message ?? 'Impossible de lancer la vente flash.'),
  });

  const stopFlash = useMutation({
    mutationFn: (id) => api.delete(`/products/${id}/flash`),
    onSuccess: () => {
      toast.info('Vente flash arrêtée.');
      queryClient.invalidateQueries({ queryKey: ['boutique', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'flash'] });
    },
  });

  const { data: mine } = useQuery({
    queryKey: ['products', 'mine', 'flash-eligible', flashOpen],
    queryFn: async () => (await api.get('/products/mine')).data,
    enabled: flashOpen,
  });

  if (!isPro) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <Store size={42} className="mx-auto text-djassa-red" />
        <p className="mt-4 font-jakarta text-lg font-extrabold text-djassa-black">Espace réservé aux vendeurs Pro</p>
        <p className="mt-1 font-inter text-sm text-djassa-slate">Ouvrez votre boutique pour accéder au dashboard.</p>
        <Link to="/register" className="btn-red btn-sm mt-5">Ouvrir ma boutique</Link>
      </div>
    );
  }

  if (isLoading || !data) return <div className="flex justify-center py-24"><Spinner size={36} /></div>;

  const stats = data.stats ?? {};
  const stockCritique = data.stock_critique ?? [];
  const flashActives = data.ventes_flash_actives?.data ?? [];
  const ventesParJour = [...(data.ventes_par_jour ?? [])].reverse();
  const maxVente = Math.max(...ventesParJour.map((v) => Number(v.total)), 1);
  const eligible = (mine?.data ?? []).filter((a) => a.statut === 'published' && a.condition === 'neuf');

  const kpis = [
    { label: 'CA libéré', value: formatFCFA(stats.chiffre_affaires_fcfa ?? 0), icon: TrendingUp, accent: true, spark: [18, 30, 22, 40, 35, 55, 48] },
    { label: 'En séquestre', value: formatFCFA(stats.encaisse_securise_fcfa ?? 0), icon: Boxes, spark: [25, 20, 32, 28, 42, 38, 50] },
    { label: 'Ventes totales', value: formatNumberFR(stats.ventes_total ?? 0), icon: ShoppingCart, spark: [12, 25, 18, 35, 30, 45, 40] },
    { label: 'Note clients', value: `${Number(stats.note_moyenne ?? 0).toFixed(1)}/5`, icon: Heart, spark: [40, 42, 38, 45, 44, 48, 47] },
  ];

  const nav = [
    { label: 'Tableau de bord', Icon: LayoutDashboard, active: true },
    { label: 'Mes annonces', Icon: Package, to: '/moi' },
    { label: 'Ventes flash', Icon: Zap, to: '/moi' },
    { label: 'Ma boutique', Icon: Store, to: boutique ? `/boutique/${boutique.slug}` : '/moi' },
    { label: 'Paramètres', Icon: Settings, to: '/moi' },
  ];

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#f3f4f6] px-3 py-5 sm:px-6 sm:py-8">
      {/* Formes décoratives */}
      <div className="pointer-events-none fixed -left-16 top-1/3 h-64 w-64 rounded-full bg-djassa-red/10 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none fixed -right-20 bottom-10 h-72 w-72 rounded-full bg-djassa-red/10 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[28px] bg-white shadow-[0_20px_60px_rgba(18,18,18,0.1)]">
        {/* Header rouge */}
        <header className="relative overflow-hidden bg-gradient-to-r from-[#ED0F02] via-[#e00c00] to-[#b80b00] px-4 py-4 text-white sm:px-6">
          <div className="absolute -right-10 -top-16 h-40 w-40 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
          <div className="relative flex items-center gap-3">
            <button onClick={() => setSidebarOpen((v) => !v)} className="rounded-lg bg-white/15 p-2 lg:hidden" aria-label="Menu"><Menu size={18} /></button>
            <Link to="/" className="flex items-center gap-2">
              <img src="/images/logo-256.png" alt="" className="h-8 w-8 rounded-lg" />
              <span className="font-jakarta text-[13px] font-extrabold uppercase tracking-tight">Djassa <span className="text-white/70">Pro</span></span>
            </Link>
            <span className="ml-2 hidden rounded-full bg-white/15 px-2.5 py-1 font-jakarta text-[9px] font-extrabold uppercase tracking-widest ring-1 ring-white/20 sm:inline">Dashboard</span>
            <div className="ml-auto flex items-center gap-2">
              <label className="hidden items-center gap-2 rounded-full bg-black/20 px-3 py-2 ring-1 ring-white/15 md:flex">
                <Search size={14} className="text-white/70" />
                <input placeholder="Rechercher une vente…" className="w-32 bg-transparent font-inter text-[11px] text-white outline-none placeholder:text-white/60 lg:w-44" />
              </label>
              <button className="relative rounded-full bg-white/15 p-2" aria-label="Notifications"><Bell size={16} /><span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-white" /></button>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white font-jakarta text-xs font-extrabold text-[#ED0F02]">{(boutique?.nom_boutique ?? 'B').slice(0, 1).toUpperCase()}</span>
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Sidebar */}
          <aside className={`${sidebarOpen ? 'block' : 'hidden'} w-56 shrink-0 border-r border-djassa-black/8 bg-white px-3 py-5 lg:block`}>
            <p className="mb-3 px-3 font-jakarta text-[9px] font-extrabold uppercase tracking-[0.2em] text-djassa-slate">Menu vendeur</p>
            <nav className="space-y-1">
              {nav.map(({ label, Icon, active, to }) => {
                const cls = `flex items-center gap-3 rounded-xl px-3 py-2.5 font-jakarta text-[11px] font-bold transition ${active ? 'bg-[#ED0F02] text-white shadow-[0_6px_16px_rgba(237,15,2,0.25)]' : 'text-djassa-slate hover:bg-djassa-cloud hover:text-djassa-black'}`;
                return to ? <Link key={label} to={to} onClick={() => setSidebarOpen(false)} className={cls}><Icon size={16} /> {label}</Link> : <div key={label} className={cls}><Icon size={16} /> {label}</div>;
              })}
            </nav>
            <div className="mt-6 rounded-2xl bg-djassa-red/5 p-3 ring-1 ring-djassa-red/10">
              <img src="/images/dash-cart-sale.png" alt="" className="mx-auto h-16 object-contain" />
              <p className="mt-2 text-center font-jakarta text-[10px] font-extrabold text-djassa-black">Boostez vos ventes</p>
              <p className="mt-1 text-center font-inter text-[9px] text-djassa-slate">Lancez une vente flash pour attirer plus d'acheteurs.</p>
              <button onClick={() => setFlashOpen(true)} className="mt-3 w-full rounded-lg bg-[#ED0F02] py-2 font-jakarta text-[9px] font-extrabold text-white">Lancer une flash</button>
            </div>
          </aside>

          {/* Contenu */}
          <main className="min-w-0 flex-1 p-4 sm:p-6">
            {/* Profil boutique */}
            <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-djassa-black/8 bg-white p-3 shadow-card sm:p-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff2d1f] to-[#ED0F02] font-jakarta text-lg font-extrabold text-white">{boutique?.nom_boutique?.slice(0, 1) ?? 'B'}</span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 font-jakarta text-sm font-extrabold text-djassa-black">
                  <span className="truncate">{boutique?.nom_boutique ?? 'Ma boutique'}</span>
                  {boutique?.verifie && <BadgeCheck size={15} className="shrink-0 fill-djassa-red text-white" />}
                </p>
                <p className="font-inter text-[10px] text-djassa-slate">{boutique?.ville ?? 'Abidjan'} · {boutique?.categorie ?? 'Boutique Pro'}</p>
              </div>
              <button onClick={() => setFlashOpen(true)} className="inline-flex h-9 items-center gap-1.5 rounded-full border-2 border-[#ED0F02] px-4 font-jakarta text-[10px] font-extrabold text-[#ED0F02] transition hover:bg-[#ED0F02] hover:text-white"><Zap size={13} /> Vente flash</button>
              {boutique && <Link to={`/boutique/${boutique.slug}`} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-djassa-black px-4 font-jakarta text-[10px] font-extrabold text-white">Voir boutique <ArrowRight size={13} /></Link>}
            </div>

            {/* KPI */}
            <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {kpis.map(({ label, value, icon: Icon, accent, spark }) => (
                <div key={label} className={`relative overflow-hidden rounded-2xl p-4 shadow-card ${accent ? 'bg-gradient-to-br from-[#ff2d1f] to-[#ED0F02] text-white' : 'bg-white text-djassa-black ring-1 ring-djassa-black/6'}`}>
                  <div className="flex items-start justify-between">
                    <span className={`font-inter text-[10px] font-semibold uppercase tracking-wide ${accent ? 'text-white/80' : 'text-djassa-slate'}`}>{label}</span>
                    <Icon size={16} className={accent ? 'text-white' : 'text-djassa-red'} />
                  </div>
                  <p className="mt-2 font-jakarta text-lg font-extrabold tracking-tight sm:text-xl">{value}</p>
                  <svg viewBox="0 0 100 30" className={`mt-2 h-7 w-full ${accent ? 'text-white' : 'text-djassa-red'}`} preserveAspectRatio="none" aria-hidden="true">
                    <polyline points={spark.map((v, i) => `${i * (100 / (spark.length - 1))},${30 - v / 2}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              ))}
            </div>

            {/* Graphique + illustrations */}
            <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_280px]">
              <div className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-djassa-black/6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-jakarta text-sm font-extrabold text-djassa-black">Ventes par jour</h3>
                  <span className="font-inter text-[10px] text-djassa-slate">14 derniers jours · FCFA</span>
                </div>
                {ventesParJour.length ? (
                  <div className="flex h-40 items-end gap-1.5">
                    {ventesParJour.map((v, i) => (
                      <div key={i} className="group relative flex h-full flex-1 items-end">
                        <div className="w-full rounded-t-md bg-gradient-to-t from-djassa-red-dark to-djassa-red transition-all group-hover:opacity-80" style={{ height: `${Math.max((Number(v.total) / maxVente) * 100, 4)}%` }} />
                        <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-djassa-black px-1.5 py-0.5 font-inter text-[8px] text-white opacity-0 transition group-hover:opacity-100">{formatFCFA(v.total)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-40 items-center justify-center font-inter text-xs text-djassa-slate">Aucune vente libérée pour le moment.</div>
                )}
                <div className="mt-2 flex justify-between font-inter text-[9px] text-djassa-slate">
                  <span>{ventesParJour[0] ? new Date(ventesParJour[0].jour).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '—'}</span>
                  <span>{ventesParJour.at(-1) ? new Date(ventesParJour.at(-1).jour).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '—'}</span>
                </div>
              </div>

              <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-[#ED0F02] to-[#b80b00] p-4 text-white shadow-card">
                <div>
                  <p className="font-jakarta text-sm font-extrabold">Votre boutique grandit !</p>
                  <p className="mt-1 font-inter text-[10px] text-white/80">Suivez vos performances en temps réel et boostez vos ventes.</p>
                </div>
                <img src="/images/dash-phone.png" alt="Ventes mobile Djassa" className="mx-auto h-32 object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)]" />
                <Link to="/publier" className="inline-flex items-center justify-center gap-1 rounded-full bg-white py-2 font-jakarta text-[10px] font-extrabold text-[#ED0F02]">Ajouter un article <ArrowRight size={12} /></Link>
              </div>
            </div>

            {/* 3 cartes métriques */}
            <div className="mb-5 grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Articles en ligne', value: stats.articles_en_ligne ?? 0, Icon: Package, sub: 'publiés', color: 'text-[#ED0F02]' },
                { label: 'Stock critique', value: stockCritique.length, Icon: AlertTriangle, sub: 'à restock', color: 'text-amber-600' },
                { label: 'Avis clients', value: stats.nombre_avis ?? 0, Icon: Heart, sub: `★ ${Number(stats.note_moyenne ?? 0).toFixed(1)}`, color: 'text-djassa-red' },
              ].map(({ label, value, Icon, sub, color }) => (
                <div key={label} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-djassa-black/6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-djassa-red/10"><Icon size={19} className={color} /></span>
                  <div>
                    <p className="font-jakarta text-xl font-extrabold text-djassa-black">{value}</p>
                    <p className="font-inter text-[10px] text-djassa-slate">{label} · {sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stock critique + ventes flash */}
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-djassa-black/6">
                <h3 className="mb-3 flex items-center gap-2 font-jakarta text-sm font-extrabold text-djassa-black"><AlertTriangle size={15} className="text-amber-500" /> Stock critique</h3>
                {stockCritique.length ? (
                  <div className="space-y-2">
                    {stockCritique.map((a) => (
                      <div key={a.id} className="flex items-center gap-3 rounded-xl bg-amber-50 p-2.5">
                        <img src={a.image_principale ?? a.images?.[0]} alt="" className="h-10 w-10 rounded-lg object-cover" />
                        <div className="min-w-0 flex-1"><p className="truncate font-jakarta text-[11px] font-bold text-djassa-black">{a.titre}</p><p className="font-inter text-[9px] text-djassa-slate">{formatFCFA(a.prix)}</p></div>
                        <span className="rounded-full bg-amber-500 px-2 py-0.5 font-jakarta text-[9px] font-extrabold text-white">{a.stock} restant{a.stock > 1 ? 's' : ''}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="font-inter text-xs text-djassa-slate">Aucun article en stock critique ✅</p>}
              </div>

              <div className="relative overflow-hidden rounded-2xl bg-djassa-black p-4 text-white shadow-card">
                <div className="relative z-10">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 font-jakarta text-sm font-extrabold"><Zap size={15} className="text-djassa-red" /> Ventes flash actives</h3>
                    <button onClick={() => setFlashOpen(true)} className="rounded-full bg-[#ED0F02] px-3 py-1.5 font-jakarta text-[9px] font-extrabold">+ Lancer</button>
                  </div>
                  {flashActives.length ? (
                    <div className="space-y-2">
                      {flashActives.map((a) => (
                        <div key={a.id} className="flex items-center gap-3 rounded-xl bg-white/5 p-2.5 ring-1 ring-white/10">
                          <img src={a.image_principale} alt="" className="h-10 w-10 rounded-lg object-cover" />
                          <div className="min-w-0 flex-1"><p className="truncate font-jakarta text-[11px] font-bold">{a.titre}</p><p className="font-inter text-[9px] text-white/60"><span className="font-bold text-[#ff5a3c]">{formatFCFA(a.prix_flash)}</span> <span className="line-through">{formatFCFA(a.prix)}</span></p></div>
                          <button onClick={() => stopFlash.mutate(a.id)} className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Arrêter"><X size={14} /></button>
                        </div>
                      ))}
                    </div>
                  ) : <div className="flex items-center gap-3"><p className="font-inter text-xs text-white/60">Aucune vente flash en cours.</p><img src="/images/dash-blackfriday.png" alt="" className="h-16 object-contain" /></div>}
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <Link to="/moi" className="inline-flex items-center gap-1 font-inter text-[11px] text-djassa-slate hover:text-djassa-black"><ArrowLeft size={13} /> Mon Djassa</Link>
              <span className="font-inter text-[10px] text-djassa-slate">Mise à jour auto · 15s</span>
            </div>
          </main>
        </div>
      </div>

      {/* Modale lancement flash */}
      <Modal open={flashOpen} onClose={() => setFlashOpen(false)} title="Lancer une vente flash" footer={
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1"><p className="font-inter text-[10px] font-semibold text-djassa-slate">Nouveau prix</p><p className="font-jakarta text-sm font-extrabold text-djassa-black">{flashPrix ? formatFCFA(flashPrix) : '—'}</p></div>
          <button className="btn-red" disabled={!flashArticleId || !flashPrix || Number(flashPrix) <= 0 || startFlash.isPending} onClick={() => startFlash.mutate({ id: flashArticleId, prix: flashPrix, duree: flashDuree })}>{startFlash.isPending ? <Spinner size={16} /> : <Zap size={16} />} Lancer</button>
        </div>
      }>
        <div className="space-y-3">
          <div><label className="label">Article à promouvoir</label><select className="input" value={flashArticleId} onChange={(e) => setFlashArticleId(e.target.value)}><option value="">Choisir un article…</option>{eligible.map((a) => <option key={a.id} value={a.id}>{a.titre} — {formatFCFA(a.prix)}</option>)}</select></div>
          <div><label className="label">Prix flash (FCFA)</label><input type="number" min="1" className="input" placeholder="27 500" value={flashPrix} onChange={(e) => setFlashPrix(e.target.value)} /></div>
          <div><label className="label">Durée</label><select className="input" value={flashDuree} onChange={(e) => setFlashDuree(e.target.value)}><option value="24">24 heures</option><option value="48">48 heures</option><option value="72">72 heures</option><option value="168">7 jours</option></select></div>
          <p className="font-inter text-[10px] text-djassa-slate">Seuls les articles neufs publiés sont éligibles.</p>
        </div>
      </Modal>
    </div>
  );
}
