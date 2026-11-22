import { useEffect, useRef, useState } from 'react';
import { usePageReveal } from '../hooks/usePageReveal';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, Sparkles, ShieldCheck, Truck, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Spinner } from '../components/ui';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

export default function Login() {
  const { login, loginWithGoogle, loading, isAuthenticated, user, needsPlan, dashboardPath } = useAuth();
  const scope = useRef(null);
  usePageReveal(scope);
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  // Une offre non choisie force l'onboarding, quelle que soit la page demandée.
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    // Un admin va toujours dans son espace, quelle que soit la page d'origine.
    const destination = user?.role === 'admin'
      ? '/admin'
      : needsPlan
        ? '/choisir-offre'
        : from && !['/moi', '/pro/dashboard', '/login', '/register', '/maintenance'].includes(from)
          ? from
          : dashboardPath ?? '/';
    navigate(destination, { replace: true });
  }, [isAuthenticated, user, needsPlan, dashboardPath, from, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success('Bienvenue sur le Djassa !');
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Identifiants invalides.');
    }
  };

  const googleDev = async () => {
    try {
      await loginWithGoogle('dev.testeur-web');
      toast.success('Connexion Google (mode dev) réussie.');
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Connexion Google impossible.');
    }
  };

  return (
    <div ref={scope} data-reveal className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-[#F1F5F9] px-4 py-8 sm:px-6">
      {/* Carte blanche arrondie */}
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] shadow-[0_20px_60px_rgba(18,18,18,0.08)] md:grid-cols-2">

        {/* Panneau rouge vif */}
        <div className="relative hidden min-h-[380px] flex-col overflow-hidden bg-[#780000] p-5 text-white sm:min-h-[460px] sm:p-8 md:flex md:min-h-[520px] md:p-9">
          {/* dégradé vers un rouge plus soutenu */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#780000] via-[#780000] to-[#780000]" aria-hidden="true" />
          <div className="absolute -left-16 top-10 h-56 w-56 rounded-[5px] bg-white/10 blur-2xl" aria-hidden="true" />
          <div className="absolute bottom-0 right-0 h-64 w-64 rounded-[5px] bg-black/10 blur-2xl" aria-hidden="true" />

          {/* Retour à l'accueil — desktop (dans le panneau) */}
          <Link to="/" className="absolute right-8 top-8 z-20 hidden items-center gap-1.5 rounded-[5px] bg-white/15 px-3 py-1.5 font-spacegrotesk text-[10px] font-extrabold uppercase tracking-wide text-white backdrop-blur-sm transition hover:bg-white/25 md:inline-flex">
            <ArrowLeft size={24} strokeWidth={2.8} /> Retour à l'accueil
          </Link>

          <div className="relative z-10 pt-8 sm:pt-10 md:pt-12">
            <span className="inline-flex items-center gap-1.5 rounded-[5px] bg-white/15 px-3 py-1 font-spacegrotesk text-[9px] font-extrabold uppercase tracking-[0.18em] text-white">
              <Sparkles size={16} /> Le marché d'Abidjan
            </span>
            <h2 className="mt-3 font-spacegrotesk text-2xl font-extrabold leading-[1.1] tracking-tight sm:text-3xl md:text-[36px]">
              Le Djassa dans<br />ta poche<span className="text-white/70">.</span>
            </h2>
            <div className="mt-3 h-0.5 w-16 rounded-[5px] bg-white/70" aria-hidden="true" />
            <p className="mt-3 max-w-sm font-DM-Sans text-[11.5px] leading-relaxed text-white/85 sm:text-[12.5px]">
              Achète, vends et troque en toute confiance — paiement sécurisé par séquestre, code PIN à la remise et boutiques pro vérifiées.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5 md:mt-5 md:gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-[5px] bg-white/10 px-2.5 py-1.5 font-DM-Sans text-[9px] font-semibold text-white/90"><ShieldCheck size={20} /> Paiement sécurisé</span>
              <span className="inline-flex items-center gap-1.5 rounded-[5px] bg-white/10 px-2.5 py-1.5 font-DM-Sans text-[9px] font-semibold text-white/90"><Zap size={20} /> Ventes flash</span>
              <span className="inline-flex items-center gap-1.5 rounded-[5px] bg-white/10 px-2.5 py-1.5 font-DM-Sans text-[9px] font-semibold text-white/90"><Truck size={20} /> Remise en main propre</span>
            </div>
          </div>

          {/* Illustration — panier avec produits flottants */}
          <div className="relative z-10 mt-auto flex flex-1 items-end justify-center pt-1 md:pt-3">
            <img
              src="/images/illustrations/cart-3d-phone.webp"
              alt="Panier Djassa sur mobile — achats en ligne"
              className="art-warm h-40 w-auto max-w-[90%] select-none object-contain drop-shadow-[0_18px_40px_rgba(0,0,0,0.25)] sm:h-56 md:h-[380px] lg:h-[440px]"
             loading="lazy" decoding="async" />
          </div>
        </div>

        {/* Formulaire */}
        <div className="flex flex-col justify-center px-5 py-8 sm:px-10 sm:py-9 md:px-16 lg:px-24">
          <div className="mx-auto w-full max-w-sm">
            {/* Retour à l'accueil — mobile uniquement */}
            <Link to="/" className="mb-6 inline-flex items-center gap-1.5 rounded-[5px] bg-djassa-gray/15 px-3 py-1.5 font-spacegrotesk text-[10px] font-extrabold uppercase tracking-wide text-djassa-black transition hover:bg-djassa-red/10 md:hidden">
              <ArrowLeft size={24} strokeWidth={2.8} /> Retour à l'accueil
            </Link>

            {/* Logo + marque centrés */}
            <div className="flex flex-col items-center">
              <img src="/images/logo-mark.svg" alt="" className="h-12 w-12 rounded-[5px] object-contain shadow-[0_8px_20px_rgba(120,0,0,0.35)]" />
              <p className="mt-2.5 font-spacegrotesk text-[15px] font-extrabold tracking-tight text-djassa-black">Djassa <span className="text-[#780000]">Online</span></p>
              <h1 className="mt-5 font-spacegrotesk text-[26px] font-extrabold tracking-tight text-djassa-black">Content de te revoir</h1>
              <p className="mt-1 font-DM-Sans text-[11px] text-djassa-black/70">Connecte-toi à ton compte Djassa.</p>
            </div>

            {/* Champs */}
            <form onSubmit={submit} className="mt-6 space-y-3">
              <div>
                <label htmlFor="email" className="sr-only">Adresse e-mail</label>
                <div className="relative">
                  <Mail size={24} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-djassa-black/70" />
                  <input id="email" type="email" required autoComplete="email" className="input-auth !pl-10" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Adresse e-mail" />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="sr-only">Mot de passe</label>
                <div className="relative">
                  <LockKeyhole size={24} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-djassa-black/70" />
                  <input id="password" type={showPwd ? 'text' : 'password'} required autoComplete="current-password" className="input-auth !pl-10 !pr-10" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe" />
                  <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-djassa-black/70 transition hover:text-djassa-black" aria-label={showPwd ? 'Masquer' : 'Afficher'}>
                    {showPwd ? <EyeOff size={24} /> : <Eye size={24} />}
                  </button>
                </div>
              </div>
              <button type="button" onClick={() => toast.info('Contactez le support Djassa pour réinitialiser votre mot de passe.')} className="block w-full text-right font-DM-Sans text-[10px] font-semibold text-djassa-black/70 hover:text-djassa-red">Mot de passe oublié ?</button>

              <button type="submit" className="mt-2 w-full rounded-[5px] bg-[#780000] border-solid border-[0.5px] border-[rgba(255,255,255,0.12)] py-3 font-spacegrotesk text-[12px] font-extrabold uppercase tracking-wide text-white shadow-[0_8px_20px_rgba(120,0,0,0.28)] transition hover:bg-[#780000] active:scale-[0.98]" disabled={loading}>
                {loading ? <Spinner size={16} className="" /> : 'Se connecter'}
              </button>
            </form>

            {/* Séparateur */}
            <div className="my-5 flex items-center gap-3 font-DM-Sans text-[10px] text-djassa-black/70">
              <span className="h-px flex-1 bg-djassa-black/10" /> Ou connecte-toi avec <span className="h-px flex-1 bg-djassa-black/10" />
            </div>

            {/* Google + Facebook */}
            <div className="grid grid-cols-2 gap-2.5">
              {GOOGLE_CLIENT_ID ? (
                <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                  <GoogleLogin onSuccess={(r) => loginWithGoogle(r.credential).catch(() => toast.error('Échec Google.'))} onError={() => toast.error('Échec Google.')} theme="outline" shape="square" width="100%" text="continue_with" locale="fr" />
                </GoogleOAuthProvider>
              ) : (
                <button type="button" onClick={googleDev} className="flex items-center justify-center gap-2 rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] shadow-card py-2.5 font-spacegrotesk text-[11px] font-bold text-djassa-black transition hover:bg-djassa-cloud">
                  <GoogleGlyph /> Google
                </button>
              )}
              <button type="button" onClick={() => toast.info('Connexion Facebook bientôt disponible.')} className="flex items-center justify-center gap-2 rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] shadow-card py-2.5 font-spacegrotesk text-[11px] font-bold text-djassa-black transition hover:bg-djassa-cloud">
                <FacebookGlyph /> Facebook
              </button>
            </div>

            <p className="mt-6 text-center font-DM-Sans text-[11px] text-djassa-black/70">
              Pas encore de compte ? <Link to="/register" className="font-spacegrotesk font-extrabold text-[#780000] hover:underline">S'inscrire</Link>
            </p>

            {/* Démo repliée */}
            <details className="group mt-4 rounded-[5px] bg-djassa-cloud/50 px-3 py-2">
              <summary className="cursor-pointer font-DM-Sans text-[10px] font-semibold text-djassa-black/70">Comptes de démonstration</summary>
              <div className="mt-1.5 space-y-0.5 font-DM-Sans text-[9px] text-djassa-black/70">
                <p><code>koffi@djassaonline.ci</code> / <code>password</code> — particulier</p>
                <p><code>bakayoko@djassaonline.ci</code> / <code>password</code> — pro</p>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true"><path fill="#780000" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.1 6 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" /><path fill="#780000" d="M6.3 14.7l6.6 4.8C14.7 15.1 18.9 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.1 6 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" /><path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2C29.3 35.1 26.8 36 24 36c-5.2 0-9.6-3.3-11.2-8l-6.5 5C9.5 39.6 16.2 44 24 44z" /><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4 5.9l6.3 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" /></svg>
  );
}

function FacebookGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true"><path fill="#1877F2" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.96h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07z" /></svg>
  );
}

export { GoogleGlyph };
