import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ArrowLeftRight, BadgeCheck, Heart, MapPin, Store, Zap } from 'lucide-react-native';
import { useState } from 'react';
import { Couleurs, Ombres, Polices } from '../theme';
import { CONDITION_LABELS, formatFCFA } from '../lib/format';

/** Carte produit Djassa (mobile) — badges TROC / VENTE FLASH / BOUTIQUE PRO */
export default function ProductCard({ article, onPress }) {
  const [faved, setFaved] = useState(false);
  const isFlash = Boolean(article.vente_flash && article.prix_flash);
  const trocable = article.est_trocable || ['troc', 'mixte'].includes(article.mode_transaction);
  const prixActuel = Number(article.prix_actuel ?? article.prix);
  const prixOriginal = Number(article.prix);
  const image = article.image_principale ?? article.images?.[0];

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.card} accessibilityRole="button" accessibilityLabel={article.titre}>
      <View style={styles.imageWrap}>
        {image ? (
          <Image source={{ uri: image }} resizeMode="cover" style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderLogo}>Djassa</Text>
            <Text style={styles.placeholderCat}>{article.categorie}</Text>
          </View>
        )}

        <View style={styles.badges}>
          {isFlash && (
            <View style={[styles.badge, styles.badgeFlash]}>
              <Zap size={9} color="#fff" strokeWidth={3.5} />
              <Text style={styles.badgeText}>VENTE FLASH</Text>
            </View>
          )}
          {trocable && (
            <View style={[styles.badge, styles.badgeTroc]}>
              <ArrowLeftRight size={9} color="#fff" strokeWidth={3.5} />
              <Text style={styles.badgeText}>TROC</Text>
            </View>
          )}
          {article.boutique && (
            <View style={[styles.badge, styles.badgePro]}>
              <Store size={9} color="#fff" strokeWidth={3.5} />
              <Text style={styles.badgeText}>BOUTIQUE PRO</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.heart}
          onPress={() => setFaved((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={faved ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          hitSlop={8}
        >
          <Heart size={15} strokeWidth={2.4} fill={faved ? Couleurs.red : 'transparent'} color={faved ? Couleurs.red : Couleurs.black} />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <Text style={styles.condition} numberOfLines={1}>{CONDITION_LABELS[article.condition] ?? article.condition}</Text>
        <Text style={styles.titre} numberOfLines={2}>{article.titre}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatFCFA(prixActuel)}</Text>
          {isFlash && <Text style={styles.priceOld}>{formatFCFA(prixOriginal)}</Text>}
        </View>
        <View style={styles.footer}>
          {article.boutique ? (
            <View style={styles.storeRow}>
              <BadgeCheck size={11} strokeWidth={2.5} color={Couleurs.red} />
              <Text style={styles.storeName} numberOfLines={1}>{article.boutique.nom_boutique}</Text>
            </View>
          ) : (
            <View style={styles.storeRow}>
              <MapPin size={10} color={Couleurs.slate} />
              <Text style={styles.location} numberOfLines={1}>{article.quartier ? `${article.quartier}, ` : ''}{article.ville}</Text>
            </View>
          )}
          {article.prix_negociable && <Text style={styles.nego}>NÉGOCIABLE</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Couleurs.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(18,18,18,0.06)',
    ...Ombres.card,
  },
  imageWrap: { position: 'relative', aspectRatio: 4 / 4.6, backgroundColor: Couleurs.cloud },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: Couleurs.mist },
  placeholderLogo: { fontFamily: Polices.jakarta, fontSize: 22, fontWeight: '800', color: 'rgba(18,18,18,0.18)' },
  placeholderCat: { fontSize: 9, color: Couleurs.slate, textTransform: 'uppercase', letterSpacing: 1.5 },
  badges: { position: 'absolute', left: 6, top: 6, gap: 4, alignItems: 'flex-start' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3.5 },
  badgeTroc: { backgroundColor: Couleurs.red },
  badgeFlash: { backgroundColor: '#C1112E' },
  badgePro: { backgroundColor: Couleurs.black },
  badgeText: { color: '#fff', fontFamily: Polices.jakartaBold, fontSize: 8, letterSpacing: 0.6 },
  heart: {
    position: 'absolute', top: 6, right: 6, borderRadius: 999, padding: 7,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  body: { padding: 9, gap: 2 },
  condition: { fontSize: 8, color: Couleurs.slate, textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: Polices.interSemi },
  titre: { fontFamily: Polices.jakartaBold, fontSize: 11.5, lineHeight: 15, color: Couleurs.black, minHeight: 30 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 2 },
  price: { fontFamily: Polices.jakarta, fontSize: 14, color: Couleurs.black },
  priceOld: { fontSize: 9.5, color: Couleurs.slate, textDecorationLine: 'line-through' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 },
  storeRow: { flexDirection: 'row', alignItems: 'center', gap: 3, flex: 1, minWidth: 0 },
  storeName: { fontSize: 8.5, fontFamily: Polices.interSemi, color: Couleurs.black, flexShrink: 1 },
  location: { fontSize: 8.5, color: Couleurs.slate, flexShrink: 1 },
  nego: { fontSize: 7, fontFamily: Polices.interSemi, color: Couleurs.slate, letterSpacing: 0.6 },
});
