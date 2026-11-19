import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Banknote, Check, ChevronLeft, ChevronRight, CloudUpload, Camera, Image as ImageIcon,
  ArrowLeftRight, BadgeCheck, Trash2, Zap,
} from 'lucide-react';
import { gsap } from 'gsap';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatFCFA } from '../lib/format';
import { PUBLISH_CATEGORIES, CONDITION_OPTIONS } from '../lib/categories';
import { Spinner } from '../components/ui';

const STEPS = ['Photos', 'Détails & État', 'Mode de vente'];

/** Compression client → WebP ≤ ~350 Ko (guide ressources §3) via canvas. */
async function compressImage(file, maxSide = 1440, quality = 0.82) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' })) : reject(new Error('Compression impossible'))),
      'image/webp',
      quality
    );
  });
}

export default function Publish() {
  const navigate = useNavigate();
  const { isAuthenticated, isPro, boutique } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);
  const successRef = useRef(null);

  const [step, setStep] = useState(0);
  const [images, setImages] = useState([]); // {file, url}
  const [compressing, setCompressing] = useState(false);
  const [form, setForm] = useState({
    titre: '', categorie: 'Outillage', description: '', condition: 'bon_etat',
    mode_transaction: 'vente', prix: '', prix_negociable: false, stock: 1,
    ville: 'Abidjan', quartier: '', specs: [{ key: '', value: '' }],
  });
  const [submitting, setSubmitting] = useState(false);
  const [publishedId, setPublishedId] = useState(null);

  const isProVerified = Boolean(isPro && boutique?.verifie);
  const isNeufLocked = form.condition === 'neuf';

  useEffect(() => () => images.forEach((img) => URL.revokeObjectURL(img.url)), [images]);

  const addFiles = async (fileList) => {
    const files = Array.from(fileList).slice(0, 6 - images.length);
    if (files.length === 0) return;
    setCompressing(true);
    try {
      const processed = await Promise.all(
        files.map(async (file) => {
          if (file.size > 9 * 1024 * 1024) {
            toast.error(`${file.name} dépasse 9 Mo — ignorée.`);
            return null;
          }
          const compressed = await compressImage(file).catch(() => file);
          return { file: compressed, url: URL.createObjectURL(compressed) };
        })
      );
      setImages((prev) => [...prev, ...processed.filter(Boolean)].slice(0, 6));
    } finally {
      setCompressing(false);
    }
  };

  const removeImage = (idx) => setImages((prev) => { URL.revokeObjectURL(prev[idx].url); return prev.filter((_, i) => i !== idx); });

  const updateSpec = (idx, field, value) => setForm((f) => {
    const specs = [...f.specs];
    specs[idx] = { ...specs[idx], [field]: value };
    return { ...f, specs };
  });
  const addSpec = () => setForm((f) => ({ ...f, specs: [...f.specs, { key: '', value: '' }] }));
  const removeSpec = (idx) => setForm((f) => ({ ...f, specs: f.specs.filter((_, i) => i !== idx) }));

  const canNext = step === 0 ? images.length >= 4 : step === 1 ? form.titre.trim().length >= 5 && Number(form.prix) > 0 : true;

  const submit = async () => {
    if (images.length < 4) {
      toast.error('Ajoutez au moins 4 photos du produit pour le publier.');
      setStep(0);
      return;
    }
    if (!isAuthenticated) {
      toast.info('Connectez-vous pour publier.');
      navigate('/login', { state: { from: '/publier' } });
      return;
    }
    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('titre', form.titre.trim());
      payload.append('description', form.description.trim());
      payload.append('prix', String(Number(form.prix)));
      payload.append('prix_negociable', form.prix_negociable ? '1' : '0');
      payload.append('condition', form.condition);
      payload.append('mode_transaction', form.mode_transaction);
      payload.append('est_trocable', form.mode_transaction !== 'vente' ? '1' : '0');
      payload.append('stock', String(Math.max(1, Number(form.stock) || 1)));
      payload.append('categorie', form.categorie);
      payload.append('ville', form.ville);
      payload.append('quartier', form.quartier);
      const specs = Object.fromEntries(form.specs.filter((s) => s.key.trim()).map((s) => [s.key.trim().toLowerCase().replaceAll(' ', '_'), s.value.trim()]));
      Object.entries(specs).forEach(([k, v]) => payload.append(`specs[${k}]`, v));
      images.forEach((img) => payload.append('images[]', img.file));

      const { data } = await api.post('/products', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPublishedId(data?.data?.id ?? data?.id);
      toast.success('Annonce en ligne !');
      gsap.fromTo(successRef.current, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.55, ease: 'back.out(1.7)' });
    } catch (error) {
      const resp = error.response?.data;
      const msg = resp?.errors ? Object.values(resp.errors).flat()[0] : (resp?.message ?? 'Échec de la publication.');
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ---- Écran succès ---- */
  if (publishedId) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-6 py-16 text-center">
        <span ref={successRef} className="flex h-24 w-24 items-center justify-center rounded-full bg-djassa-red text-white shadow-pop"><Check size={46} strokeWidth={3.5} /></span>
        <h1 className="mt-5 font-jakarta text-2xl font-extrabold text-djassa-black">Votre annonce<br />est en ligne !</h1>
        <p className="mt-2 text-sm text-djassa-slate">Les souhaits correspondants ont été alertés. Bonne vente (ou bon troc) !</p>
        <Link to={`/article/${publishedId}`} className="btn-red mt-6 w-full">Voir mon annonce <ChevronRight size={18} /></Link>
        <Link to="/" className="btn-ghost mt-2 w-full">Retour au fil</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-3 pb-10 pt-4 sm:px-6">
      <h1 className="font-jakarta text-xl font-extrabold text-djassa-black">Publier une annonce</h1>
      <p className="text-xs text-djassa-slate">Moins de 60 secondes chrono — le mode Flash Djassa.</p>

      {/* Stepper */}
      <ol className="mt-4 flex items-center" aria-label="Étapes de publication">
        {STEPS.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li key={label} className="flex flex-1 items-center">
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-jakarta text-xs font-extrabold transition ${done ? 'bg-djassa-red text-white' : active ? 'bg-djassa-black text-white ring-4 ring-djassa-red/25' : 'bg-djassa-cloud text-djassa-slate'}`}>{done ? <Check size={15} strokeWidth={3.5} /> : i + 1}</span>
              <span className={`ml-2 hidden text-[11px] font-bold sm:block ${active ? 'text-djassa-black' : 'text-djassa-slate'}`}>{label}</span>
              {i < STEPS.length - 1 && <span className={`mx-2 h-0.5 flex-1 rounded ${done ? 'bg-djassa-red' : 'bg-djassa-black/10'}`} />}
            </li>
          );
        })}
      </ol>

      {/* ============ ÉTAPE 1 — Photos ============ */}
      {step === 0 && (
        <section className="mt-5">
          <label htmlFor="photos" className="group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-djassa-black/15 bg-white px-6 py-10 text-center transition hover:border-djassa-red/50">
            {compressing ? <Spinner size={34} /> : <CloudUpload size={38} className="text-djassa-red" />}
            <p className="font-jakarta text-sm font-bold text-djassa-black">{compressing ? 'Compression WebP en cours…' : 'Ajoutez 4 photos du produit'}</p>
            <p className={`font-inter text-[10px] font-semibold ${images.length >= 4 ? 'text-emerald-600' : 'text-djassa-red'}`}>
              {images.length >= 4 ? `✓ ${images.length} photos — prêt pour la publication` : `${images.length}/4 photos ajoutées · 4 vues exigées (face, dos, détails, en usage)`}
            </p>
            <p className="text-[10px] text-djassa-slate">JPEG, PNG, WebP — compressées automatiquement (&lt; 350 Ko)</p>
            <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-djassa-cloud px-3 py-1.5 text-[10px] font-semibold text-djassa-slate"><Camera size={12} /> ou glissez-déposez ici</p>
            <input id="photos" ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
          </label>

          {images.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {images.map((img, i) => (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-2xl bg-djassa-cloud">
                  <img src={img.url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                  <button onClick={() => removeImage(i)} className="absolute right-1 top-1 rounded-full bg-black/60 p-1.5 text-white opacity-80 transition hover:bg-djassa-red" aria-label="Retirer la photo"><Trash2 size={12} /></button>
                  {i === 0 && <span className="absolute bottom-1 left-1 rounded-full bg-djassa-black/70 px-2 py-0.5 text-[8px] font-bold uppercase text-white">Principale</span>}
                </div>
              ))}
            </div>
          )}
          <p className="mt-2 text-[10px] text-djassa-slate"><ImageIcon size={10} className="inline" /> Sans photo, votre annonce part avec le visuel générique Djassa.</p>
        </section>
      )}

      {/* ============ ÉTAPE 2 — Détails & État ============ */}
      {step === 1 && (
        <section className="mt-5 space-y-4">
          <div>
            <label htmlFor="titre" className="label">Titre de l'annonce *</label>
            <input id="titre" className="input" maxLength={180} placeholder="Ex : Perceuse sans fil Bosch GSB 18V-50" value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} />
          </div>

          <div>
            <span className="label">Rayon *</span>
            <div className="flex flex-wrap gap-1.5">
              {PUBLISH_CATEGORIES.map(({ key, label, Icon }) => (
                <button key={key} onClick={() => setForm({ ...form, categorie: key })} className={form.categorie === key ? 'pill-black-active' : 'pill-idle'} aria-pressed={form.categorie === key}>
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="label">État du produit *</span>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {CONDITION_OPTIONS.map(({ key, label, hint }) => {
                const locked = key === 'neuf' && !isProVerified;
                return (
                  <button
                    key={key}
                    disabled={locked}
                    title={locked ? 'Réservé aux Boutiques Pro vérifiées' : hint}
                    onClick={() => setForm({ ...form, condition: key })}
                    className={`rounded-2xl border-2 p-2 text-left transition disabled:cursor-not-allowed disabled:opacity-45 ${form.condition === key ? 'border-djassa-red bg-djassa-red/5' : 'border-djassa-black/10 bg-white hover:border-djassa-red/40'}`}
                  >
                    <span className="block font-jakarta text-[11px] font-extrabold text-djassa-black">{label}</span>
                    <span className="mt-0.5 block text-[8px] leading-tight text-djassa-slate">{locked ? 'Pro vérifiée requis' : hint}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="desc" className="label">Description</label>
            <textarea id="desc" rows={3} className="input" maxLength={5000} placeholder="Marque, modèle, défauts éventuels, raison de la vente…" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          {/* Spécifications dynamiques (JSONB) */}
          <fieldset>
            <legend className="label">Caractéristiques (marque, puissance, pointure…)</legend>
            <div className="space-y-1.5">
              {form.specs.map((spec, i) => (
                <div key={i} className="flex gap-1.5">
                  <input className="input !py-2 text-xs" placeholder="Ex : marque" value={spec.key} onChange={(e) => updateSpec(i, 'key', e.target.value)} />
                  <input className="input !py-2 text-xs" placeholder="Ex : Bosch" value={spec.value} onChange={(e) => updateSpec(i, 'value', e.target.value)} />
                  {form.specs.length > 1 && <button onClick={() => removeSpec(i)} className="rounded-xl px-2 text-djassa-slate hover:bg-djassa-cloud hover:text-djassa-red" aria-label="Retirer"><Trash2 size={15} /></button>}
                </div>
              ))}
            </div>
            <button onClick={addSpec} className="mt-1.5 text-[10px] font-bold text-djassa-red hover:underline">+ Ajouter une caractéristique</button>
          </fieldset>
        </section>
      )}

      {/* ============ ÉTAPE 3 — Prix & Mode ============ */}
      {step === 2 && (
        <section className="mt-5 space-y-4">
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div>
              <label htmlFor="prix" className="label">Prix (FCFA) *</label>
              <input id="prix" type="number" min="0" inputMode="numeric" className="input font-jakarta text-lg font-extrabold" placeholder="85 000" value={form.prix} onChange={(e) => setForm({ ...form, prix: e.target.value })} />
            </div>
            {isProVerified && (
              <div>
                <label htmlFor="stock" className="label">Stock</label>
                <input id="stock" type="number" min="0" className="input w-20 text-center font-jakarta font-extrabold" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              </div>
            )}
          </div>
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-djassa-black/10 bg-white p-3">
            <span className="text-xs font-semibold">Prix négociable (l'acheteur peut faire une offre)</span>
            <input type="checkbox" className="h-5 w-5 accent-[#E11D48]" checked={form.prix_negociable} onChange={(e) => setForm({ ...form, prix_negociable: e.target.checked })} />
          </label>

          <fieldset>
            <legend className="label">Mode de transaction *</legend>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'vente', label: 'Vente', hint: 'Cash Mobile Money', bg: 'hover:border-djassa-black', Icon: Banknote },
                { key: 'troc', label: 'Troc', hint: 'Objet contre objet', bg: 'hover:border-djassa-red', Icon: ArrowLeftRight },
                { key: 'mixte', label: 'Mixte', hint: 'Troc + soulte FCFA', bg: 'hover:border-djassa-red', Icon: Zap },
              ].map(({ key, label, hint, Icon }) => (
                <button key={key} onClick={() => setForm({ ...form, mode_transaction: key })} aria-pressed={form.mode_transaction === key}
                  className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-3 transition ${form.mode_transaction === key ? 'border-djassa-red bg-djassa-red/5 shadow-pop' : 'border-djassa-black/10 bg-white'}`}>
                  <Icon size={20} className={form.mode_transaction === key ? 'text-djassa-red' : 'text-djassa-black'} />
                  <span className="font-jakarta text-xs font-extrabold">{label}</span>
                  <span className="text-center text-[8px] leading-tight text-djassa-slate">{hint}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="ville" className="label">Ville</label>
              <input id="ville" className="input" value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })} list="villes-ci" />
              <datalist id="villes-ci"><option value="Abidjan" /><option value="Bouaké" /><option value="Yamoussoukro" /><option value="San Pedro" /><option value="Daloa" /><option value="Korhogo" /><option value="Grand-Bassam" /></datalist>
            </div>
            <div>
              <label htmlFor="quartier" className="label">Quartier / Commune</label>
              <input id="quartier" className="input" placeholder="Cocody, Plateau…" value={form.quartier} onChange={(e) => setForm({ ...form, quartier: e.target.value })} />
            </div>
          </div>

          {/* Récapitulatif */}
          <div className="rounded-2xl bg-djassa-black p-4 text-white">
            <p className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-white/60">Récapitulatif <BadgeCheck size={12} className="text-djassa-red" /></p>
            <p className="mt-1 font-jakarta text-sm font-bold leading-snug">{form.titre || 'Votre article'}</p>
            <p className="mt-1 font-jakarta text-xl font-extrabold text-white">{form.prix ? formatFCFA(form.prix) : '—'} <span className="text-[10px] font-inter font-medium text-white/60">· {form.mode_transaction === 'vente' ? 'Vente cash' : form.mode_transaction === 'troc' ? 'Troc uniquement' : 'Troc + soulte'}</span></p>
            {isNeufLocked && <p className="mt-1.5 text-[9px] font-bold uppercase tracking-wide text-amber-400">Article neuf — vitrine Boutique Pro {boutique?.nom_boutique}</p>}
          </div>
        </section>
      )}

      {/* Navigation d'étapes */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <button className="btn-ghost" onClick={() => (step === 0 ? navigate(-1) : setStep((s) => s - 1))}><ChevronLeft size={18} /> {step === 0 ? 'Annuler' : 'Retour'}</button>
        {step < 2 ? (
          <button className="btn-black" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>Continuer <ChevronRight size={18} /></button>
        ) : (
          <button className="btn-red" disabled={submitting || images.length < 4 || !form.titre.trim() || !form.prix} onClick={submit}>{submitting ? <Spinner size={18} /> : <Zap size={18} />} Publier l'annonce</button>
        )}
      </div>
    </div>
  );
}
