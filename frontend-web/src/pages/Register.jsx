import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { ArrowLeftRight, Eye, EyeOff, LockKeyhole, Mail, Store, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Spinner } from '../components/ui';
import { GoogleGlyph } from './Login';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

export default function Register() {
  const { register, loginWithGoogle, loading, isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ nom: '', email: '', telephone: '', password: '', password_confirmation: '' });
  const [asBoutique, setAsBoutique] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password_confirmation) {
      toast.error('Les mots de passe ne correspondent pas.');
      return;
    }
    try {
      await register({ ...form, role: undefined });
      toast.success(asBoutique ? 'Compte créé — ouvrez maintenant votre boutique pro.' : 'Bienvenue sur le Djassa !');
      navigate(asBoutique ? '/moi?ouvrir-boutique=1' : '/', { replace: true });
    } catch (error) {
      const resp = error.response?.data;
      const msg = resp?.errors ? Object.values(resp.errors).flat()[0] : (resp?.message ?? 'Inscription impossible.');
      toast.error(msg);
    }
  };

  const googleSignup = async (credential) => {
    try {
      const data = await loginWithGoogle(credential, asBoutique ? 'pro_seller' : 'user');
      toast.success(asBoutique ? 'Compte Google créé — ouvrez votre boutique pro.' : 'Bienvenue sur le Djassa !');
      navigate(asBoutique && data?.needs_boutique ? '/moi?ouvrir-boutique=1' : '/', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Inscription Google impossible.');
    }
  };

  const googleDev = async () => {
    try {
      await loginWithGoogle('dev.testeur-inscription', asBoutique ? 'pro_seller' : 'user');
      toast.success('Inscription Google (mode dev) réussie.');
      navigate('/', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Inscription Google impossible.');
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-10">
      <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-djassa-red text-white shadow-pop"><ArrowLeftRight size={30} /></span>
      <h1 className="mt-4 font-jakarta text-2xl font-extrabold text-djassa-black">Créer mon compte</h1>
      <p className="mt-1 text-xs text-djassa-slate">Rejoignez la marketplace de revente & troc de Côte d'Ivoire.</p>

      {/* Bascule Particulier / Boutique Pro */}
      <div className="mt-5 grid w-full grid-cols-2 gap-2 rounded-2xl bg-djassa-cloud p-1.5" role="tablist" aria-label="Type de compte">
        <button role="tab" aria-selected={!asBoutique} onClick={() => setAsBoutique(false)} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-jakarta font-bold transition ${!asBoutique ? 'bg-white text-djassa-black shadow-card' : 'text-djassa-slate'}`}>
          <UserRound size={15} /> Particulier
          <span className="block text-[8px] font-inter font-medium text-djassa-slate">vendre · troquer</span>
        </button>
        <button role="tab" aria-selected={asBoutique} onClick={() => setAsBoutique(true)} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-jakarta font-bold transition ${asBoutique ? 'bg-djassa-black text-white shadow-card' : 'text-djassa-slate'}`}>
          <Store size={15} /> Boutique Pro
          <span className="block text-[8px] font-inter font-medium text-white/60">neufs · factures</span>
        </button>
      </div>

      {/* Google */}
      <div className="mt-4 w-full">
        {GOOGLE_CLIENT_ID ? (
          <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <GoogleLogin onSuccess={(r) => googleSignup(r.credential)} onError={() => toast.error('Échec Google Sign-In.')} theme="filled_black" shape="pill" width="100%" text="signup_with" locale="fr" />
          </GoogleOAuthProvider>
        ) : (
          <button type="button" onClick={googleDev} className="flex w-full items-center justify-center gap-2.5 rounded-full border-2 border-djassa-black bg-djassa-black px-4 py-3 font-jakarta text-xs font-bold text-white transition hover:bg-djassa-red hover:border-djassa-red">
            <GoogleGlyph /> S'inscrire avec Google <span className="text-[9px] font-medium opacity-60">(dev)</span>
          </button>
        )}
      </div>

      <div className="my-4 flex w-full items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-djassa-slate"><span className="h-px flex-1 bg-djassa-black/10" /> ou e-mail <span className="h-px flex-1 bg-djassa-black/10" /></div>

      <form onSubmit={submit} className="w-full space-y-3">
        <div>
          <label htmlFor="nom" className="label">Nom complet *</label>
          <input id="nom" required className="input" placeholder="Koffi N'Guessan" value={form.nom} onChange={set('nom')} autoComplete="name" />
        </div>
        <div>
          <label htmlFor="email" className="label">E-mail *</label>
          <div className="relative"><Mail size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-djassa-slate" /><input id="email" type="email" required autoComplete="email" className="input !pl-11" placeholder="vous@exemple.ci" value={form.email} onChange={set('email')} /></div>
        </div>
        <div>
          <label htmlFor="telephone" className="label">Téléphone (Mobile Money)</label>
          <input id="telephone" type="tel" autoComplete="tel" className="input" placeholder="+225 07 00 00 00 00" value={form.telephone} onChange={set('telephone')} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="password" className="label">Mot de passe *</label>
            <div className="relative"><LockKeyhole size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-djassa-slate" /><input id="password" type={showPwd ? 'text' : 'password'} required minLength={8} autoComplete="new-password" className="input !pl-11" placeholder="8 caractères min." value={form.password} onChange={set('password')} /></div>
          </div>
          <div>
            <label htmlFor="password_confirmation" className="label">Confirmation *</label>
            <div className="relative"><input id="password_confirmation" type={showPwd ? 'text' : 'password'} required minLength={8} autoComplete="new-password" className="input !pr-12" placeholder="Répétez" value={form.password_confirmation} onChange={set('password_confirmation')} /><button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-djassa-slate hover:text-djassa-black" onClick={() => setShowPwd((v) => !v)} aria-label={showPwd ? 'Masquer' : 'Afficher'}>{showPwd ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
          </div>
        </div>
        <button type="submit" className="btn-red w-full" disabled={loading}>{loading ? <Spinner size={18} className="!border-white/40 !border-t-white" /> : null} {asBoutique ? 'Créer mon compte Pro' : 'Créer mon compte'}</button>
      </form>

      <p className="mt-4 text-center text-xs text-djassa-slate">Déjà inscrit ? <Link to="/login" className="font-bold text-djassa-red hover:underline">Se connecter</Link></p>
    </div>
  );
}
