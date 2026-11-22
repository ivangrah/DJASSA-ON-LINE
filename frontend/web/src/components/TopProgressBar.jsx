import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

const listeners = new Set();
let pending = 0;
export const progressBus = {
  start() { pending += 1; listeners.forEach((fn) => fn(pending)); },
  done() { pending = Math.max(0, pending - 1); listeners.forEach((fn) => fn(pending)); },
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  reset() { pending = 0; listeners.forEach((fn) => fn(pending)); },
};

export default function TopProgressBar() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fading, setFading] = useState(false);
  const timers = useRef([]);
  const activeLoads = useRef(0);
  const routePending = useRef(false);
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.current.push(t); return t; };

  const finish = () => {
    clearTimers();
    setProgress(100);
    setFading(true);
    later(() => { setVisible(false); setFading(false); setProgress(0); }, reduced ? 0 : 260);
  };

  const kick = () => {
    clearTimers();
    setFading(false);
    setVisible(true);
    setProgress((p) => (p > 0 && p < 85 ? p : 12));
    later(() => setProgress(45), reduced ? 0 : 80);
    later(() => setProgress(72), reduced ? 0 : 220);
    later(() => setProgress(85), reduced ? 0 : 520);
  };

  useEffect(() => progressBus.subscribe((count) => {
    activeLoads.current = count;
    if (count > 0) {
      if (!visible) kick();
    } else if (!routePending.current) {
      finish();
    }
  }), [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    routePending.current = true;
    kick();
    // Page is considered mounted after route change paints; complete unless lazy loads pending.
    const t = later(() => {
      routePending.current = false;
      if (activeLoads.current === 0) finish();
    }, reduced ? 0 : 180);
    return () => clearTimeout(t);
    // eslint-disable-line react-hooks/exhaustive-deps
  }, [location.key]);

  useEffect(() => () => clearTimers(), []);

  if (!visible) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[0.2rem] bg-transparent">
      <div
        className="h-full origin-left bg-[#780000]"
        style={{
          width: `${progress}%`,
          opacity: fading ? 0 : 1,
          boxShadow: '0 0 12px rgba(120, 0, 0, 0.35)',
          transition: reduced
            ? 'none'
            : fading
              ? 'width 220ms cubic-bezier(0.22,1,0.36,1), opacity 260ms ease 120ms'
              : 'width 420ms cubic-bezier(0.22,1,0.36,1), opacity 120ms ease',
        }}
      />
    </div>
  );
}
