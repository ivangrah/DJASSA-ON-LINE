import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, SafeAreaView,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  ArrowLeft, ArrowLeftRight, BadgeCheck, Check, Send, Tag, X, Zap,
} from 'lucide-react-native';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatFCFA, timeAgo } from '../lib/format';
import { Couleurs, Polices, Ombres } from '../theme';
import Avatar from '../components/Avatar';

export default function ThreadScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { partnerId, articleId } = route.params;
  const { user } = useAuth();
  const toast = useToast();
  const flatListRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [offerMode, setOfferMode] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');

  const [article, setArticle] = useState(null);

  useEffect(() => {
    if (!articleId) return;
    api.get(`/products/${articleId}`).then(({ data }) => setArticle(data.data)).catch(() => {});
  }, [articleId]);

  const load = async () => {
    try {
      const { data } = await api.get('/messages/thread', { params: { with: partnerId, article_id: articleId || undefined } });
      setMessages(data?.data ?? []);
    } catch {
      /* silencieux */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const { data } = await api.get('/messages/thread', { params: { with: partnerId, article_id: articleId || undefined } });
        if (alive) setMessages(data?.data ?? []);
      } catch {
        /* silencieux */
      }
    };
    load();
    const t = setInterval(poll, 4000);
    return () => { alive = false; clearInterval(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId, articleId]);

  const send = async (payload) => {
    try {
      await api.post('/messages', payload);
      setText('');
      setOfferAmount('');
      setOfferMode(false);
      load();
    } catch {
      toast.error('Message non envoyé.');
    }
  };

  const submitText = () => {
    const value = text.trim();
    if (!value) return;
    send({ destinataire_id: partnerId, article_id: articleId || undefined, type: 'texte', contenu: value });
  };

  const submitOffer = () => {
    const amount = Number(offerAmount);
    if (!amount || amount <= 0) return;
    send({
      destinataire_id: partnerId,
      article_id: articleId || undefined,
      type: 'offre_prix',
      contenu: `Offre de prix : ${formatFCFA(amount)}`,
      payload: { montant_fcfa: amount },
    });
  };

  const trocable = article && (article.est_trocable || ['troc', 'mixte'].includes(article.mode_transaction));

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        {/* En-tête */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Retour">
            <ArrowLeft size={20} color={Couleurs.black} />
          </TouchableOpacity>
          <View style={styles.headerBody}>
            <View style={styles.headerNameRow}>
              <Avatar name={partnerId?.slice(0, 2).toUpperCase()} size={34} />
              <View>
                <Text style={styles.headerName}>Négociation</Text>
                {article && <Text style={styles.headerArticle} numberOfLines={1}>{article.titre}</Text>}
              </View>
            </View>
          </View>
          {article && trocable && (
            <TouchableOpacity style={styles.trocButton} onPress={() => navigation.navigate('Article', { id: article.id })} accessibilityRole="button" accessibilityLabel="Ouvrir l'article">
              <ArrowLeftRight size={16} color="#fff" />
              <Text style={styles.trocButtonText}>Troc</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => (
            <MessageRow message={item} myId={user?.id} />
          )}
          ListEmptyComponent={loading ? <ActivityIndicator color={Couleurs.red} style={{ marginTop: 40 }} /> : null}
        />

        {/* Bandeau offre de prix */}
        {offerMode && (
          <View style={styles.offerBar}>
            <Tag size={15} color="#92400E" />
            <TextInput
              autoFocus
              style={styles.offerInput}
              value={offerAmount}
              onChangeText={setOfferAmount}
              onSubmitEditing={submitOffer}
              keyboardType="number-pad"
              placeholder="Montant en FCFA"
              placeholderTextColor="#92400E"
            />
            <TouchableOpacity onPress={submitOffer} style={styles.offerSend} accessibilityRole="button" accessibilityLabel="Envoyer l'offre">
              <Check size={16} color="#fff" strokeWidth={3} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setOfferMode(false)} hitSlop={6} accessibilityLabel="Annuler">
              <X size={17} color="#92400E" />
            </TouchableOpacity>
          </View>
        )}

        {/* Composer */}
        <View style={styles.composer}>
          <TouchableOpacity onPress={() => setOfferMode((v) => !v)} style={styles.tagButton} accessibilityRole="button" accessibilityLabel="Faire une offre de prix">
            <Tag size={19} color={Couleurs.slate} />
          </TouchableOpacity>
          <TextInput
            style={styles.composerInput}
            value={text}
            onChangeText={setText}
            onSubmitEditing={submitText}
            placeholder="Écrire un message…"
            placeholderTextColor={Couleurs.slate}
            returnKeyType="send"
            accessibilityLabel="Votre message"
          />
          <TouchableOpacity onPress={submitText} style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]} disabled={!text.trim()} accessibilityRole="button" accessibilityLabel="Envoyer">
            <Send size={17} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const BARTER_STATUS_STYLES = {
  pending: { label: 'En attente', bg: '#FFFBEB', text: '#92400E' },
  accepted: { label: 'Acceptée', bg: '#ECFDF5', text: '#047857' },
  countered: { label: 'Contre-offre', bg: '#F0F9FF', text: '#0369A1' },
  rejected: { label: 'Refusée', bg: '#FEF2F2', text: '#B91C1C' },
  completed: { label: 'Terminée', bg: '#121212', text: '#fff' },
  cancelled: { label: 'Annulée', bg: '#F5F5F5', text: '#64748B' },
};

