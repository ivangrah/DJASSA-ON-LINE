import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react-native';
import { Couleurs, Polices } from '../theme';

const ToastContext = createContext(null);

/** Toast Djassa mobile — pastille noire, icône colorée, file de 3 max */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const push = useCallback((message, type = 'info') => {
    idRef.current += 1;
    const id = idRef.current;
    setToasts((prev) => [...prev.slice(-2), { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4200);
  }, []);

  const toast = useMemo(() => ({
    success: (m) => push(m, 'success'),
    error: (m) => push(m, 'error'),
    info: (m) => push(m, 'info'),
  }), [push]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <View pointerEvents="box-none" style={styles.overlay} accessibilityLiveRegion="polite">
        {toasts.map((t) => (
          <View key={t.id} style={styles.toast}>
            {t.type === 'success' && <CheckCircle2 size={17} color="#34D399" />}
            {t.type === 'error' && <XCircle size={17} color={Couleurs.red} />}
            {t.type === 'info' && <Info size={17} color={Couleurs.redSoft} />}
            <Text style={styles.text}>{t.message}</Text>
            <TouchableOpacity onPress={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} hitSlop={6} accessibilityLabel="Fermer">
              <X size={14} color="rgba(255,255,255,0.55)" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast doit être utilisé dans <ToastProvider>');
  return ctx;
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 56, left: 16, right: 16, gap: 8, zIndex: 100, alignItems: 'center' },
  toast: {
    flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: '100%',
    backgroundColor: Couleurs.black, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 11,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  text: { flex: 1, color: '#fff', fontFamily: Polices.interMedium, fontSize: 12.5, lineHeight: 17 },
});
