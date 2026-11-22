# AGENTS.md — Djassa Online

> Point d'entrée lu automatiquement. Pour les règles détaillées, voir **`agent/system-rules.md`** et les skills dans **`skills/*/SKILL.md`**.

## État réel du dépôt

Architecture **100 % microservices** (Phase 4 terminée). Le monolithe `backend-laravel/` a été retiré.

- **`backend/gateway/`** : point d'entrée unique (nginx, JWT `auth_request`, rate limiting, Gzip).
- **`services/`** : 5 microservices Laravel autonomes, chacun avec son `vendor/`, son `composer.lock` et sa base PostgreSQL dédiée.
- **`frontend/web/`** : React/Vite. **`frontend/mobile/`** : Expo (client actif, à migrer vers le nouveau modèle de rôles).

## Les dossiers racines

| Dossier | Rôle |
|---|---|
| `frontend/` | `web/` (React + Vite + Tailwind, **actif**) et `mobile/` (**Expo actif**, ex-`mobile-app/`) |
| `backend/` | `gateway/` (nginx, rate limiting, JWT check) et `core-api/` (cible noyau Laravel) |
| `services/` | 5 microservices métier, chacun avec README, `app/` et `tests/Feature/` |
| `database/` | `init/`, `migrations/`, `schemas/`, `seeders/`, `backups/` — Database-per-Service |
| `models/` | `eloquent/`, `schemas/` (JSON Schema), `enums/` — source de vérité des contrats |
| `routes/` | Carte des routes externes et séparation `public` / `particulier` / `pro` / `webhooks` |
| `test/` | Suite globale : `unit/`, `integration/`, `feature/`, `e2e/` (+ contrats, perf, sécurité) |
| `security/` | `policies/`, `semgrep/`, `scripts/`, `checklists/` — garde-fous défensifs |
| `documents/` | PRD, TRD, AppFlow, UML, charte graphique (ex-`docs/`) |
| `skills/` | Compétences métier OpenCode (Laravel, PostgreSQL, UI Djassa, audit escrow) |
| `agent/` | `system-rules.md`, `prompts/`, `context/` — mémoire et orchestration des agents |
| `video/` | Production vidéo (ex-`video-promo/`) — film de lancement, briefs, captures |
| `pub/` | Promotion : `campagnes/`, `assets/`, `copy/` |
| `design/` | Identité visuelle : `brand/`, `rive/`, `illustrations/`, `maquettes/` |

`test/` valide que ça marche ; `security/` empêche que ça casse. Ne pas confondre.

## Règles d'or

1. **Database-per-Service.** Une base par service, un rôle PostgreSQL par base, zéro requête SQL cross-service. Références croisées = UUID logiques, communication = API interne ou événements Redis.
2. **Rôles étanches.** `particulier | vendeur_pro | admin`. Le gateway valide le JWT puis injecte `X-User-Id` / `X-User-Role` vérifiés — jamais ceux du client. Boutique et article **neuf** réservés à `vendeur_pro`.
3. **Isolation financière.** Clés GeniusPay et PIN haché (bcrypt, 4 chiffres) confinés dans `escrow-payment-service` + `djassa_escrow_db`.
4. **Contrats partagés.** Tout champ échangé est défini dans `models/schemas/` et déclaré dans `routes/api-gateway.routes.json`.
5. **Isolation PostgreSQL active (D2).** Chaque service possède sa base (`djassa_auth_db`, `djassa_catalog_db`, `djassa_troc_db`, `djassa_escrow_db`, `djassa_chat_db`) et aucun modèle n'a de relation cross-base. Intégrité inter-domaines par API interne signée (`X-Djassa-Signature`) et événements Redis Streams.
6. **Pas de vibe-coding.** Voir `agent/system-rules.md`.

## Design system (cible)

`#780000` (accent) · `#121212` (encre) · `#FFFFFF` · `Space Grotesk` (titres) + `DM Sans` (corps) · composants `border-none` · icônes Lucide ≥ 16px · GSAP sobre, `prefers-reduced-motion` respecté.

⚠️ Le code actif est **déjà aligné** : 123 occurrences de `#780000`, `Space Grotesk` + `DM Sans` chargées dans `index.html`, 0 occurrence des anciens tokens `#E11D48/#E60023`. `DESIGN_SYSTEM_SUMMARY.md` reste une doc historique à rafraîchir.

## Règles de Performance & Production (29 règles obligatoires)

