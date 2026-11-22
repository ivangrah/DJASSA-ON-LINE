---
name: postgres-integrity
description: Garantit l'intégrité PostgreSQL de Djassa Online — UUID, NUMERIC(12,2) FCFA, contraintes CHECK, indexation et isolation Database-per-Service. Utiliser pour toute migration ou tout schéma.
---

# Intégrité PostgreSQL (Djassa)

## Conventions

- Clés primaires `UUID DEFAULT gen_random_uuid()`, jamais d'ID auto-incrémenté exposé.
- Montants `NUMERIC(12,2)` en FCFA ; `CHECK (montant >= 0)` (ou `> 0` pour une transaction).
- Rôles, formules et statuts validés par `CHECK` en base, en plus de la validation applicative.
- `TIMESTAMPTZ` partout.
- `down()` fourni et testé pour chaque migration.
- Un rôle PostgreSQL par base, `REVOKE ALL ON DATABASE ... FROM PUBLIC`.

## Vérification

```bash
# appliquer les schémas dans une base temporaire
for f in database/schemas/*.sql; do psql -d djassa_check -v ON_ERROR_STOP=1 -f "$f"; done
```

## Références

`database/init/`, `database/schemas/`, `models/schemas/`.

## Performance & production — règles 20–23

Le référentiel complet est dans `AGENTS.md`. Checklist base obligatoire :

- **20** — sélection explicite des colonnes (`select(['id','titre','prix','...'])`) ; jamais `SELECT *`.
- **21** — zéro N+1 : `with()` sur les relations du même domaine et `Model::preventLazyLoading(! app()->isProduction())` activé en dev (`AppServiceProvider`).
- **22** — index ciblés sur les FK, les colonnes de filtrage (`statut`, `marche`, `categorie`, `ville`) et de tri (`created_at`, `prix`).
- **23** — pool de connexions PgBouncer devant PostgreSQL pour absorber les pics entre microservices.

Rappel D2 : une base par domaine, aucune FK cross-domaine ; ces index sont à créer **par base**.
