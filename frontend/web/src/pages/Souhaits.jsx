import { useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { usePageReveal } from '../hooks/usePageReveal';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeftRight, Eye, Plus, Search, Tag, X } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatFCFA, timeAgo } from '../lib/format';
import { Avatar, EmptyState, Modal, Spinner } from '../components/ui';
import { PUBLISH_CATEGORIES } from '../lib/categories';


/** Carte de souhait isolée (memoïsée via React dans la liste virtuelle). */
function SouhaitCard({ s, onRespond }) {
  return (
    <article className="djassa-card card-lift flex gap-3 p-3">
      <Avatar name={s.utilisateur?.nom} size={42} />
      <div className="min-w-0 flex-1">
        <p className="font-spacegrotesk text-[13px] font-bold leading-snug text-djassa-black">{s.titre}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-djassa-black/70">
          <span className="font-semibold text-djassa-black">par {s.utilisateur?.nom}</span>
          {s.budget_max && <span className="flex items-center gap-1"><Tag size={16} />Budget max : {formatFCFA(s.budget_max)}</span>}
          <span className="flex items-center gap-1"><Eye size={16} />{s.vues}</span>
          <span>{timeAgo(s.created_at)}</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {s.categorie && <span className="rounded-[5px] bg-djassa-gray/15 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-djassa-black/70">{s.categorie}</span>}
          {s.accepte_troc && <span className="badge-troc !px-2 !py-0.5"><ArrowLeftRight size={9} strokeWidth={3} /> Troc accepté</span>}
          <button className="ml-auto btn-black btn-sm !px-3 !py-1.5 text-[10px]" onClick={() => onRespond(s)}>J'ai ça !</button>
        </div>
      </div>
    </article>
  );
}

