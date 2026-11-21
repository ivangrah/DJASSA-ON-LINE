# État d'avancement

## Actif

- `backend-laravel/` : API Laravel 11 sur `:8899` (Docker `djassa-php:8.4`), migrations appliquées.
- `frontend/web/` : SPA React 19 / Vite sur `:5199` (déplacée depuis `frontend-web/`).
- `frontend/mobile/` : client Expo 58 (non migré vers le nouveau modèle de rôles).

## Scaffold (pas encore de code métier)

- `backend/core-api/`, `services/*`, `models/`, `routes/`, `database/` (cible), `security/`.

## Décisions enregistrées

- Deux topologies coexistent jusqu'à migration explicite ; ne pas supprimer le monolithe.
- Le code actif est **déjà aligné** : 123 occurrences de `#780000`, `Space Grotesk` + `DM Sans` chargées dans `index.html`, 0 occurrence des anciens tokens `#E11D48/#E60023`. `DESIGN_SYSTEM_SUMMARY.md` reste une doc historique à rafraîchir.
- Bloquants : `AUDIT_APPLICATION.md` doit être traité avant mise en production.

## Consolidation 2026-11-21 (faite)

- `data/`, `agent/skills/`, `skills/find-skills/` et 49 copies de `find-skills` supprimés ; seul `.agents/skills/find-skills` reste.
- `mobile-app/` unifié dans `frontend/mobile/` (plus de double source mobile).
- `security/policies/*.php` supprimés : source unique = `backend-laravel/app/Policies/`.
- 5 connexions `auth`, `catalog`, `troc`, `escrow`, `chat` ajoutées à `config/database.php` (repli sur `DB_DATABASE`) ; chaque modèle porte son `$connection`.
- `UserFactory` corrigée (rôle `particulier`) — finding B3.
- 4 tests Feature créés : `RoleIsolationTest`, `AntiAutoTrocTest`, `GeniusPayWebhookTest`, `PinValidationBruteForceTest` → 12 passent, 2 `incomplete` documentés (B1, idempotence webhook).
- Base de test dédiée `djassa_test` dans phpunit.xml ; la base de dev n'est jamais touchée.

## Décisions D1–D5 validées

Voir `decisions-architecture.md` : Strangler Fig, isolation DB immédiate, HTTP signé + Redis Streams, bloquants d'abord, `/api/v1` jusqu'à breaking change.

## À faire (dans l'ordre)

- **En cours : B1, B5, W1/W2 avec tests** (D4) avant toute extraction.
- ~~Puis D2 : activer les 5 variables `DB_*_DATABASE`.~~ ✅ FAIT (5 bases migrées, 21 tests verts).
- Puis M1–M3 (mobile) et Phase 1 du Strangler Fig.
- Porter le modèle rôles/offres sur le mobile.
- Décider de la migration monolithe → microservices.
