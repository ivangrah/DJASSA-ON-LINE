import { Component, useEffect, useState } from 'react';
import { Link, useRouteError } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, RefreshCw, WifiOff } from 'lucide-react';

/** Frontière d'erreur React — remplace l'écran blanc par une page charte Djassa. */
export class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) { return { error }; }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <ErrorScreen
        code="500"
        title="Une erreur est survenue"
        hint="La page n'a pas pu s'afficher. Réessayez ou revenez au marché."
        action={<button className="btn-red btn-sm" onClick={() => window.location.reload()}><RefreshCw size={14} /> Réessayer</button>}
      />
    );
  }
}

/** Bandeau hors-ligne — testable et visible sur mobile 3G instable. */
export function OfflineBanner() {
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine);
  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  if (!offline) return null;
  return (
    <div role="status" className="fixed inset-x-0 top-0 z-[100] flex items-center justify-center gap-2 bg-djassa-black px-4 py-2 text-white">
      <WifiOff size={15} /> <span className="font-DM-Sans text-xs">Hors ligne — vos données sont conservées.</span>
    </div>
  );
}

export function ErrorScreen({ code, title, hint, action }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-djassa-cloud px-6 text-center text-djassa-black">
      <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-[5px] bg-white shadow-[0_12px_40px_rgba(120,0,0,0.12)]">
        <AlertTriangle size={54} strokeWidth={1.6} className="text-djassa-red" />
      </div>
      <p className="font-spacegrotesk text-6xl font-extrabold tracking-tight text-djassa-red">{code}</p>
      <h1 className="mt-3 font-spacegrotesk text-2xl font-extrabold">{title}</h1>
      {hint && <p className="mt-2 max-w-sm font-DM-Sans text-sm text-djassa-black/70">{hint}</p>}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {action}
        <Link to="/" className="btn-outline btn-sm inline-flex items-center gap-1.5"><ArrowLeft size={14} /> Retour au marché</Link>
      </div>
    </main>
  );
}

/** Route error element (React Router). */
export function RouteError() {
  const error = useRouteError();
  const status = error?.status ?? 500;
  const map = {
    403: { title: 'Accès refusé', hint: "Votre offre Pro a expiré ou cette page est réservée aux vendeurs Pro." },
    404: { title: 'Page introuvable', hint: "Cette annonce ou cette boutique n'existe plus." },
    500: { title: 'Erreur serveur', hint: "Le service est momentanément indisponible." },
  };
  const view = map[status] ?? map[500];
  return <ErrorScreen code={String(status)} title={view.title} hint={view.hint} action={<button className="btn-red btn-sm" onClick={() => window.location.reload()}><RefreshCw size={14} /> Réessayer</button>} />;
}
