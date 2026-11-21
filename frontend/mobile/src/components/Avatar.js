import { Text, View, StyleSheet } from 'react-native';
import { Couleurs, Polices } from '../theme';

/** Avatar initiales (noir ou rouge selon la prop tone) */
export default function Avatar({ name, size = 40, tone = 'black' }) {
  const initials = (name ?? '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  return (
    <View
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: tone === 'red' ? Couleurs.red : Couleurs.black },
      ]}
      accessibilityElementsHidden
    >
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  initials: { fontFamily: Polices.jakartaBold, color: '#fff' },
});
