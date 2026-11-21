# Audit d'architecture & inventaire des dossiers — Djassa Online

> Audit en lecture seule de l'arborescence courante. Date : 2026-11-21.
> Complément de `AUDIT_APPLICATION.md` (failles fonctionnelles/sécurité) : celui-ci porte sur **l'organisation du dépôt et le contenu exact de chaque dossier**.

---

> **Mise à jour post-audit (2026-11-21)** : les findings **A2**(doublons `find-skills`/`data/`), **A3** (mobile unifié), **A4** (policies copiées) et **A6** (0 test exécutable) ont été **traités**. A1 reste partiel : le backend actif est désormais explicitement `backend-laravel/` avec 5 connexions par domaine, mais les microservices restent des scaffolds. Les finding A5, A7–A10 restent ouverts.

## 1. Verdict d'architecture

Le dépôt est passé d'un monolithe à une **structure cible microservices documentée**, sans casser l'application active. C'est une bonne décision de conservation, mais elle crée une **double topologies** qu'il faudra trancher.

| État | Dossiers | Rôle |
|---|---|---|
| **Actif** | `backend-laravel/`, `frontend/web/`, `frontend/mobile/`, `video/`, `design/rive/` | Code et livrables réels |
| **Scaffold / contrat** | `backend/`, `services/`, `models/`, `routes/`, `database/`, `security/`, `test/`, `skills/`, `agent/`, `pub/`, `design/{brand,illustrations,maquettes}` | Structures et documentation, pas de code métier |

**Taille utile** (hors `node_modules`, `vendor`, `.git`, `dist`) : **359 Mo**, dont ~19 Mo de PDF/images dans `documents/` et ~9,6 Mo dans `video/`.

**Cohérence vérifiée** : les 5 noms de services sont identiques dans `docker-compose.yml`, `backend/gateway/nginx.conf` et `routes/api-gateway.routes.json` ✅. `npm run build` passe ✅. `docker compose config` passe ✅.

---

## 2. Inventaire contenu par dossier

Légende : `[sous-dossier/]` = dossier, `n fichiers` = nombre total de fichiers hors dépendances.

### `agent/` — 7 fichiers · règles et mémoire des agents
```
system-rules.md                      anti-vibe-coding, séparation des rôles
context/
  decisions-architecture.md          décisions (Database-per-Service, gateway, design…)
  etat-avancement.md                 actif vs scaffold, décisions, à-faire
prompts/
  nouveau-service.md                 prompt standard création microservice
  audit-securite.md                  prompt audit en lecture seule
  refonte-ui.md                      prompt refonte d'écran
skills/
  find-skills/                       copie parasite (voir finding A2)
```
**Observation** : bon noyau, mais la copie de `find-skills/` n'a rien à faire ici.

### `backend/` — 3 fichiers · gateway + cible noyau
```
core-api/README.md                   cible : noyau Laravel d'orchestration
gateway/
  nginx.conf                         routage /api/v1/*, rate limiting, auth_request JWT
  middlewares/README.md              contrat X-User-Id / X-User-Role
```
**Observation** : 100 % scaffold. Le gateway n'est pas testé en conditions réelles.

### `backend-laravel/` — 190 fichiers · **API active**
```
app/                    58 fichiers  (Http/ 35, Models/ 9, Policies/ 6, Services/ 6, Jobs/ 1, Providers/ 1)
config/                  11 fichiers (app, auth, cors, database, logging, mail, queue, services…)
database/                27 fichiers (migrations/ 16, seeders/ 9, factories/ 1)
routes/                   3 fichiers (api.php = 50 routes, console.php, web.php)
resources/                5 fichiers (css, js, views)
scripts/smoke-api.sh      11,7 Ko
storage/                 58 fichiers (logs, cache, vues compilées)
tests/                    3 fichiers (TestCase + 2 stubs ExampleTest)
.env                      présent mais bien ignoré par .gitignore ✅
docker/php/Dockerfile.local        image PHP 8.4 + pdo_pgsql
```
**Observation** : seul composant réellement opérationnel (HTTP 200 sur :8899). Les findings B1–B11 de `AUDIT_APPLICATION.md` s'appliquent ici.

