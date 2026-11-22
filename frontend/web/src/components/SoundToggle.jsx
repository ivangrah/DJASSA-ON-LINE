import { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { isSoundEnabled, subscribeSound, toggleSound } from '../utils/soundEffects';

export default function SoundToggle({ className = '' }) {
  const [enabled, setEnabled] = useState(isSoundEnabled);

  useEffect(() => subscribeSound(setEnabled), []);

  return (
    <button
      type="button"
      onClick={() => setEnabled(toggleSound())}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-[5px] transition active:scale-[0.98] ${className}`}
      aria-label={enabled ? 'Couper les sons' : 'Activer les sons'}
      title={enabled ? 'Son activé' : 'Son coupé'}
    >
      {enabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
    </button>
  );
}
