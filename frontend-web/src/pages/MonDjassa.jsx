import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BadgeCheck, Download, LayoutDashboard, LogOut, ShieldCheck,
  Trash2, Wallet,
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
  const [pinFor, setPinFor] = useState(null); // transaction à valider
  const [pinSuccessTx, setPinSuccessTx] = useState(null); // transaction validée → overlay de succès

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
      setPinSuccessTx(pinFor); // overlay pin-success (animation) avant de fermer la modale
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

  return (
    <div className="mx-auto max-w-5xl px-3 pb-10 pt-4 sm:px-6">
      {/* Carte profil */}
      <div className="overflow-hidden rounded-3xl bg-djassa-black text-white">
        <div className="flex flex-wrap items-center gap-4 p-5">
          <Avatar name={user.nom} size={72} tone="red" />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 font-jakarta text-lg font-extrabold leading-tight">
              <span className="truncate">{user.nom}</span>
              {user.kyc_status === 'verified' && <BadgeCheck size={18} className="fill-djassa-red text-white" />}
            </p>
            <p className="truncate text-[11px] text-white/60">{user.email ?? user.telephone} · {user.ville}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white/80">{isPro ? 'Vendeur Pro' : user.role === 'admin' ? 'Admin' : 'Particulier'}</span>
              <span className="flex items-center gap-1.5 text-[10px] text-white/60">Score confiance
                <span className="h-1.5 w-20 overflow-hidden rounded-full bg-white/15"><span className="block h-full rounded-full bg-djassa-red" style={{ width: `${user.score_confiance ?? 50}%` }} /></span>
                <strong className="text-white">{user.score_confiance ?? 50}</strong>
              </span>
            </div>
          </div>
          <button className="rounded-full p-2.5 text-white/60 transition hover:bg-white/10 hover:text-white" onClick={logout} aria-label="Se déconnecter"><LogOut size={20} /></button>
        </div>

        {/* Portefeuille */}
        <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-white/5 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <Wallet size={22} className="text-djassa-red" />
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/55">Portefeuille Djassa</p>
              <p className="font-jakarta text-xl font-extrabold text-white">{formatFCFA(user.solde_portefeuille ?? 0)}</p>
            </div>
          </div>
          {isPro && (
            <Link to="/pro/dashboard" className="btn-red btn-sm"><LayoutDashboard size={15} /> Dashboard Pro</Link>
          )}
        </div>
      </div>

      {/* Onglets */}
      <div className="no-scrollbar mt-4 flex gap-1.5 overflow-x-auto pb-1" role="tablist">
        {[
          { key: 'annonces', label: `Mes annonces (${myArticles.length})` },
          { key: 'ventes', label: `Mes ventes (${ventes.length})` },
          { key: 'achats', label: `Mes achats (${achats.length})` },
        ].map(({ key, label }) => (
          <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={tab === key ? 'pill-black-active' : 'pill-idle'}>{label}</button>
        ))}
      </div>

      {/* Contenu onglets */}
      {tab === 'annonces' && (
        <div className="mt-3">
          {loadingMine ? <div className="flex justify-center p-8"><Spinner /></div> : myArticles.length === 0 ? (
            <EmptyState title="Aucune annonce publiée" hint="Publiez votre premier article en moins de 60 secondes." action={<Link to="/publier" className="btn-red btn-sm">Publier maintenant</Link>} />
          ) : (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {myArticles.map((a) => {
                const meta = ARTICLE_STATUS[a.statut] ?? ARTICLE_STATUS.draft;
                return (
                  <li key={a.id} className="djassa-card flex items-center gap-3 p-2.5">
                    <img src={a.image_principale} alt="" className="h-16 w-16 rounded-xl object-cover bg-djassa-cloud" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
                    <div className="min-w-0 flex-1">
                      <Link to={`/article/${a.id}`} className="clamp-2 text-[11px] font-bold leading-snug text-djassa-black hover:text-djassa-red">{a.titre}</Link>
                      <p className="mt-0.5 font-jakarta text-xs font-extrabold">{formatFCFA(a.prix_actuel ?? a.prix)}</p>
                      <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide ${meta.cls}`}>{meta.label}</span>
                    </div>
                    <button onClick={() => archive.mutate(a.id)} className="rounded-full p-2 text-djassa-slate transition hover:bg-red-50 hover:text-djassa-red" aria-label="Archiver l’annonce"><Trash2 size={16} /></button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {['ventes', 'achats'].includes(tab) && (
        <div className="mt-3">
          {loadingTx ? <div className="flex justify-center p-8"><Spinner /></div> : (tab === 'ventes' ? ventes : achats).length === 0 ? (
            <EmptyState title="Aucune transaction" hint="Les achats et trocs réglés via l'escrow GeniusPay apparaîtront ici." />
          ) : (
            <ul className="space-y-2">
              {(tab === 'ventes' ? ventes : achats).map((tx) => {
                const meta = ESCROW_STATUS[tx.escrow_status] ?? ESCROW_STATUS.initiated;
                const canRelease = tab === 'ventes' && tx.escrow_status === 'held';
                return (
                  <li key={tx.id} className="djassa-card flex flex-wrap items-center gap-3 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="clamp-2 text-xs font-bold text-djassa-black">{tx.article?.titre ?? 'Article'}</p>
                      <p className="mt-0.5 text-[10px] text-djassa-slate">{tx.type === 'troc_mixte' ? 'Troc mixte (soulte)' : 'Achat direct'} · {timeAgo(tx.created_at)}</p>
                      <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide ${meta.cls}`}>{meta.label}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-jakarta text-sm font-extrabold text-djassa-black">{formatFCFA(tx.montant)}</p>
                      <div className="mt-1 flex items-center justify-end gap-1">
                        {canRelease && (
                          <button className="btn-red btn-sm !px-3 !py-1.5 text-[10px]" onClick={() => setPinFor(tx)}><ShieldCheck size={13} /> Valider PIN</button>
                        )}
                        <button className="rounded-full p-2 text-djassa-slate transition hover:bg-djassa-cloud hover:text-djassa-black" title="Reçu / facture PDF" onClick={() => downloadAuthenticated(`/transactions/${tx.id}/receipt`, `djassa-recu-${tx.id.slice(0, 8)}.pdf`)} aria-label="Télécharger le reçu PDF"><Download size={16} /></button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Overlay succès PIN — animation Djassa (Rive si disponible, sinon SVG) */}
      {pinSuccessTx && <PinSuccess amount={pinSuccessTx.montant} onClose={() => setPinSuccessTx(null)} />}

      {/* Modale PIN — remise physique */}
      <Modal open={Boolean(pinFor)} onClose={() => setPinFor(null)} title="Valider la remise — code PIN">
        {pinFor && (
          <div className="text-center">
            <ShieldCheck size={40} className="mx-auto text-djassa-red" />
            <p className="mt-2 text-sm font-semibold text-djassa-black">{pinFor.article?.titre}</p>
            <p className="text-[11px] text-djassa-slate">Demandez le code PIN à 4 chiffres à l'acheteur et saisissez-le ci-dessous pour libérer {formatFCFA(pinFor.montant)}.</p>
            <div className="mt-4">
              <PinInput onComplete={(pin) => verifyPin.mutate({ transactionId: pinFor.id, pin })} key={pinFor.id} />
            </div>
            <p className="mt-3 text-[10px] text-djassa-slate">5 tentatives maximum — au-delà, le séquestre est bloqué.</p>
            {verifyPin.isPending && <div className="mt-2 flex justify-center"><Spinner /></div>}
          </div>
        )}
      </Modal>
    </div>
  );
}