### `data/` — 1 fichier · **but non défini**
```
skills/find-skills/SKILL.md           copie parasite
```
**Observation** : dossier sans rôle architectural, contentant une seule copie de skill. Voir finding A2.

### `database/` — 9 fichiers · schémas PostgreSQL cibles
```
init/01-create-databases.sql          5 bases + 5 rôles, REVOKE PUBLIC
migrations/README.md                  convention de versionnement (pas de vraies migrations ici)
schemas/
  djassa_auth_db.sql                  3 tables (users, abonnements, personal_access_tokens)
  djassa_catalog_db.sql               4 tables (categories, boutiques, articles, souhaits)
  djassa_troc_db.sql                  3 tables (offres_troc, items_echanges, verrous_stock)
  djassa_escrow_db.sql                3 tables (transactions, webhooks_logs, pins_remise)
  djassa_chat_db.sql                  3 tables (conversations, messages, notifications)
seeders/abidjan_seed.sql              Cocody, Yopougon, Marcory, Plateau
backups/backup.sh                     pg_dump des 5 bases
```
**Vérifié** : 16 tables créées sans erreur dans une base temporaire ; seeder exécuté avec succès ✅.

### `design/` — 10 fichiers · identité visuelle
```
README.md                             tokens cibles + état du code
brand/                                VIDE
illustrations/                        VIDE
maquettes/                            VIDE
rive/djassa-pin-success/              9 fichiers (scene.rml, rive.yaml, build/, CLAUDE.md…)
```
**Observation** : contenu réel réduit à la animation Rive. Les 3 sous-dossiers vides sont des intentions, pas des livrables. Le `.rml` contient encore l'ancien rouge `FFE11D48` (coche du PIN) — à harmoniser avec `#780000` si la charte s'applique aussi à Rive.

### `documents/` — 15 fichiers · 9,09 Mo · documentation (ex-`docs/`)
```
prd_djassa_online.md (9,9 Ko)         cahier des charges
trd.txt (17 Ko) + trd_djassa_online.pdf
cartographie_des_flux_applicatifs_app_flow_djassa_online.md (10 Ko)
charte_graphique_et_maquettes_ui_ux_djassa_online.md (2 Ko)
guide.txt (9,7 Ko) + guide_ressources_visuelles.pdf
backend_schema.pdf (1,2 Mo) + backend_schema.txt + schema_physique.sql (34 Ko)
schema_page-1/2/3.png (2 Mo)          MLD en images
maquette_1.jpeg (2,6 Mo), maquette_2.jpeg (2,7 Mo)
```
**Observation** : documentation riche mais figée au 18/11, antérieure au refactor rôles/offres. À mettre à jour.

### `frontend/` — 100 fichiers hors `node_modules` · clients
```
mobile/README.md                       squelette cible (l'app active est frontend/mobile/)
web/                                   ex-frontend-web/ — React 19 / Vite 8 / Tailwind 3
  src/                                 43 fichiers
    App.jsx, main.jsx, index.css
    components/  12 .jsx (Navbar, RouteGuards, CheckoutModal, DjassaLogo3D…)
    pages/       9 .jsx + sous-dossiers particulier/ et pro/
    layouts/     4 .jsx (AppShell, ParticulierLayout, ProLayout, BottomTabBar)
    context/     3 .jsx (Auth, Cart, Toast)
    lib/         api.js, categories.js, format.js
  public/                              47 fichiers (dont images/ illustrations, logos)
  public/images/illustrations/         visuels de page
  vite.config.js                       proxy /api → :8899, port 5199
  tailwind.config.js                   tokens, Space Grotesk + DM Sans
```
**Vérifié** : `npm run build` ✅ (2828 modules, 15,3 s), 0 occurrence des anciens tokens de couleur/font ✅.
**Finding connu** : bundle unique de 1,94 Mo (545 Ko gzip) — voir W11 de `AUDIT_APPLICATION.md`.

