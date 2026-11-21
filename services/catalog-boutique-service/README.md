# Catalogue & Boutiques (`catalog-boutique-service`)

> **Scaffold architectural.** Le code métier réside encore dans `backend-laravel/` (monolithe). Ce dossier définit le contrat cible ; voir `AGENTS.md` et `AUDIT_APPLICATION.md`.

## Responsabilité

Articles d'occasion (C2C) et neufs (B2C), boutiques Pro (/boutique/:slug), catégories et mur des souhaits.

## Base de données

Propriétaire exclusif : **`djassa_catalog_db`**. Aucun accès SQL direct à une autre base (règle « Database-per-Service »).

## Endpoints

- `GET    /api/v1/catalog/articles — filtres marche, categorie, sort, per_page`
- `GET    /api/v1/catalog/articles/{id} — détail + galerie`
- `POST   /api/v1/catalog/articles — création (neuf réservé à X-User-Role=vendeur_pro)`
- `GET    /api/v1/catalog/boutiques/{slug} — vitrine publique`
- `POST   /api/v1/catalog/boutiques — création réservée vendeur_pro`
- `GET/POST /api/v1/catalog/souhaits — mur des souhaits`

## Événements

Publiés :
- `article.created`
- `article.updated`
- `boutique.verified`
- `souhait.created`

Consommés :
- `user.role_changed`
- `plan.expired (masquage des boutiques Pro)`

## Contrat d'API

Un article neuf exige boutique_id + X-User-Role=vendeur_pro. Les montants sont en FCFA (NUMERIC(12,2)). Les références vers auth-subscription-service sont des UUID logiques, jamais des FK inter-bases.

## Sécurité

Contrôle obligatoire de X-User-Role transmis par le gateway pour toute création d'article neuf ou de boutique (règle d'or n°2). Ne jamais faire confiance à un rôle envoyé par le client.

## Tests Feature attendus

- [ ] Création boutique refusée pour particulier
- [ ] Article neuf refusé sans boutique
- [ ] Slug unique
- [ ] Recherche FTS/TSVECTOR
