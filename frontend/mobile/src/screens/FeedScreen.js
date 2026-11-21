import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, FlatList, RefreshControl, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronRight, LayoutGrid, Search, Zap, Wrench, Smartphone, Shirt, Refrigerator, House, Car, Clock } from 'lucide-react-native';
import { api } from '../api';
import { CATEGORIES, flashCountdownLabel, formatFCFA } from '../lib/format';
import { Couleurs, Polices, Ombres } from '../theme';
import ProductCard from '../components/ProductCard';
import FlashCountdown from '../components/FlashCountdown';

const TABS = [
  { key: 'tout', label: 'Tout' },
  { key: 'occ', label: 'Seconde Main & Troc' },
  { key: 'neuf', label: 'Boutiques Neuves' },
];

const CATEGORY_ICONS = { '': LayoutGrid, Outillage: Wrench, 'High-Tech': Smartphone, Mode: Shirt, Électroménager: Refrigerator, Maison: House, 'Auto/Moto': Car };

export default function FeedScreen() {
  const navigation = useNavigation();
  const [tab, setTab] = useState('tout');
  const [category, setCategory] = useState('');
  const [query, setQuery] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [articles, setArticles] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [flash, setFlash] = useState([]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setPage(1);
    setArticles([]);
  }, [tab, category, debouncedQ]);

  const buildParams = useCallback((p) => {
    const params = { per_page: 10, page: p, sort: 'latest' };
    if (tab === 'occ') params.marche = 'occ';
    if (tab === 'neuf') params.marche = 'neuf';
    if (category) params.category = category;
    if (debouncedQ) params.q = debouncedQ;
    return params;
  }, [tab, category, debouncedQ]);

  const load = useCallback(async (pageToLoad, replace) => {
    try {
      const { data } = await api.get('/products', { params: buildParams(pageToLoad) });
      setMeta(data.meta);
      setArticles((prev) => (replace || pageToLoad === 1 ? data.data : [...prev, ...data.data]));
    } catch (e) {
      // l'écran garde l'état courant ; les toasts d'erreur globaux suffisent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [buildParams]);

  useEffect(() => {
    setLoading(true);
    load(1, true);
  }, [load]);

  useEffect(() => {
    api.get('/products/flash').then(({ data }) => setFlash(data?.data ?? [])).catch(() => {});
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    load(1, true);
  };

  const loadMore = () => {
    if (!meta || loading || page >= (meta.last_page ?? 1)) return;
    const next = page + 1;
    setPage(next);
    load(next, false);
  };

  const openArticle = (article) => navigation.navigate('Article', { id: article.id });

  const renderHeader = () => (
    <View>
      {/* En-tête noir */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Text style={styles.logo}>Djassa<Text style={styles.logoRed}> Online</Text></Text>
          <TouchableOpacity style={styles.souhaitLink} onPress={() => navigation.navigate('Souhaits')} accessibilityRole="button">
            <Text style={styles.souhaitLinkText}>Publier un souhait</Text>
            <ChevronRight size={13} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>

        <Text style={styles.heroLine}>Le bon plan <Text style={styles.heroRed}>près de chez vous</Text></Text>

        {/* Recherche */}
        <View style={styles.searchBar}>
          <Search size={16} color="rgba(255,255,255,0.6)" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher sur le Djassa…"
            placeholderTextColor="rgba(255,255,255,0.5)"
            style={styles.searchInput}
            returnKeyType="search"
            accessibilityLabel="Rechercher un article"
          />
        </View>

        {/* Onglets marché */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          {TABS.map((t) => (
            <TouchableOpacity key={t.key} onPress={() => setTab(t.key)} style={[styles.marketTab, tab === t.key && styles.marketTabActive]} accessibilityRole="tab" accessibilityState={{ selected: tab === t.key }}>
              <Text style={[styles.marketTabText, tab === t.key && styles.marketTabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Rayons */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catsRow}>
          {CATEGORIES.map(({ key, label }) => {
            const Icon = CATEGORY_ICONS[key] ?? LayoutGrid;
            const active = category === key;
            return (
              <TouchableOpacity key={key || 'all'} onPress={() => setCategory(key)} style={[styles.catChip, active && styles.catChipActive]} accessibilityRole="button">
                <Icon size={12} color={active ? Couleurs.black : 'rgba(255,255,255,0.75)'} strokeWidth={2.2} />
                <Text style={[styles.catChipText, active && styles.catChipTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Ventes Flash */}
      {flash.length > 0 && !debouncedQ && (
        <View style={styles.flashBanner}>
          <View style={styles.flashIcon}>
            <Zap size={19} color="#FDE68A" fill="#FDE68A" />
          </View>
          <View style={styles.flashBody}>
            <Text style={styles.flashKicker}>VENTES FLASH BOUTIQUES</Text>
            <Text style={styles.flashTitle} numberOfLines={1}>{flash[0].titre}</Text>
            <View style={styles.flashPriceRow}>
              <Text style={styles.flashPrice}>{formatFCFA(flash[0].prix_flash)}</Text>
              <Text style={styles.flashPriceOld}>{formatFCFA(flash[0].prix)}</Text>
            </View>
          </View>
          <View style={styles.flashRight}>
            <View style={styles.flashTimer}>
              <Clock size={10} color="#FDE68A" strokeWidth={3} />
              <FlashCountdown iso={flash[0].flash_fin_at} />
            </View>
            <TouchableOpacity onPress={() => openArticle(flash[0])} accessibilityRole="button">
              <Text style={styles.flashCta}>J'EN PROFITE</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={articles}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={Couleurs.red} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Rien ici pour l'instant</Text>
              <Text style={styles.emptyHint}>Soyez le premier à publier dans ce rayon.</Text>
            </View>
          )
        }
        ListFooterComponent={
          articles.length > 0 && meta && page < (meta.last_page ?? 1) ? (
            <TouchableOpacity onPress={loadMore} style={styles.loadMore} accessibilityRole="button">
              {loading ? <ActivityIndicator color={Couleurs.red} /> : <Text style={styles.loadMoreText}>Charger plus d'annonces</Text>}
            </TouchableOpacity>
          ) : <View style={{ height: 20 }} />
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Couleurs.red} />}
        onEndReachedThreshold={0.4}
        onEndReached={loadMore}
        renderItem={({ item }) => (
          <View style={styles.gridCell}>
            <ProductCard article={item} onPress={() => openArticle(item)} />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Couleurs.black },
  header: { backgroundColor: Couleurs.black, paddingHorizontal: 14, paddingTop: 6, paddingBottom: 14 },
  logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { fontFamily: Polices.jakarta, fontSize: 18, color: '#fff' },
  logoRed: { color: Couleurs.red },
  souhaitLink: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  souhaitLinkText: { color: 'rgba(255,255,255,0.7)', fontSize: 10.5, fontFamily: Polices.interSemi },
  heroLine: { fontFamily: Polices.jakarta, fontSize: 20, color: '#fff', marginTop: 8 },
  heroRed: { color: Couleurs.red },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 999, paddingHorizontal: 14, height: 40, marginTop: 10,
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 12.5, fontFamily: Polices.inter },
  tabsRow: { gap: 6, paddingTop: 12, paddingBottom: 2 },
  marketTab: { borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.08)' },
  marketTabActive: { backgroundColor: Couleurs.red, ...Ombres.pop },
  marketTabText: { color: 'rgba(255,255,255,0.75)', fontFamily: Polices.jakartaBold, fontSize: 10.5 },
  marketTabTextActive: { color: '#fff' },
  catsRow: { gap: 6, paddingTop: 10 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.06)' },
  catChipActive: { backgroundColor: '#fff' },
  catChipText: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontFamily: Polices.interMedium },
  catChipTextActive: { color: Couleurs.black },

  flashBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 12, marginTop: 12, borderRadius: 18, padding: 10,
    backgroundColor: '#C1112E', borderWidth: 1, borderColor: '#E11D48',
  },
  flashIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  flashBody: { flex: 1, minWidth: 0 },
  flashKicker: { color: 'rgba(255,255,255,0.8)', fontSize: 7.5, fontFamily: Polices.jakartaBold, letterSpacing: 1.4 },
  flashTitle: { color: '#fff', fontFamily: Polices.jakartaBold, fontSize: 11, marginTop: 1 },
  flashPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 1 },
  flashPrice: { color: '#fff', fontFamily: Polices.jakarta, fontSize: 13 },
  flashPriceOld: { color: 'rgba(255,255,255,0.55)', fontSize: 9, textDecorationLine: 'line-through' },
  flashRight: { alignItems: 'flex-end', gap: 4 },
  flashTimer: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  flashCta: { color: '#fff', fontSize: 7.5, fontFamily: Polices.jakartaBold, letterSpacing: 1, textDecorationLine: 'underline' },

  gridContent: { paddingHorizontal: 10, paddingTop: 12, backgroundColor: Couleurs.cloud },
  gridRow: { gap: 10 },
  gridCell: { flex: 1, marginBottom: 10 },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontFamily: Polices.jakartaBold, fontSize: 15, color: Couleurs.black },
  emptyHint: { fontFamily: Polices.inter, fontSize: 12, color: Couleurs.slate, marginTop: 4 },
  loadMore: { alignItems: 'center', paddingVertical: 14 },
  loadMoreText: { fontFamily: Polices.interSemi, fontSize: 12, color: Couleurs.black, textDecorationLine: 'underline' },
});
