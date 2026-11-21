# Tests de contrat

Objectif : garantir qu'un changement de réponse d'un service ne casse pas ses consommateurs (web, mobile, autres services).

## Contrats à maintenir

- `openapi.yaml` (à générer depuis les routes de chaque service) — source de vérité.
- Réponse `GET /api/v1/auth/me` : `{ id, role, plan_abonnement, abonnement_actif_jusqu_au, needs_plan, has_active_pro_plan }`.
- Réponses paginées : `{ data: [], meta: { current_page, last_page, per_page, total } }`.
- `POST /auth/select-plan` : `{ redirect_to, message }`.
- Statuts de transaction : `pending | held | released | refunded | failed`.

## Règle

Ajouter un champ est compatible. Retirer ou renommer un champ est un **breaking change** : versionner `/api/v2` ou passer par une migration coordonnée.
