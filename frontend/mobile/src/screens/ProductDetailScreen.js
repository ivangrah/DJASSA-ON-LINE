import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Image, Modal, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  ArrowLeftRight, BadgeCheck, Check, ChevronLeft, Eye, MapPin, MessageCircle,
  ShieldCheck, Store, Zap,
} from 'lucide-react-native';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CONDITION_LABELS, CONDITION_STYLES, formatFCFA, timeAgo } from '../lib/format';
import { Couleurs, Polices, Ombres } from '../theme';
import Avatar from '../components/Avatar';
import FlashCountdown from '../components/FlashCountdown';

export default function ProductDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params;
  const toast = useToast();
  const { user, isAuthenticated } = useAuth();

  const [article, setArticle] = useState(null);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [trocOpen, setTrocOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        setArticle(data.data);
      } catch (e) {
        setError(e.response?.data?.message ?? 'Article introuvable.');
      }
    })();
  }, [id]);

  const requireAuth = () => {
    if (!isAuthenticated) {
      toast.info('Connectez-vous pour continuer.');
      return false;
    }
    return true;
  };

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Article introuvable</Text>
        <Text style={styles.errorHint}>{error}</Text>
        <TouchableOpacity style={styles.blackButton} onPress={() => navigation.goBack()} accessibilityRole="button">
          <Text style={styles.blackButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!article) {
    return <View style={styles.centered}><ActivityIndicator color={Couleurs.red} size="large" /></View>;
  }

  const images = article.images?.length ? article.images : (article.image_principale ? [article.image_principale] : []);
  const trocable = article.est_trocable || ['troc', 'mixte'].includes(article.mode_transaction);
  const isFlash = Boolean(article.vente_flash && article.prix_flash);
  const prixActuel = Number(article.prix_actuel ?? article.prix);
  const isPro = Boolean(article.boutique);
  const conditionStyle = CONDITION_STYLES[article.condition] ?? CONDITION_STYLES.bon_etat;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Barre haute */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.topButton} accessibilityLabel="Retour" accessibilityRole="button">
          <ChevronLeft size={22} color={Couleurs.black} />
        </TouchableOpacity>
        <Text style={styles.topTitle} numberOfLines={1}>{article.categorie}</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Galerie */}
        <View style={styles.gallery}>
          {images[activeImage] ? (
            <Image source={{ uri: images[activeImage] }} style={styles.hero} resizeMode="cover" />
          ) : (
            <View style={[styles.hero, styles.heroPlaceholder]}><Text style={styles.heroLogo}>Djassa</Text></View>
          )}
          {isFlash && (
            <View style={styles.flashChip}>
              <Zap size={11} color="#FDE68A" fill="#FDE68A" />
              <Text style={styles.flashChipText}>VENTE FLASH</Text>
              <FlashCountdown iso={article.flash_fin_at} style={{ fontSize: 10 }} />
            </View>
          )}
        </View>
        {images.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbs}>
            {images.map((img, i) => (
              <TouchableOpacity key={i} onPress={() => setActiveImage(i)} style={[styles.thumb, i === activeImage && styles.thumbActive]} accessibilityRole="button" accessibilityLabel={`Photo ${i + 1}`}>
                <Image source={{ uri: img }} style={styles.thumbImage} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Badges */}
        <View style={styles.badgesRow}>
          <View style={[styles.conditionBadge, { backgroundColor: conditionStyle.bg }]}>
            <Text style={[styles.conditionText, { color: conditionStyle.text }]}>{CONDITION_LABELS[article.condition]}</Text>
          </View>
          {trocable && (
            <View style={styles.trocBadge}>
              <ArrowLeftRight size={10} color="#fff" strokeWidth={3} />
              <Text style={styles.trocBadgeText}>TROC POSSIBLE</Text>
            </View>
          )}
          {isPro && (
            <View style={styles.proBadge}>
              <Store size={10} color="#fff" strokeWidth={3} />
              <Text style={styles.proBadgeText}>NEUF BOUTIQUE PRO</Text>
            </View>
          )}
        </View>

        {/* Titre + prix */}
        <Text style={styles.title}>{article.titre}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatFCFA(prixActuel)}</Text>
          {isFlash && <Text style={styles.priceOld}>{formatFCFA(article.prix)}</Text>}
        </View>

        {/* Méta */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MapPin size={11} color={Couleurs.slate} />
            <Text style={styles.metaText}>{article.quartier ? `${article.quartier}, ` : ''}{article.ville}</Text>
          </View>
          <View style={styles.metaItem}>
            <Eye size={11} color={Couleurs.slate} />
            <Text style={styles.metaText}>{article.vues} vue{article.vues > 1 ? 's' : ''}</Text>
          </View>
          <Text style={styles.metaText}>{timeAgo(article.created_at)}</Text>
        </View>

        {/* Vendeur / Boutique */}
        <View style={styles.sellerCard}>
          <Avatar name={article.boutique?.nom_boutique ?? article.proprietaire?.nom} size={44} tone={isPro ? 'red' : 'black'} />
          <View style={styles.sellerBody}>
            <View style={styles.sellerNameRow}>
              <Text style={styles.sellerName} numberOfLines={1}>{article.boutique?.nom_boutique ?? article.proprietaire?.nom}</Text>
              {isPro && article.boutique?.verifie && <BadgeCheck size={15} color={Couleurs.red} fill={Couleurs.red} />}
            </View>
            <Text style={styles.sellerHint}>{isPro ? 'Boutique Pro vérifiée · Neuf garanti' : 'Particulier · Remise en main propre'}</Text>
          </View>
          <TouchableOpacity style={styles.messageButton} onPress={() => { if (requireAuth()) navigation.navigate('Thread', { partnerId: article.proprietaire?.id, articleId: article.id }); }} accessibilityRole="button" accessibilityLabel="Envoyer un message">
            <MessageCircle size={19} color={Couleurs.black} />
          </TouchableOpacity>
        </View>

        {/* Description */}
        <Text style={styles.sectionLabel}>Description</Text>
        <Text style={styles.description}>{article.description || 'Aucune description fournie par le vendeur.'}</Text>

        {/* Specs */}
        {article.specs && Object.keys(article.specs).length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Caractéristiques</Text>
            <View style={styles.specsGrid}>
              {Object.entries(article.specs).slice(0, 6).map(([key, value]) => (
                <View key={key} style={styles.specCell}>
                  <Text style={styles.specKey}>{String(key).replaceAll('_', ' ').toUpperCase()}</Text>
                  <Text style={styles.specValue} numberOfLines={1}>{String(value)}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* CTA sticky */}
      <View style={styles.ctaBar}>
        <TouchableOpacity style={styles.buyButton} onPress={() => requireAuth() && setCheckoutOpen(true)} accessibilityRole="button">
          <ShieldCheck size={17} color="#fff" />
          <Text style={styles.buyButtonText}>Acheter {formatFCFA(prixActuel)}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.trocButton, !trocable && styles.trocButtonDisabled]}
          disabled={!trocable}
          onPress={() => requireAuth() && setTrocOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Proposer un troc"
        >
          <ArrowLeftRight size={19} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Modale troc */}
      <TrocModal visible={trocOpen} article={article} onClose={() => setTrocOpen(false)} onSubmitted={() => {
        setTrocOpen(false);
        navigation.navigate('Thread', { partnerId: article.proprietaire?.id, articleId: article.id });
      }} />

      {/* Modale checkout */}
      <CheckoutModal visible={checkoutOpen} article={article} onClose={() => setCheckoutOpen(false)} />
    </SafeAreaView>
  );
}

/* ============ Modale Proposer un troc ============ */

function TrocModal({ visible, article, onClose, onSubmitted }) {
  const toast = useToast();
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [soulte, setSoulte] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    api.get('/products/mine')
      .then(({ data }) => setMine((data?.data ?? []).filter((a) => a.statut === 'published' && a.id !== article.id)))
      .catch(() => setMine([]))
      .finally(() => setLoading(false));
  }, [visible, article.id]);

  const toggle = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const targetPrice = Number(article?.prix_actuel ?? article?.prix ?? 0);
  const selectedTotal = mine.filter((a) => selected.includes(a.id)).reduce((acc, a) => acc + Number(a.prix), 0);
  const soulteNum = Number(soulte || 0);

  const submit = async () => {
    if (selected.length === 0 || submitting) return;
    setSubmitting(true);
    try {
      await api.post('/barter-offers', {
        article_cible_id: article.id,
        articles_offerts: selected,
        montant_soulte_fcfa: soulteNum,
        message: message || undefined,
      });
      toast.success('Proposition de troc envoyée au vendeur.');
      setSelected([]); setSoulte(''); setMessage('');
      onSubmitted();
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Impossible d’envoyer la proposition.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Proposer un troc</Text>
          <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Fermer">
            <Text style={styles.sheetClose}>Fermer</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.sheetBody}>
          <View style={styles.targetRow}>
            <Image source={{ uri: article.image_principale }} style={styles.targetImage} />
            <View style={styles.targetBody}>
              <Text style={styles.targetKicker}>Vous voulez obtenir</Text>
              <Text style={styles.targetTitle} numberOfLines={2}>{article.titre}</Text>
              <Text style={styles.targetPrice}>{formatFCFA(targetPrice)}</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Choisissez vos articles</Text>
          {loading ? (
            <ActivityIndicator color={Couleurs.red} style={{ marginVertical: 20 }} />
          ) : mine.length === 0 ? (
            <Text style={styles.mineEmpty}>Aucune annonce publiée — publiez d'abord un article à troquer.</Text>
          ) : (
            mine.map((a) => {
              const checked = selected.includes(a.id);
              return (
                <TouchableOpacity key={a.id} style={[styles.mineRow, checked && styles.mineRowActive]} onPress={() => toggle(a.id)} accessibilityRole="checkbox" accessibilityState={{ checked }}>
                  <Image source={{ uri: a.image_principale }} style={styles.mineImage} />
                  <View style={styles.mineBody}>
                    <Text style={styles.mineTitle} numberOfLines={2}>{a.titre}</Text>
                    <Text style={styles.minePrice}>{formatFCFA(a.prix)}</Text>
                  </View>
                  <View style={[styles.checkbox, checked && styles.checkboxActive]}>
                    {checked && <Check size={13} color="#fff" strokeWidth={4} />}
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          <Text style={styles.sectionLabel}>Soulte (FCFA) — optionnelle</Text>
          <TextInput
            style={styles.soulteInput}
            value={soulte}
            onChangeText={setSoulte}
            keyboardType="number-pad"
            placeholder="Ex : 15 000"
            placeholderTextColor={Couleurs.slate}
            accessibilityLabel="Montant de la soulte"
          />
          <Text style={styles.soulteHint}>La soulte est bloquée en séquestre GeniusPay jusqu'à la remise physique (code PIN).</Text>

          <Text style={styles.sectionLabel}>Petit mot au vendeur (facultatif)</Text>
          <TextInput
            style={[styles.soulteInput, styles.messageInput]}
            value={message}
            onChangeText={setMessage}
            placeholder="État réel, emplacement pour la remise…"
            placeholderTextColor={Couleurs.slate}
            multiline
            maxLength={1000}
          />
        </ScrollView>

        <View style={styles.sheetFooter}>
          <View>
            <Text style={styles.footerKicker}>VOTRE OFFRE</Text>
            <Text style={styles.footerTotal}>{formatFCFA(selectedTotal + soulteNum)}</Text>
          </View>
          <TouchableOpacity style={[styles.sendButton, (selected.length === 0 || submitting) && styles.sendButtonDisabled]} disabled={selected.length === 0 || submitting} onPress={submit} accessibilityRole="button">
            {submitting ? <ActivityIndicator color="#fff" /> : <ArrowLeftRight size={17} color="#fff" />}
            <Text style={styles.sendButtonText}>Envoyer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* ============ Modale Checkout (achat) ============ */

function CheckoutModal({ visible, article, onClose }) {
  const toast = useToast();
  const [step, setStep] = useState('recap'); // recap → paying → held
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState(null);

  useEffect(() => {
    if (!visible) {
      setStep('recap');
      setSession(null);
      setBusy(false);
    }
  }, [visible]);

  const prix = Number(article?.prix_actuel ?? article?.prix ?? 0);
  const frais = Math.round(prix * 0.03);
  const total = prix + frais;

  const startPayment = async () => {
    setBusy(true);
    try {
      const { data } = await api.post('/payments/geniuspay/init', { type: 'achat', article_id: article.id });
      setSession(data);
      setStep('paying');
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Impossible d’initialiser le paiement.');
    } finally {
      setBusy(false);
    }
  };

  const simulateWebhook = async () => {
    setBusy(true);
    try {
      await api.post('/webhooks/geniuspay', { reference: session.geniuspay_ref, status: 'success' });
      setStep('held');
      toast.success('Paiement confirmé — fonds bloqués en séquestre.');
    } catch {
      toast.error('Échec de la simulation du paiement.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>{step === 'held' ? 'Paiement sécurisé' : 'Récapitulatif'}</Text>

        {step === 'recap' && (
          <>
            <View style={styles.checkoutRow}>
              <Image source={{ uri: article.image_principale }} style={styles.checkoutImage} />
              <Text style={styles.checkoutTitle} numberOfLines={2}>{article.titre}</Text>
            </View>
            <View style={styles.priceDetails}>
              <View style={styles.priceDetailRow}><Text style={styles.priceDetailLabel}>Prix article</Text><Text style={styles.priceDetailValue}>{formatFCFA(prix)}</Text></View>
              <View style={styles.priceDetailRow}><Text style={styles.priceDetailLabel}>Frais sécurisation (3%)</Text><Text style={styles.priceDetailValue}>{formatFCFA(frais)}</Text></View>
              <View style={styles.divider} />
              <View style={styles.priceDetailRow}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>{formatFCFA(total)}</Text></View>
            </View>
            <View style={styles.escrowHint}>
              <ShieldCheck size={14} color={Couleurs.black} />
              <Text style={styles.escrowHintText}><Text style={{ fontWeight: '700' }}>Séquestre Djassa</Text> — le vendeur ne reçoit rien tant que le code PIN n'est pas validé à la remise.</Text>
            </View>
            <TouchableOpacity style={styles.momoButton} onPress={startPayment} disabled={busy} accessibilityRole="button">
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.momoButtonText}>Payer via Mobile Money</Text>}
            </TouchableOpacity>
            <Text style={styles.momoBrands}>WAVE · ORANGE MONEY · MTN MOMO · MOOV</Text>
          </>
        )}

        {step === 'paying' && session && (
          <>
            {session.mock && (
              <>
                <Text style={styles.mockTitle}>Mode démonstration (sans clés GeniusPay)</Text>
                <Text style={styles.mockBody}>Sur un vrai appareil, vous seriez redirigé vers le widget Mobile Money. Ici, simulez la confirmation :</Text>
                <TouchableOpacity style={styles.momoButton} onPress={simulateWebhook} disabled={busy} accessibilityRole="button">
                  {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.momoButtonText}>Simuler le paiement réussi</Text>}
                </TouchableOpacity>
              </>
            )}
            {!session.mock && (
              <Text style={styles.mockBody}>Ouvrez le widget GeniusPay pour finaliser :{'\n'}{session.payment_url}</Text>
            )}
          </>
        )}

        {step === 'held' && (
          <>
            <View style={styles.heldIcon}><ShieldCheck size={44} color="#047857" /></View>
            <Text style={styles.heldTitle}>Fonds bloqués en séquestre</Text>
            <Text style={styles.mockBody}>Votre code PIN à 4 chiffres vous a été envoyé par e-mail (Mailpit en local). Communiquez-le au vendeur à la remise — c'est lui qui le saisit.</Text>
            <TouchableOpacity style={styles.blackButton} onPress={onClose} accessibilityRole="button">
              <Text style={styles.blackButtonText}>C'est compris</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Couleurs.cloud },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24, backgroundColor: Couleurs.cloud },
  errorTitle: { fontFamily: Polices.jakartaBold, fontSize: 17, color: Couleurs.black },
  errorHint: { fontFamily: Polices.inter, fontSize: 12, color: Couleurs.slate, textAlign: 'center' },
  scroll: { paddingBottom: 24 },

  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 4, paddingBottom: 6 },
  topButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(18,18,18,0.06)' },
  topTitle: { fontFamily: Polices.interSemi, fontSize: 12, color: Couleurs.slate, textTransform: 'uppercase', letterSpacing: 1 },

  gallery: { marginHorizontal: 12, borderRadius: 20, overflow: 'hidden', backgroundColor: Couleurs.cloud },
  hero: { width: '100%', aspectRatio: 1, backgroundColor: Couleurs.mist },
  heroPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  heroLogo: { fontFamily: Polices.jakarta, fontSize: 40, color: 'rgba(18,18,18,0.15)' },
  flashChip: {
    position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Couleurs.red, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7,
  },
  flashChipText: { color: '#fff', fontFamily: Polices.jakartaBold, fontSize: 10, letterSpacing: 0.8 },
  thumbs: { gap: 8, paddingHorizontal: 12, paddingTop: 8 },
  thumb: { width: 56, height: 56, borderRadius: 14, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent', opacity: 0.7 },
  thumbActive: { borderColor: Couleurs.red, opacity: 1 },
  thumbImage: { width: '100%', height: '100%' },

  badgesRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 14, paddingTop: 12, flexWrap: 'wrap' },
  conditionBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  conditionText: { fontFamily: Polices.interSemi, fontSize: 9.5, textTransform: 'uppercase', letterSpacing: 0.6 },
  trocBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: Couleurs.red },
  trocBadgeText: { color: '#fff', fontFamily: Polices.jakartaBold, fontSize: 9, letterSpacing: 0.6 },
  proBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: Couleurs.black },
  proBadgeText: { color: '#fff', fontFamily: Polices.jakartaBold, fontSize: 9, letterSpacing: 0.6 },

  title: { fontFamily: Polices.jakarta, fontSize: 21, lineHeight: 28, color: Couleurs.black, paddingHorizontal: 14, paddingTop: 10 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, paddingHorizontal: 14, paddingTop: 6 },
  price: { fontFamily: Polices.jakarta, fontSize: 27, color: Couleurs.black },
  priceOld: { fontSize: 15, color: Couleurs.slate, textDecorationLine: 'line-through' },
  metaRow: { flexDirection: 'row', gap: 14, paddingHorizontal: 14, paddingTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: Couleurs.slate, fontFamily: Polices.inter },

  sellerCard: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 14, marginTop: 12, padding: 12, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(18,18,18,0.07)', ...Ombres.card },
  sellerBody: { flex: 1, minWidth: 0 },
  sellerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sellerName: { fontFamily: Polices.jakartaBold, fontSize: 12.5, color: Couleurs.black, flexShrink: 1 },
  sellerHint: { fontSize: 9.5, color: Couleurs.slate, marginTop: 1, fontFamily: Polices.inter },
  messageButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: Couleurs.cloud },

  sectionLabel: { fontFamily: Polices.jakartaBold, fontSize: 10, color: Couleurs.slate, textTransform: 'uppercase', letterSpacing: 1.2, paddingHorizontal: 14, marginTop: 16 },
  description: { fontFamily: Polices.inter, fontSize: 13, lineHeight: 19, color: 'rgba(18,18,18,0.85)', paddingHorizontal: 14, marginTop: 4 },
  specsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 14, marginTop: 6 },
  specCell: { backgroundColor: Couleurs.mist, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, minWidth: '45%' },
  specKey: { fontSize: 8, color: Couleurs.slate, letterSpacing: 0.6, fontFamily: Polices.interSemi },
  specValue: { fontSize: 11, fontFamily: Polices.jakartaBold, color: Couleurs.black, marginTop: 2 },

  ctaBar: { position: 'absolute', bottom: 18, left: 0, right: 0, flexDirection: 'row', gap: 10, paddingHorizontal: 14 },
  buyButton: { flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: Couleurs.black, borderRadius: 16, height: 52, ...Ombres.card },
  buyButtonText: { color: '#fff', fontFamily: Polices.jakartaBold, fontSize: 13 },
  trocButton: { width: 52, height: 52, borderRadius: 16, backgroundColor: Couleurs.red, alignItems: 'center', justifyContent: 'center', ...Ombres.pop },
  trocButtonDisabled: { opacity: 0.35 },

  /* Modales (sheets) */
  sheet: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 10 },
  sheetHandle: { alignSelf: 'center', width: 42, height: 4.5, borderRadius: 3, backgroundColor: 'rgba(18,18,18,0.15)', marginBottom: 10 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sheetTitle: { fontFamily: Polices.jakarta, fontSize: 18, color: Couleurs.black },
  sheetClose: { fontFamily: Polices.interSemi, fontSize: 13, color: Couleurs.red },
  sheetBody: { paddingBottom: 12 },

  targetRow: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: Couleurs.mist, borderRadius: 18, padding: 10 },
  targetImage: { width: 64, height: 64, borderRadius: 14, backgroundColor: Couleurs.cloud },
  targetBody: { flex: 1, minWidth: 0 },
  targetKicker: { fontSize: 9, color: Couleurs.slate, textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: Polices.interSemi },
  targetTitle: { fontFamily: Polices.jakartaBold, fontSize: 12, color: Couleurs.black, marginTop: 2 },
  targetPrice: { fontFamily: Polices.jakarta, fontSize: 15, color: Couleurs.red, marginTop: 2 },

  mineEmpty: { fontFamily: Polices.inter, fontSize: 12, color: Couleurs.slate, textAlign: 'center', marginVertical: 16 },
  mineRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, borderWidth: 2, borderColor: 'rgba(18,18,18,0.08)', padding: 8, marginBottom: 8 },
  mineRowActive: { borderColor: Couleurs.red, backgroundColor: 'rgba(225,29,72,0.05)' },
  mineImage: { width: 56, height: 56, borderRadius: 12, backgroundColor: Couleurs.cloud },
  mineBody: { flex: 1, minWidth: 0 },
  mineTitle: { fontFamily: Polices.jakartaBold, fontSize: 11, color: Couleurs.black },
  minePrice: { fontFamily: Polices.jakarta, fontSize: 11.5, color: Couleurs.black, marginTop: 2 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: 'rgba(18,18,18,0.2)', alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { borderColor: Couleurs.red, backgroundColor: Couleurs.red },

  soulteInput: { borderWidth: 1.5, borderColor: 'rgba(18,18,18,0.14)', borderRadius: 14, paddingHorizontal: 14, height: 46, fontFamily: Polices.jakartaBold, fontSize: 14, color: Couleurs.black, marginTop: 6 },
  messageInput: { height: 72, textAlignVertical: 'top', paddingTop: 10, fontFamily: Polices.inter, fontSize: 12 },
  soulteHint: { fontSize: 10, color: Couleurs.slate, marginTop: 4, fontFamily: Polices.inter },

  sheetFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderTopWidth: 1, borderTopColor: 'rgba(18,18,18,0.08)', paddingVertical: 12 },
  footerKicker: { fontSize: 9, color: Couleurs.slate, letterSpacing: 1, fontFamily: Polices.interSemi },
  footerTotal: { fontFamily: Polices.jakarta, fontSize: 16, color: Couleurs.black },
  sendButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Couleurs.red, borderRadius: 14, paddingHorizontal: 18, height: 46, ...Ombres.pop },
  sendButtonDisabled: { opacity: 0.4 },
  sendButtonText: { color: '#fff', fontFamily: Polices.jakartaBold, fontSize: 13 },

  checkoutRow: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: Couleurs.mist, borderRadius: 18, padding: 10, marginTop: 6 },
  checkoutImage: { width: 64, height: 64, borderRadius: 14, backgroundColor: Couleurs.cloud },
  checkoutTitle: { flex: 1, fontFamily: Polices.jakartaBold, fontSize: 12, color: Couleurs.black },
  priceDetails: { marginTop: 14, gap: 6 },
  priceDetailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  priceDetailLabel: { fontFamily: Polices.inter, fontSize: 12.5, color: Couleurs.slate },
  priceDetailValue: { fontFamily: Polices.interSemi, fontSize: 12.5, color: Couleurs.black },
  divider: { borderTopWidth: 1, borderStyle: 'dashed', borderTopColor: 'rgba(18,18,18,0.2)', marginVertical: 6 },
  totalLabel: { fontFamily: Polices.jakarta, fontSize: 14, color: Couleurs.black },
  totalValue: { fontFamily: Polices.jakarta, fontSize: 17, color: Couleurs.red },
  escrowHint: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: Couleurs.cloud, borderRadius: 14, padding: 12, marginTop: 12 },
  escrowHintText: { flex: 1, fontFamily: Polices.inter, fontSize: 10.5, lineHeight: 15, color: Couleurs.slate },
  momoButton: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: Couleurs.red, borderRadius: 16, height: 52, marginTop: 16, ...Ombres.pop },
  momoButtonText: { color: '#fff', fontFamily: Polices.jakartaBold, fontSize: 13 },
  momoBrands: { textAlign: 'center', fontSize: 8, color: Couleurs.slate, letterSpacing: 1.4, marginTop: 12, fontFamily: Polices.interSemi },
  mockTitle: { fontFamily: Polices.jakartaBold, fontSize: 13, color: '#92400E', backgroundColor: '#FFFBEB', borderColor: '#FDE68A', borderWidth: 1, borderRadius: 14, padding: 12, marginTop: 6, overflow: 'hidden' },
  mockBody: { fontFamily: Polices.inter, fontSize: 11.5, lineHeight: 17, color: Couleurs.slate, marginTop: 8 },
  heldIcon: { alignItems: 'center', marginTop: 8 },
  heldTitle: { textAlign: 'center', fontFamily: Polices.jakarta, fontSize: 17, color: Couleurs.black, marginTop: 10 },
  blackButton: { alignItems: 'center', justifyContent: 'center', backgroundColor: Couleurs.black, borderRadius: 14, height: 48, marginTop: 16 },
  blackButtonText: { color: '#fff', fontFamily: Polices.jakartaBold, fontSize: 13 },
});