### `frontend/mobile/` — 34 fichiers · **client Expo actif**
```
App.js, index.js, app.json, package.json, README.md, LICENSE
assets/                               6 PNG (icônes Android, splash, favicon)
src/                                  20 fichiers
  api.js, theme.js
  screens/        10 (Feed, ProductDetail, Publish, ProDashboard, Messages…)
  components/      4
  context/         2 (dont AuthContext.js)
  lib/             1
  navigation/      1 (RootNavigator.js)
```
**Observation** : dernier client à n'avoir **pas** intégré le modèle `particulier`/`vendeur_pro` + `plan_abonnement` (findings M1–M6 de `AUDIT_APPLICATION.md`).

### `models/` — 9 fichiers · contrats partagés
```
eloquent/README.md                     registre des modèles (source : backend-laravel/app/Models)
enums/
  UserRole.php                         particulier | vendeur_pro | admin + peutPublierNeuf()
  PlanAbonnement.php                   gratuit | pro
  StatutTroc.php                       pending|countered|accepted|refused|expired
  StatutEscrow.php                     pending|held|released|refunded|failed
schemas/
  user.schema.json, article.schema.json, transaction.schema.json
  README.md
```
**Observation** : enums et JSON Schema existent, mais **aucun test ne les valide** contre les réponses réelles de l'API.

### `pub/` — 1 fichier · promotion (**vide**)
```
README.md
campagnes/  VIDE · assets/  VIDE · copy/  VIDE
```
**Observation** : structure d'accueil uniquement. À remplir ou à supprimer si aucun usage prévu.

### `routes/` — 6 fichiers · registre des contrats d'API
```
README.md
api-gateway.routes.json                13 routes externes + service + auth + throttle
public.routes.php                      6 routes visiteurs
particulier.routes.php                 4 routes particulier/pro
pro.routes.php                         4 routes vendeur_pro
webhooks.routes.php                    GeniusPay + Brevo (HMAC, idempotence)
```
**Vérifié** : 5 services cités = 5 dossiers `services/` = 5 services dans le compose et le nginx ✅.

### `security/` — 7 fichiers (ex-`security-qa/`) · garde-fous
```
checklists/OWASP_TOP10_DJASSA.md       checklist + findings bloquants B1–B6, W1–W3, M1–M6
policies/
  ArticlePolicy.php, BoutiquePolicy.php, OffreTrocPolicy.php   copies de backend-laravel
  README.md
scripts/run-security-audit.sh          composer audit + npm audit + semgrep + tests + build
semgrep/djassa-rules.yml               4 règles (clés API, fuite PIN, SQL brut, webhook non signé)
```
**Observation** : les 3 policies sont des **copies** — risque de divergence avec le monolithe (finding A4).

### `services/` — 17 fichiers · 5 microservices scaffolds
```
Dockerfile                             image PHP générique (health.php)
health.php                             /health JSON
auth-subscription-service/    README.md + app/.gitkeep + tests/Feature/.gitkeep
catalog-boutique-service/     idem
escrow-payment-service/       idem
notification-chat-service/    idem
troc-engine-service/          idem
```
**Observation** : chaque README contient responsabilité, endpoints, événements, contrat et tests attendus — mais **zéro ligne de code métier**. Ne pas interpréter comme opérationnel.

### `skills/` — 5 dossiers · compétences projet
```
find-skills/                            copie parasite
laravel-microservices/SKILL.md         Sanctum, policies, Database-per-Service
postgres-integrity/SKILL.md            UUID, NUMERIC(12,2), CHECK
react-ui-djassa/SKILL.md               #780000, Space Grotesk, DM Sans, border-none
security-escrow-audit/SKILL.md         GeniusPay, HMAC, PIN bcrypt
```
**Observation** : 4 skills utiles + 1 copie parasite. S'y ajoutent **167 skills** dans `.agents/skills/` et **232** dans `.opencode/skills/` (386 uniques au total) — surcharge importante pour un projet de cette taille.

