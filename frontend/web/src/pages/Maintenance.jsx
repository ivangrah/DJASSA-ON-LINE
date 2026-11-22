import { useEffect, useState } from 'react';
import { api } from '../lib/api';

/** Écran plein écran affiché quand l'API renvoie 503 maintenance. */
export default function Maintenance() {
  const [message, setMessage] = useState('La plateforme est momentanément indisponible.');

  useEffect(() => {
    api.get('/admin/maintenance').then((r) => {
      if (r.data?.data?.message) setMessage(r.data.data.message);
    }).catch(() => {});
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center text-white" style={{ background: 'linear-gradient(135deg, #780000 0%, #121212 100%)' }}>
      <img src="/images/admin-gears.webp" alt="" aria-hidden="true" className="h-40 w-auto object-contain opacity-90" />
      <h1 className="mt-6 font-spacegrotesk text-4xl font-extrabold tracking-tight sm:text-5xl">Maintenance en cours<span className="text-white/40">.</span></h1>
      <p className="mt-3 max-w-md font-DM-Sans text-sm text-white/70">{message}</p>
      <p className="mt-8 font-spacegrotesk text-[9px] font-extrabold uppercase tracking-[0.24em] text-white/40">Djassa Online — nous revenons vite</p>
    </main>
  );
}
