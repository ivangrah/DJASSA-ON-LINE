import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LockKeyhole, Clock3, Mail, ShieldCheck, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

/** Écran maintenance : message + durée estimée + accès admin uniquement. */
export default function Maintenance() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [state, setState] = useState({
    message: 'La plateforme est momentanément indisponible.',
    ends_at: null, duration_minutes: null, started_at: null,
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    api.get('/maintenance').then((r) => {
      if (r.data?.data) setState((s) => ({ ...s, ...r.data.data }));
    }).catch(() => {});
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const remaining = state.ends_at ? Math.max(0, new Date(state.ends_at).getTime() - now) : null;
  const remainingLabel = remaining == null
    ? (state.duration_minutes ? `Durée estimée : ${state.duration_minutes} min` : 'Reprise annoncée prochainement')
    : remaining === 0
      ? 'La reprise est imminente…'
      : `Reprise dans ${Math.floor(remaining / 3_600_000)}h ${Math.floor((remaining % 3_600_000) / 60_000)}m ${Math.floor((remaining % 60_000) / 1000)}s`;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user?.role !== 'admin') {
        setError('Accès réservé aux administrateurs.');
        return;
      }
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message ?? 'Identifiants invalides.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-5 py-10 text-white" style={{ background: 'linear-gradient(135deg, #780000 0%, #121212 100%)' }}>
      <img src="/images/admin-gears.webp" alt="" aria-hidden="true" className="h-32 w-auto object-contain opacity-90" />

      <h1 className="mt-5 text-center font-spacegrotesk text-4xl font-extrabold tracking-tight sm:text-5xl">
        Maintenance en cours<span className="text-white/40">.</span>
      </h1>
      <p className="mt-3 max-w-lg text-center font-DM-Sans text-sm text-white/70">{state.message}</p>

      {remaining != null && (
        <div className="mt-5 flex items-center gap-2 rounded-[5px] bg-white/10 px-4 py-2.5 backdrop-blur-sm">
          <Clock3 size={18} className="text-white/80" />
          <span className="font-DM-Sans text-[13px] font-bold tabular-nums">{remainingLabel}</span>
        </div>
      )}

      {/* Zone de connexion — administrateurs uniquement */}
      <section className="mt-9 w-full max-w-sm rounded-[5px] bg-white p-6 text-djassa-black shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <div className="mb-5 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[5px] bg-djassa-red/10 text-djassa-red">
            <LockKeyhole size={18} />
          </span>
          <div>
            <h2 className="font-spacegrotesk text-[15px] font-extrabold">Accès administrateur</h2>
            <p className="font-DM-Sans text-[10px] text-djassa-black/55">Réservé au rôle admin pendant la maintenance.</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-3">
          <label className="block font-DM-Sans text-[10px] font-bold text-djassa-black/60">
            Email
            <span className="mt-1 flex items-center gap-2 rounded-[5px] bg-djassa-cloud px-3 py-2.5">
              <Mail size={15} className="text-djassa-black/40" />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@djassa.ci" className="w-full bg-transparent font-DM-Sans text-[12px] outline-none" />
            </span>
          </label>
          <label className="block font-DM-Sans text-[10px] font-bold text-djassa-black/60">
            Mot de passe
            <span className="mt-1 flex items-center gap-2 rounded-[5px] bg-djassa-cloud px-3 py-2.5">
              <LockKeyhole size={15} className="text-djassa-black/40" />
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" className="w-full bg-transparent font-DM-Sans text-[12px] outline-none" />
            </span>
          </label>

          {error && (
            <p className="flex items-center gap-1.5 rounded-[5px] bg-djassa-red/10 px-3 py-2 font-DM-Sans text-[11px] text-djassa-red">
              <AlertTriangle size={14} /> {error}
            </p>
          )}

          <button type="submit" disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-[5px] bg-djassa-red py-2.5 font-spacegrotesk text-[11px] font-extrabold text-white transition hover:bg-[#9b0000] active:scale-95 disabled:opacity-60">
            <ShieldCheck size={16} /> {loading ? 'Connexion…' : 'Se connecter en admin'}
          </button>
        </form>
      </section>

      <p className="mt-8 font-spacegrotesk text-[9px] font-extrabold uppercase tracking-[0.24em] text-white/40">
        Djassa Online — nous revenons vite
      </p>
    </main>
  );
}
