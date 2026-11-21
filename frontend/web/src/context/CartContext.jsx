import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'djassa_cart';
const CartContext = createContext(null);

function readCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toLine(article) {
  return {
    id: article.id,
    titre: article.titre,
    image: article.image_principale ?? article.images?.[0] ?? null,
    prix: Number(article.prix_actuel ?? article.prix ?? 0),
    categorie: article.categorie ?? null,
    ville: article.ville ?? null,
    quartier: article.quartier ?? null,
    boutique: article.boutique?.nom_boutique ?? null,
    vendeurId: article.proprietaire?.id ?? article.utilisateur_id ?? null,
  };
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* quota / private mode */ }
  }, [items]);

  // 1 article = 1 ligne (le backend ne gère pas la quantité : 1 transaction = 1 article)
  const add = useCallback((article) => {
    if (!article?.id || items.some((i) => i.id === article.id)) return false;
    setItems((prev) => [...prev, toLine(article)]);
    return true;
  }, [items]);

  const remove = useCallback((id) => setItems((prev) => prev.filter((i) => i.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);
  const has = useCallback((id) => items.some((i) => i.id === id), [items]);

  const count = items.length;
  const subtotal = items.reduce((sum, i) => sum + Number(i.prix || 0), 0);
  const fees = Math.round(subtotal * 0.03); // estimation — l'API fait foi
  const total = subtotal + fees;

  const value = useMemo(() => ({
    items, count, subtotal, fees, total, add, remove, clear, has,
  }), [items, count, subtotal, fees, total, add, remove, clear, has]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart doit être utilisé dans <CartProvider>');
  return ctx;
}
