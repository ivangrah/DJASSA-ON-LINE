/** Helpers FCFA / dates — version mobile */

const FCFA = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

export function formatFCFA(value) {
  return `${FCFA.format(Math.round(Number(value ?? 0)))} FCFA`;
}

export function formatNumberFR(value) {
  return FCFA.format(Math.round(Number(value ?? 0)));
}

export function timeAgo(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - then);
  const min = 60000, h = 3600000, d = 86400000;
  if (diff < min) return "à l'instant";
  if (diff < h) return `il y a ${Math.floor(diff / min)} min`;
  if (diff < d) return `il y a ${Math.floor(diff / h)} h`;
  if (diff < 7 * d) return `il y a ${Math.floor(diff / d)} j`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export const CONDITION_LABELS = {
  neuf: 'Neuf',
  comme_neuf: 'Comme neuf',
  bon_etat: 'Bon état',
  usage: 'Usagé',
};

export const CONDITION_STYLES = {
  neuf: { bg: '#ECFDF5', text: '#047857' },
  comme_neuf: { bg: '#F0F9FF', text: '#0369A1' },
  bon_etat: { bg: '#FFFBEB', text: '#92400E' },
  usage: { bg: '#F5F5F5', text: '#64748B' },
};

export const CATEGORIES = [
  { key: '', label: 'Tous' },
  { key: 'Outillage', label: 'Outillage' },
  { key: 'High-Tech', label: 'High-Tech' },
  { key: 'Mode', label: 'Mode' },
  { key: 'Électroménager', label: 'Électroménager' },
  { key: 'Maison', label: 'Maison' },
  { key: 'Auto/Moto', label: 'Auto/Moto' },
];

export function flashCountdownLabel(iso) {
  if (!iso) return 'Terminée';
  const total = Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, '0');
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export const ARTICLE_STATUS = {
  published: { label: 'En ligne', bg: '#ECFDF5', text: '#047857' },
  reserved: { label: 'Réservé', bg: '#FFFBEB', text: '#92400E' },
  sold: { label: 'Vendu', bg: '#121212', text: '#FFFFFF' },
  archived: { label: 'Archivé', bg: '#F5F5F5', text: '#64748B' },
  draft: { label: 'Brouillon', bg: '#F5F5F5', text: '#64748B' },
};

export const ESCROW_STATUS = {
  initiated: { label: 'Initiée', bg: '#F0F9FF', text: '#0369A1' },
  held: { label: 'Fonds bloqués', bg: '#FFFBEB', text: '#92400E' },
  released: { label: 'Fonds libérés', bg: '#ECFDF5', text: '#047857' },
  failed: { label: 'Échec', bg: '#FEF2F2', text: '#B91C1C' },
  refunded: { label: 'Remboursée', bg: '#F5F5F5', text: '#64748B' },
};