function MessageRow({ message, myId }) {
  const mine = message.expediteur_id === myId;

  if (message.type === 'systeme') {
    return (
      <View style={styles.systemRow}>
        <Text style={styles.systemText}>{message.contenu}</Text>
      </View>
    );
  }

  if (message.type === 'carte_troc') {
    return <TrocCard message={message} myId={myId} />;
  }

  if (message.type === 'offre_prix') {
    return (
      <View style={[styles.offerCard, mine ? styles.offerCardMine : styles.offerCardTheirs]}>
        <Text style={styles.offerKicker}>OFFRE DE PRIX FORMELLE</Text>
        <Text style={styles.offerAmount}>{formatFCFA(message.payload?.montant_fcfa ?? 0)}</Text>
        <Text style={styles.offerHint}>{mine ? 'En attente de la réponse du vendeur.' : 'Le vendeur peut accepter ou décliner depuis sa fiche.'}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
        <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{message.contenu}</Text>
        <Text style={[styles.bubbleTime, mine && styles.bubbleTimeMine]}>{timeAgo(message.created_at)}</Text>
      </View>
    </View>
  );
}

/** Carte de troc interactive dans le fil (accepter / refuser / contre-offre) */
function TrocCard({ message, myId }) {
  const toast = useToast();
  const { user } = useAuth();
  const [offer, setOffer] = useState(null);
  const [counter, setCounter] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!message.offre_troc_id) return;
    let alive = true;
    const load = async () => {
      try {
        const { data } = await api.get(`/barter-offers/${message.offre_troc_id}`);
        if (alive) setOffer(data?.data ?? null);
      } catch {
        /* silencieux */
      }
    };
    load();
    const t = setInterval(load, 5000);
    return () => { alive = false; clearInterval(t); };
  }, [message.offre_troc_id]);

  const payload = message.payload ?? {};
  const status = offer?.statut ?? payload.statut_offre ?? 'pending';
  const statusMeta = BARTER_STATUS_STYLES[status] ?? BARTER_STATUS_STYLES.pending;
  const iAmSeller = offer ? offer.vendeur?.id === user?.id : false;
  const canAct = iAmSeller && ['pending', 'countered'].includes(status);
  const soulte = offer?.soulte_effective ?? payload.montant_soulte_fcfa ?? 0;

  const respond = async (action, montant) => {
    setPending(true);
    try {
      await api.patch(`/barter-offers/${message.offre_troc_id}/respond`, {
        action,
        montant_contre_offre_fcfa: montant,
      });
      toast.success(action === 'accept' ? 'Offre acceptée — articles verrouillés.' : action === 'reject' ? 'Offre refusée.' : 'Contre-offre envoyée.');
      const { data } = await api.get(`/barter-offers/${message.offre_troc_id}`);
      setOffer(data?.data ?? null);
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Action impossible.');
    } finally {
      setPending(false);
    }
  };

  return (
    <View style={styles.trocCard}>
      <View style={styles.trocHeader}>
        <ArrowLeftRight size={13} color="#fff" />
        <Text style={styles.trocKicker}>PROPOSITION DE TROC</Text>
        <View style={[styles.statusPill, { backgroundColor: statusMeta.bg }]}>
          <Text style={[styles.statusPillText, { color: statusMeta.text }]}>{statusMeta.label.toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.trocBody}>
        {(payload.articles_offerts ?? []).map((a, i) => (
          <View key={i} style={styles.trocItem}>
            <Zap size={10} color={Couleurs.red} />
            <Text style={styles.trocItemText}>{a.titre ?? a}</Text>
          </View>
        ))}
        <View style={styles.soulteRow}>
          <View>
            <Text style={styles.soulteLabel}>SOULTE{Number(soulte) > 0 ? ' (TROC MIXTE)' : ' (TROC PUR)'}</Text>
            <Text style={styles.soulteValue}>{formatFCFA(soulte)}</Text>
          </View>
        </View>

        {canAct && (
          <>
            <View style={styles.trocActions}>
              <TouchableOpacity style={styles.trocAccept} disabled={pending} onPress={() => respond('accept')} accessibilityRole="button">
                <Check size={15} color="#fff" strokeWidth={3} />
                <Text style={styles.trocAcceptText}>Accepter</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.trocReject} disabled={pending} onPress={() => respond('reject')} accessibilityRole="button">
                <X size={15} color={Couleurs.red} strokeWidth={3} />
                <Text style={styles.trocRejectText}>Refuser</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.counterRow}>
              <TextInput
                style={styles.counterInput}
                value={counter}
                onChangeText={setCounter}
                keyboardType="number-pad"
                placeholder="Contre-offre FCFA…"
                placeholderTextColor={Couleurs.slate}
              />
              <TouchableOpacity style={[styles.counterButton, !counter && styles.sendButtonDisabled]} disabled={!counter || pending} onPress={() => respond('counter', Number(counter))} accessibilityRole="button">
                <Text style={styles.counterButtonText}>Contre-offrir</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Couleurs.mist },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: 'rgba(18,18,18,0.07)',
    paddingHorizontal: 10, paddingVertical: 8,
  },
  backButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: Couleurs.cloud },
  headerBody: { flex: 1, minWidth: 0 },
  headerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerName: { fontFamily: Polices.jakartaBold, fontSize: 12, color: Couleurs.black },
  headerArticle: { fontSize: 9, fontFamily: Polices.interSemi, color: Couleurs.red, marginTop: 1 },
  trocButton: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Couleurs.red, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 8 },
  trocButtonText: { color: '#fff', fontFamily: Polices.jakartaBold, fontSize: 10 },

  messagesList: { padding: 12, gap: 8, paddingBottom: 20 },

  systemRow: { alignItems: 'center', marginVertical: 4 },
  systemText: { backgroundColor: 'rgba(18,18,18,0.85)', color: 'rgba(255,255,255,0.9)', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, fontSize: 9.5, fontFamily: Polices.interMedium, maxWidth: '88%', textAlign: 'center', overflow: 'hidden' },

  bubbleRow: { alignItems: 'flex-start', marginVertical: 1 },
  bubbleRowMine: { alignItems: 'flex-end' },
  bubble: { maxWidth: '78%', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8 },
  bubbleMine: { backgroundColor: Couleurs.black, borderBottomRightRadius: 6 },
  bubbleTheirs: { backgroundColor: '#fff', borderBottomLeftRadius: 6, borderWidth: 1, borderColor: 'rgba(18,18,18,0.07)' },
  bubbleText: { fontFamily: Polices.inter, fontSize: 12.5, lineHeight: 17, color: Couleurs.black },
  bubbleTextMine: { color: '#fff' },
  bubbleTime: { fontSize: 8, color: Couleurs.slate, marginTop: 3, fontFamily: Polices.inter },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.5)' },

  offerCard: { maxWidth: '78%', borderRadius: 18, borderWidth: 2, paddingHorizontal: 14, paddingVertical: 10, marginVertical: 2 },
  offerCardMine: { alignSelf: 'flex-end', borderColor: Couleurs.black, backgroundColor: Couleurs.black },
  offerCardTheirs: { alignSelf: 'flex-start', borderColor: Couleurs.red, backgroundColor: '#fff' },
  offerKicker: { fontSize: 8, fontFamily: Polices.jakartaBold, letterSpacing: 1.2, color: 'rgba(255,255,255,0.65)' },
  offerAmount: { fontFamily: Polices.jakarta, fontSize: 19, color: '#fff', marginTop: 2 },
  offerHint: { fontSize: 8, color: 'rgba(255,255,255,0.5)', marginTop: 3, fontFamily: Polices.inter },

  trocCard: { maxWidth: '92%', alignSelf: 'flex-start', borderRadius: 18, borderWidth: 2, borderColor: Couleurs.red, backgroundColor: '#fff', overflow: 'hidden', marginVertical: 2, ...Ombres.card },
  trocHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Couleurs.red, paddingHorizontal: 12, paddingVertical: 6 },
  trocKicker: { fontFamily: Polices.jakartaBold, fontSize: 9, letterSpacing: 1.3, color: '#fff' },
  statusPill: { marginLeft: 'auto', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  statusPillText: { fontSize: 8, fontFamily: Polices.jakartaBold, letterSpacing: 0.8 },
  trocBody: { padding: 10, gap: 4 },
  trocItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  trocItemText: { fontFamily: Polices.interMedium, fontSize: 10.5, color: Couleurs.black },
  soulteRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Couleurs.cloud, borderRadius: 12, padding: 9, marginTop: 4 },
  soulteLabel: { fontSize: 8, color: Couleurs.slate, letterSpacing: 0.6, fontFamily: Polices.interSemi },
  soulteValue: { fontFamily: Polices.jakarta, fontSize: 15, color: Couleurs.black, marginTop: 1 },
  trocActions: { flexDirection: 'row', gap: 8, marginTop: 6 },
  trocAccept: { flex: 1, flexDirection: 'row', gap: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: Couleurs.black, borderRadius: 12, height: 40 },
  trocAcceptText: { color: '#fff', fontFamily: Polices.jakartaBold, fontSize: 11 },
  trocReject: { flex: 1, flexDirection: 'row', gap: 5, alignItems: 'center', justifyContent: 'center', borderRadius: 12, height: 40, borderWidth: 1.5, borderColor: Couleurs.red },
  trocRejectText: { color: Couleurs.red, fontFamily: Polices.jakartaBold, fontSize: 11 },
  counterRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  counterInput: { flex: 1, height: 40, borderWidth: 1.5, borderColor: 'rgba(18,18,18,0.14)', borderRadius: 12, paddingHorizontal: 10, fontFamily: Polices.inter, fontSize: 11, color: Couleurs.black },
  counterButton: { justifyContent: 'center', backgroundColor: Couleurs.red, borderRadius: 12, paddingHorizontal: 12 },
  counterButtonText: { color: '#fff', fontFamily: Polices.jakartaBold, fontSize: 10.5 },

  offerBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFBEB', borderTopWidth: 1, borderTopColor: '#FDE68A', paddingHorizontal: 12, paddingVertical: 8 },
  offerInput: { flex: 1, height: 36, backgroundColor: '#fff', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 10, paddingHorizontal: 10, fontFamily: Polices.inter, fontSize: 12, color: '#92400E' },
  offerSend: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#92400E', alignItems: 'center', justifyContent: 'center' },

  composer: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: 'rgba(18,18,18,0.08)', paddingHorizontal: 10, paddingVertical: 8 },
  tagButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  composerInput: { flex: 1, height: 42, backgroundColor: Couleurs.cloud, borderRadius: 21, paddingHorizontal: 14, fontFamily: Polices.inter, fontSize: 12.5, color: Couleurs.black },
  sendButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: Couleurs.red, alignItems: 'center', justifyContent: 'center' },
  sendButtonDisabled: { opacity: 0.35 },
});