/** Mur des Souhaits — recherche inversée (PRD §3.5) */
export default function Souhaits() {
  const { isAuthenticated } = useAuth();
  const scope = useRef(null);
  usePageReveal(scope);
  const toast = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('tous'); // tous | miens
  const [q, setQ] = useState('');
  const [composeOpen, setComposeOpen] = useState(false);
  const [respondFor, setRespondFor] = useState(null); // souhait sélectionné
  const [form, setForm] = useState({ titre: '', description: '', budget_max: '', categorie: 'High-Tech', accepte_troc: true });
  const [respondArticleId, setRespondArticleId] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['souhaits', tab, q],
    queryFn: async () => {
      const endpoint = tab === 'miens' ? '/souhaits/mine' : '/souhaits';
      return (await api.get(endpoint, { params: q && tab === 'tous' ? { q } : undefined })).data;
    },
  });

  const souhaits = data?.data ?? [];
  const listRef = useRef(null);
  const virtualizer = useVirtualizer({
    count: souhaits.length > 20 ? souhaits.length : 0,
    getScrollElement: () => listRef.current,
    estimateSize: () => 130,
    overscan: 5,
  });

  const { data: mine } = useQuery({
    queryKey: ['products', 'mine'],
    queryFn: async () => (await api.get('/products/mine')).data,
    enabled: Boolean(respondFor && isAuthenticated),
  });
  const myArticles = (mine?.data ?? []).filter((a) => a.statut === 'published');

  const publish = useMutation({
    mutationFn: async () => (await api.post('/souhaits', {
      ...form,
      budget_max: form.budget_max ? Number(form.budget_max) : null,
    })).data,
    // Optimistic UI avec rollback (règle 11)
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['souhaits'] });
      const key = ['souhaits', tab, q];
      const previous = queryClient.getQueryData(key);
      const optimistic = {
        id: `temp-${Date.now()}`, titre: form.titre, description: form.description,
        budget_max: form.budget_max, categorie: form.categorie,
        accepte_troc: form.accepte_troc, statut: 'active', vues: 0,
        utilisateur: { nom: 'Vous' }, created_at: new Date().toISOString(),
      };
      queryClient.setQueryData(key, (old) => ({ ...old, data: [optimistic, ...(old?.data ?? [])] }));
      return { previous, key };
    },
    onSuccess: () => {
      toast.success('Votre souhait est en ligne — les vendeurs compatibles vont être alertés.');
      setComposeOpen(false);
      setForm({ titre: '', description: '', budget_max: '', categorie: 'High-Tech', accepte_troc: true });
      queryClient.invalidateQueries({ queryKey: ['souhaits'] });
    },
    onError: (e, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(ctx.key, ctx.previous);
      toast.error(e.response?.data?.message ?? 'Impossible de publier le souhait (8 caractères minimum).');
    },
  });

  const respond = useMutation({
    mutationFn: async () => (await api.post(`/souhaits/${respondFor.id}/respond`, { article_id: respondArticleId })).data,
    onSuccess: () => {
      toast.success('Votre proposition a été envoyée au souhaiteur.');
      setRespondFor(null);
      setRespondArticleId('');
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Échec de l’envoi.'),
  });

  return (
    <div ref={scope} data-reveal className="mx-auto max-w-4xl px-3 pb-10 pt-4 sm:px-6">
      {/* En-tête */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-spacegrotesk font-bold uppercase tracking-[0.22em] text-djassa-red">Mur des souhaits</p>
          <h1 className="font-spacegrotesk text-xl font-extrabold leading-tight text-djassa-black sm:text-2xl">Publiez ce que<br />vous <span className="text-djassa-red">cherchez</span></h1>
        </div>
        <button className="btn-red btn-sm shrink-0" onClick={() => (isAuthenticated ? setComposeOpen(true) : toast.info('Connectez-vous pour publier un souhait.'))}>
          <Plus size={16} /> Publier un besoin
        </button>
        <img src="/images/illustrations/shopper-phone.webp" alt="" aria-hidden="true" className="art-warm pointer-events-none hidden h-24 w-auto shrink-0 select-none object-contain md:block"  loading="lazy" decoding="async" />
      </div>

      {/* Onglets + recherche */}
      <div className="mt-4 flex items-center gap-2">
        <div className="flex rounded-[5px] bg-white p-1">
          {[{ k: 'tous', l: 'Tous les souhaits' }, { k: 'miens', l: 'Les miens' }].map(({ k, l }) => (
            <button key={k} onClick={() => setTab(k)} className={`rounded-[5px] px-4 py-1.5 text-xs font-semibold transition ${tab === k ? 'bg-djassa-black text-white' : 'text-djassa-black/70'}`}>{l}</button>
          ))}
        </div>
        {tab === 'tous' && (
          <label className="flex h-9 flex-1 items-center gap-2 rounded-[5px] bg-white px-3 shadow-card focus-within:ring-2 focus-within:ring-djassa-red/25">
            <Search size={15} className="text-djassa-black/70" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrer les souhaits…" className="w-full bg-transparent text-sm outline-none" aria-label="Filtrer" />
            {q && <button onClick={() => setQ('')} aria-label="Effacer"><X size={14} /></button>}
          </label>
        )}
      </div>

      {/* Liste */}
      <div className="mt-4 space-y-2.5">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-24 w-full" />)
        ) : souhaits.length === 0 ? (
          <EmptyState
            art="wishlist"
            title={tab === 'miens' ? 'Aucun souhait publié' : 'Rien ne correspond'}
            hint={tab === 'miens' ? 'Publiez ce que vous cherchez — les vendeurs compatibles vous contacteront.' : 'Élargissez votre recherche ou publiez le vôtre.'}
            action={tab === 'tous' ? <button className="btn-red btn-sm" onClick={() => setComposeOpen(true)}>Publier un besoin</button> : null}
          />
        ) : souhaits.length > 20 ? (
          <div ref={listRef} className="max-h-[70vh] overflow-y-auto">
            <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
              {virtualizer.getVirtualItems().map((row) => {
                const s = souhaits[row.index];
                return (
                  <div key={s.id} style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${row.start}px)` }}>
                    <SouhaitCard s={s} onRespond={setRespondFor} />
                  </div>
                );
              })}
            </div>
          </div>
        ) : souhaits.map((s) => <SouhaitCard key={s.id} s={s} onRespond={setRespondFor} />)}
      </div>

      {/* Modale publication */}
      <Modal open={composeOpen} onClose={() => setComposeOpen(false)} title="Publier un besoin"
        footer={<button className="btn-red w-full" disabled={publish.isPending || form.titre.trim().length < 8} onClick={() => publish.mutate()}>{publish.isPending ? <Spinner size={18} /> : <Plus size={18} />} Publier le souhait</button>}>
        <div className="space-y-3">
          <div>
            <label htmlFor="s-titre" className="label">Je recherche…</label>
            <input id="s-titre" autoFocus className="input" placeholder="Ex : groupe électrogène d’occasion, budget 80 000 FCFA ou troc" value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} maxLength={200} />
            <p className="mt-1 text-[10px] text-djassa-black/70">8 caractères minimum — soyez précis, les vendeurs sont alertés automatiquement.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="s-budget" className="label">Budget max (FCFA)</label>
              <input id="s-budget" type="number" min="0" inputMode="numeric" className="input" placeholder="80 000" value={form.budget_max} onChange={(e) => setForm({ ...form, budget_max: e.target.value })} />
            </div>
            <div>
              <label htmlFor="s-cat" className="label">Rayon</label>
              <select id="s-cat" className="input" value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })}>
                {PUBLISH_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="s-desc" className="label">Précisions (facultatif)</label>
            <textarea id="s-desc" rows={2} className="input" placeholder="État, marque, emplacement…" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-[5px] bg-djassa-gray/15 p-3">
            <span className="text-xs font-semibold text-djassa-black">J'accepte aussi le troc</span>
            <input type="checkbox" className="h-5 w-5 accent-[#780000]" checked={form.accepte_troc} onChange={(e) => setForm({ ...form, accepte_troc: e.target.checked })} />
          </label>
        </div>
      </Modal>

      {/* Modale réponse avec un de mes articles */}
      <Modal open={Boolean(respondFor)} onClose={() => setRespondFor(null)} title="Vous avez cet article ?"
        footer={<button className="btn-red w-full" disabled={!respondArticleId || respond.isPending} onClick={() => respond.mutate()}>{respond.isPending ? <Spinner size={18} /> : null} Envoyer ma proposition</button>}>
        <p className="text-xs text-djassa-black/70">Choisissez un de vos articles publiés à proposer pour « <span className="font-semibold text-djassa-black">{respondFor?.titre}</span> » :</p>
        <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
          {myArticles.length === 0 && <p className="rounded-[5px] bg-djassa-cloud border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] p-3 text-center text-xs text-djassa-black/70">Aucune annonce publiée — <Link to="/publier" className="font-bold text-djassa-red underline">publiez un article</Link> d'abord.</p>}
          {myArticles.map((a) => (
            <label key={a.id} className={`flex cursor-pointer items-center gap-3 rounded-[5px]  p-2 transition ${respondArticleId === a.id ? ' bg-djassa-red/5 shadow-card' : ''}`}>
              <input type="radio" name="respond-article" className="accent-[#780000]" checked={respondArticleId === a.id} onChange={() => setRespondArticleId(a.id)} />
              <img src={a.image_principale} alt="" className="h-14 w-14 rounded-[5px] object-cover bg-djassa-cloud border-solid border-[0.5px] border-[rgba(18,18,18,0.08)]" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} loading="lazy" decoding="async" />
              <span className="min-w-0 flex-1"><span className="clamp-2 text-xs font-bold">{a.titre}</span><span className="font-spacegrotesk text-xs font-extrabold text-djassa-red">{formatFCFA(a.prix)}</span></span>
            </label>
          ))}
        </div>
      </Modal>
    </div>
  );
}
