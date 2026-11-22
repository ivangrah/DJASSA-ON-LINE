# Plan d'extraction — Phase 2 : `escrow-payment-service`

> **Statut : PROPOSÉ — en attente de validation.** Aucun fichier n'est déplacé tant que ce plan n'est pas approuvé.
> Stratégie : **Strangler Fig** (D1). Le monolithe reste opérationnel ; on extrait d'abord le domaine le plus isolé.

---

## 1. Principe

`escrow-payment-service` devient propriétaire exclusif de **`djassa_escrow_db`** (déjà isolée en D2). Pendant la transition, `backend-laravel` conserve une **façade HTTP** vers le service ; le gateway bascule progressivement le trafic. Le code monolithique n'est supprimé qu'après validation (shadow traffic puis bascule).

---

## 2. Fichiers à migrer depuis `backend-laravel/`

| Fichier actuel | Destination dans `services/escrow-payment-service/` | Note |
|---|---|---|
| `app/Services/GeniusPayService.php` | `app/Services/` | HMAC, mode mock, release/refund |
| `app/Services/EscrowService.php` | `app/Services/` | PIN bcrypt, 5 tentatives, états `held → released` |
| `app/Services/ReceiptService.php` | `app/Services/` | Reçus PDF (DomPDF) |
| `app/Http/Controllers/Api/V1/PaymentController.php` | `app/Http/Controllers/` |Initiation de paiement |
| `app/Http/Controllers/Api/V1/TransactionController.php` | `app/Http/Controllers/` | Consultation, PIN, reçu |
| `app/Http/Controllers/Api/V1/WebhookController.php` | **scindé** | Partie transaction/idempotence → service ; activation Pro → auth-service (event) ; notifications → chat-service (event) |
| `app/Models/Transaction.php` | `app/Models/` | `$connection = 'escrow'` |
| `app/Models/WebhookLog.php` | `app/Models/` | Quitte la base orchestrateur pour rejoindre escrow |
| `app/Http/Requests/InitPaymentRequest.php`, `VerifyPinRequest.php` | `app/Http/Requests/` | Validation |
| `app/Http/Resources/TransactionResource.php` | `app/Http/Resources/` | Contrat `transaction.schema.json` |
| `database/migrations/2026_11_18_000005_create_transactions_table.php` | `database/migrations/` | Table du domaine |
| `database/migrations/2026_11_21_000000_create_webhooks_logs_table.php` | `database/migrations/` | Idempotence |
| `tests/Feature/GeniusPayWebhookTest.php`, `PinValidationBruteForceTest.php` | `tests/Feature/` | Tests du service |
| Partie checkout/webhook de `tests/Feature/ContractTest.php` | `tests/Contract/` | Contrats du service |

**Reste dans le monolithe (façade)** : 3 contrôleurs très fins `PaymentController`, `TransactionController`, `WebhookController` qui proxyfient vers le service via HTTP interne signé.

---

## 3. Endpoints

### Externes (via `backend/gateway`)
| Méthode | Chemin | Remplace |
|---|---|---|
| POST | `/api/v1/escrow/checkout` | `/api/v1/payments/geniuspay/init` |
| GET | `/api/v1/escrow/transactions` | `/api/v1/transactions` |
| GET | `/api/v1/escrow/transactions/{id}` | `/api/v1/transactions/{id}` |
| POST | `/api/v1/escrow/transactions/{id}/verify-pin` | `/api/v1/transactions/{id}/verify-pin` |
| GET | `/api/v1/escrow/transactions/{id}/receipt` | `/api/v1/transactions/{id}/receipt` |
| POST | `/api/v1/escrow/webhooks/geniuspay` | `/api/v1/webhooks/geniuspay` (public, HMAC) |

Les anciens chemins restent **alias** pendant la transition (façade), puis sont retirés.

### Internes (`/internal/*`, réseau Docker privé + header signé — D3)
- `POST /internal/escrow/transactions` — création depuis catalog/troc
- `POST /internal/escrow/transactions/{id}/hold` — séquestre après webhook
- `POST /internal/escrow/transactions/{id}/release` — libération après PIN
- `GET  /internal/escrow/transactions/{id}` — état pour la façade
- `POST /internal/escrow/webhooks/log` — journalisation idempotence

Ces routes sont `internal;` dans nginx et refusent tout header `X-User-*` venant de l'extérieur.

### Événements Redis Streams (D3)
`payment.pending`, `payment.held`, `payment.succeeded`, `payment.failed`, `escrow.released` — avec clé d'idempotence `(reference, payload_hash)`.

---

## 4. Dépendances cross-domaines à casser (point critique)

Aujourd'hui `EscrowService` et `WebhookController` écrivent directement dans 4 autres domaines. Chaque écriture devient un appel interne ou un événement :

