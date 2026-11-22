# Djassa Online

Plateforme hybride e-commerce **C2C seconde main & troc** + **Boutiques Pro B2C** d'articles neufs — marché ouest-africain (Côte d'Ivoire, FCFA).

## Architecture (Phase 4 — 100 % microservices)

```
Client web / mobile
        │  HTTPS
        ▼
backend/gateway (nginx :8080)  ── JWT auth_request ──▶ auth-subscription-service :8080
        │
        ├── /api/v1/auth/*        → auth-subscription-service  (djassa_auth_db)
        ├── /api/v1/products*     → catalog-boutique-service   (djassa_catalog_db)
        ├── /api/v1/boutiques*    → catalog-boutique-service
        ├── /api/v1/souhaits*     → catalog-boutique-service
        ├── /api/v1/trocs*        → troc-engine-service        (djassa_troc_db)
        ├── /api/v1/escrow/*      → escrow-payment-service     (djassa_escrow_db)
        └── /api/v1/messages*     → notification-chat-service  (djassa_chat_db)

Appels inter-services : /internal/* signés HMAC (DJASSA_INTERNAL_SIGNING_KEY), réseau Docker privé (port 8081 non publié).
Événements : Redis Streams djassa.events (payment.*, escrow.*, troc.*, souhait.created).
```

Chaque service possède son propre `vendor/`, `composer.lock`, base PostgreSQL et jeux de tests. Le monolithe `backend-laravel/` a été retiré.

## Arborescence

| Dossier | Description |
|---|---|
| `backend/gateway/` | nginx : routage, rate limiting, validation JWT, Gzip, Cache-Control |
| `services/` | 5 microservices Laravel 11 autonomes (auth, catalog, troc, escrow, chat) |
| `database/` | `init/`, `schemas/`, `migrations/`, `seeders/`, `backups/` — Database-per-Service |
| `models/` | `schemas/` (JSON Schema), `enums/` — contrats partagés |
| `routes/` | Carte des routes externes et registre des endpoints |
| `frontend/web/` | SPA React (Vite, Tailwind, GSAP, Lucide) — dev sur `:5199` |
| `frontend/mobile/` | Client React Native (Expo) |
| `test/`, `security/` | Tests transverses et garde-fous (Semgrep, OWASP) |
| `documents/`, `agent/`, `skills/`, `video/`, `design/`, `pub/` | Documentation, règles agents, skills, médias |

## Contraintes métier clés

- **Double marché** : C2C (`condition = used`, troc activable) vs Boutiques Pro B2C (`condition = new`, stock, badge vérifié, `/boutique/:slug`, reçus PDF).
- **Moteur de troc** : pur (objet ⇄ objet) et mixte (objet + soulte FCFA — `montant_soulte_fcfa`) avec contre-offre vendeur et verrous d'inventaire.
- **Escrow & PIN** : fonds GeniusPay bloqués (`held`) → code PIN à 4 chiffres (bcrypt, confiné dans escrow) → remise physique → `released`.
- **Mur des Souhaits** : recherche inversée, alertes via notifications Brevo.
- **Rôles étanches** : `particulier | vendeur_pro | admin` ; le gateway injecte `X-User-Id` / `X-User-Role` vérifiés.

## Démarrage

Ports locaux utilisés : gateway **8080**, PostgreSQL **5433**, Redis **6380**, frontend web **5199**.

```bash
docker compose up -d                 # base + Redis + gateway + 5 services
cd frontend/web && npm install && npm run dev
./test/run-all.sh                    # 5 suites PHPUnit + lint/build + sécurité
```

## Vérification

```bash
curl http://127.0.0.1:8080/healthz
curl http://127.0.0.1:8080/api/v1/products
```

## Design System

`#780000` (accent) · `#121212` (encre) · `#FFFFFF` · `Space Grotesk` + `DM Sans` · composants `border-none` · icônes Lucide ≥ 16px. Voir `skills/react-ui-djassa/SKILL.md` et `AGENTS.md` (29 règles de performance).