Référentiel officiel, applicable à chaque développement. Détail par domaine dans `agent/system-rules.md` et les skills correspondants.

### A. Frontend — `frontend/web/`, `frontend/mobile/` (1–13)

1. **Squelettes, jamais de spinner nu.** Reproduire la structure des cartes produit / dashboards.
2. **WebP/AVIF + lazy loading.** `loading="lazy"` + `decoding="async"` sous la ligne de flottaison.
3. **Polices auto-hébergées.** `Space Grotesk` + `DM Sans` en `.woff2` local, uniquement les graisses 400/500/600/700 ; aucun appel Google Fonts bloquant.
4. **Code splitting par route.** `React.lazy()` + `Suspense` ; chunks lourds (Three.js, GSAP) isolés via `manualChunks` dans `vite.config.js`.
5. **Virtualisation.** `@tanstack/react-virtual` pour catalogue infini, transactions et fils de messagerie.
6. **Zéro re-render inutile.** `React.memo`, `useMemo`, `useCallback`, contextes cloisonnés (Auth, Cart).
7. **Debounce 300 ms** sur la recherche catalogue avant appel API.
8. **Déduplication des requêtes** + verrou anti-double-clic sur `POST /escrow/checkout` (TanStack Query).
9. **Optimistic UI** avec rollback : favoris/souhaits, panier, lecture de message.
10. **Streaming IA par token** (SSE / `ReadableStream`) si une aide à la rédaction est intégrée.
11. **Scripts tiers différés** après `window.load` ou en `defer`.
12. **Pages d'erreur dédiées** : 403 (dont Pro expiré), 404, 500, Hors-ligne — charte `#780000`, `border-none`.
13. **Qualité terrain** : Core Web Vitals (RUM) + tests CPU 4× / Fast 3G sur smartphone d'entrée de gamme.

### B. Backend & microservices — `backend/`, `services/` (14–19)

14. **Pagination systématique.** `paginate(20)` ou curseur ; **jamais `Model::all()`**.
15. **Appels indépendants en parallèle.** `Http::pool()` / `Promise.all()` plutôt que séquentiels.
16. **Cache Redis des données chaudes.** Catalogue public, boutiques populaires, catégories ; invalidation par événements (`article.created`, `article.updated`).
17. **Files de jobs Redis** pour tout travail lent : Brevo e-mails/SMS, PDF, compression d'images, matching souhaits.
18. **Timeouts stricts** : `connectTimeout(3)` / `timeout(8)` sur GeniusPay, Brevo, Google OAuth + retry contrôlé.
19. **Dépendances inutiles supprimées** de `composer.json` et `package.json`.

### C. PostgreSQL — `database/` (20–23)

20. **Sélection explicite des colonnes** (`select(['id','titre','prix','...'])`), jamais `SELECT *`.
21. **Zéro N+1.** `with()` sur les relations du même domaine + `Model::preventLazyLoading(! app()->isProduction())` en dev.
22. **Index ciblés.** FK, colonnes de filtre (`statut`, `marche`, `categorie`, `ville`) et de tri (`created_at`, `prix`).
23. **Pool de connexions** PgBouncer devant PostgreSQL pour absorber les pics entre microservices.

### D. Infrastructure, build & mesure (24–29)

24. **Compression Gzip/Brotli** dans `backend/gateway/nginx.conf`.
25. **Cache navigateur** : `Cache-Control: public, max-age=31536000, immutable` sur les assets buildés.
26. **CDN** pour les fichiers statiques et illustrations.
27. **Co-localisation** des conteneurs applicatifs dans la même région que PostgreSQL et Redis.
28. **Rendu serveur/build (SSG/SSR)** pour les pages vitrines et SEO.
29. **Montée en charge multi-instances** derrière l'API Gateway + répartition du trafic.

## Commandes

```bash
# Stack microservices (gateway :8080, bases :5433, Redis :6380)
docker compose config
docker compose up -d

# Frontend
cd frontend/web && npm install && npm run dev     # :5199

# Vérification / audit
cd frontend/web && npm run build
./security/scripts/run-security-audit.sh
./test/run-all.sh   # 5 suites : 51 tests / 168 assertions
```

## Références

- `agent/system-rules.md` — règles strictes anti-vibe-coding.
- `skills/*/SKILL.md` — compétences métier.
- `AUDIT_APPLICATION.md` — findings bloquants (à lire avant tout changement paiement/rôles/auth).
- `documents/` — PRD, TRD, UML, charte.
