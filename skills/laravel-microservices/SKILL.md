---
name: laravel-microservices
description: Crée et maintient les microservices Laravel 11 de Djassa Online — Sanctum, Policies, API Resources,événements Redis et séparation Database-per-Service. Utiliser quand on ajoute un service, un endpoint interne ou une policy.
---

# Laravel Microservices (Djassa)

## Règles

1. Un service = une base (`database/init/01-create-databases.sql`). Jamais de requête SQL sur la base d'un autre service ; passer par API interne ou événement Redis Streams.
2. Auth : Sanctum + Google OAuth. Le gateway valide le JWT et injecte `X-User-Id` / `X-User-Role` vérifiés.
3. RBAC : `particulier | vendeur_pro | admin`. Le catalogue refuse boutique et article **neuf** si le rôle n'est pas `vendeur_pro`.
4. Toute action sensible appelle `$this->authorize()` ou un FormRequest `authorize()`. Les policies de référence sont dans `security/policies/`.
5. Les montants sont des `NUMERIC(12,2)` en FCFA. Aucun calcul d'argent en flottant JavaScript.
6. Routes déclarées dans `routes/` ; contrats de données dans `models/schemas/`.

## Pièges connus

- `select-plan` ne doit jamais accorder le statut Pro sans webhook vérifié (finding B1 de `AUDIT_APPLICATION.md`).
- `UserFactory` doit utiliser `particulier`, pas l'ancien rôle `user`.
- `OffreTrocPolicy::create()` doit être réellement appelée dans `store()`.
