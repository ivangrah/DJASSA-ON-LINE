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

## Performance & production — règles 8, 14–19, 28–29

Le référentiel complet est dans `AGENTS.md`. Checklist backend obligatoire :

- **8** — dédupliquer les GET et verrouiller anti-double-clic les POST de paiement côté client/API.
- **14** — pagination systématique (`paginate(20)` ou curseur) ; **interdiction formelle de `Model::all()`**.
- **15** — appels inter-services indépendants en parallèle : `Http::pool()` (Laravel), `Promise.all()` (React).
- **16** — cache Redis des données chaudes (catalogue public, boutiques populaires, catégories) avec invalidation événementielle (`article.created`, `article.updated`).
- **17** — jobs Redis asynchrones : e-mails/SMS Brevo, PDF, compression d'images, matching des souhaits.
- **18** — timeouts stricts `connectTimeout(3)` / `timeout(8)` sur GeniusPay, Brevo, Google OAuth + retry contrôlé.
- **19** — retirer toute dépendance inutilisée de `composer.json` / `package.json`.
- **28** — SSG/SSR pour les pages vitrines et SEO.
- **29** — multi-instances derrière le gateway, répartition du trafic.

Ces règles s'appliquent au code existant lors de toute modification, pas seulement au neuf.
