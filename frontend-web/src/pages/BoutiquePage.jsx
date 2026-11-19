import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BadgeCheck, MapPin, Phone, Store, Star, TrendingUp, ChevronLeft } from 'lucide-react';
import { api } from '../lib/api';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton, EmptyState } from '../components/ui';
import { formatNumberFR } from '../lib/format';

/** Vitrine Boutique Pro — /boutique/:slug (PRD §3.2, App Flow §6) */
export default function BoutiquePage() {
  const { slug } = useParams();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['boutique', slug, page],
    queryFn: async () => (await api.get(`/boutiques/${slug}`, { params: { page } })).data,
    enabled: Boolean(slug),
  });

  const boutique = data?.boutique;
  const articles = data?.articles?.data ?? [];
  const meta = data?.articles?.meta;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="skeleton h-40 w-full rounded-3xl" />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}</div>
      </div>
    );
  }

  if (isError || !boutique) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="font-jakarta text-lg font-extrabold">Boutique introuvable</p>
        <Link to="/" className="btn-red btn-sm mt-4">Retour au fil</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-3 pb-10 sm:px-6">
      <Link to="/" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-djassa-slate hover:text-djassa-black"><ChevronLeft size={14} /> Retour</Link>

      {/* Bannière — dégradé noir/rouge (fallback charte si absente) */}
      <div className="relative mt-2 overflow-hidden rounded-3xl">
        {boutique.banniere ? (
          <img src={boutique.banniere} alt={`Bannière ${boutique.nom_boutique}`} className="h-36 w-full object-cover sm:h-44" />
        ) : (
          <div className="geo-pattern h-36 w-full sm:h-44" />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
        <div className="absolute bottom-3 left-4 flex items-end gap-3 sm:left-6">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-4 border-djassa-black bg-djassa-black font-jakarta text-3xl font-extrabold text-white shadow-pop sm:h-24 sm:w-24">
            {boutique.logo ? <img src={boutique.logo} alt="" className="h-full w-full object-cover" /> : boutique.nom_boutique.slice(0, 1).toUpperCase()}
          </div>
          <div className="pb-1 text-white">
            <h1 className="flex items-center gap-2 font-jakarta text-lg font-extrabold leading-tight sm:text-2xl">
              {boutique.nom_boutique}
              {boutique.verifie && <BadgeCheck size={20} className="shrink-0 fill-djassa-red text-white" aria-label="Vendeur Vérifié" />}
            </h1>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-white/85 sm:text-[11px]">
              <span className="flex items-center gap-1"><MapPin size={10} />{boutique.adresse ? `${boutique.adresse}, ` : ''}{boutique.ville}</span>
              {boutique.telephone && <a href={`tel:${boutique.telephone}`} className="flex items-center gap-1 hover:text-white"><Phone size={10} />{boutique.telephone}</a>}
            </p>
          </div>
        </div>
      </div>

      {/* Bandeau statistiques */}
      <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3">
        {boutique.verifie && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-djassa-black px-3 py-1.5 text-[10px] font-jakarta font-extrabold uppercase tracking-wider text-white">
            <BadgeCheck size={12} className="fill-djassa-red text-white" /> Vendeur vérifié
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-djassa-black ring-1 ring-djassa-black/10"><TrendingUp size={12} className="text-djassa-red" />{formatNumberFR(boutique.total_ventes)} ventes</span>
        {Number(boutique.note_moyenne) > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-djassa-black ring-1 ring-djassa-black/10"><Star size={12} className="fill-amber-400 text-amber-400" />{Number(boutique.note_moyenne).toFixed(1)} · {boutique.nombre_avis} avis</span>
        )}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-djassa-black ring-1 ring-djassa-black/10"><Store size={12} className="text-djassa-red" />{boutique.categorie}</span>
      </div>

      {boutique.description && <p className="mt-3 max-w-3xl text-sm leading-relaxed text-djassa-black/85">{boutique.description}</p>}

      {/* Catalogue neuf */}
      <h2 className="section-title mt-5 flex items-center gap-2"><Store size={18} className="text-djassa-red" /> Nouveautés de la boutique</h2>
      {articles.length === 0 ? (
        <EmptyState title="Aucun article en ligne" hint="Cette boutique n'a pas encore d'article publié." />
      ) : (
        <>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {articles.map((a) => <ProductCard key={a.id} article={a} />)}
          </div>
          {meta && page < meta.last_page && (
            <div className="mt-4 flex justify-center"><button className="btn-outline btn-sm" onClick={() => setPage((p) => p + 1)}>Charger plus</button></div>
          )}
        </>
      )}
    </div>
  );
}
