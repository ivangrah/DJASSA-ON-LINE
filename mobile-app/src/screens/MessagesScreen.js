import { useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MessageCircle, ChevronRight } from 'lucide-react-native';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { formatFCFA, timeAgo } from '../lib/format';
import { Couleurs, Polices } from '../theme';
import Avatar from '../components/Avatar';

/** Inbox Djassa — conversations avec contexte article */
export default function MessagesScreen() {
  const navigation = useNavigation();
  const { isAuthenticated, user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await api.get('/messages/conversations');
      setConversations(data?.conversations ?? []);
    } catch {
      // silencieux
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    let alive = true;
    const poll = async () => {
      try {
        const { data } = await api.get('/messages/conversations');
        if (alive) setConversations(data?.conversations ?? []);
      } catch {
        /* silencieux */
      }
    };
    load();
    const t = setInterval(poll, 8000);
    return () => { alive = false; clearInterval(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.emptyTitle}>Connectez-vous pour négocier</Text>
        <Text style={styles.emptyHint}>Vos propositions de troc et discussions apparaîtront ici.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.kicker}>MESSAGES<Text style={styles.kickerRed}> & NÉGOCIATIONS</Text></Text>
        <Text style={styles.count}>{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</Text>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => `${item.with?.id}-${item.article?.id ?? 'global'}`}
        contentContainerStyle={styles.list}
        ListEmptyComponent={loading ? <ActivityIndicator color={Couleurs.red} style={{ marginTop: 48 }} /> : (
          <View style={styles.centeredState}>
            <MessageCircle size={36} color="rgba(18,18,18,0.18)" />
            <Text style={styles.emptyTitle}>Aucune conversation</Text>
            <Text style={styles.emptyHint}>Proposez un troc depuis une fiche article, ou écrivez à un vendeur.</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('Thread', { partnerId: item.with?.id, articleId: item.article?.id ?? null })}
            accessibilityRole="button"
          >
            <Avatar name={item.with?.nom} size={44} />
            <View style={styles.rowBody}>
              <View style={styles.rowTop}>
                <Text style={styles.rowName} numberOfLines={1}>{item.with?.nom}</Text>
                <Text style={styles.rowTime}>{timeAgo(item.dernier_message?.created_at)}</Text>
              </View>
              {item.article && <Text style={styles.rowArticle} numberOfLines={1}>{item.article.titre}</Text>}
              <View style={styles.rowBottom}>
                <Text style={styles.rowPreview} numberOfLines={1}>{item.dernier_message?.contenu}</Text>
                {item.non_lus > 0 && (
                  <View style={styles.unread}><Text style={styles.unreadText}>{item.non_lus}</Text></View>
                )}
              </View>
            </View>
            {item.article && <Image source={{ uri: item.article.images?.[0] ?? item.article.image_principale }} style={styles.rowThumb} />}
            <ChevronRight size={16} color={Couleurs.slate} />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Couleurs.cloud },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24, backgroundColor: Couleurs.cloud },
  centeredState: { alignItems: 'center', gap: 8, paddingVertical: 48 },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: 'rgba(18,18,18,0.07)' },
  kicker: { fontFamily: Polices.jakarta, fontSize: 16, color: Couleurs.black },
  kickerRed: { color: Couleurs.red },
  count: { fontSize: 11, color: Couleurs.slate, fontFamily: Polices.inter, marginTop: 1 },
  list: { padding: 10, gap: 6 },
  emptyTitle: { fontFamily: Polices.jakartaBold, fontSize: 14, color: Couleurs.black },
  emptyHint: { fontFamily: Polices.inter, fontSize: 11.5, color: Couleurs.slate, textAlign: 'center', paddingHorizontal: 32 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 18, padding: 10, borderWidth: 1, borderColor: 'rgba(18,18,18,0.06)' },
  rowBody: { flex: 1, minWidth: 0 },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  rowName: { fontFamily: Polices.jakartaBold, fontSize: 12, color: Couleurs.black, flexShrink: 1 },
  rowTime: { fontSize: 9, color: Couleurs.slate, fontFamily: Polices.inter },
  rowArticle: { fontSize: 9.5, fontFamily: Polices.interSemi, color: Couleurs.red, marginTop: 1 },
  rowBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 2 },
  rowPreview: { flex: 1, fontSize: 10.5, color: Couleurs.slate, fontFamily: Polices.inter },
  unread: { minWidth: 19, height: 19, borderRadius: 10, backgroundColor: Couleurs.red, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  unreadText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  rowThumb: { width: 44, height: 44, borderRadius: 12, backgroundColor: Couleurs.cloud },
});