### `test/` — 11 fichiers (ex-`tests/`) · suite globale
```
README.md, run-all.sh                  taxonomie + lanceur
unit/.gitkeep, feature/.gitkeep        VIDES
contract/README.md                     OpenAPI, contrats
e2e/README.md                          Playwright
integration/README.md                  7 scénarios inter-services
performance/README.md                  k6
postman/README.md                      Newman
security/README.md                     IDOR, HMAC, PIN, throttle
fixtures/README.md                     UUID déterministes
```
**Observation** : **aucun test exécutable** ici, uniquement des README. Le monolithe n'a que 2 stubs `ExampleTest.php`. Voir finding A6.

### `video/` — 103 fichiers · 9,64 Mo (ex-`video-promo/`)
```
BRIEF.md, STORYBOARD.md, README.md
capture/          2 fichiers + assets/ VIDE + screenshots/ VIDE + BLOCKED.md
capture2/         36 fichiers (assets/ 20, extracted/ 9, screenshots/ 3, meta.json, AGENTS.md…)
djassa-promo/     62 fichiers
  index.html (23 Ko), hyperframes.json, meta.json, package.json
  AGENTS.md / CLAUDE.md (8 Ko)
  output-with-music.mp4 (4,0 Mo) + renders/*.mp4 (3,5 Mo)
  .thumbnails/ 44, assets/ 5, renders/ 1
```
**Observation** : livrable réel (film 30,5 s / 9 plans) mais 7,5 Mo de MP4 versionnés et un `capture/BLOCKED.md` à traiter.

---

## 3. Findings d'architecture

### 🟠 A1 — Double topologie non tranchée
`backend-laravel/` (actif) coexiste avec `backend/core-api/` + 5 services (scaffold) ; `frontend/mobile/` (actif) coexiste avec `frontend/mobile/` (vide). Risque de divergence des contrats et de confusion sur quel code modifier.
**Correctif** : décider d'une cible et d'une date de bascule, ou documenter explicitement « scaffold freeze » dans `agent/context/decisions-architecture.md`.

### 🟠 A2 — Prolifération de copies de skills (53+)
`find-skills` est présent dans **53 dossiers cachés** (`.adal`, `.claude`, `.windsurf`, `.qwen`…), plus `skills/find-skills/`, `agent/skills/find-skills/` et `data/skills/find-skills/`. Le CLI d'installation l'a propagé à chaque agent détecté. `data/` ne contient que cette copie.
**Correctif** : supprimer `agent/skills/`, `data/skills/` et `skills/find-skills/` ; nettoyer les dossiers d'agents inutilisés ; supprimer `data/` devenu vide. Garder `.agents/skills/` et `.opencode/skills/` comme seules sources.

### 🟠 A3 — Scaffolds présentés comme des projets
`services/*/app/` ne contient que `.gitkeep`, `test/{unit,feature}` idem, `pub/*` et `design/{brand,illustrations,maquettes}` sont vides. Un nouvel agent pourrait croire ces services opérationnels.
**Correctif** : conserver les `.gitkeep` mais ajouter un `STATUS: scaffold` explicite en tête de chaque README (déjà fait pour la plupart) et un badge dans `AGENTS.md`.

### 🟠 A4 — Policies dupliquées
`security/policies/*.php` sont des copies de `backend-laravel/app/Policies/`. Une correction de l'OffreTrocPolicy (finding B4) ne sera pas répercutée ici.
**Correctif** : remplacer les copies par un README avec liens relatifs, ou générer les copies en CI.

### 🟡 A5 — Contrats non vérifiés
`models/schemas/*.json` et `routes/api-gateway.routes.json` ne sont validés par aucun test automatique.
**Correctif** : ajouter un test de contrat (Ajv / schemathesis) dans `test/contract/` et le brancher dans `test/run-all.sh`.

