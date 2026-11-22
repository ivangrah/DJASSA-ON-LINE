import { useRef, useState } from 'react';
import { usePageReveal } from '../hooks/usePageReveal';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BadgeCheck, Heart, MapPin, Phone, ShoppingBag,
  Star, Store, TrendingUp,
} from 'lucide-react';
import { api } from '../lib/api';
import { ProductCardSkeleton, EmptyState } from '../components/ui';
import { formatFCFA, formatNumberFR } from '../lib/format';

/** Vitrine Boutique Pro — /boutique/:slug */
export default function BoutiquePage() {
  const { slug } = useParams();
  const [page, setPage] = useState(1);
  const [favs, setFavs] = useState([]);
  const scope = useRef(null);
  usePageReveal(scope);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['boutique', slug, page],
    queryFn: async () => (await api.get(`/boutiques/${slug}`, { params: { page } })).data,
    enabled: Boolean(slug),
  });

  const boutique = data?.boutique;
  const articles = data?.articles?.data ?? [];
  const meta = data?.articles?.meta;

  const toggleFav = (id) => setFavs((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="skeleton h-40 w-full rounded-[5px]" />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}</div>
      </div>
    );
  }

  if (isError || !boutique) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="font-spacegrotesk text-lg font-extrabold">Boutique introuvable</p>
        <Link to="/" className="btn-red btn-sm mt-4">Retour au fil</Link>
      </div>
    );
  }

  return (
    <div ref={scope} data-reveal className="mx-auto max-w-7xl px-3 pb-10 sm:px-6">
      <nav className="mt-2 font-DM-Sans text-[10px] text-djassa-black/55" aria-label="Fil d’Ariane">
        <Link to="/" className="hover:text-djassa-red">Accueil</Link> <span className="px-1">/</span>
        <span className="font-semibold text-djassa-red">Boutique</span>
      </nav>

      {/* ===== BANNIÈRE ROUGE ===== */}
      <section
        className="relative mt-2 overflow-hidden rounded-[5px] px-5 py-6 text-white shadow-card sm:px-8 sm:py-8"
        style={{ background: 'linear-gradient(135deg, #780000 0%, #4A0000 60%, #140505 100%)' }}
      >
        <img src="/images/store-stripes.webp" alt="" aria-hidden="true" className="pointer-events-none absolute -right-6 -top-6 h-44 w-auto select-none object-contain opacity-25 sm:h-56"  loading="lazy" decoding="async" />
        <div className="relative z-10 flex flex-wrap items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[5px] bg-white font-spacegrotesk text-3xl font-extrabold text-[#780000] shadow-card sm:h-24 sm:w-24">
            {boutique.logo ? <img src={boutique.logo} alt="" className="h-full w-full object-cover"  loading="lazy" decoding="async" /> : boutique.nom_boutique.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-spacegrotesk text-[24px] font-extrabold leading-tight tracking-tight sm:text-[32px]">{boutique.nom_boutique}</h1>
              {boutique.verifie && <span className="inline-flex items-center gap-1 rounded-[5px] bg-white/15 px-2.5 py-1 font-spacegrotesk text-[9px] font-extrabold uppercase tracking-wide"><BadgeCheck size={14} /> Vérifié</span>}
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-DM-Sans text-[11px] text-white/70">
              <span className="flex items-center gap-1"><MapPin size={14} />{boutique.adresse ? `${boutique.adresse}, ` : ''}{boutique.ville}</span>
              {boutique.telephone && <a href={`tel:${boutique.telephone}`} className="flex items-center gap-1 hover:text-white"><Phone size={14} />{boutique.telephone}</a>}
              <span className="flex items-center gap-1"><Store size={14} />{boutique.categorie ?? 'Boutique Pro'}</span>
            </p>
          </div>
          <img src="/images/shop-open.webp" alt="" aria-hidden="true" className="pointer-events-none hidden h-28 w-auto select-none object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)] lg:block"  loading="lazy" decoding="async" />
        </div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-[250px_minmax(0,1fr)]">
        {/* ===== COLONNE GAUCHE ===== */}
        <aside className="space-y-3">
          <div className="rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] p-4 shadow-card">
            <h2 className="font-spacegrotesk text-[10px] font-extrabold uppercase tracking-[0.18em] text-djassa-red">À propos</h2>
            {boutique.description && <p className="mt-2 font-DM-Sans text-[11px] leading-relaxed text-djassa-black/65">{boutique.description}</p>}
            {boutique.telephone && (
              <a href={`tel:${boutique.telephone}`} className="mt-3 inline-flex items-center gap-1.5 rounded-[5px] bg-djassa-red px-3 py-2 font-spacegrotesk text-[10px] font-extrabold uppercase tracking-wide text-white">
                <Phone size={14} /> Appeler
              </a>
            )}
          </div>

          <div className="rounded-[5px] bg-[#780000] p-4 text-white shadow-card">
            <h2 className="font-spacegrotesk text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/70">La boutique en chiffres</h2>
            <div className="mt-3 space-y-2.5">
              <div className="flex items-center justify-between font-DM-Sans text-[11px]">
                <span className="flex items-center gap-2 text-white/70"><TrendingUp size={15} /> Ventes</span>
                <span className="font-spacegrotesk font-extrabold tabular-nums">{formatNumberFR(boutique.total_ventes)}</span>
              </div>
              <div className="flex items-center justify-between font-DM-Sans text-[11px]">
                <span className="flex items-center gap-2 text-white/70"><Star size={15} /> Note</span>
                <span className="font-spacegrotesk font-extrabold tabular-nums">{Number(boutique.note_moyenne) > 0 ? `${Number(boutique.note_moyenne).toFixed(1)}/5` : '—'}</span>
              </div>
              <div className="flex items-center justify-between font-DM-Sans text-[11px]">
                <span className="flex items-center gap-2 text-white/70"><ShoppingBag size={15} /> Articles</span>
                <span className="font-spacegrotesk font-extrabold tabular-nums">{articles.length}</span>
              </div>
            </div>
            <img src="/images/shop-open.webp" alt="" aria-hidden="true" className="pointer-events-none mx-auto mt-3 h-20 w-auto select-none object-contain lg:hidden"  loading="lazy" decoding="async" />
          </div>

          <div className="overflow-hidden rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] shadow-card">
            <img src="/images/bag-heart.webp" alt="" aria-hidden="true" className="h-28 w-full object-cover"  loading="lazy" decoding="async" />
            <p className="p-3 font-DM-Sans text-[10px] leading-relaxed text-djassa-black/65">
              Chaque achat est protégé par séquestre et code PIN sur Djassa Online.
            </p>
          </div>
        </aside>

        {/* ===== CATALOGUE ===== */}
        <main>
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="font-spacegrotesk text-[18px] font-extrabold text-djassa-black sm:text-[22px]">
                Nouveautés de la boutique<span className="text-djassa-red">.</span>
              </h2>
              <p className="mt-0.5 font-DM-Sans text-[11px] text-djassa-black/55">{articles.length} article{articles.length > 1 ? 's' : ''} en ligne</p>
            </div>
            <img src="/images/shoppers.webp" alt="" aria-hidden="true" className="art-warm pointer-events-none hidden h-16 w-auto select-none object-contain sm:block"  loading="lazy" decoding="async" />
          </div>

          {articles.length === 0 ? (
            <div className="mt-3">
              <img src="/images/wire-basket.webp" alt="" aria-hidden="true" className="mx-auto h-40 w-auto object-contain opacity-70"  loading="lazy" decoding="async" />
              <EmptyState art="box" title="Aucun article en ligne" hint="Cette boutique n'a pas encore d'article publié." />
            </div>
          ) : (
            <>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {articles.map((a) => {
                  const image = a.image_principale ?? a.images?.[0];
                  const prixActuel = Number(a.prix_actuel ?? a.prix);
                  const isFav = favs.includes(a.id);
                  return (
                    <article key={a.id} className="group overflow-hidden rounded-[5px] bg-white border-solid border-[0.5px] border-[rgba(18,18,18,0.08)] shadow-card transition hover:shadow-pop">
                      <div className="relative aspect-square overflow-hidden bg-djassa-cream">
                        <Link to={`/article/${a.id}`}>
                          {image ? (
                            <img src={image} alt={a.titre} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center font-spacegrotesk text-2xl font-extrabold text-djassa-black/15">Djassa</div>
                          )}
                        </Link>
                        <button
                          type="button"
                          onClick={() => toggleFav(a.id)}
                          aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                          aria-pressed={isFav}
                          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-[5px] bg-white shadow-card transition hover:scale-105"
                        >
                          <Heart size={16} className={isFav ? 'fill-djassa-red text-djassa-red' : 'text-djassa-black'} />
                        </button>
                      </div>
                      <div className="p-2.5">
                        <Link to={`/article/${a.id}`} className="line-clamp-2 min-h-[2.2rem] font-spacegrotesk text-[11.5px] font-bold leading-snug text-djassa-black transition hover:text-djassa-red">
                          {a.titre}
                        </Link>
                        <p className="mt-1 font-spacegrotesk text-[14px] font-extrabold tabular-nums text-[#780000]">{formatFCFA(prixActuel)}</p>
                        <div className="mt-2 flex gap-1.5">
                          <Link to={`/article/${a.id}`} className="flex-1 rounded-[5px] bg-djassa-red px-2 py-2 text-center font-spacegrotesk text-[9px] font-extrabold uppercase tracking-wide text-white transition hover:bg-[#9b0000]">
                            Voir
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
              {meta && page < meta.last_page && (
                <div className="mt-4 flex justify-center"><button className="btn-red btn-sm" onClick={() => setPage((p) => p + 1)}>Charger plus</button></div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
