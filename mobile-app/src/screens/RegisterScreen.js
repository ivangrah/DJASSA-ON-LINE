import { useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeftRight, Eye, EyeOff, LockKeyhole, Mail, Store, UserRound } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Couleurs, Polices, Ombres } from '../theme';

function GoogleGlyph() {
  return (
    <Svg viewBox="0 0 48 48" width={19} height={19}>
      <Path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.1 6 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
      <Path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 18.9 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.1 6 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
      <Path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2C29.3 35.1 26.8 36 24 36c-5.2 0-9.6-3.3-11.2-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <Path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4 5.9l6.3 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
    </Svg>
  );
}

export default function RegisterScreen() {
  const navigation = useNavigation();
  const { register, loginWithGoogle } = useAuth();
  const toast = useToast();
  const [asBoutique, setAsBoutique] = useState(false);
  const [form, setForm] = useState({ nom: '', email: '', telephone: '', password: '', password_confirmation: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k) => (v) => setForm({ ...form, [k]: v });

  const submit = async () => {
    if (form.password !== form.password_confirmation) {
      toast.error('Les mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    try {
      await register({ ...form, telephone: form.telephone || undefined });
      toast.success('Bienvenue sur le Djassa !');
    } catch (e) {
      const resp = e.response?.data;
      const msg = resp?.errors ? Object.values(resp.errors).flat()[0] : (resp?.message ?? 'Inscription impossible.');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const googleDev = async () => {
    setLoading(true);
    try {
      await loginWithGoogle('dev.testeur-mobile-inscription', asBoutique ? 'pro_seller' : 'user');
      toast.success('Compte créé.');
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Inscription Google impossible.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brandRow}>
            <ArrowLeftRight size={26} color={Couleurs.red} />
            <Text style={styles.brand}>Djassa <Text style={styles.brandRed}>Online</Text></Text>
          </View>
          <Text style={styles.title}>Créer mon compte</Text>
          <Text style={styles.subtitle}>Rejoignez la marketplace de revente & troc de Côte d'Ivoire.</Text>

          {/* Bascule Particulier / Boutique Pro */}
          <View style={styles.segment}>
            <TouchableOpacity style={[styles.segmentButton, !asBoutique && styles.segmentButtonActive]} onPress={() => setAsBoutique(false)} accessibilityRole="tab" accessibilityState={{ selected: !asBoutique }}>
              <UserRound size={14} color={!asBoutique ? Couleurs.black : Couleurs.slate} />
              <View>
                <Text style={[styles.segmentLabel, !asBoutique && styles.segmentLabelActive]}>Particulier</Text>
                <Text style={styles.segmentHint}>Vendre · troquer</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.segmentButton, styles.segmentButtonDark, asBoutique && styles.segmentButtonDarkActive]} onPress={() => setAsBoutique(true)} accessibilityRole="tab" accessibilityState={{ selected: asBoutique }}>
              <Store size={14} color={asBoutique ? '#fff' : Couleurs.slate} />
              <View>
                <Text style={[styles.segmentLabel, asBoutique && styles.segmentLabelOnDark]}>Boutique Pro</Text>
                <Text style={[styles.segmentHint, asBoutique && styles.segmentHintOnDark]}>Neufs · factures PDF</Text>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.googleButton} onPress={googleDev} disabled={loading} accessibilityRole="button">
            <GoogleGlyph />
            <Text style={styles.googleButtonText}>S'inscrire avec Google <Text style={styles.googleDevTag}>(dev)</Text></Text>
          </TouchableOpacity>

          <View style={styles.divider}><View style={styles.dividerLine} /><Text style={styles.dividerText}>ou e-mail</Text><View style={styles.dividerLine} /></View>

          <Text style={styles.label}>Nom complet *</Text>
          <TextInput style={styles.input} value={form.nom} onChangeText={set('nom')} placeholder="Koffi N'Guessan" placeholderTextColor={Couleurs.slate} autoComplete="name" />

          <Text style={styles.label}>E-mail *</Text>
          <TextInput style={styles.input} value={form.email} onChangeText={set('email')} placeholder="vous@exemple.ci" placeholderTextColor={Couleurs.slate} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />

          <Text style={styles.label}>Téléphone (Mobile Money)</Text>
          <TextInput style={styles.input} value={form.telephone} onChangeText={set('telephone')} placeholder="+225 07 00 00 00 00" placeholderTextColor={Couleurs.slate} keyboardType="phone-pad" autoComplete="tel" />

          <Text style={styles.label}>Mot de passe *</Text>
          <View style={styles.pwdRow}>
            <View style={styles.inputRow}>
              <LockKeyhole size={15} color={Couleurs.slate} />
              <TextInput style={styles.inputInline} value={form.password} onChangeText={set('password')} placeholder="8 caractères min." placeholderTextColor={Couleurs.slate} secureTextEntry={!showPwd} autoComplete="new-password" />
            </View>
            <TouchableOpacity onPress={() => setShowPwd((v) => !v)} hitSlop={8} accessibilityLabel={showPwd ? 'Masquer' : 'Afficher'}>
              {showPwd ? <EyeOff size={16} color={Couleurs.slate} /> : <Eye size={16} color={Couleurs.slate} />}
            </TouchableOpacity>
          </View>
          <TextInput style={[styles.input, { marginTop: 8 }]} value={form.password_confirmation} onChangeText={set('password_confirmation')} placeholder="Confirmez le mot de passe" placeholderTextColor={Couleurs.slate} secureTextEntry={!showPwd} autoComplete="new-password" />

          <TouchableOpacity style={[styles.submitButton, loading && styles.submitButtonDisabled]} onPress={submit} disabled={loading} accessibilityRole="button">
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>{asBoutique ? 'Créer mon compte Pro' : 'Créer mon compte'}</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.switchRow} accessibilityRole="button">
            <Text style={styles.switchText}>Déjà inscrit ? <Text style={styles.switchLink}>Se connecter</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Couleurs.cloud },
  flex: { flex: 1 },
  scroll: { padding: 22, gap: 2 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brand: { fontFamily: Polices.jakarta, fontSize: 16, color: Couleurs.black },
  brandRed: { color: Couleurs.red },
  title: { fontFamily: Polices.jakarta, fontSize: 23, color: Couleurs.black, marginTop: 8 },
  subtitle: { fontFamily: Polices.inter, fontSize: 11, color: Couleurs.slate, marginTop: 1 },

  segment: { flexDirection: 'row', gap: 8, marginTop: 12 },
  segmentButton: { flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(18,18,18,0.12)', borderRadius: 16, padding: 12, backgroundColor: '#fff' },
  segmentButtonActive: { borderColor: Couleurs.red, backgroundColor: 'rgba(225,29,72,0.05)' },
  segmentButtonDark: { borderColor: 'rgba(18,18,18,0.08)', backgroundColor: Couleurs.black },
  segmentButtonDarkActive: { borderColor: Couleurs.red },
  segmentLabel: { fontFamily: Polices.jakartaBold, fontSize: 10.5, color: Couleurs.black },
  segmentLabelActive: { color: Couleurs.red },
  segmentLabelOnDark: { color: '#fff' },
  segmentHint: { fontFamily: Polices.inter, fontSize: 8, color: Couleurs.slate },
  segmentHintOnDark: { color: 'rgba(255,255,255,0.6)' },

  googleButton: { flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: Couleurs.black, borderRadius: 999, height: 50, marginTop: 12 },
  googleButtonText: { color: '#fff', fontFamily: Polices.jakartaBold, fontSize: 12 },
  googleDevTag: { fontSize: 9, color: 'rgba(255,255,255,0.55)', fontFamily: Polices.inter },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(18,18,18,0.1)' },
  dividerText: { fontSize: 9, color: Couleurs.slate, letterSpacing: 1.2, fontFamily: Polices.interSemi, textTransform: 'uppercase' },

  label: { fontFamily: Polices.jakartaBold, fontSize: 9.5, color: Couleurs.slate, letterSpacing: 1, textTransform: 'uppercase', marginTop: 10, marginBottom: 5 },
  input: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: 'rgba(18,18,18,0.12)', borderRadius: 14, paddingHorizontal: 14, height: 50, fontFamily: Polices.inter, fontSize: 13, color: Couleurs.black },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, backgroundColor: '#fff', borderWidth: 1.5, borderColor: 'rgba(18,18,18,0.12)', borderRadius: 14, paddingHorizontal: 14, height: 50 },
  inputInline: { flex: 1, fontFamily: Polices.inter, fontSize: 13, color: Couleurs.black },
  pwdRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  submitButton: { alignItems: 'center', justifyContent: 'center', backgroundColor: Couleurs.red, borderRadius: 16, height: 52, marginTop: 16, ...Ombres.pop },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#fff', fontFamily: Polices.jakartaBold, fontSize: 13.5 },

  switchRow: { alignItems: 'center', marginTop: 12 },
  switchText: { fontFamily: Polices.inter, fontSize: 12, color: Couleurs.slate },
  switchLink: { color: Couleurs.red, fontFamily: Polices.interSemi },
});
