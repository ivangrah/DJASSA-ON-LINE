# Tests de contrat

Les schéma JSON de `models/schemas/` sont la **source de vérité** des champs échangés entre les microservices et les deux frontends.

## Exécution

Le test de contrat vit dans le backend Laravel (il a accès aux Resources et à la base de test dédiée) :

```bash
docker exec djassa-api php artisan test --filter=ContractTest
# ou, via le lanceur global :
./test/run-all.sh
```

`ContractTest` charge les schémas depuis `/repo/models/schemas` dans le conteneur (montage de la racine du dépôt) et valide :

| Endpoint | Schéma |
|---|---|
| `GET /api/v1/auth/me` | `user.schema.json` |
| `GET /api/v1/products` | `article.schema.json` (chaque élément de `data`) |
| `GET /api/v1/boutiques/{slug}` | `boutique.schema.json` |
| `POST /api/v1/webhooks/geniuspay` | `webhook_payload.schema.json` (payload entrant) |
| `POST /api/v1/payments/geniuspay/init` | `checkout.schema.json` |

Le validateur est volontairement minimal (types, champs requis, enums, objets imbriqués) pour éviter une dépendance Composer supplémentaire.

## Schémas disponibles

`user`, `article`, `boutique`, `offre_troc`, `message`, `transaction`, `webhook_payload`, `checkout`.

Les enums PHP correspondants sont dans `models/enums/` et sont alignés sur les contraintes `CHECK` PostgreSQL (`StatutEscrow::INITIATED = 'initiated'`, `StatutTroc::COMPLETED`, etc.).

## Règle

Ajouter un champ est compatible. Retirer ou renommer un champ est un **breaking change** → `/api/v2` (décision D5).
