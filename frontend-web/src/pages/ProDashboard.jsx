import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle, BadgeCheck, ChevronLeft, Store,
  TrendingUp, Zap, X,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatFCFA, formatNumberFR } from '../lib/format';
import { Modal, Spinner } from '../components/ui';

/** Dashboard Boutique Pro — stocks, ventes flash, CA, alertes (App Flow §6) */
export default function ProDashboard() {
  const { isPro, boutique } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [flashArticleId, setFlashArticleId] = useState('');
  const [flashPrix, setFlashPrix] = useState('');
  const [flashDuree, setFlashDuree] = useState('24');
  const [flashOpen, setFlashOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['boutique', 'dashboard'],
    queryFn: async () => (await api.get('/boutiques/me/dashboard')).data,
    enabled: isPro,
    refetchInterval: 15000,
  });

  const startFlash = useMutation({
    mutationFn: async () => (await api.post(`/products/${flashArticleId}/flash`, {
      prix_flash: Number(flashPrix),
      duree_heures: Number(flashDuree),
    })).data,
    onSuccess: () => {
      toast.success('Vente Flash lancée — elle remonte sur le carrousel.');
      setFlashOpen(false); setFlashArticleId(''); setFlashPrix('');
      queryClient.invalidateQueries({ queryKey: ['boutique', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'flash'] });
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Impossible de lancer la vente flash.'),
  });

  const stopFlash = useMutation({
    mutationFn: async (id) => api.delete(`/products/${id}/flash`),
    onSuccess: () => { toast.info('Vente Flash arrêtée.'); queryClient.invalidateQueries({ queryKey: ['boutique', 'dashboard'] }); },
  });

  const maxVente = useMemo(() => Math.max(1, ...(data?.ventes_par_jour ?? []).map((v) => Number(v.total ?? 0))), [data]);

  if (!isPro) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <Store size={40} className="mx-auto text-djassa-red" />
        <p className="mt-3 font-jakarta text-lg font-extrabold">Espace Boutique Pro</p>
        <p className="mt-1 text-sm text-djassa-slate">Cet espace est réservé aux vendeurs professionnels. Ouvrez votre boutique pour y accéder.</p>
        <Link to="/register" className="btn-red mt-5">Ouvrir ma boutique pro</Link>
      </div>
    );
  }

  if (isLoading) return <div className="flex justify-center py-24"><Spinner size={36} /></div>;

  const stats = data?.stats;
  const stockCritique = data?.stock_critique ?? [];
  const flashActives = data?.ventes_flash_actives ?? [];
  const ventesJour = [...(data?.ventes_par_jour ?? [])].reverse();

  return (
    <div className="mx-auto max-w-6xl px-3 pb-10 pt-4 sm:px-6">
      <Link to="/moi" className="inline-flex items-center gap-1 text-xs font-semibold text-djassa-slate hover:text-djassa-black"><ChevronLeft size={14} /> Mon Djassa</Link>

      {/* En-tête sombre pro */}
      <div className="mt-2 overflow-hidden rounded-3xl bg-djassa-black text-white">
        <div className="flex flex-wrap items-center gap-4 p-5">
          <div className="geo-pattern flex h-16 w-16 items-center justify-center rounded-2xl font-jakarta text-2xl font-extrabold text-white">{boutique?.nom_boutique?.slice(0, 1)?.toUpperCase() ?? 'B'}</div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 font-jakarta text-base font-extrabold sm:text-lg"><span className="truncate">{boutique?.nom_boutique}</span>{boutique?.verifie && <BadgeCheck size={18} className="shrink-0 fill-djassa-red text-white" />}</p>
            <Link to={`/boutique/${boutique?.slug}`} className="text-[11px] text-white/60 underline underline-offset-2 hover:text-white">/boutique/{boutique?.slug}</Link>
          </div>
          {!boutique?.verifie && <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">KYC en attente de vérification</span>}
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 divide-x divide-white/10 border-t border-white/10 sm:grid-cols-4">
          {[
            { label: 'CA libéré', value: formatFCFA(stats?.chiffre_affaires_fcfa ?? 0), accent: true },
            { label: 'Encaissé séquestré', value: formatFCFA(stats?.encaisse_securise_fcfa ?? 0) },
            { label: 'Ventes totales', value: formatNumberFR(stats?.ventes_total ?? 0) },
            { label: 'Note clients', value: Number(stats?.note_moyenne ?? 0) > 0 ? `★ ${Number(stats.note_moyenne).toFixed(1)} (${stats.nombre_avis})` : '—' },
          ].map((kpi) => (
            <div key={kpi.label} className="px-4 py-4">
              <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-white/50">{kpi.label}</p>
              <p className={`mt-1 font-jakarta text-sm font-extrabold leading-tight sm:text-base ${kpi.accent ? 'text-djassa-red' : 'text-white'}`}>{kpi.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Stock critique */}
        <section className="rounded-3xl border-2 border-djassa-red/40 bg-white p-4 lg:col-span-1">
          <h2 className="flex items-center gap-2 font-jakarta text-sm font-extrabold uppercase tracking-wide text-djassa-red"><AlertTriangle size={16} /> Stock critique (≤ 2)</h2>
          {stockCritique.length === 0 ? (
            <p className="mt-3 text-xs text-djassa-slate">Aucun article en stock critique. 👍</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {stockCritique.map((a) => (
                <li key={a.id} className="flex items-center gap-2.5 rounded-2xl bg-red-50 p-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-djassa-red font-jakarta text-sm font-extrabold text-white">{a.stock}</span>
                  <div className="min-w-0 flex-1">
                    <p className="clamp-2 text-[11px] font-bold leading-snug text-djassa-black">{a.titre}</p>
                    <p className="text-[10px] font-semibold text-djassa-slate">{formatFCFA(a.prix)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Ventes par jour (mini bar chart CSS) */}
        <section className="rounded-3xl bg-white p-4 lg:col-span-2">
          <h2 className="flex items-center gap-2 font-jakarta text-sm font-extrabold uppercase tracking-wide text-djassa-black"><TrendingUp size={16} className="text-djassa-red" /> Ventes par jour</h2>
          {ventesJour.length === 0 ? (
            <p className="mt-3 text-xs text-djassa-slate">Les premières ventes apparaîtront ici.</p>
          ) : (
            <div className="mt-3 flex h-40 items-end gap-1.5" role="img" aria-label="Histogramme des ventes par jour">
              {ventesJour.map((v) => {
                const h = Math.max(8, (Number(v.total ?? 0) / maxVente) * 100);
                return (
                  <div key={v.jour} className="group flex h-full flex-1 flex-col items-center justify-end gap-1">
                    <span className="text-[8px] font-bold text-djassa-red opacity-0 transition group-hover:opacity-100">{formatNumberFR(v.total)}</span>
                    <div className="w-full rounded-t-md bg-gradient-to-t from-djassa-red-dark to-djassa-red" style={{ height: `${h}%` }} />
                    <span className="text-[8px] text-djassa-slate">{new Date(v.jour).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Ventes Flash */}
      <section className="mt-4 rounded-3xl bg-djassa-black p-5 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-jakarta text-sm font-extrabold uppercase tracking-wide"><Zap size={16} className="text-yellow-400" /> Ventes Flash actives</h2>
            <p className="mt-0.5 text-[11px] text-white/55">Vos articles remontent en haut de la page d'accueil avec un compte à rebours.</p>
          </div>
          <button className="btn-red btn-sm" onClick={() => setFlashOpen(true)}><Zap size={14} /> Lancer une Vente Flash</button>
        </div>
        {flashActives.length === 0 ? (
          <p className="mt-4 text-xs text-white/50">Aucune vente flash active. Lancez-en une pour écouler votre stock !</p>
        ) : (
          <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {flashActives.map((a) => (
              <li key={a.id} className="flex items-center gap-3 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
                <img src={a.image_principale} alt="" className="h-14 w-14 rounded-xl object-cover" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
                <div className="min-w-0 flex-1">
                  <p className="clamp-2 text-[11px] font-bold leading-snug">{a.titre}</p>
                  <p className="font-jakarta text-xs font-extrabold text-yellow-300">{formatFCFA(a.prix_flash)} <span className="text-white/40 line-through">{formatFCFA(a.prix)}</span></p>
                </div>
                <button onClick={() => stopFlash.mutate(a.id)} className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white" aria-label="Arrêter la vente flash"><X size={16} /></button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Modale Vente Flash */}
      <FlashLaunchModal open={flashOpen} onClose={() => setFlashOpen(false)} onLaunch={(articleId, prix, duree) => { setFlashArticleId(articleId); setFlashPrix(prix); setFlashDuree(duree); startFlash.mutate(); }} pending={startFlash.isPending} />
    </div>
  );
}

function FlashLaunchModal({ open, onClose, onLaunch, pending }) {
  const [articleId, setArticleId] = useState('');
  const [prix, setPrix] = useState('');
  const [duree, setDuree] = useState('24');

  const { data, isLoading } = useQuery({
    queryKey: ['products', 'mine', 'flash-eligible', open],
    queryFn: async () => (await api.get('/products/mine')).data,
    enabled: open,
  });

  const eligible = (data?.data ?? []).filter((a) => a.statut === 'published' && a.condition === 'neuf');

  return (
    <Modal open={open} onClose={onClose} title="Lancer une Vente Flash"
      footer={<button className="btn-red w-full" disabled={!articleId || !prix || Number(prix) <= 0 || pending} onClick={() => onLaunch(articleId, prix, duree)}>{pending ? <Spinner size={18} /> : <Zap size={18} />} Lancer la vente flash</button>}>
      <label htmlFor="flash-article" className="label">Article neuf (boutique)</label>
      {isLoading ? <div className="flex justify-center py-4"><Spinner /></div> : (
        <select id="flash-article" className="input" value={articleId} onChange={(e) => setArticleId(e.target.value)}>
          <option value="">— Choisir un article en stock —</option>
          {eligible.map((a) => <option key={a.id} value={a.id}>{a.titre} — {formatFCFA(a.prix)}</option>)}
        </select>
      )}

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="flash-prix" className="label">Prix flash (FCFA)</label>
          <input id="flash-prix" type="number" min="0" inputMode="numeric" className="input font-jakarta font-bold" placeholder="Ex : 27 500" value={prix} onChange={(e) => setPrix(e.target.value)} />
        </div>
        <div>
          <label htmlFor="flash-duree" className="label">Durée</label>
          <select id="flash-duree" className="input" value={duree} onChange={(e) => setDuree(e.target.value)}>
            <option value="24">24 heures</option>
            <option value="48">48 heures</option>
            <option value="72">3 jours</option>
            <option value="168">7 jours</option>
          </select>
        </div>
      </div>
      <p className="mt-2 text-[10px] text-djassa-slate">Le prix flash doit être inférieur au prix catalogue. Un compte à rebours temps réel s'affiche sur la carte et la fiche.</p>
    </Modal>
  );
}
