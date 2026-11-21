import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, FlatList, Image, Modal, SafeAreaView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import {
  BadgeCheck, LayoutDashboard, LogOut, ShieldCheck, Trash2, Wallet,
} from 'lucide-react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';

import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ARTICLE_STATUS, ESCROW_STATUS, formatFCFA, timeAgo } from '../lib/format';
import { Couleurs, Polices, Ombres } from '../theme';
import Avatar from '../components/Avatar';
import PinInput from '../components/PinInput';

export default function MonDjassaScreen() {
  const navigation = useNavigation();
  const { user, isPro, logout, isAuthenticated } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState('annonces');
  const [mine, setMine] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pinFor, setPinFor] = useState(null);
  const [pinSuccess, setPinSuccess] = useState(null);

  const load = async () => {
    if (!isAuthenticated) return;
    try {
      const [mineRes, txRes] = await Promise.all([
        api.get('/products/mine'),
        api.get('/transactions'),
      ]);
      setMine(mineRes.data?.data ?? []);
      setTransactions(txRes.data?.data ?? []);
    } catch {
      // silencieux
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const archive = async (id) => {
    try {
      await api.delete(`/products/${id}`);
      toast.info('Annonce archivée.');
      load();
    } catch {
      toast.error('Archivage impossible.');
    }
  };

  const verifyPin = async (transactionId, pin) => {
    try {
      await api.post(`/transactions/${transactionId}/verify-pin`, { pin });
      const tx = transactions.find((t) => t.id === transactionId);
      setPinSuccess(tx ?? { montant: 0 });
      setPinFor(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Code PIN incorrect.');
    }
  };

  if (!isAuthenticated) return null; // le navigateur d'auth s'affiche à la place

  const ventes = transactions.filter((t) => t.role_utilisateur === 'vendeur');
  const achats = transactions.filter((t) => t.role_utilisateur === 'acheteur');
  const listed = tab === 'annonces' ? mine : tab === 'ventes' ? ventes : achats;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={listed}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            {/* En-tête profil */}
            <View style={styles.profileCard}>
              <View style={styles.profileRow}>
                <Avatar name={user?.nom} size={66} tone="red" />
                <View style={styles.profileBody}>
                  <View style={styles.profileNameRow}>
                    <Text style={styles.profileName} numberOfLines={1}>{user?.nom}</Text>
                    {user?.kyc_status === 'verified' && <BadgeCheck size={16} color="#fff" fill={Couleurs.red} />}
                  </View>
                  <Text style={styles.profileContact} numberOfLines={1}>{user?.email ?? user?.telephone} · {user?.ville}</Text>
                  <View style={styles.profileBadges}>
                    <Text style={styles.roleBadge}>{isPro ? 'VENDEUR PRO' : 'PARTICULIER'}</Text>
                    <View style={styles.scoreWrap}>
                      <Text style={styles.scoreLabel}>Confiance</Text>
                      <View style={styles.scoreTrack}><View style={[styles.scoreFill, { width: `${user?.score_confiance ?? 50}%` }]} /></View>
                      <Text style={styles.scoreValue}>{user?.score_confiance ?? 50}</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity style={styles.logoutButton} onPress={logout} accessibilityRole="button" accessibilityLabel="Se déconnecter">
                  <LogOut size={18} color="rgba(255,255,255,0.6)" />
                </TouchableOpacity>
              </View>

              {/* Portefeuille */}
              <View style={styles.walletRow}>
                <View style={styles.walletLeft}>
                  <Wallet size={19} color={Couleurs.red} />
                  <View>
                    <Text style={styles.walletLabel}>PORTEFEUILLE DJASSA</Text>
                    <Text style={styles.walletValue}>{formatFCFA(user?.solde_portefeuille ?? 0)}</Text>
                  </View>
                </View>
                {isPro && (
                  <TouchableOpacity style={styles.dashButton} onPress={() => navigation.navigate('ProDashboard')} accessibilityRole="button">
                    <LayoutDashboard size={14} color="#fff" />
                    <Text style={styles.dashButtonText}>Dashboard{'\n'}Pro</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Onglets */}
            <View style={styles.tabs}>
              {[
                { key: 'annonces', label: `Annonces (${mine.length})` },
                { key: 'ventes', label: `Ventes (${ventes.length})` },
                { key: 'achats', label: `Achats (${achats.length})` },
              ].map(({ key, label }) => (
                <TouchableOpacity key={key} onPress={() => setTab(key)} style={[styles.tab, tab === key && styles.tabActive]} accessibilityRole="tab" accessibilityState={{ selected: tab === key }}>
                  <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        }
        ListEmptyComponent={loading ? <ActivityIndicator color={Couleurs.red} style={{ marginTop: 32 }} /> : <Text style={styles.empty}>Rien ici pour l'instant.</Text>}
        renderItem={({ item }) =>
          tab === 'annonces' ? (
            <View style={styles.articleRow}>
              <Image source={{ uri: item.image_principale }} style={styles.articleImage} />
              <View style={styles.articleBody}>
                <Text style={styles.articleTitle} numberOfLines={2}>{item.titre}</Text>
                <Text style={styles.articlePrice}>{formatFCFA(item.prix_actuel ?? item.prix)}</Text>
                <View style={[styles.statusPill, { backgroundColor: ARTICLE_STATUS[item.statut]?.bg ?? '#F5F5F5' }]}>
                  <Text style={[styles.statusPillText, { color: ARTICLE_STATUS[item.statut]?.text ?? '#64748B' }]}>{(ARTICLE_STATUS[item.statut]?.label ?? item.statut).toUpperCase()}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.archiveButton} onPress={() => archive(item.id)} accessibilityRole="button" accessibilityLabel="Archiver l'annonce">
                <Trash2 size={16} color={Couleurs.slate} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.txRow}>
              <View style={styles.txBody}>
                <Text style={styles.txTitle} numberOfLines={2}>{item.article?.titre ?? 'Article'}</Text>
                <Text style={styles.txMeta}>{item.type === 'troc_mixte' ? 'Troc mixte' : 'Achat direct'} · {timeAgo(item.created_at)}</Text>
                <View style={[styles.statusPill, { backgroundColor: ESCROW_STATUS[item.escrow_status]?.bg ?? '#F5F5F5', alignSelf: 'flex-start', marginTop: 5 }]}>
                  <Text style={[styles.statusPillText, { color: ESCROW_STATUS[item.escrow_status]?.text ?? '#64748B' }]}>{(ESCROW_STATUS[item.escrow_status]?.label ?? item.escrow_status).toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.txRight}>
                <Text style={styles.txAmount}>{formatFCFA(item.montant)}</Text>
                {tab === 'ventes' && item.escrow_status === 'held' && (
                  <TouchableOpacity style={styles.pinButton} onPress={() => setPinFor(item)} accessibilityRole="button">
                    <ShieldCheck size={13} color="#fff" />
                    <Text style={styles.pinButtonText}>Valider PIN</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )
        }
      />

      {/* Modale PIN */}
      <Modal visible={Boolean(pinFor)} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPinFor(null)}>
        {pinFor && (
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <ShieldCheck size={40} color={Couleurs.red} style={{ alignSelf: 'center' }} />
            <Text style={styles.sheetTitle}>Valider la remise</Text>
            <Text style={styles.sheetSubtitle} numberOfLines={2}>{pinFor.article?.titre}</Text>
            <Text style={styles.sheetHint}>Demandez le code PIN à 4 chiffres à l'acheteur — saisissez-le pour libérer {formatFCFA(pinFor.montant)}.</Text>
            <PinInput onComplete={(pin) => verifyPin(pinFor.id, pin)} key={pinFor.id} />
            <Text style={styles.sheetLimit}>5 tentatives maximum avant blocage du séquestre.</Text>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setPinFor(null)} accessibilityRole="button">
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        )}
      </Modal>

      {/* Overlay succès */}
      {pinSuccess && <PinSuccessOverlay amount={pinSuccess.montant} onClose={() => setPinSuccess(null)} />}
    </SafeAreaView>
  );
}

/** Overlay coche animée (react-native-svg + Animated RN) */
function PinSuccessOverlay({ amount, onClose }) {
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 6, tension: 90, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start();
  }, [scale, opacity]);

  return (
    <View style={styles.overlay} accessibilityLiveRegion="polite">
      <Animated.View style={[styles.overlayCard, { transform: [{ scale }], opacity }]}>
        <Animated.View style={scale}>
          <Svg viewBox="0 0 200 200" width={150} height={150}>
            <Circle cx="100" cy="100" r="78" stroke="#121212" strokeWidth="12" fill="none" />
            <Path d="M62 104 L92 134 L142 74" stroke="#E11D48" strokeWidth="13" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Animated.View>
        <Text style={styles.overlayTitle}>Fonds libérés !</Text>
        <Text style={styles.overlayHint}>Code PIN validé — les fonds sont crédités sur votre portefeuille Djassa.</Text>
        {amount != null && <Text style={styles.overlayAmount}>{formatFCFA(amount)}</Text>}
        <TouchableOpacity style={styles.overlayButton} onPress={onClose} accessibilityRole="button">
          <Text style={styles.overlayButtonText}>Parfait !</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Couleurs.cloud },
  list: { padding: 12, gap: 8, paddingBottom: 30 },

  profileCard: { backgroundColor: Couleurs.black, borderRadius: 22, overflow: 'hidden' },
  profileRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16 },
  profileBody: { flex: 1, minWidth: 0 },
  profileNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  profileName: { fontFamily: Polices.jakarta, fontSize: 17, color: '#fff', flexShrink: 1 },
  profileContact: { fontSize: 10.5, color: 'rgba(255,255,255,0.6)', marginTop: 2, fontFamily: Polices.inter },
  profileBadges: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  roleBadge: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3.5, fontSize: 8, color: 'rgba(255,255,255,0.8)', fontFamily: Polices.jakartaBold, letterSpacing: 0.8 },
  scoreWrap: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  scoreLabel: { fontSize: 8, color: 'rgba(255,255,255,0.55)', fontFamily: Polices.inter },
  scoreTrack: { width: 72, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.15)', overflow: 'hidden' },
  scoreFill: { height: '100%', backgroundColor: Couleurs.red, borderRadius: 3 },
  scoreValue: { fontSize: 9, color: '#fff', fontFamily: Polices.interSemi },
  logoutButton: { padding: 8 },

  walletRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.09)', backgroundColor: 'rgba(255,255,255,0.04)', paddingHorizontal: 16, paddingVertical: 12 },
  walletLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  walletLabel: { fontSize: 8, color: 'rgba(255,255,255,0.5)', letterSpacing: 1.6, fontFamily: Polices.interSemi },
  walletValue: { fontFamily: Polices.jakarta, fontSize: 19, color: '#fff' },
  dashButton: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Couleurs.red, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8 },
  dashButtonText: { color: '#fff', fontFamily: Polices.jakartaBold, fontSize: 8.5, lineHeight: 11, textAlign: 'center' },

  tabs: { flexDirection: 'row', gap: 6, marginTop: 12, marginBottom: 4 },
  tab: { borderRadius: 999, borderWidth: 1, borderColor: 'rgba(18,18,18,0.14)', backgroundColor: '#fff', paddingHorizontal: 13, paddingVertical: 8 },
  tabActive: { backgroundColor: Couleurs.black, borderColor: Couleurs.black },
  tabText: { fontFamily: Polices.interSemi, fontSize: 10.5, color: Couleurs.slate },
  tabTextActive: { color: '#fff' },

  articleRow: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 10, borderWidth: 1, borderColor: 'rgba(18,18,18,0.06)' },
  articleImage: { width: 64, height: 64, borderRadius: 12, backgroundColor: Couleurs.cloud },
  articleBody: { flex: 1, minWidth: 0 },
  articleTitle: { fontFamily: Polices.jakartaBold, fontSize: 11, lineHeight: 14, color: Couleurs.black },
  articlePrice: { fontFamily: Polices.jakarta, fontSize: 11.5, color: Couleurs.black, marginTop: 2 },
  archiveButton: { padding: 9 },

  txRow: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: 'rgba(18,18,18,0.06)' },
  txBody: { flex: 1, minWidth: 0 },
  txTitle: { fontFamily: Polices.jakartaBold, fontSize: 11, lineHeight: 14, color: Couleurs.black },
  txMeta: { fontSize: 9, color: Couleurs.slate, marginTop: 2, fontFamily: Polices.inter },
  txRight: { alignItems: 'flex-end', gap: 6 },
  txAmount: { fontFamily: Polices.jakarta, fontSize: 12.5, color: Couleurs.black },

  statusPill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  statusPillText: { fontSize: 7.5, fontFamily: Polices.jakartaBold, letterSpacing: 0.6 },
  pinButton: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Couleurs.red, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  pinButtonText: { color: '#fff', fontFamily: Polices.jakartaBold, fontSize: 9 },
  empty: { textAlign: 'center', color: Couleurs.slate, fontFamily: Polices.inter, fontSize: 12, marginTop: 36 },

  sheet: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 22, paddingTop: 14, alignItems: 'center' },
  sheetHandle: { alignSelf: 'center', width: 42, height: 4.5, borderRadius: 3, backgroundColor: 'rgba(18,18,18,0.15)', marginBottom: 18 },
  sheetTitle: { fontFamily: Polices.jakarta, fontSize: 19, color: Couleurs.black, marginTop: 8 },
  sheetSubtitle: { fontFamily: Polices.interSemi, fontSize: 12, color: Couleurs.black, textAlign: 'center', marginTop: 6 },
  sheetHint: { fontFamily: Polices.inter, fontSize: 11.5, color: Couleurs.slate, textAlign: 'center', marginTop: 6, lineHeight: 17 },
  sheetLimit: { fontSize: 9.5, color: Couleurs.slate, fontFamily: Polices.inter, marginTop: 16 },
  cancelButton: { marginTop: 'auto', marginBottom: 26, paddingVertical: 12, paddingHorizontal: 26 },
  cancelButtonText: { fontFamily: Polices.interSemi, fontSize: 13, color: Couleurs.slate },

  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(18,18,18,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  overlayCard: { backgroundColor: '#fff', borderRadius: 26, padding: 26, alignItems: 'center', width: '100%', maxWidth: 320 },
  overlayTitle: { fontFamily: Polices.jakarta, fontSize: 20, color: Couleurs.black, marginTop: 10 },
  overlayHint: { fontFamily: Polices.inter, fontSize: 11, color: Couleurs.slate, textAlign: 'center', marginTop: 4, lineHeight: 16 },
  overlayAmount: { fontFamily: Polices.jakarta, fontSize: 22, color: Couleurs.red, marginTop: 8 },
  overlayButton: { backgroundColor: Couleurs.red, borderRadius: 16, height: 50, width: '100%', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  overlayButtonText: { color: '#fff', fontFamily: Polices.jakartaBold, fontSize: 14 },
});
