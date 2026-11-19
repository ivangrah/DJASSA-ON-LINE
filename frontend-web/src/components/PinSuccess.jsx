import { Component, useEffect, useState } from 'react';
import { Rive } from '@rive-app/react-canvas';
import { X } from 'lucide-react';

const RIV_URL = '/animations/djassa-pin-success.riv';

/* Repli SVG animé (tracé CSS) — même rendu, zéro dépendance */
function FallbackSvg() {
  return (
    <svg viewBox="0 0 500 500" className="h-full w-full" role="img" aria-label="Coche de validation Djassa">
      <circle className="pin-success-circle" cx="250" cy="250" r="150" fill="none" stroke="#121212" strokeWidth="22" strokeLinecap="round" pathLength="100" />
      <path className="pin-success-check" d="M152 262 L221 330 L356 168" fill="none" stroke="#E11D48" strokeWidth="34" strokeLinecap="round" strokeLinejoin="round" pathLength="100" />
    </svg>
  );
}

/* Boundary de sécurité : un .riv invalide/corrupt ne doit jamais faire planter la page */
class RiveSafe extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return <FallbackSvg />;
    return <Rive src={RIV_URL} stateMachines="State Machine 1" className="h-full w-full" />;
  }
}

/**
 * PinSuccess — animation « Fonds libérés » (Ressources Visuelles : confirmation PIN,
 * coche Noir & Rouge, flat line-art).
 *
 * Utilise `public/animations/djassa-pin-success.riv` s'il est présent
 * (build local : `rive <projet> --publish`, signé via `rive login`).
 * Sinon, repli SVG — même rendu, sans dépendance.
 */
export default function PinSuccess({ amount, onClose }) {
  const [hasRive, setHasRive] = useState(null); // null = chargement, true/false = décision

  useEffect(() => {
    let alive = true;
    fetch(RIV_URL, { method: 'HEAD' })
      .then((res) => {
        const type = (res.headers.get('content-type') ?? '').toLowerCase();
        // Le fallback SPA sert index.html en text/html pour les fichiers manquants → ne pas le confondre avec un .riv
        if (alive) setHasRive(res.ok && !type.includes('text/html'));
      })
      .catch(() => { if (alive) setHasRive(false); });
    return () => { alive = false; };
  }, []);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-6" role="alertdialog" aria-modal="true" aria-label="Fonds libérés">
      <div className="absolute inset-0 bg-djassa-black/60 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />

      <div className="pin-success-pop relative flex w-full max-w-xs flex-col items-center rounded-3xl bg-white px-6 pb-6 pt-7 text-center shadow-2xl">
        <button onClick={onClose} className="absolute right-3 top-3 rounded-full p-1.5 text-djassa-slate transition hover:bg-djassa-cloud" aria-label="Fermer">
          <X size={18} />
        </button>

        <div className="flex h-44 w-44 items-center justify-center">
          {hasRive === true ? (
            <RiveSafe />
          ) : hasRive === false ? (
            <FallbackSvg />
          ) : (
            <div className="h-24 w-24 animate-pulse rounded-full bg-djassa-cloud" aria-hidden="true" />
          )}
        </div>

        <h2 className="mt-3 font-jakarta text-xl font-extrabold text-djassa-black">Fonds libérés !</h2>
        <p className="mt-1 text-xs leading-relaxed text-djassa-slate">
          Code PIN validé — les fonds sont crédités sur votre portefeuille Djassa.
          {amount != null && <span className="mt-1 block font-jakarta text-base font-extrabold text-djassa-red">{new Intl.NumberFormat('fr-FR').format(Math.round(Number(amount)))} FCFA</span>}
        </p>
        <button className="btn-red mt-4 w-full" onClick={onClose}>Parfait !</button>
      </div>
    </div>
  );
}
