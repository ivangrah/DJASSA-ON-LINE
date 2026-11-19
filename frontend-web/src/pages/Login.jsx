import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { ArrowLeftRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Store } from 'lucide-react';
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

  const [email, setEmail] = useState('koffi@djassaonline.ci');
  const [password, setPassword] = useState('password');
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
    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-card sm:p-8">
      <h1 className="font-jakarta text-2xl font-extrabold text-djassa-black">Connexion</h1>
      <p className="mt-1 text-xs text-djassa-slate">Retrouvez vos annonces, trocs et ventes flash.</p>

      {/* Google */}
      <div className="mt-5">
        {GOOGLE_CLIENT_ID ? (
          <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <GoogleLogin
              onSuccess={(credentialResponse) => loginWithGoogle(credentialResponse.credential).then(() => navigate(from, { replace: true })).catch(() => toast.error('Échec Google Sign-In.'))}
              onError={() => toast.error('Échec Google Sign-In.')}
              theme="filled_black"
              shape="pill"
              width="100%"
              text="continue_with"
              locale="fr"
            />
          </GoogleOAuthProvider>
        ) : (
          <button type="button" onClick={googleDev} className="flex w-full items-center justify-center gap-2.5 rounded-full border-2 border-djassa-black bg-djassa-black px-4 py-3 font-jakarta text-xs font-bold text-white transition hover:bg-djassa-red hover:border-djassa-red">
            <GoogleGlyph /> Continuer avec Google <span className="text-[9px] font-medium opacity-60">(dev)</span>
          </button>
        )}
      </div>

      <div className="my-4 flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-djassa-slate"><span className="h-px flex-1 bg-djassa-black/10" /> ou e-mail <span className="h-px flex-1 bg-djassa-black/10" /></div>

      <form onSubmit={submit} className="space-y-3">
        <div>
          <label htmlFor="email" className="label">E-mail</label>
          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-djassa-slate" />
            <input id="email" type="email" required autoComplete="email" className="input !pl-11" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.ci" />
          </div>
        </div>
        <div>
          <label htmlFor="password" className="label">Mot de passe</label>
          <div className="relative">
            <LockKeyhole size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-djassa-slate" />
            <input id="password" type={showPwd ? 'text' : 'password'} required autoComplete="current-password" className="input !pl-11 !pr-12" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-djassa-slate hover:text-djassa-black" aria-label={showPwd ? 'Masquer' : 'Afficher'}>
              {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>
        <button type="submit" className="btn-red w-full" disabled={loading}>{loading ? <Spinner size={18} className="!border-white/40 !border-t-white" /> : null} Se connecter</button>
      </form>

      <p className="mt-4 text-center text-xs text-djassa-slate">
        Pas encore de compte ? <Link to="/register" className="font-bold text-djassa-red hover:underline">Créer mon compte</Link>
      </p>
      <p className="mt-3 rounded-xl bg-djassa-cloud px-3 py-2 text-center text-[10px] text-djassa-slate">
        Démo — <code>koffi@djassaonline.ci</code> / <code>password</code> (particulier) · <code>bakayoko@djassaonline.ci</code> / <code>password</code> (Quincaillerie Moderne)
      </p>
    </div>
  );

  return (
    <div className="grid min-h-[calc(100vh-3.5rem)] lg:grid-cols-2">
      {/* Panneau de marque */}
      <aside className="relative hidden overflow-hidden bg-djassa-black p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <p className="font-jakarta text-lg font-extrabold">Djassa <span className="text-djassa-red">Online</span></p>
        <div className="geo-pattern absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="relative">
          <ArrowLeftRight size={44} className="text-djassa-red" />
          <h2 className="mt-4 font-jakarta text-4xl font-extrabold leading-[1.08] text-balance">Le marché d'Abidjan<br /><span className="text-djassa-red">dans ta poche.</span></h2>
          <ul className="mt-6 space-y-2.5 text-sm text-white/80">
            <li className="flex items-center gap-2"><ShieldCheck size={16} className="text-djassa-red" /> Séquestre GeniusPay + code PIN à la remise</li>
            <li className="flex items-center gap-2"><ArrowLeftRight size={16} className="text-djassa-red" /> Troc pur ou mixte avec soulte FCFA</li>
            <li className="flex items-center gap-2"><Store size={16} className="text-djassa-red" /> Boutiques Pro neuves vérifiées, factures PDF</li>
          </ul>
        </div>
        <p className="relative text-[10px] uppercase tracking-[0.25em] text-white/40">Wave · Orange Money · MTN · Moov</p>
      </aside>
      <div className="flex items-center justify-center px-4 py-10">{form}</div>
    </div>
  );
}

export function GoogleGlyph() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.1 6 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" /><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 18.9 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.1 6 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" /><path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2C29.3 35.1 26.8 36 24 36c-5.2 0-9.6-3.3-11.2-8l-6.5 5C9.5 39.6 16.2 44 24 44z" /><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4 5.9l6.3 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" /></svg>
  );
}