### 🟡 A6 — Aucun test exécutable
`test/` ne contient que des README ; `backend-laravel/tests/` contient 2 stubs. C'est le finding T1 de l'audit applicatif, confirmé ici.
**Correctif** : implémenter au minimum les 4 tests bloquants listés dans `security/checklists/OWASP_TOP10_DJASSA.md`.

### 🟡 A7 — Bloat binaire versionné
`documents/` 9,09 Mo (PDF + JPEG), `video/` 9,64 Mo (dont 7,5 Mo de MP4) : ~19 Mo pour 359 Mo utiles.
**Correctif** : Git LFS pour `*.mp4`, `*.pdf`, `*.jpeg` ; garder les rendus finaux, archiver les intermédiaires `.thumbnails/` et `capture2/extracted/`.

### 🟡 A8 — Documentation datée
`documents/` est antérieur au 19/11 et ne reflète ni les rôles `particulier/vendeur_pro`, ni les formules `gratuit/pro`, ni le `#780000`. `DESIGN_SYSTEM_SUMMARY.md` (racine) est également historique.
**Correctif** : réécrire la charte et le TRD à partir de `AGENTS.md` + `models/schemas/`.

### 🔵 A9 — Animation Rive non alignée
`design/rive/djassa-pin-success/scene.rml:26` utilise `FFE11D48` alors que la charte cible est `#780000`.
**Correctif** : décider si le bicolore de la coche reste l'ancien rouge (identité historique) ou suit la nouvelle charte.

### 🔵 A10 — `capture/BLOCKED.md`
Blocage documenté dans `video/capture/` non résolu. À traiter ou à archiver.

---

## 4. Ce qui est sain

- ✅ Aucun fichier perdu lors des renommages (`frontend-web→frontend/web`, `docs→documents`, `video-promo→video`, `rive-animations→design/rive`, services renommés).
- ✅ Cohérence des 5 noms de services entre compose, nginx et registre de routes.
- ✅ Schémas SQL exécutés avec succès (16 tables) et seeder fonctionnel.
- ✅ Build frontend OK, compose OK, scripts shell et PHP lint OK, JSON valides.
- ✅ `.env` bien ignoré par Git.
- ✅ Design system effectivement appliqué dans le code (123 × `#780000`, Space Grotesk + DM Sans chargées, 0 ancien token).
- ✅ Séparation `test/` (fonctionnel) vs `security/` (défensif) respectée.

---

## 5. Priorités

1. **A1** — trancher monolithe vs microservices (décision d'architecture).
2. **A2** — nettoyer les 53 copies de skills et le dossier `data/`.
3. **A6 + A5** — tests exécutables et validation des contrats.
4. **B1/B5/M1–M3/W1–W2** (`AUDIT_APPLICATION.md`) — avant toute production.
5. **A4, A7, A8** — policies, LFS, documentation.

## Décisions validées (D1–D5) — 2026-11-21

| ID | Décision |
|---|---|
| D1 | Strangler Fig : `backend-laravel/` orchestrateur de transition, retiré en Phase 4 au profit de `backend/gateway` + 5 microservices. |
| D2 | ✅ **Activée** : 5 bases migrées (17 migrations, 19 tables chacune), FK cross-domaines désactivées via `DomainSchema`, 21 tests verts. |
| D3 | HTTP interne sécurisé (Docker privé + header signé) en synchrone, Redis Streams en asynchrone ; ni gRPC ni mTLS. |
| D4 | Correction de **B1, B5, W1/W2 avec tests PHPUnit** avant toute extraction de service. |
| D5 | Maintien de `/api/v1` jusqu'à un breaking change réel sur `models/schemas/` ; `/api/v2` alors seulement. |

Conséquence sur le finding **A1** : la double topologie est désormais **planifiée et cadrée** (stratégie Strangler Fig), plus ambiguë. Les findings A5, A7–A10 restent ouverts.
