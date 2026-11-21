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
