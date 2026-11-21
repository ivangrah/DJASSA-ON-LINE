# backend/core-api — cible du noyau Laravel

> **Scaffold.** Le noyau Laravel 11 actif est encore `backend-laravel/` (Sanctum, Google OAuth, policies RBAC, migrations). Ce dossier accueillera le noyau d'orchestration une fois la migration décidée.

## Responsabilités cibles

- Validation centrale du JWT pour le gateway (`GET /internal/jwt/validate`).
- Injection des headers signés `X-User-Id` / `X-User-Role`.
- Orchestration des appels inter-services et des transactions distribuées.
- Aucun accès direct aux bases des microservices.

## Avant migration

Lire `AUDIT_APPLICATION.md` : les findings B1 (Pro gratuit), B2 (rate limiting), B5 (webhook non signé) doivent être corrigés dans le monolithe avant tout déplacement.
