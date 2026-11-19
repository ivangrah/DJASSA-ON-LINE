import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import {
  ArrowLeft, ArrowRight, Check, CheckCircle2, Eye, EyeOff,
  LockKeyhole, Mail, Phone, ShieldCheck, Sparkles, Store, UserRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Spinner } from '../components/ui';
import { GoogleGlyph } from './Login';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';
const STEPS = ['Votre profil', 'Vos coordonnées', 'Sécurité'];

export default function Register() {
  const { register, loginWithGoogle, loading, isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ nom: '', email: '', telephone: '', password: '', password_confirmation: '' });
  const [asBoutique, setAsBoutique] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const pwdOk = form.password.length >= 8 && form.password === form.password_confirmation;

  const canNext = step === 0 ? true : step === 1 ? form.nom.trim().length >= 2 && /\S+@\S+\.\S+/.test(form.email) : pwdOk;

  const next = () => {
    if (!canNext) {
      toast.info(step === 1 ? 'Renseignez un nom et un e-mail valide.' : '8 caractères min. et confirmation identique.');
      return;
    }
    setStep((s) => Math.min(s + 1, 2));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (step < 2) { next(); return; }
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
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-[#f3f4f6] px-4 py-8 sm:px-6">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[32px] bg-white shadow-[0_20px_60px_rgba(18,18,18,0.08)] md:grid-cols-2">

        {/* Panneau rouge — illustration smartphone avec logo */}
        <div className="relative hidden min-h-[380px] flex-col overflow-hidden bg-[#ED0F02] p-5 text-white sm:min-h-[460px] sm:p-8 md:flex md:min-h-[520px] md:p-9">
          <div className="absolute inset-0 bg-gradient-to-br from-[#ff2d1f] via-[#ED0F02] to-[#b80b00]" aria-hidden="true" />
          <div className="absolute -left-16 top-10 h-56 w-56 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
          <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-black/10 blur-2xl" aria-hidden="true" />

          <Link to="/" className="absolute right-8 top-8 z-20 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 font-jakarta text-[10px] font-extrabold uppercase tracking-wide text-white backdrop-blur-sm ring-1 ring-white/25 transition hover:bg-white/25">
            <ArrowLeft size={13} strokeWidth={2.8} /> Retour à l'accueil
          </Link>

          <div className="relative z-10 pt-8 sm:pt-10 md:pt-12">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 font-jakarta text-[9px] font-extrabold uppercase tracking-[0.18em] text-white ring-1 ring-white/25"><Sparkles size={10} /> C2C · Troc · Boutiques Pro</span>
            <h2 className="mt-4 font-jakarta text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-[36px]">
              Ton prochain coup de cœur<br /><span className="text-white/70">t'attend ici.</span>
            </h2>
            <div className="mt-3 h-0.5 w-16 rounded-full bg-white/70" aria-hidden="true" />
            <p className="mt-4 max-w-sm font-inter text-[12.5px] leading-relaxed text-white/85">
              Des milliers d'annonces en FCFA, des trocs malins et des boutiques vérifiées — le tout dans ta poche.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              {[{ n: '1 500+', l: 'Annonces' }, { n: '50+', l: 'Boutiques' }].map((s) => (
                <div key={s.l} className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-sm">
                  <p className="font-jakarta text-lg font-extrabold">{s.n}</p>
                  <p className="font-inter text-[9px] uppercase tracking-wide text-white/60">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 mt-auto flex flex-1 items-end justify-center pt-2">
            <img src="/images/auth-phone-logo.png" alt="Application Djassa sur smartphone" className="h-56 w-auto max-w-[85%] object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.3)] sm:h-64 md:h-[360px]" />
          </div>
        </div>

        {/* Formulaire étape par étape */}
        <div className="flex flex-col justify-center px-5 py-8 sm:px-10 sm:py-9 md:px-14 lg:px-20">
          <div className="mx-auto w-full max-w-sm">
            {/* Retour mobile */}
            <Link to="/" className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-djassa-cloud px-3 py-1.5 font-jakarta text-[10px] font-extrabold uppercase tracking-wide text-djassa-black transition hover:bg-djassa-red/10 md:hidden">
              <ArrowLeft size={13} strokeWidth={2.8} /> Retour à l'accueil
            </Link>

            <div className="flex flex-col items-center text-center">
              <img src="/images/logo-256.png" alt="" className="h-12 w-12 rounded-2xl object-contain shadow-[0_8px_20px_rgba(237,15,2,0.35)]" />
              <p className="mt-2.5 font-jakarta text-[15px] font-extrabold tracking-tight text-djassa-black">Djassa <span className="text-[#ED0F02]">Online</span></p>
              <h1 className="mt-4 font-jakarta text-[26px] font-extrabold tracking-tight text-djassa-black">Crée ton compte<span className="text-[#ED0F02]">.</span></h1>
              <p className="mt-1 font-inter text-[11px] text-djassa-slate">3 étapes rapides pour rejoindre le Djassa.</p>
            </div>

            {/* Stepper */}
            <ol className="mt-6 flex items-center" aria-label="Étapes d'inscription">
              {STEPS.map((label, i) => (
                <li key={label} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center gap-1">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full font-jakarta text-[11px] font-extrabold transition ${i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-[#ED0F02] text-white ring-4 ring-[#ED0F02]/20' : 'bg-djassa-cloud text-djassa-slate'}`}>
                      {i < step ? <Check size={14} strokeWidth={3} /> : i + 1}
                    </span>
                    <span className={`font-inter text-[9px] font-semibold ${i === step ? 'text-djassa-black' : 'text-djassa-slate'}`}>{label}</span>
                  </div>
                  {i < STEPS.length - 1 && <span className={`mx-1.5 h-0.5 flex-1 rounded-full ${i < step ? 'bg-emerald-500' : 'bg-djassa-cloud'}`} />}
                </li>
              ))}
            </ol>

            <form onSubmit={submit} className="mt-6 space-y-3.5">
              {/* Étape 0 — Profil / type de compte */}
              {step === 0 && (
                <>
                  <p className="font-jakarta text-[11px] font-extrabold uppercase tracking-wide text-djassa-slate">Je m'inscris en tant que</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setAsBoutique(false)} className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 px-3 py-4 text-center transition ${!asBoutique ? 'border-[#ED0F02] bg-[#ED0F02]/5' : 'border-djassa-black/10 bg-white hover:border-djassa-red/40'}`}>
                      <UserRound size={22} className={!asBoutique ? 'text-[#ED0F02]' : 'text-djassa-slate'} />
                      <span className="font-jakarta text-[12px] font-extrabold text-djassa-black">Particulier</span>
                      <span className="font-inter text-[9px] text-djassa-slate">Vendre · troquer</span>
                    </button>
                    <button type="button" onClick={() => setAsBoutique(true)} className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 px-3 py-4 text-center transition ${asBoutique ? 'border-[#ED0F02] bg-[#ED0F02]/5' : 'border-djassa-black/10 bg-white hover:border-djassa-red/40'}`}>
                      <Store size={22} className={asBoutique ? 'text-[#ED0F02]' : 'text-djassa-slate'} />
                      <span className="font-jakarta text-[12px] font-extrabold text-djassa-black">Boutique Pro</span>
                      <span className="font-inter text-[9px] text-djassa-slate">Neuf · factures</span>
                    </button>
                  </div>
                  <p className="flex items-center gap-1.5 font-inter text-[10px] text-djassa-slate"><Check size={11} className="text-emerald-600" strokeWidth={3} /> {asBoutique ? 'Vends du neuf et obtiens le badge vérifié.' : 'Vends tes affaires et troque en confiance.'}</p>

                  <div className="my-4 flex items-center gap-2 font-inter text-[10px] text-djassa-slate"><span className="h-px flex-1 bg-djassa-black/10" /> ou continuer avec <span className="h-px flex-1 bg-djassa-black/10" /></div>
                  {GOOGLE_CLIENT_ID ? (
                    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                      <GoogleLogin onSuccess={(r) => googleSignup(r.credential)} onError={() => toast.error('Échec Google.')} theme="outline" shape="square" width="100%" text="signup_with" locale="fr" />
                    </GoogleOAuthProvider>
                  ) : (
                    <button type="button" onClick={googleDev} className="flex w-full items-center justify-center gap-2 rounded-xl border border-djassa-black/10 bg-white py-2.5 font-jakarta text-[11px] font-extrabold text-djassa-black transition hover:bg-djassa-cloud">
                      <GoogleGlyph /> S'inscrire avec Google <span className="text-[9px] font-medium opacity-50">(dev)</span>
                    </button>
                  )}
                </>
              )}

              {/* Étape 1 — Coordonnées */}
              {step === 1 && (
                <>
                  <div>
                    <label htmlFor="nom" className="label">Nom complet</label>
                    <div className="relative"><UserRound size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-djassa-slate" /><input id="nom" required className="input-auth !pl-11" placeholder="Koffi N'Guessan" value={form.nom} onChange={set('nom')} autoComplete="name" /></div>
                  </div>
                  <div>
                    <label htmlFor="email" className="label">Adresse e-mail</label>
                    <div className="relative"><Mail size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-djassa-slate" /><input id="email" type="email" required autoComplete="email" className="input-auth !pl-11" placeholder="vous@exemple.ci" value={form.email} onChange={set('email')} /></div>
                  </div>
                  <div>
                    <label htmlFor="telephone" className="label">Téléphone <span className="font-normal normal-case text-djassa-slate">(Mobile Money)</span></label>
                    <div className="relative"><Phone size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-djassa-slate" /><input id="telephone" type="tel" autoComplete="tel" className="input-auth !pl-11" placeholder="+225 07 00 00 00 00" value={form.telephone} onChange={set('telephone')} /></div>
                  </div>
                </>
              )}

              {/* Étape 2 — Sécurité */}
              {step === 2 && (
                <>
                  <div>
                    <label htmlFor="password" className="label">Mot de passe</label>
                    <div className="relative"><LockKeyhole size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-djassa-slate" /><input id="password" type={showPwd ? 'text' : 'password'} required minLength={8} autoComplete="new-password" className="input-auth !pl-11" placeholder="8 caractères min." value={form.password} onChange={set('password')} /></div>
                  </div>
                  <div>
                    <label htmlFor="password_confirmation" className="label">Confirmation</label>
                    <div className="relative"><input id="password_confirmation" type={showPwd ? 'text' : 'password'} required minLength={8} autoComplete="new-password" className={`input !pr-12 ${form.password_confirmation && !pwdOk ? '!border-red-400' : ''}`} placeholder="Répétez le mot de passe" value={form.password_confirmation} onChange={set('password_confirmation')} /><button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-djassa-slate transition hover:bg-djassa-cloud" onClick={() => setShowPwd((v) => !v)} aria-label={showPwd ? 'Masquer' : 'Afficher'}>{showPwd ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
                  </div>
                  {form.password && (
                    <p className={`flex items-center gap-1.5 font-inter text-[10px] ${pwdOk ? 'text-emerald-600' : 'text-djassa-slate'}`}>
                      {pwdOk ? <><CheckCircle2 size={12} /> Les mots de passe correspondent</> : '8 caractères min. et confirmation identique'}
                    </p>
                  )}
                  <div className="rounded-xl bg-djassa-mist p-3 font-inter text-[10px] leading-relaxed text-djassa-slate">
                    <ShieldCheck size={13} className="mr-1 inline text-[#ED0F02]" /> Vos données sont protégées. Les paiements sont sécurisés par séquestre et code PIN.
                  </div>
                </>
              )}

              {/* Navigation étapes */}
              <div className="flex items-center gap-2 pt-1">
                {step > 0 && (
                  <button type="button" onClick={() => setStep((s) => s - 1)} className="inline-flex h-11 items-center gap-1.5 rounded-xl border-2 border-djassa-black/15 px-4 font-jakarta text-[11px] font-extrabold text-djassa-black transition hover:bg-djassa-cloud">
                    <ArrowLeft size={15} /> Retour
                  </button>
                )}
                <button type="submit" disabled={loading} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#ED0F02] font-jakarta text-[12px] font-extrabold uppercase tracking-wide text-white shadow-[0_8px_20px_rgba(237,15,2,0.28)] transition hover:bg-[#ff1e12] active:scale-[0.98] disabled:opacity-50">
                  {loading ? <Spinner size={16} className="!border-white/40 !border-t-white" /> : step < 2 ? <>Étape suivante <ArrowRight size={16} strokeWidth={2.8} /></> : <>Créer mon compte <ArrowRight size={16} strokeWidth={2.8} /></>}
                </button>
              </div>
            </form>

            <p className="mt-5 text-center font-inter text-[12px] text-djassa-slate">Déjà inscrit ? <Link to="/login" className="font-jakarta font-extrabold text-[#ED0F02] hover:underline">Se connecter</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
