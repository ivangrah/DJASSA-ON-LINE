# Tests — Djassa Online

Ce dossier regroupe les **tests transverses** (plusieurs services, ou plusieurs clients). Les tests locaux restent à leur place :

| Portée | Emplacement |
|---|---|
| Unitaires / Feature d'un service | `services/<service>/tests/Feature/`, `backend-laravel/tests/` |
| Tests transverses (ce dossier) | `tests/` |
| SAST / checklist conformité | `security/` |

## Taxonomie

| Dossier | Ce qui y va | Commande typique |
|---|---|---|
| `unit/` | Logique pure partagée (helpers FCFA, normaliseurs de rôle, validateurs) partagée entre services | `npm test` / `php artisan test --filter=Unit` |
| `feature/` | Cas d'usage métier complets (ex. « un particulier ne peut pas créer de boutique ») | `php artisan test --testsuite=Feature` |
| `integration/` | Communications inter-services : gateway → service, événements Redis/RabbitMQ, base par service | `docker compose up -d && npm test --prefix tests/integration` |
| `contract/` | Contrats d'API (OpenAPI, schémas de réponse, versions) et compatibilité producteur/consommateur | `npx schemathesis run tests/contract/openapi.yaml` |
| `e2e/` | Parcours utilisateur réels dans un navigateur (web + mobile web) | `npx playwright test` |
| `performance/` | Charge, latence, pics (k6) | `k6 run tests/performance/smoke.js` |
| `security/` | Tests d'intrusion ciblés : IDOR, escalade de privilèges, webhook HMAC, brute-force PIN | `./security/scripts/run-security-audit.sh` |
| `postman/` | Collections Postman inter-services (à exporter depuis Postman) | `newman run tests/postman/djassa-microservices.json` |
| `fixtures/` | Jeux de données déterministes (UUID, comptes de test, charges utiles webhook) | — |

## Règles

1. **Aucune donnée réelle** : utiliser les UUID déterministes de `database/seeders/abidjan_seed.sql`.
2. **Aucun secret** : les tokens/PIN de test viennent de variables d'environnement (`TEST_*`).
3. **Un test = une règle métier** documentée dans `AUDIT_APPLICATION.md` ou `security/SECURITY_CHECKLIST.md`.
4. **Aucun test ne doit dépendre de l'ordre d'exécution** : chaque test crée et nettoie ses propres données.
5. Les tests de paiement utilisent le mode mock **uniquement** avec `APP_ENV=local|testing` (finding B5).

## Lancer tout

```bash
./tests/run-all.sh
```
