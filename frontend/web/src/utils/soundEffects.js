/**
 * Djassa — bruitages synthétisés Web Audio (zéro MP3, <4Ko).
 * Lazy-init au premier geste utilisateur. Respecte le mute localStorage.
 */
const STORAGE_KEY = 'djassa_sound_enabled';
let ctx = null;
let unlocked = false;
const listeners = new Set();

const canUse = () => typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);

export function isSoundEnabled() {
  try { return localStorage.getItem(STORAGE_KEY) !== '0'; } catch { return true; }
}

export function setSoundEnabled(enabled) {
  try { localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0'); } catch {}
  listeners.forEach((fn) => fn(enabled));
}

export function toggleSound() {
  const next = !isSoundEnabled();
  setSoundEnabled(next);
  return next;
}

export function subscribeSound(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function getCtx() {
  if (!canUse()) return null;
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function unlock() {
  if (unlocked) return;
  unlocked = true;
  const c = getCtx();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
  ['pointerdown', 'keydown', 'touchstart'].forEach((e) => window.removeEventListener(e, unlock, true));
}

if (typeof window !== 'undefined') {
  ['pointerdown', 'keydown', 'touchstart'].forEach((e) => window.addEventListener(e, unlock, { capture: true, passive: true }));
}

function tone({ freq = 440, freqEnd, type = 'sine', start = 0, attack = 0.01, decay = 0.2, peak = 0.08, pan = 0 }) {
  const c = getCtx();
  if (!c || !isSoundEnabled()) return;
  const t = c.currentTime + start;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqEnd), t + attack + decay);
  gain.gain.cancelScheduledValues(t);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(peak, t + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  let dest = c.destination;
  if (c.createStereoPanner) {
    const p = c.createStereoPanner();
    p.pan.setValueAtTime(pan, t);
    osc.connect(gain).connect(p).connect(dest);
  } else {
    osc.connect(gain).connect(dest);
  }
  osc.start(t);
  osc.stop(t + attack + decay + 0.02);
}

export function playCartPop() {
  tone({ freq: 520, freqEnd: 1180, type: 'sine', attack: 0.005, decay: 0.16, peak: 0.07 });
  tone({ freq: 1040, freqEnd: 1600, type: 'triangle', start: 0.015, attack: 0.004, decay: 0.1, peak: 0.025 });
}

export function playMessageSent() {
  tone({ freq: 320, freqEnd: 720, type: 'sine', attack: 0.008, decay: 0.18, peak: 0.055 });
  tone({ freq: 640, freqEnd: 980, type: 'triangle', start: 0.02, attack: 0.006, decay: 0.12, peak: 0.018 });
}

export function playMessageReceived() {
  tone({ freq: 523.25, freqEnd: 560, type: 'sine', attack: 0.01, decay: 0.22, peak: 0.05 });
  tone({ freq: 659.25, freqEnd: 700, type: 'sine', start: 0.09, attack: 0.01, decay: 0.26, peak: 0.045 });
}

export function playNotificationChime() {
  tone({ freq: 880, freqEnd: 990, type: 'sine', attack: 0.006, decay: 0.28, peak: 0.045 });
  tone({ freq: 1318.5, freqEnd: 1400, type: 'triangle', start: 0.08, attack: 0.006, decay: 0.34, peak: 0.03 });
}

export function playSuccessChord() {
  tone({ freq: 523.25, type: 'sine', attack: 0.008, decay: 0.35, peak: 0.045, pan: -0.05 });
  tone({ freq: 659.25, type: 'sine', start: 0.02, attack: 0.008, decay: 0.35, peak: 0.04, pan: 0.05 });
  tone({ freq: 783.99, type: 'triangle', start: 0.04, attack: 0.008, decay: 0.4, peak: 0.03 });
}

export function playErrorThud() {
  tone({ freq: 160, freqEnd: 70, type: 'sine', attack: 0.005, decay: 0.18, peak: 0.08 });
  tone({ freq: 110, freqEnd: 55, type: 'triangle', start: 0.06, attack: 0.005, decay: 0.22, peak: 0.055 });
}

export function playDeleteWhoosh() {
  tone({ freq: 420, freqEnd: 120, type: 'triangle', attack: 0.004, decay: 0.22, peak: 0.045 });
  tone({ freq: 260, freqEnd: 90, type: 'sine', start: 0.02, attack: 0.006, decay: 0.2, peak: 0.035 });
}

export function playUpdateTick() {
  tone({ freq: 1046.5, freqEnd: 1200, type: 'sine', attack: 0.003, decay: 0.09, peak: 0.04 });
  tone({ freq: 1568, freqEnd: 1760, type: 'triangle', start: 0.055, attack: 0.003, decay: 0.11, peak: 0.028 });
}

export function playButtonClick() {
  tone({ freq: 320, freqEnd: 220, type: 'triangle', attack: 0.002, decay: 0.028, peak: 0.03 });
}
