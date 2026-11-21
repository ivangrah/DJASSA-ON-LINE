import { useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Couleurs, Polices } from '../theme';

/** Saisie PIN à 4 chiffres (remise physique) */
export default function PinInput({ onComplete }) {
  const [digits, setDigits] = useState(['', '', '', '']);
  const refs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const handle = (index, value) => {
    const clean = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    if (clean && index < 3) refs[index + 1].current?.focus();
    if (next.every((d) => d !== '')) onComplete?.(next.join(''));
  };

  const handleKey = (index, key) => {
    if (key === 'Backspace' && !digits[index] && index > 0) refs[index - 1].current?.focus();
  };

  return (
    <View style={styles.row}>
      {digits.map((d, i) => (
        <TextInput
          key={i}
          ref={refs[i]}
          style={styles.box}
          value={d}
          onChangeText={(v) => handle(i, v)}
          onKeyPress={({ nativeEvent }) => handleKey(i, nativeEvent.key)}
          keyboardType="number-pad"
          maxLength={1}
          selectTextOnFocus
          textAlign="center"
          accessibilityLabel={`Chiffre ${i + 1}`}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  box: {
    width: 58, height: 66, borderRadius: 16, borderWidth: 2, borderColor: 'rgba(18,18,18,0.14)',
    backgroundColor: Couleurs.mist, fontFamily: Polices.jakarta, fontSize: 26, color: Couleurs.black,
  },
});
