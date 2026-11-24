# AGENTS.md — Djassa Online

> Point d'entrée lu automatiquement. Pour les règles détaillées, voir **`agent/system-rules.md`** et les skills dans **`skills/*/SKILL.md`**.

Ce fichier est lu par l'agent (OpenCode) au début de chaque session. Il fixe les règles permanentes du projet. Les chantiers ponctuels (corrections, refontes) sont donnés séparément dans le prompt de la session.

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

## Le projet en bref

Marketplace d'occasion et de troc à Abidjan. Particuliers et boutiques Pro vérifiées. Confiance par **séquestre Mobile Money (GeniusPay)** et **PIN à 4 chiffres** validé à la remise. Montants en FCFA, interface en français.

**Le code fait foi.** Les documents (`documents/`, cahier des charges) décrivent l'intention. En cas d'écart, suis le dépôt et signale la divergence.

## Règles d'or

1. **Database-per-Service.** Une base par service, un rôle PostgreSQL par base, zéro requête SQL cross-service. Références croisées = UUID logiques, communication = API interne ou événements Redis.
2. **Rôles étanches.** `particulier | vendeur_pro | admin`. Le gateway valide le JWT puis injecte `X-User-Id` / `X-User-Role` vérifiés — jamais ceux du client. Boutique et article **neuf** réservés à `vendeur_pro`.
3. **Isolation financière.** Clés GeniusPay et PIN haché (bcrypt, 4 chiffres) confinés dans `escrow-payment-service` + `djassa_escrow_db`.
4. **Contrats partagés.** Tout champ échangé est défini dans `models/schemas/` et déclaré dans `routes/api-gateway.routes.json`.
5. **Isolation PostgreSQL active (D2).** Chaque service possède sa base (`djassa_auth_db`, `djassa_catalog_db`, `djassa_troc_db`, `djassa_escrow_db`, `djassa_chat_db`) et aucun modèle n'a de relation cross-base. Intégrité inter-domaines par API interne signée (`X-Djassa-Signature`) et événements Redis Streams.
6. **Pas de vibe-coding.** Voir `agent/system-rules.md`.

### Sécurité du PIN et du séquestre (précisions)

- Aucun secret, PIN, clé GeniusPay ou clé HMAC dans le code, les logs, les tests ou les réponses API. Variables d'environnement uniquement ; échec du démarrage en production si une clé requise est absente.
- Le PIN n'est jamais stocké en clair ni renvoyé après sa création. Hachage bcrypt **plus** secret serveur (pepper), 5 tentatives maximum par transaction **et** par IP, verrouillage après 5 essais, tentatives journalisées. Détenteur du PIN = acheteur ; le vendeur ne le saisit qu'après remise de l'objet.
- Les webhooks sont vérifiés (HMAC-SHA256 sur le corps brut, comparaison à temps constant) **avant** tout traitement, rejetés si la signature est absente, et idempotents (clé d'événement unique). Montant et devise sont comparés à la transaction.
- Les transitions d'état interdites sont refusées côté application **et** par contrainte en base. Chaîne autorisée : `initiated → held`, `held → released | refunded | disputed`, `initiated → failed`, `disputed → released | refunded`, avec verrous transactionnels contre la double libération et libération/remboursement automatique après un délai configurable si le PIN n'est jamais saisi.
- Troc pur (sans soulte) : confirmation mutuelle. Litiges et arbitrage admin : voir `docs/CHECKLIST-MISE-EN-LIGNE.md` et `security/checklists/OWASP_TOP10_DJASSA.md`.
- Un service escrow indisponible ne doit jamais produire de 500 dans l'administration.
- Les montants sont en `NUMERIC(12,2)`, jamais en flottants.
- En-têtes `X-User-Id` et `X-User-Role` : uniquement du gateway, jamais du client.

## Méthode de travail

1. **Lis avant d'écrire** : fichiers concernés, tests existants, contrats.
2. **Plan court d'abord** (fichiers touchés, risques). Pour tout ce qui touche au séquestre, au PIN, à l'authentification ou aux migrations : attends mon accord.
3. **Petits lots** : une modification cohérente + ses tests + un commit en français. Ne mélange pas documentation, sécurité et design.
4. **Prouve, ne suppose pas** : lance les commandes de la section 6 et montre le résultat réel. Si tu n'as pas pu vérifier quelque chose, dis-le.
5. **Une seule question à la fois** si une règle est ambiguë. Ne devine pas sur l'argent ou la sécurité.
6. **Skills** : charge les skills de la table ci-dessous selon la tâche, annonce lesquels tu utilises, et n'en ouvre pas d'autres sans raison. Les skills propres au projet passent avant les skills génériques.

### Skills par type de tâche

| Tâche | Skills à utiliser |
|---|---|
| Microservices Laravel, endpoints, policies | `laravel-microservices` (projet), `laravel-specialist` |
| Base de données, migrations | `postgres-integrity` (projet), `postgres-pro` |
| Séquestre, PIN, paiement, webhooks | `security-escrow-audit` (projet), `secure-code-guardian` |
| Avant de modifier un contrat ou un schéma | `change-impact` |
| Tests | `test-driven-development`, `tdd-workflow`, `e2e-testing`, `playwright-expert` |
| Frontend web et mobile | `react-ui-djassa` (projet), `mobile-native`, `animate-expo` (Expo) |
| Animation web | `motion-design` (projet), `gsap-core`, `gsap-react`, `animation-performance` |
| Accessibilité et revue d'interface | `web-design-guidelines`, `break-ui` |
| Documentation et cahier des charges | `docs-governance`, `markdown-pro` |
| Vidéo promo (Remotion) | `remotion-motion-graphics` |
| Fin de chaque lot | `verification-before-completion` |

Skills présents dans le pack mais **non installés** dans cette installation et donc retirés de la table : `api-and-interface-design`, `migration`, `deprecation-and-migration`, `security-and-hardening`, `doubt-driven-development`, `frontend-ui-engineering`, `accessibility-engineering`, `documentation-and-adrs`, `spec-driven-development`, `pixel2motion`, `git-workflow-and-versioning`, `code-review-and-quality`.

**Skills à ne pas laisser décider du style visuel** : `design-taste-frontend`, `unslop`, `apple-design`. Ils proposent des effets (glow, verre, dégradés, fonds WebGL) que la charte interdit. Utilise-les au plus pour un conseil de hiérarchie ou d'espacement, jamais pour les couleurs, les polices ou les effets. (Les autres noms du pack — `ui-ux-pro-max`, `impeccable`, `react-bits`, `theme-factory`, `banner-design` — ne sont pas installés ici.)

**Skills interdits sur ce dépôt** car ils envoient du code ou des données à l'extérieur : les `caveman-*` liés au cloud, `connect`, `connect-apps`, `skill-share`, `developer-growth-analysis` (aucun n'est installé ici). `strix-pentest` est installé mais uniquement sur mes propres environnements, après accord.

