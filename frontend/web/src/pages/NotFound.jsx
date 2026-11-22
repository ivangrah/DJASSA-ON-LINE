import { Link } from 'react-router-dom';
import { useRef } from 'react';
import { Compass } from 'lucide-react';
import { usePageReveal } from '../hooks/usePageReveal';

export default function NotFound() {
  const scope = useRef(null);
  usePageReveal(scope);
  return (
    <div ref={scope} data-reveal className="mx-auto flex max-w-md flex-col items-center px-6 py-20 text-center">
      <svg viewBox="0 0 220 160" className="h-40 w-56" fill="none" aria-hidden="true">
        <circle cx="110" cy="72" r="54" stroke="#121212" strokeWidth="4" strokeDasharray="12 9" opacity="0.3" />
        <path d="M110 44v56M110 100l-17-17M110 100l17-17" stroke="#121212" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
        <circle cx="168" cy="38" r="13" fill="#780000" />
        <path d="M163.5 38l4 4 6.5-8" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <h1 className="font-spacegrotesk text-4xl font-extrabold text-djassa-black">404</h1>
      <p className="mt-1 font-spacegrotesk font-bold text-djassa-black">Cette page n'existe pas (encore).</p>
      <p className="mt-1 text-sm text-djassa-black/70">Le Djassa est grand, mais pas infini. Revenez au marché.</p>
      <Link to="/" className="btn-red mt-6"><Compass size={18} /> Retour au fil</Link>
    </div>
  );
}
