import { useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, Modal, SafeAreaView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { ArrowLeftRight, Eye, Plus, Tag, X } from 'lucide-react-native';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatFCFA, timeAgo } from '../lib/format';
import { Couleurs, Polices, Ombres } from '../theme';
import Avatar from '../components/Avatar';

const CATEGORIES = ['High-Tech', 'Outillage', 'Électroménager', 'Mode', 'Maison', 'Auto/Moto'];

export default function SouhaitsScreen() {
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const [souhaitList, setSouhaits] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [composeOpen, setComposeOpen] = useState(false);
  const [form, setForm] = useState({ titre: '', budget_max: '', categorie: 'High-Tech', accepte_troc: true });
  const [submitting, setSubmitting] = useState(false);

  const load = async (pageToLoad, replace) => {
    try {
      const { data } = await api.get('/souhaits', { params: { per_page: 12, page: pageToLoad } });
      setMeta(data.meta);
      setSouhaits((prev) => (replace || pageToLoad === 1 ? data.data : [...prev, ...data.data]));
    } catch {
      // silencieux — pull-to-refresh reste disponible
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMore = () => {
    if (!meta || loading || page >= (meta.last_page ?? 1)) return;
    setPage((p) => p + 1);
    load(page + 1, false);
  };

  const publish = async () => {
    if (form.titre.trim().length < 8 || submitting) return;
    setSubmitting(true);
    try {
      await api.post('/souhaits', {
        ...form,
        budget_max: form.budget_max ? Number(form.budget_max) : null,
      });
      toast.success('Votre souhait est en ligne — les vendeurs compatibles vont être alertés.');
      setForm({ titre: '', budget_max: '', categorie: 'High-Tech', accepte_troc: true });
      setComposeOpen(false);
      load(1, true);
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Impossible de publier le souhait.');
    } finally {
      setSubmitting(false);
    }
  };

  const openCompose = () => {
    if (!isAuthenticated) {
      toast.info('Connectez-vous pour publier un souhait.');
      return;
    }
    setComposeOpen(true);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.kicker}>MUR DES SOUHAITS</Text>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Publiez ce que{'\n'}vous <Text style={styles.titleRed}>cherchez</Text></Text>
          <TouchableOpacity style={styles.publishButton} onPress={openCompose} accessibilityRole="button" accessibilityLabel="Publier un besoin">
            <Plus size={17} color="#fff" strokeWidth={3} />
            <Text style={styles.publishButtonText}>Publier un besoin</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={souhaitList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        onEndReachedThreshold={0.4}
        onEndReached={loadMore}
        ListEmptyComponent={loading ? <ActivityIndicator color={Couleurs.red} style={{ marginTop: 40 }} /> : <Text style={styles.empty}>Aucun souhait pour l'instant.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Avatar name={item.utilisateur?.nom} size={40} />
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.titre}</Text>
              <View style={styles.cardMeta}>
                <Text style={styles.cardAuthor}>par {item.utilisateur?.nom}</Text>
                {item.budget_max && (
                  <View style={styles.metaItem}><Tag size={10} color={Couleurs.slate} /><Text style={styles.metaText}>{formatFCFA(item.budget_max)}</Text></View>
                )}
                <View style={styles.metaItem}><Eye size={10} color={Couleurs.slate} /><Text style={styles.metaText}>{item.vues}</Text></View>
              </View>
              <View style={styles.cardFooter}>
                {item.categorie && <Text style={styles.categoryChip}>{item.categorie}</Text>}
                {item.accepte_troc && (
                  <View style={styles.trocChip}>
                    <ArrowLeftRight size={9} color="#fff" strokeWidth={3.5} />
                    <Text style={styles.trocChipText}>TROC ACCEPTÉ</Text>
                  </View>
                )}
                <Text style={styles.cardTime}>{timeAgo(item.created_at)}</Text>
              </View>
            </View>
          </View>
        )}
      />

      {/* Modale publication */}
      <Modal visible={composeOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setComposeOpen(false)}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Publier un besoin</Text>
            <TouchableOpacity onPress={() => setComposeOpen(false)} accessibilityRole="button" accessibilityLabel="Fermer">
              <X size={20} color={Couleurs.slate} />
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>Je recherche…</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex : groupe électrogène d'occasion, budget 80 000 FCFA ou troc"
            placeholderTextColor={Couleurs.slate}
            value={form.titre}
            onChangeText={(t) => setForm({ ...form, titre: t })}
            maxLength={200}
            autoFocus
            multiline
          />
          <Text style={styles.inputHint}>8 caractères minimum — les vendeurs compatibles sont alertés automatiquement.</Text>

          <Text style={styles.inputLabel}>Budget max (FCFA)</Text>
          <TextInput
            style={styles.input}
            placeholder="80 000"
            placeholderTextColor={Couleurs.slate}
            value={form.budget_max}
            onChangeText={(t) => setForm({ ...form, budget_max: t })}
            keyboardType="number-pad"
          />

          <Text style={styles.inputLabel}>Rayon</Text>
          <View style={styles.catRow}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity key={c} style={[styles.catChip, form.categorie === c && styles.catChipActive]} onPress={() => setForm({ ...form, categorie: c })} accessibilityRole="button">
                <Text style={[styles.catChipText, form.categorie === c && styles.catChipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.trocToggle} onPress={() => setForm({ ...form, accepte_troc: !form.accepte_troc })} accessibilityRole="checkbox" accessibilityState={{ checked: form.accepte_troc }}>
            <Text style={styles.trocToggleText}>J'accepte aussi le troc</Text>
            <View style={[styles.toggle, form.accepte_troc && styles.toggleOn]}>
              <View style={[styles.toggleKnob, form.accepte_troc && styles.toggleKnobOn]} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.submitButton, (form.titre.trim().length < 8 || submitting) && styles.submitButtonDisabled]} disabled={form.titre.trim().length < 8 || submitting} onPress={publish} accessibilityRole="button">
            {submitting ? <ActivityIndicator color="#fff" /> : <Plus size={18} color="#fff" strokeWidth={3} />}
            <Text style={styles.submitButtonText}>Publier le souhait</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Couleurs.cloud },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  kicker: { fontSize: 9, fontFamily: Polices.jakartaBold, letterSpacing: 2, color: Couleurs.red },
  headerRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginTop: 2 },
  title: { fontFamily: Polices.jakarta, fontSize: 22, lineHeight: 28, color: Couleurs.black },
  titleRed: { color: Couleurs.red },
  publishButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Couleurs.red, borderRadius: 14, paddingHorizontal: 12, height: 44, ...Ombres.pop },
  publishButtonText: { color: '#fff', fontFamily: Polices.jakartaBold, fontSize: 11 },
  list: { padding: 12, gap: 10 },
  empty: { textAlign: 'center', color: Couleurs.slate, marginTop: 40, fontFamily: Polices.inter },
  card: { flexDirection: 'row', gap: 10, backgroundColor: '#fff', borderRadius: 18, padding: 12, borderWidth: 1, borderColor: 'rgba(18,18,18,0.06)', ...Ombres.card },
  cardBody: { flex: 1, minWidth: 0 },
  cardTitle: { fontFamily: Polices.jakartaBold, fontSize: 12, lineHeight: 17, color: Couleurs.black },
  cardMeta: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 3 },
  cardAuthor: { fontSize: 10, fontFamily: Polices.interSemi, color: Couleurs.black },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 10, color: Couleurs.slate, fontFamily: Polices.inter },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  categoryChip: { backgroundColor: Couleurs.cloud, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3.5, fontSize: 8, color: Couleurs.slate, fontFamily: Polices.interSemi, letterSpacing: 0.5 },
  trocChip: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Couleurs.red, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3.5 },
  trocChipText: { color: '#fff', fontSize: 7.5, fontFamily: Polices.jakartaBold, letterSpacing: 0.6 },
  cardTime: { marginLeft: 'auto', fontSize: 9, color: Couleurs.slate, fontFamily: Polices.inter },

  sheet: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 18, paddingTop: 16 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sheetTitle: { fontFamily: Polices.jakarta, fontSize: 19, color: Couleurs.black },
  inputLabel: { fontFamily: Polices.jakartaBold, fontSize: 10, color: Couleurs.slate, letterSpacing: 1, textTransform: 'uppercase', marginTop: 12 },
  input: { borderWidth: 1.5, borderColor: 'rgba(18,18,18,0.14)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontFamily: Polices.inter, fontSize: 13, color: Couleurs.black, marginTop: 6, minHeight: 46 },
  inputHint: { fontSize: 9, color: Couleurs.slate, marginTop: 4, fontFamily: Polices.inter },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  catChip: { borderRadius: 999, borderWidth: 1, borderColor: 'rgba(18,18,18,0.15)', paddingHorizontal: 12, paddingVertical: 7 },
  catChipActive: { backgroundColor: Couleurs.black, borderColor: Couleurs.black },
  catChipText: { fontSize: 11, color: Couleurs.black, fontFamily: Polices.interMedium },
  catChipTextActive: { color: '#fff' },
  trocToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, backgroundColor: Couleurs.mist, borderRadius: 16, padding: 14 },
  trocToggleText: { fontFamily: Polices.interSemi, fontSize: 12, color: Couleurs.black },
  toggle: { width: 44, height: 26, borderRadius: 13, backgroundColor: 'rgba(18,18,18,0.15)', padding: 3, justifyContent: 'center' },
  toggleOn: { backgroundColor: Couleurs.red },
  toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  toggleKnobOn: { alignSelf: 'flex-end' },
  submitButton: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: Couleurs.red, borderRadius: 16, height: 52, marginTop: 20, ...Ombres.pop },
  submitButtonDisabled: { opacity: 0.4 },
  submitButtonText: { color: '#fff', fontFamily: Polices.jakartaBold, fontSize: 13 },
});
