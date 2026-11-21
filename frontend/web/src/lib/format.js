/** Helpers FCFA & dates — Djassa Online */

const FCFA = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

export function formatFCFA(value) {
  const n = Number(value ?? 0);
  return `${FCFA.format(Math.round(n))} FCFA`;
}

/** Prix court : 85 000 → "85 000" (unité affichée à part si besoin) */
export function formatNumberFR(value) {
  return FCFA.format(Math.round(Number(value ?? 0)));
}

export function timeAgo(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - then);
  const min = 60_000, h = 3_600_000, d = 86_400_000;
  if (diff < min) return "à l'instant";
  if (diff < h) return `il y a ${Math.floor(diff / min)} min`;
  if (diff < d) return `il y a ${Math.floor(diff / h)} h`;
  if (diff < 7 * d) return `il y a ${Math.floor(diff / d)} j`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export function flashCountdown(iso) {
  if (!iso) return { ended: true, label: 'Terminée', totalSeconds: 0 };
  const totalSeconds = Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (v) => String(v).padStart(2, '0');
  return {
    ended: totalSeconds <= 0,
    totalSeconds,
    label: `${pad(h)}:${pad(m)}:${pad(s)}`,
  };
}

export const CONDITION_LABELS = {
  neuf: 'Neuf',
  comme_neuf: 'Comme neuf',
  bon_etat: 'Bon état',
  usage: 'Usagé',
};

export const CONDITION_STYLES = {
  neuf: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  comme_neuf: 'bg-sky-50 text-sky-700 border-sky-200',
  bon_etat: 'bg-amber-50 text-amber-800 border-amber-200',
  usage: 'bg-djassa-cloud text-djassa-black/70 border-djassa-gray/40',
};

export const ARTICLE_STATUS = {
  draft: { label: 'Brouillon', cls: 'bg-djassa-cloud text-djassa-black/70' },
  published: { label: 'En ligne', cls: 'bg-emerald-50 text-emerald-700' },
  reserved: { label: 'Réservé', cls: 'bg-amber-50 text-amber-800' },
  sold: { label: 'Vendu', cls: 'bg-djassa-black text-white' },
  archived: { label: 'Archivé', cls: 'bg-djassa-cloud text-djassa-black/70' },
};

export const ESCROW_STATUS = {
  initiated: { label: 'Initiée', cls: 'bg-sky-50 text-sky-700' },
  held: { label: 'Fonds bloqués', cls: 'bg-amber-50 text-amber-800' },
  released: { label: 'Fonds libérés', cls: 'bg-emerald-50 text-emerald-700' },
  refunded: { label: 'Remboursée', cls: 'bg-djassa-cloud text-djassa-black/70' },
  failed: { label: 'Échec', cls: 'bg-red-50 text-red-700' },
};

export const BARTER_STATUS = {
  pending: { label: 'En attente', cls: 'bg-amber-50 text-amber-800' },
  accepted: { label: 'Acceptée', cls: 'bg-emerald-50 text-emerald-700' },
  rejected: { label: 'Refusée', cls: 'bg-red-50 text-red-700' },
  countered: { label: 'Contre-offre', cls: 'bg-sky-50 text-sky-700' },
  completed: { label: 'Terminée', cls: 'bg-djassa-black text-white' },
  cancelled: { label: 'Annulée', cls: 'bg-djassa-cloud text-djassa-black/70' },
};
