# Contrats de données partagés (Single Source of Truth)

Ces schémas JSON décrivent les champs **réellement échangés** entre les microservices et les deux frontends. Ils sont validés en CI par `backend-laravel/tests/Feature/ContractTest.php`.

| Schéma | Couvre |
|---|---|
| `user.schema.json` | `GET /api/v1/auth/me`, `UserResource` |
| `article.schema.json` | `GET /api/v1/products`, `ProductResource` |
| `boutique.schema.json` | `GET /api/v1/boutiques/{slug}`, `BoutiqueResource` |
| `offre_troc.schema.json` | `BarterOfferResource` (troc pur/mixte) |
| `message.schema.json` | `MessageResource`, messagerie |
| `transaction.schema.json` | `TransactionResource` — le PIN n'y figure jamais (`pin_visible: false`) |
| `webhook_payload.schema.json` | Payload entrant GeniusPay (signature HMAC) |
| `checkout.schema.json` | Réponse d'initiation de paiement |

Les montants FCFA sont sérialisés en **chaînes décimales** (`"185000.00"`) pour éviter les erreurs de virgule flottante côté JavaScript.

Les enums correspondants sont dans `../enums/` et alignés sur les contraintes `CHECK` PostgreSQL :
- `StatutEscrow::INITIATED = 'initiated'` (et non `pending`)
- `StatutTroc::COMPLETED/CANCELLED/REJECTED` (et non `refused`/`expired`)

## Règle de versionnage (D5)

Ajouter un champ = compatible. Retirer ou renommer un champ = breaking change → bascule `/api/v2`.
