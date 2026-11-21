import { useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  AlertTriangle, BadgeCheck, ChevronLeft, TrendingUp, Wallet, Zap, X,
} from 'lucide-react-native';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatFCFA, formatNumberFR } from '../lib/format';
import { Couleurs, Polices, Ombres } from '../theme';

/** Dashboard Boutique Pro (mobile, dark) */
export default function ProDashboardScreen() {
  const navigation = useNavigation();
  const { isPro, boutique } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data: d } = await api.get('/boutiques/me/dashboard');
      setData(d);
    } catch {
      /* silencieux */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isPro) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPro]);

  const stopFlash = async (id) => {
    try {
      await api.delete(`/products/${id}/flash`);
      toast.info('Vente Flash arrêtée.');
      load();
    } catch {
      toast.error('Impossible d’arrêter la vente flash.');
    }
  };

  if (!isPro) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.centeredTitle}>Espace Boutique Pro</Text>
        <Text style={styles.centeredHint}>Réservé aux vendeurs professionnels. Ouvrez votre boutique pour y accéder.</Text>
      </SafeAreaView>
    );
  }

  if (loading) return <SafeAreaView style={styles.centered}><ActivityIndicator color={Couleurs.red} size="large" /></SafeAreaView>;

  const stats = data?.stats;
  const stockCritique = data?.stock_critique ?? [];
  const flashActives = data?.ventes_flash_actives ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={[]}
        renderItem={null}
        ListHeaderComponent={
          <>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Retour">
              <ChevronLeft size={19} color={Couleurs.slate} />
              <Text style={styles.backText}>Mon Djassa</Text>
            </TouchableOpacity>

            {/* En-tête dark */}
            <View style={styles.hero}>
              <View style={styles.heroRow}>
                <View style={styles.heroLogo}><Text style={styles.heroLogoText}>{boutique?.nom_boutique?.slice(0, 1)?.toUpperCase() ?? 'B'}</Text></View>
                <View style={styles.heroBody}>
                  <View style={styles.heroNameRow}>
                    <Text style={styles.heroName} numberOfLines={1}>{boutique?.nom_boutique}</Text>
                    {boutique?.verifie && <BadgeCheck size={16} color={Couleurs.red} fill="#fff" />}
                  </View>
                  <Text style={styles.heroLink}>/boutique/{boutique?.slug}</Text>
                </View>
              </View>

              <View style={styles.kpiGrid}>
                {[
                  { label: 'CA LIBÉRÉ', value: formatFCFA(stats?.chiffre_affaires_fcfa ?? 0), accent: true },
                  { label: 'ENCAISSÉ SÉQUESTRÉ', value: formatFCFA(stats?.encaisse_securise_fcfa ?? 0) },
                  { label: 'VENTES TOTALES', value: formatNumberFR(stats?.ventes_total ?? 0) },
                ].map((kpi) => (
                  <View key={kpi.label} style={styles.kpiCell}>
                    <Text style={styles.kpiLabel}>{kpi.label}</Text>
                    <Text style={[styles.kpiValue, kpi.accent && styles.kpiAccent]} numberOfLines={2}>{kpi.value}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Stock critique */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <AlertTriangle size={14} color={Couleurs.red} />
                <Text style={styles.sectionTitleRed}>STOCK CRITIQUE (≤ 2)</Text>
              </View>
              {stockCritique.length === 0 ? (
                <Text style={styles.okText}>Aucun article en stock critique. 👍</Text>
              ) : (
                stockCritique.map((a) => (
                  <View key={a.id} style={styles.stockRow}>
                    <View style={styles.stockBadge}><Text style={styles.stockBadgeText}>{a.stock}</Text></View>
                    <View style={styles.stockBody}>
                      <Text style={styles.stockTitle} numberOfLines={2}>{a.titre}</Text>
                      <Text style={styles.stockPrice}>{formatFCFA(a.prix)}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        }
        ListFooterComponent={
          <>
            {/* Ventes flash actives */}
            <View style={styles.flashPanel}>
              <View style={styles.flashPanelHeader}>
                <Zap size={15} color="#FDE68A" />
                <Text style={styles.flashPanelTitle}>VENTES FLASH ACTIVES</Text>
              </View>
              {flashActives.length === 0 ? (
                <Text style={styles.flashEmpty}>Aucune vente flash active — lancez-en une pour écouler votre stock.</Text>
              ) : (
                flashActives.map((a) => (
                  <View key={a.id} style={styles.flashRow}>
                    <Image source={{ uri: a.image_principale }} style={styles.flashImage} />
                    <View style={styles.flashBody}>
                      <Text style={styles.flashTitle} numberOfLines={2}>{a.titre}</Text>
                      <Text style={styles.flashPriceRow}>
                        <Text style={styles.flashPrice}>{formatFCFA(a.prix_flash)}</Text>
                        <Text style={styles.flashPriceOld}>{'  '}{formatFCFA(a.prix)}</Text>
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => stopFlash(a.id)} style={styles.flashStop} accessibilityRole="button" accessibilityLabel="Arrêter la vente flash">
                      <X size={16} color="rgba(255,255,255,0.7)" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
            <View style={{ height: 24 }} />
          </>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Couleurs.cloud },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24, backgroundColor: Couleurs.cloud },
  centeredTitle: { fontFamily: Polices.jakartaBold, fontSize: 17, color: Couleurs.black },
  centeredHint: { fontFamily: Polices.inter, fontSize: 12, color: Couleurs.slate, textAlign: 'center' },

  backButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingTop: 8 },
  backText: { fontFamily: Polices.interSemi, fontSize: 12, color: Couleurs.slate },

  hero: { backgroundColor: Couleurs.black, borderRadius: 22, margin: 12, overflow: 'hidden' },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  heroLogo: { width: 62, height: 62, borderRadius: 18, backgroundColor: Couleurs.red, alignItems: 'center', justifyContent: 'center' },
  heroLogoText: { fontFamily: Polices.jakarta, fontSize: 26, color: '#fff' },
  heroBody: { flex: 1, minWidth: 0 },
  heroNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroName: { fontFamily: Polices.jakarta, fontSize: 15, color: '#fff', flexShrink: 1 },
  heroLink: { fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 2, fontFamily: Polices.inter },

  kpiGrid: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  kpiCell: { flex: 1, padding: 12, borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.07)' },
  kpiLabel: { fontSize: 7, color: 'rgba(255,255,255,0.5)', letterSpacing: 1.2, fontFamily: Polices.interSemi },
  kpiValue: { fontFamily: Polices.jakarta, fontSize: 12, color: '#fff', marginTop: 4, lineHeight: 16 },
  kpiAccent: { color: Couleurs.red },

  section: { backgroundColor: '#fff', borderRadius: 20, marginHorizontal: 12, padding: 14, borderWidth: 2, borderColor: 'rgba(225,29,72,0.35)' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitleRed: { fontFamily: Polices.jakartaBold, fontSize: 10.5, color: Couleurs.red, letterSpacing: 1 },
  okText: { fontFamily: Polices.inter, fontSize: 12, color: Couleurs.slate, marginTop: 8 },
  stockRow: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: '#FEF2F2', borderRadius: 14, padding: 10, marginTop: 8 },
  stockBadge: { width: 34, height: 34, borderRadius: 10, backgroundColor: Couleurs.red, alignItems: 'center', justifyContent: 'center' },
  stockBadgeText: { color: '#fff', fontFamily: Polices.jakarta, fontSize: 14 },
  stockBody: { flex: 1, minWidth: 0 },
  stockTitle: { fontFamily: Polices.interSemi, fontSize: 11, color: Couleurs.black },
  stockPrice: { fontFamily: Polices.inter, fontSize: 10, color: Couleurs.slate, marginTop: 1 },

  flashPanel: { backgroundColor: Couleurs.black, borderRadius: 22, margin: 12, padding: 14 },
  flashPanelHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flashPanelTitle: { fontFamily: Polices.jakartaBold, fontSize: 10.5, color: '#fff', letterSpacing: 1.2 },
  flashEmpty: { fontFamily: Polices.inter, fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 8 },
  flashRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 10, marginTop: 10 },
  flashImage: { width: 52, height: 52, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)' },
  flashBody: { flex: 1, minWidth: 0 },
  flashTitle: { fontFamily: Polices.interSemi, fontSize: 10.5, color: '#fff', lineHeight: 14 },
  flashPriceRow: { marginTop: 2 },
  flashPrice: { fontFamily: Polices.jakarta, fontSize: 11.5, color: '#FDE68A' },
  flashPriceOld: { fontSize: 9, color: 'rgba(255,255,255,0.35)', textDecorationLine: 'line-through' },
  flashStop: { padding: 8 },
});
