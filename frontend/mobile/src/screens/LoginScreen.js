import { useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeftRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Store } from 'lucide-react-native';
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

export default function LoginScreen() {
  const navigation = useNavigation();
  const { login, loginWithGoogle } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState('koffi@djassaonline.ci');
  const [password, setPassword] = useState('password');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await login(email.trim(), password);
      toast.success('Bienvenue sur le Djassa !');
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Identifiants invalides.');
    } finally {
      setLoading(false);
    }
  };

  const googleDev = async () => {
    setLoading(true);
    try {
      await loginWithGoogle('dev.testeur-mobile');
      toast.success('Connexion Google (mode dev) réussie.');
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Connexion Google impossible.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Panneau de marque */}
      <View style={styles.brandPanel}>
        <Text style={styles.brandLogo}>Djassa <Text style={styles.brandLogoRed}>Online</Text></Text>
        <ArrowLeftRight size={34} color={Couleurs.red} style={{ marginTop: 18 }} />
        <Text style={styles.brandTitle}>Le marché d'Abidjan{'\n'}dans ta <Text style={styles.brandTitleRed}>poche.</Text></Text>
        <View style={styles.brandPoints}>
          {[
            { Icon: ShieldCheck, text: 'Séquestre GeniusPay + code PIN' },
            { Icon: ArrowLeftRight, text: 'Troc pur ou mixte avec soulte' },
            { Icon: Store, text: 'Boutiques Pro neuf, factures PDF' },
          ].map(({ Icon, text }, i) => (
            <View key={i} style={styles.brandPoint}>
              <Icon size={13} color={Couleurs.red} />
              <Text style={styles.brandPointText}>{text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Formulaire */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.formWrap}>
        <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Connexion</Text>
          <Text style={styles.subtitle}>Retrouvez vos annonces, trocs et ventes flash.</Text>

          <TouchableOpacity style={styles.googleButton} onPress={googleDev} disabled={loading} accessibilityRole="button">
            <GoogleGlyph />
            <Text style={styles.googleButtonText}>Continuer avec Google <Text style={styles.googleDevTag}>(dev)</Text></Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} /><Text style={styles.dividerText}>ou e-mail</Text><View style={styles.dividerLine} />
          </View>

          <Text style={styles.label}>E-mail</Text>
          <View style={styles.inputRow}>
            <Mail size={16} color={Couleurs.slate} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              placeholder="vous@exemple.ci"
              placeholderTextColor={Couleurs.slate}
            />
          </View>

          <Text style={styles.label}>Mot de passe</Text>
          <View style={styles.inputRow}>
            <LockKeyhole size={16} color={Couleurs.slate} />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPwd}
              autoComplete="current-password"
              placeholder="••••••••"
              placeholderTextColor={Couleurs.slate}
            />
            <TouchableOpacity onPress={() => setShowPwd((v) => !v)} accessibilityLabel={showPwd ? 'Masquer' : 'Afficher'} hitSlop={8}>
              {showPwd ? <EyeOff size={17} color={Couleurs.slate} /> : <Eye size={17} color={Couleurs.slate} />}
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.submitButton, loading && styles.submitButtonDisabled]} onPress={submit} disabled={loading} accessibilityRole="button">
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Se connecter</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.switchRow} accessibilityRole="button">
            <Text style={styles.switchText}>Pas encore de compte ? <Text style={styles.switchLink}>Créer mon compte</Text></Text>
          </TouchableOpacity>

          <View style={styles.demoBox}>
            <Text style={styles.demoText}>Démo — koffi@djassaonline.ci / password (particulier){'\n'}bakayoko@djassaonline.ci / password (Quincaillerie Moderne)</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Couleurs.black },
  brandPanel: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 18 },
  brandLogo: { fontFamily: Polices.jakarta, fontSize: 17, color: '#fff' },
  brandLogoRed: { color: Couleurs.red },
  brandTitle: { fontFamily: Polices.jakarta, fontSize: 24, lineHeight: 31, color: '#fff', marginTop: 10 },
  brandTitleRed: { color: Couleurs.red },
  brandPoints: { gap: 6, marginTop: 12 },
  brandPoint: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  brandPointText: { fontFamily: Polices.inter, fontSize: 11, color: 'rgba(255,255,255,0.75)' },

  formWrap: { flex: 1, backgroundColor: Couleurs.cloud, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  formScroll: { padding: 22, gap: 2 },
  title: { fontFamily: Polices.jakarta, fontSize: 22, color: Couleurs.black },
  subtitle: { fontFamily: Polices.inter, fontSize: 11, color: Couleurs.slate, marginTop: 2 },

  googleButton: { flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: Couleurs.black, borderRadius: 999, height: 50, marginTop: 14 },
  googleButtonText: { color: '#fff', fontFamily: Polices.jakartaBold, fontSize: 12 },
  googleDevTag: { fontSize: 9, color: 'rgba(255,255,255,0.55)', fontFamily: Polices.inter },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(18,18,18,0.1)' },
  dividerText: { fontSize: 9, color: Couleurs.slate, letterSpacing: 1.2, fontFamily: Polices.interSemi, textTransform: 'uppercase' },

  label: { fontFamily: Polices.jakartaBold, fontSize: 9.5, color: Couleurs.slate, letterSpacing: 1, textTransform: 'uppercase', marginTop: 8, marginBottom: 5 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#fff', borderWidth: 1.5, borderColor: 'rgba(18,18,18,0.12)', borderRadius: 14, paddingHorizontal: 14, height: 50 },
  input: { flex: 1, fontFamily: Polices.inter, fontSize: 13, color: Couleurs.black },

  submitButton: { alignItems: 'center', justifyContent: 'center', backgroundColor: Couleurs.red, borderRadius: 16, height: 52, marginTop: 16, ...Ombres.pop },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#fff', fontFamily: Polices.jakartaBold, fontSize: 13.5 },

  switchRow: { alignItems: 'center', marginTop: 12 },
  switchText: { fontFamily: Polices.inter, fontSize: 12, color: Couleurs.slate },
  switchLink: { color: Couleurs.red, fontFamily: Polices.interSemi },

  demoBox: { backgroundColor: Couleurs.cloud, borderRadius: 12, padding: 10, marginTop: 14 },
  demoText: { fontFamily: Polices.inter, fontSize: 9, color: Couleurs.slate, lineHeight: 14, textAlign: 'center' },
});
