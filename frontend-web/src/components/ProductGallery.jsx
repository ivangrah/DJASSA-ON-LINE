import { useEffect, useState } from 'react';

/**
 * Galerie d'images produit avec logo Djassa.
 * Au survol, défile les 4 vues toutes les 4 secondes.
 */
export default function ProductGallery({ article, images, className = '' }) {
  const gallery = images?.length ? images : (article?.image_principale ? [article.image_principale] : []);
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [ok, setOk] = useState(true);

  useEffect(() => {
    if (!hovered || gallery.length < 2) {
      setActive(0);
      return undefined;
    }
    const t = setInterval(() => setActive((i) => (i + 1) % gallery.length), 4000);
    return () => clearInterval(t);
  }, [hovered, gallery.length]);

  return (
    <div className={`relative h-full w-full ${className}`} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {ok && gallery.length ? (
        gallery.map((src, i) => (
          <img
            key={`${src}-${i}`}
            src={src}
            alt={article?.titre ?? 'Produit Djassa'}
            loading="lazy"
            onError={() => setOk(false)}
            className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${i === active ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
          />
        ))
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-djassa-mist font-jakarta text-lg font-extrabold text-djassa-black/15">Djassa</div>
      )}

      {/* Logo Djassa sur l'image */}
      <div className="pointer-events-none absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full bg-black/55 px-1.5 py-1 backdrop-blur-sm ring-1 ring-white/15">
        <img src="/images/logo-mark.png" alt="" className="h-3.5 w-3.5 rounded-full" />
        <span className="font-jakarta text-[7px] font-extrabold uppercase tracking-wide text-white">Djassa</span>
      </div>

      {/* Pastilles de navigation (1 point par vue) */}
      {gallery.length > 1 && (
        <div className="pointer-events-none absolute bottom-2 right-2 z-10 flex gap-1">
          {gallery.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === active ? 'w-3 bg-white' : 'w-1.5 bg-white/50'}`} />
          ))}
        </div>
      )}
    </div>
  );
}
