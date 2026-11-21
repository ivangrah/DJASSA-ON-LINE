import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { Polices } from '../theme';
import { flashCountdownLabel } from '../lib/format';

/** Compte à rebours Ventes Flash (rafraîchi chaque seconde) */
export default function FlashCountdown({ iso, style }) {
  const [label, setLabel] = useState(() => flashCountdownLabel(iso));

  useEffect(() => {
    const t = setInterval(() => setLabel(flashCountdownLabel(iso)), 1000);
    return () => clearInterval(t);
  }, [iso]);

  return (
    <Text style={[{ fontFamily: Polices.jakarta, fontSize: 11, color: '#FDE68A', fontVariant: ['tabular-nums'] }, style]}>
      {label}
    </Text>
  );
}
