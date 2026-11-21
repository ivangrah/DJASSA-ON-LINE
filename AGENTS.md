# AGENTS.md — Djassa Online

> Point d'entrée lu automatiquement. Pour les règles détaillées, voir **`agent/system-rules.md`** et les skills dans **`skills/*/SKILL.md`**.

## État réel du dépôt

Deux topologies coexistent. **Ne rien supprimer.**

1. **Actif** : `backend-laravel/` (Laravel 11, API sur `:8899`) · `frontend/web/` (React/Vite sur `:5199`, ex-`frontend-web/`) · `frontend/mobile/` (Expo 58, ex-`mobile-app/`, non migré vers le nouveau modèle de rôles).
2. **Cible (scaffold)** : `backend/core-api/`, `services/`, `database/`, `models/`, `routes/`, `security/`. Structures et contrats créés, code métier non implémenté.

La migration du monolithe vers les microservices est une décision séparée, et doit être précédée des correctifs de `AUDIT_APPLICATION.md`.

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
5. **Backend actif = `backend-laravel/`.** 5 connexions nommées (`auth`, `catalog`, `troc`, `escrow`, `chat`) sont définies dans `config/database.php` et assignées à chaque modèle ; elles replient sur `DB_DATABASE` tant que l'isolation n'est pas activée. Les tests tournent sur `djassa_test`, jamais sur la base de dev.
6. **Pas de vibe-coding.** Voir `agent/system-rules.md`.

## Design system (cible)

`#780000` (accent) · `#121212` (encre) · `#FFFFFF` · `Space Grotesk` (titres) + `DM Sans` (corps) · composants `border-none` · icônes Lucide ≥ 16px · GSAP sobre, `prefers-reduced-motion` respecté.

⚠️ Le code actif est **déjà aligné** : 123 occurrences de `#780000`, `Space Grotesk` + `DM Sans` chargées dans `index.html`, 0 occurrence des anciens tokens `#E11D48/#E60023`. `DESIGN_SYSTEM_SUMMARY.md` reste une doc historique à rafraîchir.

## Commandes

```bash
# Application active
cd backend-laravel && docker run --rm -d --name djassa-api --network host -v "$PWD":/app -w /app djassa-php:8.4
cd frontend/web && npm install && npm run dev     # :5199

# Stack cible (scaffold)
docker compose config
docker compose up -d

# Vérification / audit
cd frontend/web && npm run build
./security/scripts/run-security-audit.sh
./test/run-all.sh   # 4 tests Feature : rôles, anti-auto-troc, webhook HMAC, PIN
```

## Références

- `agent/system-rules.md` — règles strictes anti-vibe-coding.
- `skills/*/SKILL.md` — compétences métier.
- `AUDIT_APPLICATION.md` — findings bloquants (à lire avant tout changement paiement/rôles/auth).
- `documents/` — PRD, TRD, UML, charte.
