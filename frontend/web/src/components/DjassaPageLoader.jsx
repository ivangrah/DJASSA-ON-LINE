import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { progressBus } from './TopProgressBar';

const D_PATH = 'M 28 18 L 28 82 L 52 82 C 70 82 82 70 82 50 C 82 30 70 18 52 18 Z';

function DjassaMark({ size = 72, animate = true }) {
  const pathRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!animate) return undefined;
    const path = pathRef.current;
    const wrap = wrapRef.current;
    if (!path || !wrap) return undefined;
    const len = path.getTotalLength();
    gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
    const tl = gsap.timeline({ repeat: -1, defaults: { ease: 'power2.inOut' } });
    tl.to(path, { strokeDashoffset: 0, duration: 0.9, ease: 'power3.out' })
      .to(wrap, { scale: 1.04, duration: 0.28, ease: 'elastic.out(1, 0.45)' }, '-=0.15')
      .to(wrap, { scale: 1, duration: 0.25, ease: 'power2.out' })
      .to(path, { strokeDashoffset: -len, duration: 0.75, ease: 'power2.in' }, '+=0.18')
      .set(path, { strokeDashoffset: len });
    return () => tl.kill();
  }, [animate]);

  return (
    <div ref={wrapRef} style={{ width: size, height: size }} className="relative flex items-center justify-center">
      <svg viewBox="0 0 110 100" width={size} height={size} fill="none" aria-hidden="true">
        <path d={D_PATH} stroke="rgba(120,0,0,0.12)" strokeWidth="5" strokeLinejoin="round" />
        <path
          ref={pathRef}
          d={D_PATH}
          stroke="#780000"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={animate ? undefined : { strokeDasharray: 'none' }}
        />
      </svg>
    </div>
  );
}

function MicroGauge({ animate = true }) {
  const barRef = useRef(null);
  useEffect(() => {
    if (!animate || !barRef.current) return undefined;
    const tween = gsap.fromTo(
      barRef.current,
      { xPercent: -100 },
      { xPercent: 220, duration: 1.15, ease: 'power1.inOut', repeat: -1 },
    );
    return () => tween.kill();
  }, [animate]);

  return (
    <div className="h-[0.2rem] w-28 overflow-hidden rounded-full bg-[rgba(18,18,18,0.08)]" aria-hidden="true">
      <div
        ref={barRef}
        className="h-full w-1/2 rounded-full bg-[#780000]"
        style={animate ? undefined : { transform: 'translateX(30%)' }}
      />
    </div>
  );
}

export default function DjassaPageLoader({ variant = 'fullscreen', label = 'Chargement…', dark = false }) {
  const [show, setShow] = useState(variant !== 'fullscreen');
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animate = !reduced;

  useEffect(() => {
    progressBus.start();
    return () => progressBus.done();
  }, []);

  useEffect(() => {
    if (variant !== 'fullscreen') return undefined;
    const t = window.setTimeout(() => setShow(true), 120);
    return () => window.clearTimeout(t);
  }, [variant]);

  if (variant === 'inline') {
    return (
      <div role="status" aria-live="polite" className={`flex min-h-[10rem] w-full flex-col items-center justify-center gap-3 py-8 ${dark ? 'text-white' : 'text-[#121212]'}`}>
        <DjassaMark size={52} animate={animate} />
        <p className="font-spacegrotesk text-[0.95rem] font-bold tracking-tight" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>Djassa Online</p>
        <MicroGauge animate={animate} />
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  if (!show) return <span className="sr-only">{label}</span>;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 ${dark ? 'bg-[#121212] text-white' : 'bg-white text-[#121212]'}`}
    >
      <DjassaMark size={84} animate={animate} />
      <p className="font-spacegrotesk text-[1.125rem] font-bold tracking-tight" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
        Djassa Online
      </p>
      <MicroGauge animate={animate} />
      <span className="sr-only">{label}</span>
    </div>
  );
}
