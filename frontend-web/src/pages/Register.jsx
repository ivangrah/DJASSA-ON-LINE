import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import {
  ArrowLeftRight, ArrowRight, Check, CheckCircle2, Eye, EyeOff,
  LockKeyhole, Mail, Phone, ShieldCheck, Sparkles, Store, UserRound,
} from 'lucide-react';
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
  const pwdOk = form.password.length >= 8 && form.password === form.password_confirmation;

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

  const formContent = (
    <div className="w-full max-w-[460px]">
      {/* Logo mobile */}
      <div className="mb-6 flex items-center gap-2.5 lg:hidden">
        <img src="/images/logo-256.png" alt="Djassa Online" className="h-10 w-10 rounded-xl shadow-[0_4px_16px_rgba(237,15,2,0.45)]" />
        <span className="font-jakarta text-lg font-extrabold uppercase tracking-tight text-djassa-black">Djassa <span className="text-[#E60023]">Online</span></span>
      </div>

      <span className="inline-flex items-center gap-2 rounded-full bg-djassa-red/10 px-3 py-1.5 font-jakarta text-[9px] font-extrabold uppercase tracking-[0.2em] text-djassa-red">
        <Sparkles size={11} strokeWidth={3} /> Rejoins le mouvement
      </span>
      <h1 className="mt-4 font-jakarta text-[2rem] font-black leading-tight tracking-tight text-djassa-black sm:text-4xl">
        Crée ton compte<span className="text-djassa-red">.</span>
      </h1>
      <p className="mt-2 font-inter text-[13px] text-djassa-slate">Rejoins la marketplace de revente & troc de Côte d'Ivoire.</p>

      {/* Bascule Particulier / Boutique Pro */}
      <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-djassa-cloud p-1.5" role="tablist" aria-label="Type de compte">
        <button role="tab" aria-selected={!asBoutique} onClick={() => setAsBoutique(false)} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-jakarta font-extrabold transition ${!asBoutique ? 'bg-white text-djassa-black shadow-card ring-1 ring-djassa-black/5' : 'text-djassa-slate hover:text-djassa-black'}`}>
          <UserRound size={16} /> Particulier
        </button>
        <button role="tab" aria-selected={asBoutique} onClick={() => setAsBoutique(true)} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-jakarta font-extrabold transition ${asBoutique ? 'bg-djassa-black text-white shadow-card' : 'text-djassa-slate hover:text-djassa-black'}`}>
          <Store size={16} /> Boutique Pro
        </button>
      </div>
      <p className="mt-2 flex items-center gap-1.5 font-inter text-[10px] text-djassa-slate">
        <Check size={11} className="text-emerald-600" strokeWidth={3} />
        {asBoutique ? 'Vends du neuf, génère des factures et obtiens le badge vérifié.' : 'Vends tes affaires, troque et achète en toute confiance.'}
      </p>

      {/* Google */}
      <div className="mt-5">
        {GOOGLE_CLIENT_ID ? (
          <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <GoogleLogin onSuccess={(r) => googleSignup(r.credential)} onError={() => toast.error('Échec Google Sign-In.')} theme="filled_black" shape="pill" width="100%" text="signup_with" locale="fr" />
          </GoogleOAuthProvider>
        ) : (
          <button type="button" onClick={googleDev} className="flex w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-djassa-black bg-white px-4 py-3.5 font-jakarta text-xs font-extrabold text-djassa-black transition hover:border-djassa-red hover:bg-djassa-red/5 active:scale-[0.98]">
            <GoogleGlyph /> S'inscrire avec Google <span className="text-[9px] font-medium opacity-50">(dev)</span>
          </button>
        )}
      </div>

      <div className="my-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-djassa-slate">
        <span className="h-px flex-1 bg-djassa-black/10" /> ou avec ton e-mail <span className="h-px flex-1 bg-djassa-black/10" />
      </div>

      <form onSubmit={submit} className="space-y-3.5">
        <div>
          <label htmlFor="nom" className="label">Nom complet</label>
          <div className="relative">
            <UserRound size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-djassa-slate" />
            <input id="nom" required className="input !pl-12" placeholder="Koffi N'Guessan" value={form.nom} onChange={set('nom')} autoComplete="name" />
          </div>
        </div>
        <div>
          <label htmlFor="email" className="label">Adresse e-mail</label>
          <div className="relative"><Mail size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-djassa-slate" /><input id="email" type="email" required autoComplete="email" className="input !pl-12" placeholder="vous@exemple.ci" value={form.email} onChange={set('email')} /></div>
        </div>
        <div>
          <label htmlFor="telephone" className="label">Téléphone <span className="font-normal normal-case text-djassa-slate">(Mobile Money)</span></label>
          <div className="relative"><Phone size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-djassa-slate" /><input id="telephone" type="tel" autoComplete="tel" className="input !pl-12" placeholder="+225 07 00 00 00 00" value={form.telephone} onChange={set('telephone')} /></div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="password" className="label">Mot de passe</label>
            <div className="relative">
              <LockKeyhole size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-djassa-slate" />
              <input id="password" type={showPwd ? 'text' : 'password'} required minLength={8} autoComplete="new-password" className="input !pl-12" placeholder="8 caractères min." value={form.password} onChange={set('password')} />
            </div>
          </div>
          <div>
            <label htmlFor="password_confirmation" className="label">Confirmation</label>
            <div className="relative">
              <input id="password_confirmation" type={showPwd ? 'text' : 'password'} required minLength={8} autoComplete="new-password" className={`input !pr-12 ${form.password_confirmation && !pwdOk ? '!border-red-400' : ''}`} placeholder="Répétez" value={form.password_confirmation} onChange={set('password_confirmation')} />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-djassa-slate transition hover:bg-djassa-cloud hover:text-djassa-black" onClick={() => setShowPwd((v) => !v)} aria-label={showPwd ? 'Masquer' : 'Afficher'}>{showPwd ? <EyeOff size={17} /> : <Eye size={17} />}</button>
            </div>
          </div>
        </div>
        {form.password && (
          <p className={`flex items-center gap-1.5 font-inter text-[10px] ${pwdOk ? 'text-emerald-600' : 'text-djassa-slate'}`}>
            {pwdOk ? <><CheckCircle2 size={12} /> Les mots de passe correspondent</> : <>8 caractères min. et confirmation identique</>}
          </p>
        )}
        <button type="submit" className="btn-red w-full !py-3.5 !text-[13px]" disabled={loading}>
          {loading ? <Spinner size={18} className="!border-white/40 !border-t-white" /> : <>{asBoutique ? 'Créer mon compte Pro' : 'Créer mon compte'} <ArrowRight size={17} strokeWidth={2.8} /></>}
        </button>
      </form>

      <p className="mt-5 text-center font-inter text-[13px] text-djassa-slate">
        Déjà inscrit ? <Link to="/login" className="font-jakarta font-extrabold text-djassa-red hover:underline">Se connecter</Link>
      </p>
      <p className="mt-3 flex items-center justify-center gap-1.5 font-inter text-[10px] text-djassa-slate">
        <ShieldCheck size={12} className="text-djassa-red" /> Inscription gratuite · paiements sécurisés par séquestre
      </p>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-white pb-20 md:pb-0">
      <div className="grid min-h-[calc(100vh-3.5rem)] lg:grid-cols-[1fr_1.05fr]">
        {/* Formulaire */}
        <div className="flex items-center justify-center bg-white px-4 py-10 sm:px-8 lg:px-12">
          {formContent}
        </div>

        {/* Panneau de marque immersif */}
        <aside className="relative hidden overflow-hidden bg-[#0c0c0c] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <img src="/images/hero-shopping-bags.jpg" alt="" className="absolute inset-0 h-full w-full object-cover object-right opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-bl from-[#0c0c0c]/90 via-[#0c0c0c]/70 to-[#0c0c0c]/40" />
          <div className="absolute -right-24 top-1/4 h-72 w-72 rounded-full bg-djassa-red/20 blur-3xl" aria-hidden="true" />

          <div className="relative flex items-center justify-end gap-2.5">
            <span className="font-jakarta text-lg font-extrabold uppercase tracking-tight">Djassa <span className="text-[#E60023]">Online</span></span>
            <img src="/images/logo-256.png" alt="" className="h-10 w-10 rounded-xl shadow-[0_4px_16px_rgba(237,15,2,0.5)]" />
          </div>

          <div className="relative max-w-lg">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 font-jakarta text-[9px] font-extrabold uppercase tracking-[0.2em] text-white backdrop-blur-md">
              <Sparkles size={11} className="text-[#E60023]" /> C2C · Troc · Boutiques Pro
            </span>
            <h2 className="mt-5 font-jakarta text-5xl font-black leading-[1.05] tracking-tight text-balance">
              Ton prochain coup de cœur<br /><span className="text-[#E60023]">t'attend ici.</span>
            </h2>
            <p className="mt-4 font-inter text-[13px] leading-relaxed text-white/70">Des milliers d'annonces en FCFA, des trocs malins et des boutiques vérifiées — le tout près de chez toi.</p>

            <div className="mt-7 grid grid-cols-2 gap-3">
              {[
                { n: '1 500+', l: 'Annonces actives' },
                { n: '50+', l: 'Boutiques vérifiées' },
                { n: '4.8/5', l: 'Vendeurs notés' },
                { n: '4×', l: 'Moyens de paiement' },
              ].map((s) => (
                <div key={s.l} className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
                  <p className="font-jakarta text-xl font-extrabold text-white">{s.n}</p>
                  <p className="font-inter text-[9px] uppercase tracking-wide text-white/50">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="relative font-inter text-[10px] uppercase tracking-[0.25em] text-white/40">Wave · Orange Money · MTN · Moov</p>
        </aside>
      </div>
    </div>
  );
}
