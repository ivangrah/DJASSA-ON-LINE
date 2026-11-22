import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/** Barre de progression rouge Djassa affichée à chaque changement de route. */
export default function RouteProgress() {
  const location = useLocation();
  const [active, setActive] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    setActive(true);
    setDone(false);
    const t1 = window.setTimeout(() => setDone(true), 380);
    const t2 = window.setTimeout(() => { setActive(false); setDone(false); }, 720);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); };
  }, [location.key]);

  if (!active) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-[3px] bg-transparent">
      <div
        className="h-full origin-left bg-[#780000] shadow-[0_0_12px_rgba(120,0,0,0.45)]"
        style={{
          width: done ? '100%' : '72%',
          opacity: done ? 0 : 1,
          transition: done
            ? 'width 220ms cubic-bezier(0.22,1,0.36,1), opacity 280ms ease 120ms'
            : 'width 420ms cubic-bezier(0.22,1,0.36,1)',
        }}
      />
    </div>
  );
}