## Design system (cible)

`#780000` (accent) · `#121212` (encre) · `#FFFFFF` · `Space Grotesk` (titres) + `DM Sans` (corps) · composants `border-none` · icônes Lucide ≥ 16px · GSAP sobre, `prefers-reduced-motion` respecté.

⚠️ Le code actif est **déjà aligné** : 123 occurrences de `#780000`, `Space Grotesk` + `DM Sans` chargées dans `index.html`, 0 occurrence des anciens tokens `#E11D48/#E60023`. `DESIGN_SYSTEM_SUMMARY.md` reste une doc historique à rafraîchir.

### Précisions de la charte active

- **Tokens** (jamais de valeur en dur dans les composants) : `--accent #780000`, `--ink #121212`, `--white #FFFFFF`, `--surface-1 #F6F6F6`, `--surface-2 #EFEFEF`. Un seul vert de succès, défini en token et lisible avec texte blanc (ex. `#1B7F46`). Une erreur se signale par une icône et un message, pas seulement par une couleur.
- Tout nouveau code utilise les tokens. Les occurrences en dur existantes (123 de `#780000`) se migrent pendant le chantier C.
- **Typographie** : titres Space Grotesk 700, `letter-spacing: -0.03em` à partir de 24 px ; corps DM Sans 400 / 500 / 700, interligne 1,4, 16 px minimum sur mobile ; polices `.woff2` auto-hébergées latin + latin-ext, `font-display: swap`, aucun appel Google Fonts ; échelle 12 / 14 / 16 / 20 / 24 / 32 / 40 / 56 px ; montants `Intl.NumberFormat('fr-FR')` avec chiffres tabulaires. Pas d'italique, pas de tracking large sur petits textes, pas de dégradé de texte.
- **Composants** : `border-none`, coins arrondis, grille de 8 px, cibles tactiles ≥ 44 px, hiérarchie par surfaces et espacement plutôt que par bordures ou ombres lourdes. Icônes Lucide 24 px, trait 2 px (minimum absolu ≥ 16 px à l'écran). Squelettes, jamais de spinner nu. États vides, 403, 404, 500, hors-ligne. Modale de confirmation, jamais `window.confirm`.
- **Motion** : GSAP sobre, un mouvement principal par écran, entrées 300 à 450 ms, sorties 0,5× plus courtes, `prefers-reduced-motion` respecté. Animer uniquement `transform` et `opacity`. Three.js / Rive réservés aux moments signature.
- **Interdits** : `#E11D48`, `#E60023`, verts citron ou olive, dégradés violets ou bleus, glow/bloom, glassmorphism (`backdrop-filter`), fond crème + serif, polices distantes.
- **Cas particuliers** : le rouge `#780000` est interdit comme couleur de texte sur fond sombre (contraste insuffisant) : texte blanc, rouge en fond de bouton seulement. Logo toujours en SVG, espace libre égal à la hauteur du D, taille minimale 120 px, variantes pleine couleur / monochrome / inversée, jamais étiré, recoloré ni avec ombre. Contraste ≥ 4,5:1 et focus clavier visible. Dans les visuels générés par IA, ne conserve ni logo ni texte : superpose le vrai logo et de vrais libellés.

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

Vérifications complémentaires : `./vendor/bin/phpunit` dans chaque service touché ; `docker compose config && docker compose up -d` doit laisser 9 conteneurs Up.

**Définition de « terminé »** : exigence livrée, test automatisé vert, build vert, documentation mise à jour, aucun secret ni PIN en clair.

## Style de communication

- Réponds en français, de façon directe.
- Fin de chaque lot : 10 lignes maximum (ce qui a changé, fichiers touchés, tests lancés avec leur résultat réel, décisions qui m'attendent).
- Si tu n'es pas sûr d'un fait (réglementation, API GeniusPay, comportement d'une librairie), dis-le et indique où le vérifier.

## Références

- `agent/system-rules.md` — règles strictes anti-vibe-coding.
- `skills/*/SKILL.md` — compétences métier.
- `AUDIT_APPLICATION.md` — findings bloquants (à lire avant tout changement paiement/rôles/auth).
- `documents/` — PRD, TRD, UML, charte.
