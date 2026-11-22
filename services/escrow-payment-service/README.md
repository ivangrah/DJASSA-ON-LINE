# escrow-payment-service

Microservice autonome du domaine **séquestre & paiement** (Phase 2 — Strangler Fig).

## Propriété exclusive

- Base : **`djassa_escrow_db`** (`transactions`, `webhooks_logs`).
- Aucun modèle Eloquent cross-domaine : `User`, `Article`, `OffreTroc`, `Message`, `Abonnement` ne sont **jamais** accédés directement.
- Les effets cross-domaines passent par `InternalApiClient` (HTTP signé `X-Djassa-Signature`) et `RedisStreamPublisher` (Redis Streams `payment.*`, `escrow.released`).
- Le code PIN 4 chiffres est généré, haché (bcrypt) et vérifié **uniquement ici** ; il n'est jamais publié ni sérialisé (`pin_visible: false`).

## Endpoints

| Chemin | Rôle |
|---|---|
| `POST /api/v1/escrow/checkout` | Initier un paiement |
| `GET /api/v1/escrow/transactions` | Liste |
| `GET /api/v1/escrow/transactions/{id}` | Détail |
| `POST /api/v1/escrow/transactions/{id}/verify-pin` | Libération des fonds |
| `GET /api/v1/escrow/transactions/{id}/receipt` | Reçu PDF |
| `POST /api/v1/escrow/webhooks/geniuspay` | Webhook HMAC + idempotence |
| `/internal/escrow/*` | Appels internes signés (Docker privé) |

Les anciens chemins `/payments/geniuspay/init` et `/transactions/*` restent des **alias de transition**.

## Développement

En développement, le service réutilise `backend-laravel/vendor` via un symlink (`vendor -> ../../backend-laravel/vendor`) et un chargeur prépend pour `App\`/`Tests\`. En production, chaque service possède son propre `vendor/` (voir `composer.json`).

```bash
php artisan migrate --force
php artisan test
```

Variables d'environnement : voir `.env.example`. En production, le boot échoue si une clé GeniusPay ou `DJASSA_INTERNAL_SIGNING_KEY` manque (B5).
