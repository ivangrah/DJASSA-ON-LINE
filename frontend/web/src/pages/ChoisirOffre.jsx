import { useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import {
  ArrowLeft, ArrowRight, ArrowLeftRight, BadgeCheck, Boxes, Check, Crown,
  LogOut, ReceiptText, ShieldCheck, ShoppingBag, Sparkles, Store, UserRound, Wallet, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Spinner } from '../components/ui';

const FREE_FEATURES = [
  { icon: ShoppingBag, text: 'Acheter des articles d’occasion près de chez vous' },
  { icon: ArrowLeftRight, text: 'Publier des articles d’occasion et proposer des trocs' },
  { icon: Sparkles, text: 'Publier sur le Mur des Souhaits' },
  { icon: ShieldCheck, text: 'Paiement sécurisé par séquestre + code PIN' },
];

const PRO_FEATURES = [
  { icon: Store, text: 'Créer votre Boutique officielle avec vitrine publique' },
  { icon: Boxes, text: 'Vendre du matériel neuf avec gestion des stocks' },
  { icon: ArrowLeftRight, text: 'Troquer et acheter comme un particulier' },
  { icon: ReceiptText, text: 'Éditer des factures et reçus PDF professionnels' },
  { icon: BadgeCheck, text: 'Badge Vendeur Vérifié après validation KYC' },
];

const COMPARISON = [
  ['Acheter sur le marché', true, true],
  ['Publier des annonces d’occasion', true, true],
  ['Troc pur & mixte', true, true],
  ['Mur des Souhaits', true, true],
  ['Boutique officielle', false, true],
  ['Vente de matériel neuf', false, true],
  ['Gestion des stocks', false, true],
  ['Factures & reçus PDF', false, true],
  ['Ventes Flash & statistiques', false, true],
];

export default function ChoisirOffre() {
  const { user, isAdmin, selectPlan, loading, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const root = useRef(null);
  const [pending, setPending] = useState(null);

  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const ctx = gsap.context(() => {
      gsap.from('.offer-head', { y: 26, opacity: 0, duration: 0.7, ease: 'power3.out' });
      gsap.from('.offer-card', { y: 44, opacity: 0, duration: 0.8, stagger: 0.14, delay: 0.12, ease: 'power3.out' });
      gsap.from('.offer-row', { y: 12, opacity: 0, duration: 0.42, stagger: 0.035, delay: 0.5, ease: 'power2.out' });
    }, root);
    return () => ctx.revert();
  }, []);

  const choose = async (plan) => {
    if (isAdmin) {
      toast.info('Le compte administrateur n’est pas soumis au choix d’une offre.');
      return;
    }

    const destination = plan === 'pro' ? '/dashboard-pro' : '/dashboard';
    if (user?.plan_abonnement === plan) {
      navigate(destination);
      return;
    }

    if (plan === 'gratuit' && user?.role === 'vendeur_pro') {
      const ok = window.confirm(
        'Revenir à l’offre gratuite fermera l’accès aux outils Pro (boutique, neuf, factures). Continuer ?'
      );
      if (!ok) return;
    }

    setPending(plan);
    try {
      const data = await selectPlan(plan);
      toast.success(data.message);
      navigate(data.redirect_to ?? destination, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Impossible d’activer cette offre.');
    } finally {
      setPending(null);
    }
  };

  const current = user?.plan_abonnement;

  return (
    <div ref={root} className="relative min-h-screen overflow-hidden bg-djassa-black font-DM-Sans text-white">
      {/* Halos de marque */}
      <div className="pointer-events-none absolute -left-40 top-[-10%] h-[520px] w-[520px] rounded-[5px] bg-djassa-red/25 blur-[130px]" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-32 bottom-[-15%] h-[460px] w-[460px] rounded-[5px] bg-djassa-red/15 blur-[120px]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.035]" aria-hidden="true" style={{ backgroundImage: 'radial-gradient(#FFFFFF 0.7px, transparent 0.7px)', backgroundSize: '18px 18px' }} />
      <img src="/images/illustrations/storefront-arrows.webp" alt="" aria-hidden="true" className="art-warm pointer-events-none absolute right-2 top-20 hidden h-44 w-auto select-none object-contain opacity-25 lg:block"  loading="lazy" decoding="async" />

      <header className="relative z-10 mx-auto flex h-20 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5" aria-label="Djassa Online — accueil">
          <img src="/images/logo-mark.svg" alt="" className="h-10 w-10 rounded-[5px] shadow-[0_6px_20px_rgba(120,0,0,0.5)]" />
          <span className="font-spacegrotesk text-[17px] font-extrabold tracking-tight">
            Djassa<span className="text-white/45"> Online</span>
          </span>
        </Link>
        <span className="ml-2 hidden rounded-[5px] bg-white/5 px-3 py-1 font-spacegrotesk text-[9px] font-extrabold uppercase tracking-[0.18em] text-white/60 sm:inline-flex">
          Étape 2 · Votre offre
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/" className="hidden items-center gap-1.5 rounded-[5px] px-3 py-2 text-[11px] font-bold text-white/60 transition hover:text-white sm:inline-flex">
            <ArrowLeft size={13} /> Retour au marché
          </Link>
          <button type="button" onClick={logout} className="rounded-[5px] p-2.5 text-white/45 transition hover:bg-white/10 hover:text-white" aria-label="Se déconnecter">
            <LogOut size={17} />
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-20 pt-4 sm:px-6 lg:px-8 lg:pt-6">
        <div className="offer-head mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-[5px] bg-djassa-red/10 px-3.5 py-1.5 font-spacegrotesk text-[9px] font-extrabold uppercase tracking-[0.2em] text-djassa-red">
            <Sparkles size={20} /> Dernière étape avant votre dashboard
          </span>
          <h1 className="mt-4 font-spacegrotesk text-[32px] font-extrabold leading-[1.05] tracking-tight sm:text-[44px]">
            Comment souhaitez-vous<br className="hidden sm:block" /> utiliser <span className="text-djassa-red">Djassa Online</span> ?
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-[13px] leading-relaxed text-white/55 sm:text-[14px]">
            Bonjour {user?.nom?.split(' ')[0] ?? 'et bienvenue'} — choisissez votre espace. Vous pourrez passer à l’offre Pro à tout moment.
          </p>
        </div>

        {isAdmin && (
          <div className="mx-auto mt-6 max-w-2xl rounded-[5px] bg-amber-400/10 px-4 py-3 text-center text-[12px] font-semibold text-amber-200">
            Compte administrateur : la sélection d’offre est désactivée.{' '}
            <Link to="/dashboard-pro" className="underline underline-offset-2">Accéder à la supervision</Link>.
          </div>
        )}

        {location.state?.renew && (
          <div className="mx-auto mt-6 max-w-2xl rounded-[5px] bg-djassa-red/10 px-4 py-3 text-center text-[12px] font-semibold text-djassa-red">
            Votre abonnement Pro a expiré. Renouvelez-le pour retrouver vos outils vendeur.
          </div>
        )}

        <div className="mt-9 grid gap-4 lg:mt-12 lg:grid-cols-2 lg:gap-5">
          {/* Offre gratuite */}
          <section className="offer-card relative flex flex-col overflow-hidden rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] p-6 text-djassa-black shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-8">
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[5px] bg-djassa-cloud border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] text-djassa-black">
                <UserRound size={22} />
              </div>
              {current === 'gratuit' ? (
                <span className="rounded-[5px] bg-djassa-black px-3 py-1 font-spacegrotesk text-[9px] font-extrabold uppercase tracking-wide text-white">
                  Offre actuelle
                </span>
              ) : (
                <span className="rounded-[5px] bg-djassa-cloud px-3 py-1 font-spacegrotesk text-[9px] font-extrabold uppercase tracking-wide text-djassa-black/50">
                  0 FCFA / toujours
                </span>
              )}
            </div>

            <h2 className="mt-5 font-spacegrotesk text-[24px] font-extrabold tracking-tight">Offre Gratuite</h2>
            <p className="mt-1 font-spacegrotesk text-[11px] font-extrabold uppercase tracking-[0.16em] text-djassa-black/40">
              Particulier · C2C & troc
            </p>
            <p className="mt-3 text-[12.5px] leading-relaxed text-djassa-black/60">
              L’essentiel pour acheter, revendre vos affaires et troquer en toute confiance sur le Djassa.
            </p>

            <div className="mt-5 flex items-end gap-1.5">
              <span className="font-spacegrotesk text-[38px] font-extrabold leading-none tracking-tight">0</span>
              <span className="pb-1 font-spacegrotesk text-[13px] font-extrabold text-djassa-black/45">FCFA</span>
              <span className="pb-1.5 pl-1 text-[11px] text-djassa-black/40">sans engagement</span>
            </div>

            <ul className="mt-6 flex-1 space-y-2.5">
              {FREE_FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-2.5 text-[12px] leading-snug text-djassa-black/70">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] bg-djassa-cloud text-djassa-black">
                    <Icon size={20} />
                  </span>
                  {text}
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => choose('gratuit')}
              disabled={loading || Boolean(pending)}
              className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] shadow-card font-spacegrotesk text-[12px] font-extrabold uppercase tracking-wide text-djassa-black transition hover:bg-djassa-black hover:text-white active:scale-[0.99] disabled:opacity-50"
            >
              {pending === 'gratuit' ? (
                <><Spinner size={16} className="" /> Activation…</>
              ) : (
                <>{current === 'gratuit' ? 'Continuer sur mon espace' : 'Continuer gratuitement'} <ArrowRight size={15} /></>
              )}
            </button>
            <p className="mt-2.5 text-center text-[9.5px] text-djassa-black/40">
              Accès immédiat — aucune carte bancaire requise.
            </p>
          </section>

          {/* Offre Pro */}
          <section className="offer-card relative flex flex-col overflow-hidden rounded-[5px] bg-djassa-red border-solid border-[0.5px] border-[rgba(255,255,255,0.12)] p-6 text-white shadow-[0_28px_90px_rgba(120,0,0,0.4)] sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-[5px] bg-white/10 blur-2xl" aria-hidden="true" />
            <div className="relative flex items-start justify-between gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[5px] bg-black/20 text-white">
                <Store size={22} />
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className="rounded-[5px] bg-white px-3 py-1 font-spacegrotesk text-[9px] font-extrabold uppercase tracking-wide text-djassa-red shadow-sm">
                  Recommandé
                </span>
                {current === 'pro' && (
                  <span className="rounded-[5px] bg-black/20 px-3 py-1 font-spacegrotesk text-[9px] font-extrabold uppercase tracking-wide text-white">
                    Offre actuelle
                  </span>
                )}
              </div>
            </div>

            <h2 className="relative mt-5 font-spacegrotesk text-[24px] font-extrabold tracking-tight">Offre Pro</h2>
            <p className="relative mt-1 font-spacegrotesk text-[11px] font-extrabold uppercase tracking-[0.16em] text-white/60">
              Commerçant · Boutique officielle
            </p>
            <p className="relative mt-3 text-[12.5px] leading-relaxed text-white/75">
              Ouvrez votre Boutique officielle et transformez Djassa en canal de vente professionnel.
            </p>

            <div className="relative mt-5 flex items-end gap-1.5">
              <span className="font-spacegrotesk text-[38px] font-extrabold leading-none tracking-tight">5 000</span>
              <span className="pb-1 font-spacegrotesk text-[13px] font-extrabold text-white/60">FCFA</span>
              <span className="pb-1.5 pl-1 text-[11px] text-white/55">/ mois</span>
            </div>

            <ul className="relative mt-6 flex-1 space-y-2.5">
              {PRO_FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-2.5 text-[12px] leading-snug text-white/85">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] bg-white/15 text-white">
                    <Icon size={20} />
                  </span>
                  {text}
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => choose('pro')}
              disabled={loading || Boolean(pending)}
              className="relative mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] font-spacegrotesk text-[12px] font-extrabold uppercase tracking-wide text-djassa-red shadow-[0_10px_30px_rgba(0,0,0,0.18)] transition hover:bg-djassa-red-soft active:scale-[0.99] disabled:opacity-60"
            >
              {pending === 'pro' ? (
                <><Spinner size={16} className="" /> Activation…</>
              ) : (
                <>{current === 'pro' ? 'Accéder à mon espace Pro' : 'Passer Pro'} <Crown size={15} /></>
              )}
            </button>
            <p className="relative mt-2.5 text-center text-[9.5px] text-white/55">
              Activation immédiate · Renouvellement mensuel · Résiliable à tout moment.
            </p>
          </section>
        </div>

        {/* Comparatif */}
        <section className="mt-10 overflow-hidden rounded-[5px] bg-white/[0.04] backdrop-blur-sm lg:mt-12">
          <div className="grid grid-cols-[1fr_88px_88px] items-center gap-2 px-4 py-3 sm:grid-cols-[1fr_120px_120px] sm:px-6">
            <p className="font-spacegrotesk text-[9px] font-extrabold uppercase tracking-[0.18em] text-white/40">Comparaison des offres</p>
            <p className="text-center font-spacegrotesk text-[10px] font-extrabold text-white/60">Gratuit</p>
            <p className="text-center font-spacegrotesk text-[10px] font-extrabold text-djassa-red">Pro</p>
          </div>
          {COMPARISON.map(([label, free, pro]) => (
            <div key={label} className="offer-row grid grid-cols-[1fr_88px_88px] items-center gap-2 px-4 py-2.5 sm:grid-cols-[1fr_120px_120px] sm:px-6">
              <p className="text-[11.5px] text-white/65">{label}</p>
              <div className="flex justify-center">
                {free ? <Check size={15} className="text-white/70" strokeWidth={3} /> : <X size={14} className="text-white/20" />}
              </div>
              <div className="flex justify-center">
                {pro ? <Check size={15} className="text-djassa-red" strokeWidth={3} /> : <X size={14} className="text-white/20" />}
              </div>
            </div>
          ))}
        </section>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <p className="flex items-center gap-2 text-[10.5px] text-white/40">
            <ShieldCheck size={13} className="text-djassa-red" />
            Paiements protégés par séquestre — Wave, Orange Money, MTN, Moov.
          </p>
          <p className="flex items-center gap-1.5 text-[10.5px] text-white/40">
            <Wallet size={13} className="text-djassa-red" /> Tous les montants sont en FCFA.
          </p>
        </div>
      </main>
    </div>
  );
}
