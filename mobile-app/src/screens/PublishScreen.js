import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import {
  ArrowLeftRight, Banknote, Check, ChevronLeft, ChevronRight, CloudUpload, Trash2, Zap,
} from 'lucide-react-native';

import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatFCFA } from '../lib/format';
import { Couleurs, Polices, Ombres } from '../theme';

const STEPS = ['Photos', 'Détails', 'Mode'];
const CATEGORIES = ['Outillage', 'High-Tech', 'Mode', 'Électroménager', 'Maison', 'Auto/Moto'];
const CONDITIONS = [
  { key: 'neuf', label: 'Neuf', pro: true },
  { key: 'comme_neuf', label: 'Comme neuf', pro: false },
  { key: 'bon_etat', label: 'Bon état', pro: false },
  { key: 'usage', label: 'Usagé', pro: false },
];

export default function PublishScreen() {
  const navigation = useNavigation();
  const { isAuthenticated, isPro, boutique } = useAuth();
  const toast = useToast();

  const [step, setStep] = useState(0);
  const [images, setImages] = useState([]); // { uri, file }
  const [busy, setBusy] = useState(false);
  const [publishedId, setPublishedId] = useState(null);
  const [form, setForm] = useState({
    titre: '', categorie: 'Outillage', description: '', condition: 'bon_etat',
    mode_transaction: 'vente', prix: '', prix_negociable: false, stock: '1', quartier: '', ville: 'Abidjan',
  });

  const isProVerified = Boolean(isPro && boutique?.verifie);

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      toast.info('Autorisez l’accès aux photos pour publier.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 6 - images.length,
      quality: 0.85,
    });
    if (result.canceled) return;
    setBusy(true);
    try {
      const processed = await Promise.all(
        result.assets.slice(0, 6 - images.length).map(async (asset) => {
          const manip = await ImageManipulator.manipulateAsync(
            asset.uri,
            [{ resize: { width: 1280 } }],
            { compress: 0.72, format: ImageManipulator.SaveFormat.WEBP }
          );
          return { uri: manip.uri, name: `djassa-${Date.now()}-${Math.round(Math.random() * 1e6)}.webp` };
        })
      );
      setImages((prev) => [...prev, ...processed].slice(0, 6));
    } finally {
      setBusy(false);
    }
  };

  const removeImage = (idx) => setImages((prev) => prev.filter((_, i) => i !== idx));

  const update = (k) => (v) => setForm({ ...form, [k]: v });

  const submit = async () => {
    if (!isAuthenticated) {
      toast.info('Connectez-vous pour publier.');
      return;
    }
    setBusy(true);
    try {
      const data = new FormData();
      data.append('titre', form.titre.trim());
      data.append('description', form.description.trim());
      data.append('prix', String(Number(form.prix)));
      data.append('prix_negociable', form.prix_negociable ? '1' : '0');
      data.append('condition', form.condition);
      data.append('mode_transaction', form.mode_transaction);
      data.append('est_trocable', form.mode_transaction !== 'vente' ? '1' : '0');
      data.append('stock', String(Math.max(1, Number(form.stock) || 1)));
      data.append('categorie', form.categorie);
      data.append('ville', form.ville);
      data.append('quartier', form.quartier);
      images.forEach((img) => {
        data.append('images[]', { uri: img.uri, name: img.name, type: 'image/webp' });
      });

      const { data: resp } = await api.post('/products', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPublishedId(resp?.data?.id ?? resp?.id);
      toast.success('Annonce en ligne !');
    } catch (e) {
      const respBody = e.response?.data;
      const msg = respBody?.errors ? Object.values(respBody.errors).flat()[0] : (respBody?.message ?? 'Échec de la publication.');
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  /* -------- Écran succès -------- */
  if (publishedId) {
    return (
      <SafeAreaView style={styles.successSafe}>
        <View style={styles.successBody}>
          <View style={styles.successCircle}><Check size={44} color="#fff" strokeWidth={3.5} /></View>
          <Text style={styles.successTitle}>Votre annonce{'\n'}est en ligne !</Text>
          <Text style={styles.successHint}>Les souhaits correspondants ont été alertés.</Text>
          <TouchableOpacity style={styles.successButton} onPress={() => navigation.navigate('Article', { id: publishedId })} accessibilityRole="button">
            <Text style={styles.successButtonText}>Voir mon annonce</Text>
            <ChevronRight size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Accueil')} accessibilityRole="button">
            <Text style={styles.successLink}>Retour au fil</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const canNext = step === 0 || (step === 1 && form.titre.trim().length >= 5 && Number(form.prix) > 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Publier une annonce</Text>
        <Text style={styles.subtitle}>Moins de 60 secondes chrono.</Text>
      </View>

      {/* Stepper */}
      <View style={styles.stepper}>
        {STEPS.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <View key={label} style={styles.stepItem}>
              <View style={[styles.stepDot, done && styles.stepDotDone, active && styles.stepDotActive]}>
                <Text style={[styles.stepDotText, (done || active) && styles.stepDotTextActive]}>{done ? '✓' : i + 1}</Text>
              </View>
              <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{label}</Text>
              {i < STEPS.length - 1 && <View style={[styles.stepLine, done && styles.stepLineDone]} />}
            </View>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {/* ===== Étape 1 — Photos ===== */}
        {step === 0 && (
          <>
            <TouchableOpacity style={styles.uploadZone} onPress={pickImages} disabled={busy} accessibilityRole="button">
              {busy ? <ActivityIndicator color={Couleurs.red} size="large" /> : <CloudUpload size={34} color={Couleurs.red} />}
              <Text style={styles.uploadTitle}>{busy ? 'Compression WebP…' : "Ajoutez jusqu'à 6 photos"}</Text>
              <Text style={styles.uploadHint}>JPEG · PNG · WebP — compressées automatiquement</Text>
            </TouchableOpacity>
            {images.length > 0 && (
              <View style={styles.thumbGrid}>
                {images.map((img, i) => (
                  <View key={i} style={styles.thumbWrap}>
                    <Image source={{ uri: img.uri }} style={styles.thumb} />
                    <TouchableOpacity style={styles.thumbRemove} onPress={() => removeImage(i)} accessibilityLabel="Retirer la photo" accessibilityRole="button">
                      <Trash2 size={12} color="#fff" />
                    </TouchableOpacity>
                    {i === 0 && <Text style={styles.thumbMain}>Principale</Text>}
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* ===== Étape 2 — Détails ===== */}
        {step === 1 && (
          <>
            <Text style={styles.label}>Titre de l'annonce *</Text>
            <TextInput style={styles.input} value={form.titre} onChangeText={update('titre')} placeholder="Ex : Perceuse sans fil Bosch GSB 18V-50" placeholderTextColor={Couleurs.slate} maxLength={180} />

            <Text style={styles.label}>Rayon *</Text>
            <View style={styles.chipRow}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity key={c} style={[styles.chip, form.categorie === c && styles.chipActive]} onPress={() => setForm({ ...form, categorie: c })} accessibilityRole="button">
                  <Text style={[styles.chipText, form.categorie === c && styles.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>État du produit *</Text>
            <View style={styles.conditionGrid}>
              {CONDITIONS.map(({ key, label, pro }) => {
                const locked = pro && !isProVerified;
                const active = form.condition === key;
                return (
                  <TouchableOpacity key={key} disabled={locked} onPress={() => setForm({ ...form, condition: key })} style={[styles.conditionCard, active && styles.conditionCardActive, locked && styles.conditionCardLocked]} accessibilityRole="button">
                    <Text style={[styles.conditionLabel, active && styles.conditionLabelActive]}>{label}</Text>
                    {locked && <Text style={styles.conditionLocked}>Pro vérifiée</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Description</Text>
            <TextInput style={[styles.input, styles.textArea]} value={form.description} onChangeText={update('description')} placeholder="Marque, modèle, défauts, raison de la vente…" placeholderTextColor={Couleurs.slate} multiline maxLength={5000} textAlignVertical="top" />
          </>
        )}

        {/* ===== Étape 3 — Prix & Mode ===== */}
        {step === 2 && (
          <>
            <View style={styles.priceStockRow}>
              <View style={styles.priceCol}>
                <Text style={styles.label}>Prix (FCFA) *</Text>
                <TextInput style={styles.priceInput} value={form.prix} onChangeText={update('prix')} placeholder="85 000" placeholderTextColor={Couleurs.slate} keyboardType="number-pad" />
              </View>
              {isProVerified && (
                <View>
                  <Text style={styles.label}>Stock</Text>
                  <TextInput style={styles.stockInput} value={form.stock} onChangeText={update('stock')} keyboardType="number-pad" />
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.negoRow} onPress={() => setForm({ ...form, prix_negociable: !form.prix_negociable })} accessibilityRole="checkbox" accessibilityState={{ checked: form.prix_negociable }}>
              <Text style={styles.negoText}>Prix négociable</Text>
              <View style={[styles.toggle, form.prix_negociable && styles.toggleOn]}><View style={[styles.toggleKnob, form.prix_negociable && styles.toggleKnobOn]} /></View>
            </TouchableOpacity>

            <Text style={styles.label}>Mode de transaction *</Text>
            <View style={styles.modeGrid}>
              {[
                { key: 'vente', label: 'Vente', hint: 'Cash Mobile Money', Icon: Banknote },
                { key: 'troc', label: 'Troc', hint: 'Objet contre objet', Icon: ArrowLeftRight },
                { key: 'mixte', label: 'Mixte', hint: 'Troc + soulte FCFA', Icon: Zap },
              ].map(({ key, label, hint, Icon }) => {
                const active = form.mode_transaction === key;
                return (
                  <TouchableOpacity key={key} style={[styles.modeCard, active && styles.modeCardActive]} onPress={() => setForm({ ...form, mode_transaction: key })} accessibilityRole="radio" accessibilityState={{ checked: active }}>
                    <Icon size={19} color={active ? Couleurs.red : Couleurs.black} />
                    <Text style={[styles.modeLabel, active && styles.modeLabelActive]}>{label}</Text>
                    <Text style={styles.modeHint}>{hint}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.twoCols}>
              <View style={styles.col}>
                <Text style={styles.label}>Ville</Text>
                <TextInput style={styles.input} value={form.ville} onChangeText={update('ville')} />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Quartier</Text>
                <TextInput style={styles.input} value={form.quartier} onChangeText={update('quartier')} placeholder="Cocody, Plateau…" placeholderTextColor={Couleurs.slate} />
              </View>
            </View>

            {/* Récap dark */}
            <View style={styles.recap}>
              <Text style={styles.recapKicker}>RÉCAPITULATIF</Text>
              <Text style={styles.recapTitle} numberOfLines={1}>{form.titre || 'Votre article'}</Text>
              <Text style={styles.recapPrice}>{form.prix ? formatFCFA(form.prix) : '—'}
                <Text style={styles.recapMode}>{'  '}· {form.mode_transaction === 'vente' ? 'Vente cash' : form.mode_transaction === 'troc' ? 'Troc uniquement' : 'Troc + soulte'}</Text>
              </Text>
              {form.condition === 'neuf' && <Text style={styles.recapNeuf}>ARTICLE NEUF — VITRINE BOUTIQUE PRO</Text>}
            </View>
          </>
        )}
      </ScrollView>

      {/* Navigation étapes */}
      <View style={styles.footer}>
        {step > 0 ? (
          <TouchableOpacity style={styles.ghostButton} onPress={() => setStep((s) => s - 1)} accessibilityRole="button">
            <ChevronLeft size={18} color={Couleurs.slate} />
            <Text style={styles.ghostText}>Retour</Text>
          </TouchableOpacity>
        ) : <View style={{ width: 90 }} />}

        {step < 2 ? (
          <TouchableOpacity style={[styles.primaryButton, !canNext && styles.primaryButtonDisabled]} disabled={!canNext} onPress={() => setStep((s) => s + 1)} accessibilityRole="button">
            <Text style={styles.primaryButtonText}>Continuer</Text>
            <ChevronRight size={17} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.publishButton, (busy || !form.titre.trim() || !form.prix) && styles.primaryButtonDisabled]} disabled={busy || !form.titre.trim() || !form.prix} onPress={submit} accessibilityRole="button">
            {busy ? <ActivityIndicator color="#fff" /> : <Zap size={17} color="#fff" fill="#fff" />}
            <Text style={styles.primaryButtonText}>Publier l'annonce</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Couleurs.cloud },
  header: { paddingHorizontal: 16, paddingTop: 8 },
  title: { fontFamily: Polices.jakarta, fontSize: 21, color: Couleurs.black },
  subtitle: { fontFamily: Polices.inter, fontSize: 11, color: Couleurs.slate, marginTop: 1 },

  stepper: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 14 },
  stepItem: { flexDirection: 'row', alignItems: 'center' },
  stepDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: Couleurs.cloud, borderWidth: 1, borderColor: 'rgba(18,18,18,0.12)', alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: Couleurs.black, borderColor: Couleurs.black },
  stepDotDone: { backgroundColor: Couleurs.red, borderColor: Couleurs.red },
  stepDotText: { fontFamily: Polices.jakartaBold, fontSize: 11, color: Couleurs.slate },
  stepDotTextActive: { color: '#fff' },
  stepLabel: { fontFamily: Polices.interSemi, fontSize: 9.5, color: Couleurs.slate, marginLeft: 5 },
  stepLabelActive: { color: Couleurs.black },
  stepLine: { width: 22, height: 2, backgroundColor: 'rgba(18,18,18,0.12)', marginHorizontal: 6 },
  stepLineDone: { backgroundColor: Couleurs.red },

  body: { padding: 16, gap: 4, paddingBottom: 12 },
  label: { fontFamily: Polices.jakartaBold, fontSize: 9.5, color: Couleurs.slate, letterSpacing: 1, textTransform: 'uppercase', marginTop: 12, marginBottom: 5 },
  input: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: 'rgba(18,18,18,0.12)', borderRadius: 14, paddingHorizontal: 14, height: 50, fontFamily: Polices.inter, fontSize: 13, color: Couleurs.black },
  textArea: { height: 88, textAlignVertical: 'top', paddingTop: 12 },

  uploadZone: { alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(18,18,18,0.18)', borderRadius: 22, paddingVertical: 34 },
  uploadTitle: { fontFamily: Polices.jakartaBold, fontSize: 13, color: Couleurs.black },
  uploadHint: { fontFamily: Polices.inter, fontSize: 10, color: Couleurs.slate },
  thumbGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  thumbWrap: { width: 31.5 + '%', aspectRatio: 1, borderRadius: 14, overflow: 'hidden', backgroundColor: Couleurs.cloud },
  thumb: { width: '100%', height: '100%' },
  thumbRemove: { position: 'absolute', top: 5, right: 5, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  thumbMain: { position: 'absolute', bottom: 4, left: 4, backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, color: '#fff', fontSize: 8, fontFamily: Polices.interSemi, overflow: 'hidden' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderRadius: 999, borderWidth: 1.5, borderColor: 'rgba(18,18,18,0.14)', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff' },
  chipActive: { backgroundColor: Couleurs.black, borderColor: Couleurs.black },
  chipText: { fontFamily: Polices.interMedium, fontSize: 11, color: Couleurs.black },
  chipTextActive: { color: '#fff' },

  conditionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  conditionCard: { borderWidth: 1.5, borderColor: 'rgba(18,18,18,0.12)', borderRadius: 16, padding: 10, minWidth: '22.5%', flexGrow: 1, backgroundColor: '#fff' },
  conditionCardActive: { borderColor: Couleurs.red, backgroundColor: 'rgba(225,29,72,0.06)' },
  conditionCardLocked: { opacity: 0.45 },
  conditionLabel: { fontFamily: Polices.jakartaBold, fontSize: 10.5, color: Couleurs.black },
  conditionLabelActive: { color: Couleurs.red },
  conditionLocked: { fontFamily: Polices.inter, fontSize: 8, color: Couleurs.slate, marginTop: 2 },

  priceStockRow: { flexDirection: 'row', gap: 12 },
  priceCol: { flex: 1 },
  priceInput: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: 'rgba(18,18,18,0.12)', borderRadius: 14, paddingHorizontal: 14, height: 58, fontFamily: Polices.jakarta, fontSize: 20, color: Couleurs.black },
  stockInput: { width: 66, backgroundColor: '#fff', borderWidth: 1.5, borderColor: 'rgba(18,18,18,0.12)', borderRadius: 14, textAlign: 'center', height: 58, fontFamily: Polices.jakarta, fontSize: 17, color: Couleurs.black },

  negoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 16, padding: 14, marginTop: 12 },
  negoText: { fontFamily: Polices.interSemi, fontSize: 12, color: Couleurs.black },
  toggle: { width: 44, height: 26, borderRadius: 13, backgroundColor: 'rgba(18,18,18,0.15)', padding: 3, justifyContent: 'center' },
  toggleOn: { backgroundColor: Couleurs.red },
  toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  toggleKnobOn: { alignSelf: 'flex-end' },

  modeGrid: { flexDirection: 'row', gap: 8 },
  modeCard: { flex: 1, alignItems: 'center', gap: 4, borderWidth: 2, borderColor: 'rgba(18,18,18,0.1)', borderRadius: 18, padding: 12, backgroundColor: '#fff' },
  modeCardActive: { borderColor: Couleurs.red, backgroundColor: 'rgba(225,29,72,0.06)', ...Ombres.pop },
  modeLabel: { fontFamily: Polices.jakartaBold, fontSize: 11.5, color: Couleurs.black },
  modeLabelActive: { color: Couleurs.red },
  modeHint: { fontFamily: Polices.inter, fontSize: 7.5, color: Couleurs.slate, textAlign: 'center' },

  twoCols: { flexDirection: 'row', gap: 10 },
  col: { flex: 1 },

  recap: { backgroundColor: Couleurs.black, borderRadius: 18, padding: 16, marginTop: 14 },
  recapKicker: { fontSize: 8, color: 'rgba(255,255,255,0.5)', letterSpacing: 2, fontFamily: Polices.interSemi },
  recapTitle: { fontFamily: Polices.jakartaBold, fontSize: 12, color: '#fff', marginTop: 4 },
  recapPrice: { fontFamily: Polices.jakarta, fontSize: 18, color: '#fff', marginTop: 4 },
  recapMode: { fontSize: 9, color: 'rgba(255,255,255,0.55)', fontFamily: Polices.inter },
  recapNeuf: { fontSize: 8, color: '#FDE68A', letterSpacing: 1, fontFamily: Polices.jakartaBold, marginTop: 6 },

  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 14, borderTopWidth: 1, borderTopColor: 'rgba(18,18,18,0.07)', backgroundColor: '#fff' },
  ghostButton: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 12, paddingHorizontal: 8 },
  ghostText: { fontFamily: Polices.interSemi, fontSize: 13, color: Couleurs.slate },
  primaryButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Couleurs.black, borderRadius: 14, height: 50, paddingHorizontal: 20 },
  publishButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Couleurs.red, borderRadius: 14, height: 50, paddingHorizontal: 18, ...Ombres.pop },
  primaryButtonDisabled: { opacity: 0.4 },
  primaryButtonText: { color: '#fff', fontFamily: Polices.jakartaBold, fontSize: 13 },

  successSafe: { flex: 1, backgroundColor: Couleurs.black },
  successBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 },
  successCircle: { width: 84, height: 84, borderRadius: 42, backgroundColor: Couleurs.red, alignItems: 'center', justifyContent: 'center', ...Ombres.pop },
  successTitle: { fontFamily: Polices.jakarta, fontSize: 24, color: '#fff', textAlign: 'center', lineHeight: 31 },
  successHint: { fontFamily: Polices.inter, fontSize: 12, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
  successButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Couleurs.red, borderRadius: 16, height: 50, paddingHorizontal: 22, marginTop: 8 },
  successButtonText: { color: '#fff', fontFamily: Polices.jakartaBold, fontSize: 13 },
  successLink: { fontFamily: Polices.interSemi, fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
});
