import { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gsap } from 'gsap';
import {
  AlertTriangle, ArrowLeftRight, ArrowRight, ArrowUpRight, BadgeCheck, Boxes,
  CheckCircle2, ChevronRight, ClipboardList, Copy, Crown, ExternalLink, Heart,
  PlusCircle, ReceiptText, ShieldCheck, ShoppingBag, Sparkles, Store,
  TrendingUp, X, Zap,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ESCROW_STATUS, formatFCFA, formatNumberFR, timeAgo } from '../../lib/format';
import { EmptyState, Modal, Spinner } from '../../components/ui';
import { PageHead, Panel, ProductThumb } from './ui';

function OnboardingPro({ prenom }) {
  const steps = [
    { n: 1, title: 'Créez votre boutique', text: 'Nom, catégorie, téléphone et zone de vente : votre vitrine officielle en 2 minutes.' },
    { n: 2, title: 'Publiez vos articles neufs', text: 'Ajoutez photos, prix et stocks. La publication est réservée à votre Boutique Pro.' },
    { n: 3, title: 'Obtenez le badge vérifié', text: 'Notre équipe valide votre KYC rapide et affiche le badge Vendeur Vérifié.' },
  ];

  return (
    <div className="space-y-5">
      <PageHead
        eyebrow="Espace vendeur Pro"
        title={<>Bienvenue {prenom}<span className="text-djassa-red">.</span></>}
        subtitle="Votre offre Pro est active. Ouvrez votre boutique officielle pour vendre du neuf, gérer vos stocks et éditer vos factures."
      />

      <div className="relative overflow-hidden rounded-[5px] bg-djassa-black border-solid border-[0.5px] border-[rgba(255,255,255,0.12)] p-5 text-white shadow-card sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-[5px] bg-djassa-red/30 blur-[90px]" aria-hidden="true" />
        <img src="/images/illustrations/ecommerce-laptop-payment.png" alt="" aria-hidden="true" className="art-warm pointer-events-none absolute -right-10 bottom-0 hidden h-56 w-auto select-none object-contain opacity-70 xl:block" />
        <div className="relative grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-[5px] bg-white/15 px-3 py-1 font-spacegrotesk text-[9px] font-extrabold uppercase tracking-[0.18em] text-white">
              <Crown size={16} /> Étape prioritaire
            </span>
            <h2 className="mt-3 font-spacegrotesk text-[26px] font-extrabold leading-[1.08] tracking-tight sm:text-[32px]">
              Votre boutique est<br />le prochain pas<span className="text-white/60">.</span>
            </h2>
            <p className="mt-2 max-w-md text-[12.5px] leading-relaxed text-white/60">
              Sans boutique, vous ne pouvez pas publier d’articles neufs ni recevoir de factures professionnelles.
            </p>
            <Link
              to="/dashboard-pro/ma-boutique"
              className="mt-5 inline-flex items-center gap-2 rounded-[5px] bg-djassa-red border-solid border-[0.5px] border-[rgba(255,255,255,0.12)] px-4 py-2.5 font-spacegrotesk text-[11.5px] font-extrabold uppercase tracking-wide text-white shadow-pop transition hover:bg-[#9b0000] active:scale-95"
            >
              Créer ma boutique <ArrowRight size={20} />
            </Link>
          </div>
          <ol className="space-y-2.5">
            {steps.map(({ n, title, text }) => (
              <li key={n} className="flex gap-3 rounded-[5px] bg-white/5 p-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[5px] bg-djassa-red font-spacegrotesk text-[11px] font-extrabold text-white">
                  {n}
                </span>
                <div>
                  <p className="font-spacegrotesk text-[12px] font-extrabold">{title}</p>
                  <p className="mt-0.5 text-[10.5px] leading-relaxed text-white/50">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: ArrowLeftRight, title: 'Troc & occasion', text: 'Votre compte Pro peut aussi troquer et acheter comme un particulier.', to: '/dashboard-pro/trocs', cta: 'Voir mes trocs' },
          { icon: ShieldCheck, title: 'Séquestre & PIN', text: 'Chaque vente est protégée jusqu’à la remise et la validation du code PIN.', to: '/dashboard-pro/achats', cta: 'Mes achats' },
          { icon: ReceiptText, title: 'Factures PDF', text: 'Éditez vos factures et reçus dès votre première vente libérée.', to: '/dashboard-pro/factures', cta: 'Mes factures' },
        ].map(({ icon: Icon, title, text, to, cta }) => (
          <Link key={title} to={to} className="group rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] p-4 shadow-card transition hover:text-djassa-red">
            <span className="flex h-9 w-9 items-center justify-center rounded-[5px] bg-djassa-red/10 text-djassa-red">
              <Icon size={20} />
            </span>
            <p className="mt-3 font-spacegrotesk text-[12.5px] font-extrabold text-djassa-black">{title}</p>
            <p className="mt-0.5 text-[10.5px] leading-relaxed text-djassa-black/45">{text}</p>
            <span className="mt-2 inline-flex items-center gap-1 font-spacegrotesk text-[10px] font-extrabold text-djassa-red">
              {cta} <ArrowUpRight size={20} className="transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/** Carte KPI vedette — rouge signature. */
function KpiFeature({ icon: Icon, label, value, hint }) {
  return (
    <div className="relative overflow-hidden rounded-[5px] bg-[#780000] border-solid border-[0.5px] border-[rgba(255,255,255,0.12)] p-3.5 text-white shadow-card">
      <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-[5px] bg-white/10 blur-2xl" aria-hidden="true" />
      <div className="relative flex items-start justify-between gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-[5px] bg-white/[0.16]">
          <Icon size={20} strokeWidth={2.2} />
        </span>
        <TrendingUp size={16} className="text-white/60" />
      </div>
      <p className="relative mt-2 font-spacegrotesk text-[17px] font-extrabold leading-none tabular-nums sm:text-[19px]">{value}</p>
      <p className="relative mt-1 font-spacegrotesk text-[9px] font-extrabold uppercase tracking-[0.14em] text-white/75">{label}</p>
      <p className="relative mt-0.5 text-[9.5px] text-white/55">{hint}</p>
    </div>
  );
}

/** Carte KPI secondaire — surface blanche, bordure neutre, accent au survol. */
function KpiCard({ icon: Icon, label, value, hint, trend }) {
  return (
    <div className="group rounded-[5px] border border-djassa-gray/40 bg-white p-3.5 shadow-card transition hover:border-djassa-red hover:shadow-[0_10px_28px_-6px_rgba(120,0,0,0.12)]">
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-[5px] bg-djassa-red/10 text-djassa-red">
          <Icon size={20} strokeWidth={2.2} />
        </span>
        {trend && <span className="rounded-[5px] bg-djassa-red/5 px-2 py-0.5 font-spacegrotesk text-[8.5px] font-extrabold text-djassa-red">{trend}</span>}
      </div>
      <p className="mt-2 font-spacegrotesk text-[17px] font-extrabold leading-none tabular-nums text-djassa-black sm:text-[19px]">{value}</p>
      <p className="mt-1 font-spacegrotesk text-[9px] font-extrabold uppercase tracking-[0.14em] text-djassa-black/55">{label}</p>
      <p className="mt-0.5 text-[9.5px] text-djassa-black/45">{hint}</p>
    </div>
  );
}

export default function DashboardPro() {
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const root = useRef(null);
  const [flashOpen, setFlashOpen] = useState(false);
  const [flashArticleId, setFlashArticleId] = useState('');
  const [flashPrix, setFlashPrix] = useState('');
  const [flashDuree, setFlashDuree] = useState('24');
  const [periode, setPeriode] = useState(14);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['boutique', 'dashboard'],
    queryFn: async () => (await api.get('/boutiques/me/dashboard')).data,
    retry: false,
    refetchInterval: 20_000,
  });

  const hasBoutique = Boolean(data?.boutique);
  const noBoutique = isError && error?.response?.status === 404;

  const { data: txData } = useQuery({
    queryKey: ['transactions', 'pro'],
    queryFn: async () => (await api.get('/transactions')).data,
    enabled: hasBoutique,
  });

  const { data: mineData } = useQuery({
    queryKey: ['products', 'mine', 'flash-eligible', flashOpen],
    queryFn: async () => (await api.get('/products/mine')).data,
    enabled: flashOpen,
  });

  const startFlash = useMutation({
    mutationFn: ({ id, prix, duree }) => api.post(`/products/${id}/flash`, {
      prix_flash: Number(prix),
      duree_heures: Number(duree),
    }),
    onSuccess: () => {
      toast.success('Vente flash lancée !');
      queryClient.invalidateQueries({ queryKey: ['boutique', 'dashboard'] });
      setFlashOpen(false);
      setFlashArticleId('');
      setFlashPrix('');
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Impossible de lancer la vente flash.'),
  });

  const stopFlash = useMutation({
    mutationFn: (id) => api.delete(`/products/${id}/flash`),
    onSuccess: () => {
      toast.info('Vente flash arrêtée.');
      queryClient.invalidateQueries({ queryKey: ['boutique', 'dashboard'] });
    },
    onError: (err) => toast.error(err.response?.data?.message ?? 'Impossible d’arrêter cette vente flash.'),
  });

  useLayoutEffect(() => {
    if (!hasBoutique || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const ctx = gsap.context(() => {
      gsap.from('.pro-reveal', { y: 18, opacity: 0, duration: 0.55, stagger: 0.06, ease: 'power3.out' });
    }, root);
    return () => ctx.revert();
  }, [hasBoutique]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size={34} />
      </div>
    );
  }

  if (noBoutique || !data) {
    if (isAdmin) {
      return (
        <div className="space-y-5">
          <PageHead
            eyebrow="Supervision administrateur"
            title="Espace Pro"
            subtitle="Ce compte administrateur n’est rattaché à aucune boutique. Utilisez un compte vendeur de démonstration pour inspecter le parcours Pro."
          />
          <div className="rounded-[5px] bg-amber-50 p-5">
            <p className="font-spacegrotesk text-[13px] font-extrabold text-amber-900">Mode supervision</p>
            <p className="mt-1 max-w-xl text-[11.5px] leading-relaxed text-amber-800/80">
              Créer une boutique requiert le rôle <code className="rounded-[5px] bg-white/70 px-1">vendeur_pro</code>.
              Connectez-vous avec <code className="rounded-[5px] bg-white/70 px-1">bakayoko@djassaonline.ci</code> / <code className="rounded-[5px] bg-white/70 px-1">password</code> pour voir le dashboard complet.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Link to="/" className="rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] p-4 shadow-card transition">
              <Store size={20} className="text-djassa-red" />
              <p className="mt-2 font-spacegrotesk text-[12px] font-extrabold">Explorer le marché</p>
            </Link>
            <Link to="/dashboard-pro/factures" className="rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] p-4 shadow-card transition">
              <ReceiptText size={20} className="text-djassa-red" />
              <p className="mt-2 font-spacegrotesk text-[12px] font-extrabold">Factures & reçus</p>
            </Link>
            <Link to="/dashboard-pro/trocs" className="rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] p-4 shadow-card transition">
              <ArrowLeftRight size={20} className="text-djassa-red" />
              <p className="mt-2 font-spacegrotesk text-[12px] font-extrabold">Trocs</p>
            </Link>
          </div>
        </div>
      );
    }

    return <OnboardingPro prenom={user?.nom?.split(' ')[0] ?? 'vendeur'} />;
  }

  const boutique = data.boutique;
  const stats = data.stats ?? {};
  const stockCritique = data.stock_critique ?? [];
  const flashActives = data.ventes_flash_actives?.data ?? [];
  const ventesParJour = [...(data.ventes_par_jour ?? [])].reverse();
  const ventesFiltrees = ventesParJour.slice(-periode);
  const maxVente = Math.max(...ventesFiltrees.map((v) => Number(v.total)), 1);
  const transactions = txData?.data ?? [];
  const ventes = transactions.filter((tx) => tx.role_utilisateur === 'vendeur').slice(0, 6);
  const seqEnCours = transactions.filter((tx) => tx.role_utilisateur === 'acheteur' && tx.escrow_status === 'held');
  const eligible = (mineData?.data ?? []).filter((a) => a.statut === 'published' && a.condition === 'neuf');
  const prenom = user?.nom?.split(' ')[0] ?? 'vendeur';
  const nomBoutique = (boutique.nom_boutique ?? 'Boutique').replace('Quincallierie', 'Quincaillerie');
  const finPro = user?.abonnement_actif_jusqu_au
    ? new Date(user.abonnement_actif_jusqu_au).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
    : null;

  const partagerBoutique = async () => {
    const url = `${window.location.origin}/boutique/${boutique.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Lien de votre vitrine copié.');
    } catch {
      toast.info(url);
    }
  };

  return (
    <div ref={root} className="space-y-4">
      {/* ===== HERO ROUGE IMPÉRIAL ===== */}
      <section
        className="pro-reveal relative overflow-hidden rounded-[5px] p-5 text-white shadow-card sm:p-7"
        style={{ background: 'linear-gradient(135deg, #780000 0%, #4A0000 60%, #140505 100%)' }}
      >
        <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-[5px] bg-white/10 blur-[80px]" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-[5px] bg-[#ef4444]/15 blur-[90px]" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]" aria-hidden="true" style={{ backgroundImage: 'radial-gradient(#FFFFFF 0.7px, transparent 0.7px)', backgroundSize: '20px 20px' }} />
        <img src="/images/illustrations/ecommerce-laptop-payment.png" alt="" aria-hidden="true" className="art-warm pointer-events-none absolute -bottom-6 right-0 hidden h-56 w-auto select-none object-contain opacity-25 xl:block" />

        <div className="relative z-10 flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center gap-1.5 rounded-[5px] border border-white/[0.12] bg-white/10 px-3 py-1 font-spacegrotesk text-[9px] font-extrabold uppercase tracking-[0.2em] text-white/85 backdrop-blur">
              <Crown size={14} /> Espace vendeur Pro
            </span>
            <h1 className="mt-3 font-spacegrotesk text-[28px] font-extrabold leading-[1.05] tracking-tight sm:text-[38px]">
              Bonjour {prenom}<span className="text-white/60">.</span>
            </h1>
            <p className="mt-1 max-w-xl font-DM-Sans text-[12px] leading-relaxed text-white/70">
              Suivez votre activité, vos stocks critiques et vos ventes sécurisées en temps réel.
            </p>

            {/* Infos boutique intégrées — aucun bandeau redondant */}
            <div className="mt-5 flex flex-wrap items-center gap-3 rounded-[5px] border border-white/[0.12] bg-white/[0.06] px-3.5 py-3 backdrop-blur-sm">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[5px] bg-white/[0.16] font-spacegrotesk text-[15px] font-extrabold">
                {nomBoutique.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-1.5 font-spacegrotesk text-[13px] font-extrabold">
                  <span className="truncate">{nomBoutique}</span>
                  {boutique.verifie ? (
                    <span className="inline-flex items-center gap-1 rounded-[5px] bg-white/[0.16] px-2 py-0.5 font-spacegrotesk text-[8px] font-extrabold uppercase tracking-wide">
                      <BadgeCheck size={16} /> Vérifié
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-[5px] bg-white/[0.16] px-2 py-0.5 font-spacegrotesk text-[8px] font-extrabold uppercase tracking-wide">
                      <Sparkles size={16} /> KYC en attente
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-[5px] bg-white/[0.16] px-2 py-0.5 font-spacegrotesk text-[8px] font-extrabold uppercase tracking-wide">
                    <Crown size={16} /> Pro
                  </span>
                </p>
                <p className="mt-0.5 text-[10px] text-white/60">
                  {boutique.categorie ?? 'Boutique Pro'} &nbsp;•&nbsp; {boutique.ville ?? 'Abidjan'}
                  {finPro && <> &nbsp;•&nbsp; Pro actif jusqu’au {finPro}</>}
                </p>
              </div>
              <Link
                to={`/boutique/${boutique.slug}`}
                className="inline-flex items-center gap-1.5 rounded-[5px] border border-white/[0.12] bg-white/10 px-3 py-2 font-spacegrotesk text-[10px] font-extrabold uppercase tracking-wide transition hover:bg-white/20"
              >
                Voir ma vitrine <ExternalLink size={20} />
              </Link>
            </div>
          </div>

          {/* Actions */}
          <div className="flex w-full flex-col gap-2 sm:w-auto">
            <Link
              to="/publier"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] px-4 font-spacegrotesk text-[11px] font-extrabold uppercase tracking-wide text-[#780000] shadow-card transition hover:bg-white/90 active:scale-95"
            >
              <PlusCircle size={20} /> Publier un article neuf
            </Link>
            <Link
              to="/dashboard-pro/ma-boutique"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[5px] border border-white/[0.12] bg-white/[0.08] px-4 font-spacegrotesk text-[10.5px] font-extrabold uppercase tracking-wide text-white transition hover:bg-white/[0.16]"
            >
              Gérer la boutique <ChevronRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== KPI COMPACTS ===== */}
      <div className="pro-reveal grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiFeature
          icon={TrendingUp}
          label="CA libéré"
          value={formatFCFA(stats.chiffre_affaires_fcfa ?? 0)}
          hint="Ventes validées par PIN"
        />
        <KpiCard
          icon={Boxes}
          label="En séquestre"
          value={formatFCFA(stats.encaisse_securise_fcfa ?? 0)}
          hint="En attente de remise"
          trend="En cours"
        />
        <KpiCard
          icon={ShoppingBag}
          label="Ventes totales"
          value={formatNumberFR(stats.ventes_total ?? 0)}
          hint={`${stats.articles_en_ligne ?? 0} articles en ligne`}
          trend="Historique"
        />
        <KpiCard
          icon={Heart}
          label="Note clients"
          value={`${Number(stats.note_moyenne ?? 0).toFixed(1)}/5`}
          hint={`${stats.nombre_avis ?? 0} avis`}
          trend="Confiance"
        />
      </div>

      {/* ===== GRAPHIQUE + ACTIONS ===== */}
      <div className="pro-reveal grid gap-4 lg:grid-cols-12">
        {/* Colonne gauche 8/12 */}
        <section className="rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] p-4 shadow-card lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-spacegrotesk text-[13px] font-extrabold text-djassa-black">Ventes par jour</h2>
              <p className="mt-0.5 text-[10px] text-djassa-black/50">Fonds libérés en FCFA</p>
            </div>
            <div className="inline-flex rounded-[5px] bg-djassa-cream border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] p-1" role="group" aria-label="Période du graphique">
              {[7, 14, 30].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriode(p)}
                  className={`rounded-[5px] px-3 py-1.5 font-spacegrotesk text-[10px] font-extrabold tabular-nums transition ${
                    periode === p ? 'bg-djassa-red border-solid border-[0.5px] border-[rgba(255,255,255,0.12)] text-white shadow-card' : 'text-djassa-black/55 hover:text-djassa-red'
                  }`}
                >
                  {p}j
                </button>
              ))}
            </div>
          </div>

          {ventesParJour.length ? (
            <>
              <div className="relative mt-4 h-40">
                {/* grille de repères en pointillés */}
                <div className="absolute inset-0 flex flex-col justify-between" aria-hidden="true">
                  {[0, 1, 2, 3].map((i) => <div key={i} className="border-t border-dashed border-djassa-gray/50" />)}
                </div>
                <div className="absolute inset-0 flex items-end gap-1.5">
                  {ventesFiltrees.map((v, i) => (
                    <div key={`${v.jour}-${i}`} className="group relative flex h-full flex-1 items-end">
                      <div
                        className="w-full rounded-[5px] bg-gradient-to-t from-[#4A0000] to-djassa-red transition-all group-hover:opacity-80"
                        style={{ height: `${Math.max((Number(v.total) / maxVente) * 100, 4)}%` }}
                      />
                      <div className="pointer-events-none absolute -top-7 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-[5px] bg-[#121212] px-1.5 py-0.5 font-DM-Sans text-[8px] text-white opacity-0 transition group-hover:opacity-100">
                        {formatFCFA(v.total)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-2 flex justify-between font-DM-Sans text-[9px] tabular-nums text-djassa-black/45">
                <span>{ventesFiltrees[0] ? new Date(ventesFiltrees[0].jour).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '—'}</span>
                <span>{ventesFiltrees.at(-1) ? new Date(ventesFiltrees.at(-1).jour).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '—'}</span>
              </div>
            </>
          ) : (
            <div className="mt-3 flex flex-col items-center justify-center gap-2 text-center">
              <svg viewBox="0 0 300 80" className="h-20 w-full max-w-xs" aria-hidden="true">
                <path d="M4 72 C 44 60, 66 44, 104 52 S 164 22, 204 36 S 262 12, 296 20" fill="none" stroke="#bcb8b1" strokeWidth="2" strokeDasharray="5 6" />
                <path d="M4 72 C 44 60, 66 44, 104 52" fill="none" stroke="#780000" strokeWidth="2.5" strokeLinecap="round" opacity="0.65" />
              </svg>
              <p className="font-spacegrotesk text-[12px] font-extrabold text-djassa-black">Aucune vente libérée</p>
              <p className="max-w-xs text-[10.5px] leading-relaxed text-djassa-black/50">
                Dès qu’une remise sera validée par code PIN, votre chiffre d’affaires apparaîtra ici.
              </p>
              <button type="button" onClick={partagerBoutique} className="mt-1 inline-flex items-center gap-1.5 rounded-[5px] bg-djassa-red/5 px-3 py-2 font-spacegrotesk text-[10px] font-extrabold text-djassa-red transition hover:bg-djassa-red/10">
                <Copy size={16} /> Partager ma boutique
              </button>
            </div>
          )}
        </section>

        {/* Colonne droite 4/12 */}
        <div className="flex flex-col gap-3 lg:col-span-4">
          {/* Vente Flash */}
          <button
            type="button"
            onClick={() => setFlashOpen(true)}
            className="group flex items-center gap-3 rounded-[5px] border border-djassa-red bg-[#0A0A0A] p-4 text-left text-white transition hover:border-[#ef4444] hover:shadow-[0_10px_28px_-6px_rgba(120,0,0,0.35)]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[5px] bg-djassa-red border-solid border-[0.5px] border-[rgba(255,255,255,0.12)] text-white shadow-[0_0_18px_rgba(120,0,0,0.6)]">
              <Zap size={20} fill="currentColor" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="font-spacegrotesk text-[12px] font-extrabold">Vente Flash</span>
                <span className="rounded-[5px] bg-djassa-red px-1.5 py-0.5 font-spacegrotesk text-[8px] font-extrabold uppercase tracking-wide">Éclair</span>
              </span>
              <span className="mt-0.5 block text-[10px] text-white/50">Boostez un article neuf publié</span>
            </span>
            <ChevronRight size={20} className="text-white/40 transition group-hover:text-white" />
          </button>

          {/* Stocks & boutique */}
          <Link to="/dashboard-pro/ma-boutique" className="group flex items-center gap-3 rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] p-4 shadow-card transition hover:text-djassa-red">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[5px] bg-djassa-red/10 text-djassa-red"><Store size={20} /></span>
            <span className="min-w-0 flex-1">
              <span className="block font-spacegrotesk text-[12px] font-extrabold text-djassa-black">Stocks & boutique</span>
              <span className="mt-0.5 block text-[10px] text-djassa-black/50">
                <span className="font-extrabold tabular-nums text-djassa-red">{stats.articles_en_ligne ?? 0} articles actifs</span> &nbsp;•&nbsp; Stocks sains
              </span>
            </span>
            <ChevronRight size={20} className="text-djassa-black/25 transition group-hover:text-djassa-red" />
          </Link>

          {/* Séquestre en cours */}
          <Link to="/dashboard-pro/achats" className="group flex items-center gap-3 rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] p-4 shadow-card transition hover:text-djassa-red">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[5px] bg-djassa-red/10 text-djassa-red"><ShieldCheck size={20} /></span>
            <span className="min-w-0 flex-1">
              <span className="block font-spacegrotesk text-[12px] font-extrabold text-djassa-black">Séquestre en cours</span>
              <span className="mt-0.5 block font-spacegrotesk text-[12px] font-extrabold tabular-nums text-djassa-red">
                {formatFCFA(stats.encaisse_securise_fcfa ?? 0)}
              </span>
              <span className="block text-[10px] text-djassa-black/50">
                {seqEnCours.length} remise{seqEnCours.length > 1 ? 's' : ''} en attente de PIN
              </span>
            </span>
            <ChevronRight size={20} className="text-djassa-black/25 transition group-hover:text-djassa-red" />
          </Link>
        </div>
      </div>

      {/* Stock critique + flash */}
      <div className="pro-reveal grid gap-4 lg:grid-cols-2">
        <Panel
          title="Stock critique"
          hint="Articles neufs à 2 unités ou moins"
          action={<Link to="/dashboard-pro/ma-boutique" className="font-spacegrotesk text-[10px] font-extrabold text-djassa-red hover:underline">Gérer les stocks</Link>}
        >
          {stockCritique.length ? (
            <div className="space-y-2">
              {stockCritique.map((article) => (
                <div key={article.id} className="flex items-center gap-3 rounded-[5px] bg-djassa-red/5 p-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-[5px] bg-djassa-red/10 text-djassa-red"><AlertTriangle size={16} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-spacegrotesk text-[11.5px] font-bold">{article.titre}</p>
                    <p className="text-[9.5px] tabular-nums text-djassa-black/45">{formatFCFA(article.prix)}</p>
                  </div>
                  <span className="rounded-[5px] bg-djassa-red px-2.5 py-1 font-spacegrotesk text-[9px] font-extrabold text-white">
                    {article.stock} restant{article.stock > 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-[5px] bg-emerald-50 px-3 py-3 text-emerald-800">
              <CheckCircle2 size={20} />
              <p className="text-[11px] font-semibold">Aucun stock critique — votre inventaire est sain.</p>
            </div>
          )}
        </Panel>

        <Panel
          title="Ventes flash actives"
          hint="Promotions en cours sur vos articles neufs"
          action={<button type="button" onClick={() => setFlashOpen(true)} className="inline-flex items-center gap-1 rounded-[5px] bg-djassa-red border-solid border-[0.5px] border-[rgba(255,255,255,0.12)] px-2.5 py-1.5 font-spacegrotesk text-[9.5px] font-extrabold text-white transition hover:bg-[#9b0000]"><Zap size={20} /> Lancer</button>}
        >
          {flashActives.length ? (
            <div className="space-y-2">
              {flashActives.map((article) => (
                <div key={article.id} className="flex items-center gap-3 rounded-[5px] bg-[#0A0A0A] border-solid border-[0.5px] border-[rgba(255,255,255,0.12)] p-2.5 text-white">
                  <ProductThumb article={article} className="h-10 w-10" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-spacegrotesk text-[11.5px] font-bold">{article.titre}</p>
                    <p className="text-[9.5px] tabular-nums text-white/50">
                      <span className="font-extrabold text-[#ef4444]">{formatFCFA(article.prix_flash)}</span>{' '}
                      <span className="line-through">{formatFCFA(article.prix)}</span>
                    </p>
                  </div>
                  <button type="button" onClick={() => stopFlash.mutate(article.id)} disabled={stopFlash.isPending} className="rounded-[5px] p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white disabled:opacity-40" aria-label="Arrêter la vente flash">
                    <X size={20} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] p-3 shadow-card">
              <Zap size={20} className="text-djassa-red" />
              <p className="text-[11px] text-djassa-black/50">Aucune vente flash en cours. Lancez-en une pour gagner en visibilité.</p>
            </div>
          )}
        </Panel>
      </div>

      {/* Dernières ventes */}
      <div className="pro-reveal">
        <Panel
          title="Dernières ventes"
          hint="Remises, séquestre et libérations de fonds"
          action={<Link to="/dashboard-pro/factures" className="font-spacegrotesk text-[10px] font-extrabold text-djassa-red hover:underline">Toutes les factures</Link>}
        >
          {ventes.length ? (
            <div className="divide-y divide-djassa-gray/20">
              {ventes.map((tx) => {
                const statut = ESCROW_STATUS[tx.escrow_status] ?? ESCROW_STATUS.initiated;
                return (
                  <div key={tx.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <ProductThumb article={tx.article} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-spacegrotesk text-[12px] font-extrabold">{tx.article?.titre ?? 'Article'}</p>
                      <p className="mt-0.5 text-[10px] tabular-nums text-djassa-black/45">
                        {formatFCFA(tx.montant)} · Acheteur {tx.acheteur?.nom ?? 'Djassa'} · {timeAgo(tx.created_at)}
                      </p>
                    </div>
                    <span className={`rounded-[5px] px-2 py-0.5 text-[8.5px] font-extrabold uppercase tracking-wide ${statut.cls}`}>{statut.label}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              art="box"
              title="Aucune vente pour le moment"
              hint="Publiez un article neuf et partagez votre vitrine pour recevoir vos premières commandes."
              action={<Link to="/publier" className="btn-red btn-sm"><PlusCircle size={20} /> Publier un article</Link>}
            />
          )}
        </Panel>
      </div>

      {/* Modale vente flash */}
      <Modal
        open={flashOpen}
        onClose={() => setFlashOpen(false)}
        title="Lancer une vente flash"
        footer={
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-DM-Sans text-[10px] font-semibold text-djassa-black/60">Nouveau prix</p>
              <p className="font-spacegrotesk text-sm font-extrabold tabular-nums">{flashPrix ? formatFCFA(flashPrix) : '—'}</p>
            </div>
            <button
              type="button"
              className="btn-red"
              disabled={!flashArticleId || !flashPrix || Number(flashPrix) <= 0 || startFlash.isPending}
              onClick={() => startFlash.mutate({ id: flashArticleId, prix: flashPrix, duree: flashDuree })}
            >
              {startFlash.isPending ? <Spinner size={16} /> : <Zap size={16} />} Lancer
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <label htmlFor="flash-article" className="label">Article à promouvoir</label>
            <select id="flash-article" className="input" value={flashArticleId} onChange={(e) => setFlashArticleId(e.target.value)}>
              <option value="">Choisir un article neuf publié…</option>
              {eligible.map((article) => (
                <option key={article.id} value={article.id}>{article.titre} — {formatFCFA(article.prix)}</option>
              ))}
            </select>
            {eligible.length === 0 && (
              <p className="mt-1 text-[10px] text-amber-700">Aucun article neuf publié n’est éligible. Publiez d’abord un article neuf.</p>
            )}
          </div>
          <div>
            <label htmlFor="flash-prix" className="label">Prix flash (FCFA)</label>
            <input id="flash-prix" type="number" min="1" className="input" placeholder="27 500" value={flashPrix} onChange={(e) => setFlashPrix(e.target.value)} />
          </div>
          <div>
            <label htmlFor="flash-duree" className="label">Durée</label>
            <select id="flash-duree" className="input" value={flashDuree} onChange={(e) => setFlashDuree(e.target.value)}>
              <option value="24">24 heures</option>
              <option value="48">48 heures</option>
              <option value="72">72 heures</option>
              <option value="168">7 jours</option>
            </select>
          </div>
          <p className="flex items-start gap-1.5 text-[10px] leading-relaxed text-djassa-black/45">
            <ClipboardList size={20} className="mt-0.5 shrink-0 text-djassa-red" />
            Seuls les articles neufs publiés dans votre boutique sont éligibles aux ventes flash.
          </p>
        </div>
      </Modal>
    </div>
  );
}