| Dépendance actuelle | Domaine | Remplacement |
|---|---|---|
| `Article::whereIn(...)->update(['statut' => SOLD])`, stock, `total_ventes` | catalog | `POST /internal/catalog/articles/{id}/statut` + event `escrow.released` |
| `User::whereKey(...)->increment('solde_portefeuille')` | auth | `POST /internal/auth/users/{id}/wallet/credit` |
| `OffreTroc::update(['statut' => COMPLETED])` | troc | `POST /internal/troc/offres/{id}/complete` ou event `escrow.released` |
| `Message::create(...)` (code PIN) | chat | event `escrow.held` consommé par notification-chat |
| `AbonnementController::activer()` | auth | event `payment.succeeded` consommé par auth-subscription |
| `WebhookLog` (orchestrateur) | escrow | déplacé dans `djassa_escrow_db` |

⚠️ **Aucune écriture directe** dans `users`, `articles`, `offres_troc`, `messages`, `abonnements` depuis le service escrow.

---

## 5. Variables d'environnement

```bash
DB_ESCROW_DATABASE=djassa_escrow_db       # déjà actif (D2)
GENIUSPAY_API_KEY=                         # obligatoire en production
GENIUSPAY_API_SECRET=                      # obligatoire en production
GENIUSPAY_WEBHOOK_SECRET=                  # obligatoire en production (HMAC)
GENIUSPAY_BASE_URL=https://api.geniuspay.ci/v1
GENIUSPAY_FRAIS_ESCROW_PCT=3
DJASSA_INTERNAL_SIGNING_KEY=              # header signé inter-services (D3)
REDIS_URL=redis://redis:6379
```

Le boot guard de `AppServiceProvider` (B5) est reproduit dans le service : échec immédiat en production si une clé GeniusPay manque.

---

## 6. Configuration du gateway (`backend/gateway/nginx.conf`)

```nginx
upstream escrow_service { server escrow-payment-service:8080; }

location /api/v1/escrow/ {
    limit_req zone=djassa_auth burst=5 nodelay;
    auth_request /_validate;                    # JWT central
    proxy_pass http://escrow_service/;
    proxy_set_header X-User-Id $upstream_http_x_user_id;
}

location = /api/v1/escrow/webhooks/geniuspay {
    # public (pas de JWT) mais HMAC vérifié côté service
    proxy_pass http://escrow_service/internal/webhooks/geniuspay;
}

location /internal/escrow/ {
    internal;
    allow 172.16.0.0/12; deny all;             # réseau Docker privé
    proxy_pass http://escrow_service/;
}
```

Les anciens `location /api/v1/payments/` et `/api/v1/transactions/` du monolithe restent en place pendant la phase de façade.

---

## 7. Séquence d'extraction (checklist)

1. Créer le service (squelette + Dockerfile + entrée compose + healthcheck).
2. Copier le code et les 2 migrations ; configurer l'env et `djassa_escrow_db`.
3. **Casser les 6 dépendances cross-domaines** (§4) via clients HTTP + événements.
4. Tests du service verts sur sa base (`php artisan test` dédié).
5. **Shadow traffic** : le gateway duplique les requêtes vers le service et compare les réponses (journaux, pas d'effet de bord).
6. Bascule lecture → écriture par endpoint, un à la fois.
7. Façade monolith = proxy HTTP pendant une release complète.
8. Retirer les routes et le code du monolithe ; archiver les anciens chemins.

## 8. Rollback

- Le code monolithique et la façade restent intacts jusqu'à l'étape 8.
- Repli instantané par flag de routage dans le gateway (retour vers le monolithe).
- Aucune migration destructive dans `djassa_escrow_db` pendant la transition.

## 9. Critères de validation

- `php artisan test` vert dans le service **et** dans le monolithe.
- Contrats `checkout.schema.json`, `transaction.schema.json`, `webhook_payload.schema.json` respectés.
- Signature HMAC invalide → 401 ; webhook rejoué → idempotent ; PIN verrouillé après 5 essais.
- Audit : **0** accès direct cross-base (`whereHas`/`join`/`Model::` d'un autre domaine).
- Gateway : `/api/v1/escrow/*` répond 200, `/internal/escrow/*` inaccessible depuis l'extérieur.

## 10. Décisions à valider avant le premier fichier déplacé

1. Conserver `/payments/geniuspay/init` et `/transactions/*` comme **alias** pendant la transition ? *(recommandé : oui)*
2. Confirmer Redis Streams comme unique bus d'événements (D3) ? *(recommandé : oui)*
3. Le service escrow génère et hache le PIN 4 chiffres (déjà le cas) — confirmé ?
4. Le journal `webhooks_logs` rejoint `djassa_escrow_db` (actuellement sur l'orchestrateur) — confirmé ?
5. Client HTTP interne signé avec `DJASSA_INTERNAL_SIGNING_KEY` (pas de mTLS, D3) — confirmé ?
