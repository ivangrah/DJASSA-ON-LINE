# Migrations versionnées — convention

Les migrations actives sont dans `backend-laravel/database/migrations/`. Ce dossier documente la convention cible, par base :

```
database/migrations/
  auth/      2026_11_20_000000_refactor_users_roles_and_plans.php
  catalog/   ...
  troc/      ...
  escrow/    ...
  chat/      ...
```

Règles :
- UUID en clé primaire (`gen_random_uuid()`), montants `NUMERIC(12,2)` en FCFA.
- Contrainte `CHECK` sur rôles, formules et statuts (jamais de validation côté client seulement).
- `down()` toujours fourni et testé.
- Aucune migration ne touche à la base d'un autre service.
