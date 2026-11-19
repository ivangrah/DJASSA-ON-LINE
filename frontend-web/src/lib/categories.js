import {
  Wrench, Smartphone, Shirt, Refrigerator, Laptop, Car, House, LayoutGrid, Sparkles,
} from 'lucide-react';

/** Rayons Djassa Online — Outillage, High-Tech, Mode, etc. (icônes Lucide) */
export const MARKET_CATEGORIES = [
  { key: '', label: 'Tous', Icon: LayoutGrid },
  { key: 'Outillage', label: 'Outillage', Icon: Wrench },
  { key: 'High-Tech', label: 'High-Tech', Icon: Smartphone },
  { key: 'Informatique', label: 'Informatique', Icon: Laptop },
  { key: 'Mode', label: 'Mode', Icon: Shirt },
  { key: 'Électroménager', label: 'Électroménager', Icon: Refrigerator },
  { key: 'Maison', label: 'Maison', Icon: House },
  { key: 'Auto/Moto', label: 'Auto / Moto', Icon: Car },
];

export const PUBLISH_CATEGORIES = MARKET_CATEGORIES.filter((c) => c.key !== '');

export const CONDITION_OPTIONS = [
  { key: 'neuf', label: 'Neuf', hint: 'Boutiques Pro uniquement' },
  { key: 'comme_neuf', label: 'Comme neuf', hint: 'Utilisé < 1 mois, parfait état' },
  { key: 'bon_etat', label: 'Bon état', hint: 'Fonctionnel, traces normales' },
  { key: 'usage', label: 'Usagé', hint: 'Marques visibles, fonctionne' },
];

export const MODE_OPTIONS = [
  { key: 'vente', label: 'Vente', hint: 'Paiement cash Mobile Money', Icon: Sparkles },
  { key: 'troc', label: 'Troc uniquement', hint: 'Échange contre vos articles', Icon: Sparkles },
  { key: 'mixte', label: 'Troc + Cash', hint: 'Troc avec soulte FCFA', Icon: Sparkles },
];
