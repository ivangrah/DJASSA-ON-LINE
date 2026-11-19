import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import {
  ArrowLeftRight, ArrowRight, Eye, EyeOff, LockKeyhole, Mail,
  ShieldCheck, Store, Sparkles, TrendingUp, CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Spinner } from '../components/ui';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

export default function Login() {
  const { login, loginWithGoogle, loading, isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, from, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success('Bienvenue sur le Djassa !');
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Identifiants invalides.');
    }
  };

  const googleDev = async () => {
    try {
      await loginWithGoogle('dev.testeur-web');
      toast.success('Connexion Google (mode dev) réussie.');
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Connexion Google impossible.');
    }
  };

  const form = (
    <div className="w-full max-w-[420px]">
      {/* Logo mobile */}
      <div className="mb-6 flex items-center gap-2.5 lg:hidden">
        <img src="/images/logo-256.png" alt="Djassa Online" className="h-10 w-10 rounded-xl shadow-[0_4px_16px_rgba(237,15,2,0.45)]" />
        <span className="font-jakarta text-lg font-extrabold uppercase tracking-tight text-djassa-black">Djassa <span className="text-[#E60023]">Online</span></span>
      </div>

      <span className="inline-flex items-center gap-2 rounded-full bg-djassa-red/10 px-3 py-1.5 font-jakarta text-[9px] font-extrabold uppercase tracking-[0.2em] text-djassa-red">
        <Sparkles size={11} strokeWidth={3} /> Bon retour sur le Djassa
      </span>

      <h1 className="mt-4 font-jakarta text-[2rem] font-black leading-tight tracking-tight text-djassa-black sm:text-4xl">
        Content de te revoir<span className="text-djassa-red">.</span>
      </h1>
      <p className="mt-2 font-inter text-[13px] text-djassa-slate">Connecte-toi pour retrouver tes annonces, tes trocs et tes ventes flash.</p>

      {/* Google */}
      <div className="mt-7">
        {GOOGLE_CLIENT_ID ? (
          <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <GoogleLogin
              onSuccess={(credentialResponse) => loginWithGoogle(credentialResponse.credential).then(() => navigate(from, { replace: true })).catch(() => toast.error('Échec Google Sign-In.'))}
              onError={() => toast.error('Échec Google Sign-In.')}
              theme="filled_black" shape="pill" width="100%" text="continue_with" locale="fr"
            />
          </GoogleOAuthProvider>
        ) : (
          <button type="button" onClick={googleDev} className="flex w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-djassa-black bg-white px-4 py-3.5 font-jakarta text-xs font-extrabold text-djassa-black transition hover:border-djassa-red hover:bg-djassa-red/5 active:scale-[0.98]">
            <GoogleGlyph /> Continuer avec Google <span className="text-[9px] font-medium opacity-50">(dev)</span>
          </button>
        )}
      </div>

      <div className="my-6 flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-djassa-slate">
        <span className="h-px flex-1 bg-djassa-black/10" /> ou avec ton e-mail <span className="h-px flex-1 bg-djassa-black/10" />
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="email" className="label">Adresse e-mail</label>
          <div className="relative">
            <Mail size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-djassa-slate" />
            <input id="email" type="email" required autoComplete="email" className="input !pl-12" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.ci" />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="label">Mot de passe</label>
            <button type="button" onClick={() => toast.info("Contactez le support Djassa pour réinitialiser votre mot de passe.")} className="font-inter text-[10px] font-semibold text-djassa-red hover:underline">Mot de passe oublié ?</button>
          </div>
          <div className="relative">
            <LockKeyhole size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-djassa-slate" />
            <input id="password" type={showPwd ? 'text' : 'password'} required autoComplete="current-password" className="input !pl-12 !pr-12" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-djassa-slate transition hover:bg-djassa-cloud hover:text-djassa-black" aria-label={showPwd ? 'Masquer' : 'Afficher'}>
              {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>
        <button type="submit" className="btn-red w-full !py-3.5 !text-[13px]" disabled={loading}>
          {loading ? <Spinner size={18} className="!border-white/40 !border-t-white" /> : <>Se connecter <ArrowRight size={17} strokeWidth={2.8} /></>}
        </button>
      </form>

      <p className="mt-6 text-center font-inter text-[13px] text-djassa-slate">
        Pas encore de compte ? <Link to="/register" className="font-jakarta font-extrabold text-djassa-red hover:underline">Créer mon compte</Link>
      </p>

      {/* Démo repliée */}
      <details className="group mt-5 rounded-2xl border border-dashed border-djassa-black/15 bg-djassa-cloud/60 px-4 py-3">
        <summary className="cursor-pointer font-inter text-[11px] font-semibold text-djassa-slate">Comptes de démonstration</summary>
        <div className="mt-2 space-y-1 font-inter text-[10px] leading-relaxed text-djassa-slate">
          <p><code className="rounded bg-white px-1 py-0.5">koffi@djassaonline.ci</code> / <code>password</code> — particulier</p>
          <p><code className="rounded bg-white px-1 py-0.5">bakayoko@djassaonline.ci</code> / <code>password</code> — Quincaillerie Moderne</p>
        </div>
      </details>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-white pb-20 md:pb-0">
      <div className="grid min-h-[calc(100vh-3.5rem)] lg:grid-cols-[1.05fr_1fr]">
        {/* Panneau de marque immersif */}
        <aside className="relative hidden overflow-hidden bg-[#0c0c0c] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <img src="/images/hero-shopping-bags.jpg" alt="" className="absolute inset-0 h-full w-full object-cover object-left opacity-45" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0c0c0c]/90 via-[#0c0c0c]/70 to-[#0c0c0c]/40" />
          <div className="absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-djassa-red/20 blur-3xl" aria-hidden="true" />
          <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-djassa-red/10 blur-3xl" aria-hidden="true" />

          <div className="relative">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <img src="/images/logo-256.png" alt="" className="h-10 w-10 rounded-xl shadow-[0_4px_16px_rgba(237,15,2,0.5)]" />
              <span className="font-jakarta text-lg font-extrabold uppercase tracking-tight">Djassa <span className="text-[#E60023]">Online</span></span>
            </Link>
          </div>

          <div className="relative max-w-lg">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 font-jakarta text-[9px] font-extrabold uppercase tracking-[0.2em] text-white backdrop-blur-md">
              <TrendingUp size={11} className="text-[#E60023]" /> La marketplace d'Abidjan
            </span>
            <h2 className="mt-5 font-jakarta text-5xl font-black leading-[1.05] tracking-tight text-balance">
              Tout le Djassa<br /><span className="text-[#E60023]">dans ta poche.</span>
            </h2>
            <p className="mt-4 font-inter text-[13px] leading-relaxed text-white/70">
              Achète, vends et troque en confiance — paiement sécurisé, code PIN à la remise et boutiques pro vérifiées.
            </p>

            <div className="mt-7 space-y-3">
              {[
                { icon: ShieldCheck, text: 'Séquestre GeniusPay + code PIN à la remise' },
                { icon: ArrowLeftRight, text: 'Troc pur ou mixte avec soulte FCFA' },
                { icon: Store, text: 'Boutiques Pro neuves vérifiées, factures PDF' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15 backdrop-blur">
                    <Icon size={16} className="text-[#E60023]" />
                  </span>
                  <span className="font-inter text-[13px] text-white/85">{text}</span>
                  <CheckCircle2 size={15} className="ml-auto text-emerald-400" />
                </div>
              ))}
            </div>
          </div>

          <p className="relative font-inter text-[10px] uppercase tracking-[0.25em] text-white/40">Wave · Orange Money · MTN · Moov</p>
        </aside>

        {/* Formulaire */}
        <div className="flex items-center justify-center bg-white px-4 py-10 sm:px-8 lg:px-12">
          {form}
        </div>
      </div>
    </div>
  );
}

export function GoogleGlyph() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.1 6 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" /><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 18.9 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.1 6 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" /><path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2C29.3 35.1 26.8 36 24 36c-5.2 0-9.6-3.3-11.2-8l-6.5 5C9.5 39.6 16.2 44 24 44z" /><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4 5.9l6.3 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" /></svg>
  );
}
