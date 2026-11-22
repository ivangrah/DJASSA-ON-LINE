import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gsap } from 'gsap';
import {
  ArrowRight, ArrowUpRight, BadgeCheck, Boxes, Check, ChevronRight, Crown,
  ExternalLink, Minus, Package, Plus, PlusCircle, RefreshCw, ShieldCheck, Store,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ARTICLE_STATUS, CONDITION_LABELS, formatFCFA } from '../../lib/format';
import { PUBLISH_CATEGORIES } from '../../lib/categories';
import { EmptyState, Spinner } from '../../components/ui';
import { PageHead, Panel, ProductThumb, StatCard, TinyBadge } from './ui';

const EMPTY_CREATE = {
  nom_boutique: '',
  description: '',
  telephone: '',
  categorie: 'High-Tech',
  ville: 'Abidjan',
  adresse: '',
  accepte_troc: true,
};

function BoutiqueForm({ value, onChange, onSubmit, submitting, editing = false }) {
  const set = (key) => (e) => onChange({
    ...value,
    [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
  });

  return (
    <form onSubmit={onSubmit} className="space-y-3.5">
      <div>
        <label htmlFor="nom_boutique" className="label">Nom de la boutique *</label>
        <input id="nom_boutique" required minLength={3} maxLength={150} className="input" placeholder="Quincaillerie Moderne" value={value.nom_boutique} onChange={set('nom_boutique')} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="telephone" className="label">Téléphone professionnel *</label>
          <input id="telephone" required className="input" placeholder="+225 07 00 00 00 00" value={value.telephone} onChange={set('telephone')} />
        </div>
        <div>
          <label htmlFor="ville" className="label">Ville</label>
          <input id="ville" className="input" placeholder="Abidjan" value={value.ville} onChange={set('ville')} />
        </div>
      </div>
      <div>
        <span className="label">Catégorie principale *</span>
        <div className="flex flex-wrap gap-1.5">
          {PUBLISH_CATEGORIES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => onChange({ ...value, categorie: key })}
              className={`rounded-[5px] px-3 py-1.5 font-spacegrotesk text-[10px] font-extrabold transition ${
                value.categorie === key
                  ? 'bg-djassa-red text-white shadow-pop'
                  : 'bg-djassa-cloud text-djassa-black/55 hover:text-djassa-black'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="adresse" className="label">Adresse / quartier</label>
        <input id="adresse" className="input" placeholder="Plateau, Abidjan" value={value.adresse} onChange={set('adresse')} />
      </div>
      <div>
        <label htmlFor="description" className="label">Description</label>
        <textarea id="description" rows={3} maxLength={2000} className="input" placeholder="Présentez votre boutique, vos marques et vos services…" value={value.description} onChange={set('description')} />
      </div>
      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] shadow-card p-3">
        <span>
          <span className="block font-spacegrotesk text-[11.5px] font-extrabold">Accepter les trocs</span>
          <span className="block text-[10px] text-djassa-black/45">Les particuliers pourront vous proposer un échange.</span>
        </span>
        <input type="checkbox" className="h-5 w-5 accent-[#780000]" checked={value.accepte_troc} onChange={set('accepte_troc')} />
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[5px] bg-djassa-red border-solid border-[0.5px] border-[rgba(255,255,255,0.12)] font-spacegrotesk text-[11.5px] font-extrabold uppercase tracking-wide text-white shadow-pop transition hover:bg-djassa-red-dark active:scale-[0.99] disabled:opacity-50"
      >
        {submitting ? <Spinner size={16} className="" /> : editing ? <><Check size={15} /> Enregistrer les modifications</> : <><Store size={15} /> Créer ma boutique <ArrowRight size={15} /></>}
      </button>
    </form>
  );
}

export default function MaBoutique() {
  const { user, isAdmin, refreshMe } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const root = useRef(null);
  const location = useLocation();
  const isInfos = location.pathname.endsWith('/infos');
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [editForm, setEditForm] = useState(null);
  const [productFilter, setProductFilter] = useState('neuf');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['boutique', 'dashboard'],
    queryFn: async () => (await api.get('/boutiques/me/dashboard')).data,
    retry: false,
  });

  const boutique = data?.boutique ?? null;
  const noBoutique = isError || (data && !boutique);

  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ['products', 'mine', 'stock'],
    queryFn: async () => (await api.get('/products/mine')).data,
    enabled: Boolean(boutique),
  });

  useEffect(() => {
    if (!boutique) return;
    setEditForm({
      nom_boutique: boutique.nom_boutique ?? '',
      description: boutique.description ?? '',
      telephone: boutique.telephone ?? '',
      categorie: boutique.categorie ?? 'High-Tech',
      ville: boutique.ville ?? 'Abidjan',
      adresse: boutique.adresse ?? '',
      accepte_troc: Boolean(boutique.accepte_troc),
    });
  }, [boutique]);

  const createBoutique = useMutation({
    mutationFn: async (payload) => (await api.post('/boutiques', payload)).data,
    onSuccess: async () => {
      toast.success('Boutique créée ! Publiez vos premiers articles neufs.');
      await refreshMe();
      queryClient.invalidateQueries({ queryKey: ['boutique', 'dashboard'] });
      setCreateForm(EMPTY_CREATE);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Impossible de créer la boutique.'),
  });

  const updateBoutique = useMutation({
    mutationFn: async (payload) => (await api.put(`/boutiques/${boutique.id}`, payload)).data,
    onSuccess: async () => {
      toast.success('Boutique mise à jour.');
      await refreshMe();
      queryClient.invalidateQueries({ queryKey: ['boutique', 'dashboard'] });
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Impossible de mettre à jour la boutique.'),
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, payload }) => (await api.put(`/products/${id}`, payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', 'mine', 'stock'] });
      queryClient.invalidateQueries({ queryKey: ['boutique', 'dashboard'] });
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Mise à jour impossible.'),
  });

  useLayoutEffect(() => {
    if (isLoading || noBoutique || !root.current) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const targets = root.current.querySelectorAll('.boutique-reveal');
    if (!targets.length) return undefined;
    const ctx = gsap.context(() => {
      gsap.from(targets, { y: 20, opacity: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out' });
    }, root);
    return () => ctx.revert();
  }, [isLoading, noBoutique, location.pathname]);

  if (isLoading) {
    return <div className="flex justify-center py-24"><Spinner size={34} /></div>;
  }

  if (noBoutique) {
    if (isAdmin) {
      return (
        <div className="space-y-5">
          <PageHead eyebrow="Ma boutique" title="Boutique & stocks neufs" subtitle="La création de boutique est réservée aux comptes vendeur_pro. Ce compte est en mode supervision." />
          <div className="rounded-[5px] bg-amber-50 p-5 text-[12px] text-amber-900">
            Utilisez un compte <strong>vendeur_pro</strong> (ex. <code>bakayoko@djassaonline.ci</code>) pour gérer une boutique et ses stocks.
          </div>
        </div>
      );
    }

    return (
      <div ref={root} className="space-y-5">
        <div className="boutique-reveal">
          <PageHead
            eyebrow="Étape prioritaire · Offre Pro active"
            title="Créons votre boutique"
            subtitle="Quelques informations suffisent pour ouvrir votre vitrine officielle. Le badge Vendeur Vérifié sera ajouté après validation KYC."
          />
        </div>

        <div className="boutique-reveal grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Panel title="Informations de la boutique" hint="Les champs marqués * sont obligatoires">
            <BoutiqueForm
              value={createForm}
              onChange={setCreateForm}
              onSubmit={(e) => { e.preventDefault(); createBoutique.mutate(createForm); }}
              submitting={createBoutique.isPending}
            />
          </Panel>

          <div className="boutique-reveal space-y-3">
            <div className="relative overflow-hidden rounded-[5px] bg-djassa-black border-solid border-[0.5px] border-[rgba(255,255,255,0.12)] p-5 text-white shadow-card">
              <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-[5px] bg-djassa-red/30 blur-[70px]" aria-hidden="true" />
              <Crown size={20} className="relative text-djassa-red" />
              <p className="relative mt-3 font-spacegrotesk text-[16px] font-extrabold leading-tight">Votre offre Pro est active</p>
              <p className="relative mt-1 text-[11px] leading-relaxed text-white/50">
                Dès la boutique créée, vous pourrez publier des articles neufs, gérer les stocks et éditer vos factures PDF.
              </p>
              {user?.abonnement_actif_jusqu_au && (
                <div className="relative mt-3 flex items-center gap-2 rounded-[5px] bg-white/5 px-3 py-2 text-[10px] text-white/60">
                  <ShieldCheck size={13} className="text-djassa-red" />
                  Active jusqu’au {new Date(user.abonnement_actif_jusqu_au).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              )}
            </div>
            <div className="rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] shadow-card p-5">
              <p className="font-spacegrotesk text-[12px] font-extrabold">Ce que vous allez débloquer</p>
              <ul className="mt-3 space-y-2 text-[11px] text-djassa-black/60">
                {['Vitrine publique avec nom, logo et description', 'Publication d’articles neufs avec stock', 'Badge Vendeur Vérifié après KYC', 'Factures et reçus PDF professionnels'].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] bg-djassa-red/10 text-djassa-red"><Check size={16} strokeWidth={3} /></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stats = data.stats ?? {};
  const products = productsData?.data ?? [];
  const visibleProducts = products.filter((p) => (
    productFilter === 'neuf'
      ? p.condition === 'neuf'
      : p.condition !== 'neuf'
  ));

  return (
    <div ref={root} className="space-y-5">
      <div className="boutique-reveal">
        <PageHead
          eyebrow={isInfos ? 'Informations boutique' : 'Ma boutique & stocks neufs'}
          title={isInfos ? 'Modifier ma boutique' : boutique.nom_boutique}
          subtitle={isInfos
            ? 'Les changements sont visibles immédiatement sur votre vitrine.'
            : 'Gérez vos quantités et gardez vos annonces à jour.'}
          action={
            <div className="flex flex-wrap gap-2">
              {!isInfos && (
                <Link to="/publier" className="inline-flex items-center gap-2 rounded-[5px] bg-djassa-red border-solid border-[0.5px] border-[rgba(255,255,255,0.12)] px-4 py-2.5 font-spacegrotesk text-[11px] font-extrabold uppercase tracking-wide text-white shadow-pop transition hover:bg-djassa-red-dark active:scale-95">
                  <PlusCircle size={15} /> Ajouter un article neuf
                </Link>
              )}
              {boutique.slug && (
                <Link to={`/boutique/${boutique.slug}`} className="inline-flex items-center gap-2 rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] shadow-card px-4 py-2.5 font-spacegrotesk text-[11px] font-extrabold text-djassa-black/65 transition hover:text-djassa-red">
                  <ExternalLink size={14} /> Voir ma vitrine
                </Link>
              )}
            </div>
          }
        />
      </div>

      {/* Statut vérification */}
      <div className={`boutique-reveal flex flex-wrap items-center gap-3 rounded-[5px]  px-4 py-3 ${
        boutique.verifie
          ? 'bg-emerald-50 text-emerald-800 shadow-card'
          : 'border-amber-300/60 bg-amber-50 text-amber-900'
      }`}>
        <span className={`flex h-9 w-9 items-center justify-center rounded-[5px] ${boutique.verifie ? 'bg-emerald-100' : 'bg-amber-100'}`}>
          {boutique.verifie ? <BadgeCheck size={18} /> : <ShieldCheck size={18} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-spacegrotesk text-[12px] font-extrabold">
            {boutique.verifie ? 'Vendeur Vérifié' : 'Vérification KYC en attente'}
          </p>
          <p className="mt-0.5 text-[10.5px] text-djassa-black/60">
            {boutique.verifie
              ? 'Votre badge de confiance est visible sur votre vitrine et vos annonces.'
              : 'Notre équipe valide votre dossier. Le badge apparaîtra automatiquement après vérification.'}
          </p>
        </div>
        <TinyBadge tone={boutique.verifie ? 'green' : 'amber'}>
          {boutique.verifie ? 'Vérifiée' : 'En attente'}
        </TinyBadge>
      </div>

      {/* KPI rapides — uniquement dans l'onglet stocks */}
      {!isInfos && (
        <div className="boutique-reveal grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={Package} label="Articles en ligne" value={stats.articles_en_ligne ?? 0} hint="Tous rayons confondus" />
          <StatCard icon={Boxes} label="Stocks neufs" value={products.filter((p) => p.condition === 'neuf').length} hint="Annonces actives" />
          <StatCard icon={Crown} label="Note boutique" value={`${Number(stats.note_moyenne ?? 0).toFixed(1)}/5`} hint={`${stats.nombre_avis ?? 0} avis`} tone="dark" />
          <StatCard icon={ArrowUpRight} label="Ventes" value={stats.ventes_total ?? 0} hint="Depuis l’ouverture" />
        </div>
      )}

      {/* Formulaire d'édition + aperçu — onglet « Informations boutique » */}
      {isInfos && (
      <div className="boutique-reveal grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Panel title="Modifier ma boutique" hint="Les changements sont visibles immédiatement sur votre vitrine">
          {editForm && (
            <BoutiqueForm
              value={editForm}
              onChange={setEditForm}
              onSubmit={(e) => { e.preventDefault(); updateBoutique.mutate(editForm); }}
              submitting={updateBoutique.isPending}
              editing
            />
          )}
        </Panel>

        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-[5px] bg-djassa-black border-solid border-[0.5px] border-[rgba(255,255,255,0.12)] p-5 text-white">
            <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-[5px] bg-djassa-red/25 blur-[60px]" aria-hidden="true" />
            <Store size={20} className="relative text-djassa-red" />
            <p className="relative mt-3 truncate font-spacegrotesk text-[15px] font-extrabold">{boutique.nom_boutique}</p>
            <p className="relative mt-1 text-[10.5px] text-white/45">{boutique.categorie ?? 'Boutique Pro'} · {boutique.ville ?? 'Abidjan'}</p>
            {boutique.description && <p className="relative mt-2 line-clamp-3 text-[10.5px] leading-relaxed text-white/60">{boutique.description}</p>}
            <div className="relative mt-3 flex flex-wrap gap-2 text-[9px] font-bold text-white/50">
              <span className="rounded-[5px] bg-white/10 px-2.5 py-1">{boutique.telephone}</span>
              {boutique.accepte_troc && <span className="rounded-[5px] bg-djassa-red px-2.5 py-1 text-white">Troc accepté</span>}
            </div>
          </div>
          <div className="rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] shadow-card p-5">
            <p className="font-spacegrotesk text-[12px] font-extrabold">Adresse de la vitrine</p>
            <p className="mt-1 break-all font-DM-Sans text-[10.5px] text-djassa-black/50">/boutique/{boutique.slug}</p>
            <Link to={`/boutique/${boutique.slug}`} className="mt-3 inline-flex items-center gap-1.5 font-spacegrotesk text-[10px] font-extrabold text-djassa-red hover:underline">
              Ouvrir la vitrine <ChevronRight size={12} />
            </Link>
          </div>
        </div>
      </div>
      )}

      {/* Stocks — onglet « Ma boutique & stocks neufs » */}
      {!isInfos && (
      <Panel
        title="Mes articles & stocks"
        hint="Ajustez les quantités et l’état de publication en un clic"
        action={
          <div className="flex rounded-[5px] bg-djassa-cloud p-1">
            {[['neuf', 'Stocks neufs'], ['occasion', 'Occasion & troc']].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setProductFilter(key)}
                className={`rounded-[5px] px-3 py-1.5 font-spacegrotesk text-[10px] font-extrabold transition ${
                  productFilter === key ? 'bg-djassa-black text-white' : 'text-djassa-black/50 hover:text-djassa-black'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        }
      >
        {loadingProducts ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : visibleProducts.length === 0 ? (
          <EmptyState
            icon={Store}
            title={productFilter === 'neuf' ? 'Aucun article neuf en stock' : 'Aucun article d’occasion'}
            hint={productFilter === 'neuf' ? 'Publiez un article neuf avec une quantité en stock pour alimenter votre boutique.' : 'Vous pouvez aussi publier des articles d’occasion et trocables.'}
            action={<Link to="/publier" className="btn-red btn-sm"><PlusCircle size={14} /> Publier un article</Link>}
          />
        ) : (
          <div className="divide-y divide-djassa-gray/20">
            {visibleProducts.map((article) => {
              const status = ARTICLE_STATUS[article.statut] ?? ARTICLE_STATUS.published;
              const stock = Number(article.stock ?? 0);
              const canChangeStock = article.condition === 'neuf';
              return (
                <div key={article.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <ProductThumb article={article} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="truncate font-spacegrotesk text-[12px] font-extrabold">{article.titre}</p>
                      <span className={`rounded-[5px] px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide ${status.cls}`}>{status.label}</span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-djassa-black/45">
                      {formatFCFA(article.prix)} · {CONDITION_LABELS[article.condition] ?? article.condition}
                      {article.vente_flash && <span className="ml-1 font-bold text-djassa-red">· Flash</span>}
                    </p>
                  </div>
                  {canChangeStock && (
                    <div className="flex items-center gap-1 rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] shadow-card p-1">
                      <button
                        type="button"
                        onClick={() => updateProduct.mutate({ id: article.id, payload: { stock: Math.max(0, stock - 1) } })}
                        disabled={stock <= 0 || updateProduct.isPending}
                        className="flex h-7 w-7 items-center justify-center rounded-[5px] text-djassa-black/60 transition hover:bg-djassa-cloud disabled:opacity-30"
                        aria-label="Diminuer le stock"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="w-8 text-center font-spacegrotesk text-[11px] font-extrabold">{stock}</span>
                      <button
                        type="button"
                        onClick={() => updateProduct.mutate({ id: article.id, payload: { stock: stock + 1 } })}
                        disabled={updateProduct.isPending}
                        className="flex h-7 w-7 items-center justify-center rounded-[5px] text-djassa-black/60 transition hover:bg-djassa-cloud disabled:opacity-30"
                        aria-label="Augmenter le stock"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => updateProduct.mutate({
                      id: article.id,
                      payload: { statut: article.statut === 'published' ? 'archived' : 'published' },
                    })}
                    disabled={updateProduct.isPending}
                    className="inline-flex items-center gap-1 rounded-[5px] px-2.5 py-1.5 font-spacegrotesk text-[9.5px] font-extrabold text-djassa-black/55 transition hover:text-djassa-red disabled:opacity-40"
                  >
                    <RefreshCw size={20} /> {article.statut === 'published' ? 'Archiver' : 'Republier'}
                  </button>
                  <Link to={`/article/${article.id}`} className="inline-flex items-center gap-1 rounded-[5px] px-1.5 py-1.5 font-spacegrotesk text-[9.5px] font-extrabold text-djassa-red hover:underline">
                    Voir <ArrowRight size={20} />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
      )}
    </div>
  );
}
