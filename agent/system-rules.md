# Règles système — agents Djassa Online

1. **Lire en priorité** `AGENTS.md`, puis `agent/context/`, puis le skill concerné dans `skills/`.
2. **Ne jamais supprimer** de fichier existant sans confirmation explicite. Le dépôt contient du travail non commité.
3. **Deux topologies coexistent** : `backend-laravel/` + `frontend/web` + `frontend/mobile/` sont actifs ; `backend/core-api/`, `services/`, `models/`, `routes/` décrivent la cible.
4. **Anti-vibe-coding** : chaque changement doit être justifié par une règle métier, un contrat (`models/schemas/`) ou un finding (`AUDIT_APPLICATION.md`). Pas de composant décoratif sans purpose.
5. **Séparation hermétique des rôles** : `particulier` ≠ `vendeur_pro`. Aucun écran, endpoint ou test ne doit mélanger les deux sans garde explicite.
6. **Design** : suivre `skills/react-ui-djassa/` (#780000, Space Grotesk + DM Sans, border-none, icônes ≥ 16px) pour tout nouveau code, sans détruire l'existant.
7. **Sécurité** : passer par `skills/security-escrow-audit/` avant de toucher au paiement, au PIN ou à l'auth.
8. **Vérifier avant d'annoncer** : `npm run build`, `docker compose config`, `php -l`, tests ciblés.

## Règles de Performance & Production (résumé opérationnel)

Le référentiel complet des **29 règles** est dans `AGENTS.md`, section « Règles de Performance & Production ». Application obligatoire ; aucun code ne doit être livré sans vérifier les règles de son domaine.

- **Frontend (1–13)** : squelettes (jamais de spinner nu), WebP/AVIF + `loading="lazy"`, polices `.woff2` auto-hébergées (400/500/600/700), `React.lazy()` + `manualChunks`, virtualisation des listes, `memo`/`useMemo`/`useCallback`, debounce recherche 300 ms, dédup API + anti-double-clic, Optimistic UI avec rollback, streaming IA par token, scripts tiers différés, pages d'erreur 403/404/500/Offline, tests CPU 4× / Fast 3G + RUM Core Web Vitals.
- **Backend (14–19)** : pagination obligatoire (jamais `all()`), `Http::pool()`/`Promise.all()`, cache Redis des données chaudes, queues Redis pour tâches lentes, timeouts 3 s/8 s sur API externes, suppression des dépendances inutiles.
- **PostgreSQL (20–23)** : `select([...])` explicite, `preventLazyLoading()` en dev, index FK/filtre/tri, PgBouncer.
- **Infrastructure (24–29)** : Gzip/Brotli, `Cache-Control immutable`, CDN statique, co-localisation DB/Redis, SSG/SSR, multi-instances derrière le gateway.

Rappel : ces règles s'appliquent **aussi** au code existant lors de toute modification — ne pas les traiter comme une checklist de greenfield.
