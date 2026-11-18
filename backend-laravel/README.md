# Djassa Online — Backend Laravel 11 (API REST `/api/v1`)

API REST de la plateforme (marché ivoirien, FCFA) : C2C occasion & troc, Boutiques Pro B2C, Escrow GeniusPay + PIN.

## Prérequis

- PHP 8.3+ avec `pdo_pgsql` (⚠️ l'hôte ne l'a pas : image Docker de dev fournie)
- PostgreSQL 16 (local via Docker → `infra-db-1`, base `djassa_online`)
- Composer 2

## Démarrage rapide (hôte **sans** pdo_pgsql)

```bash
# Build de l'image PHP CLI de dev (une seule fois)
docker build -t djassa-php:8.4 -f docker/php/Dockerfile.local .

# Migrer + seeder (réseau hôte pour joindre PostgreSQL sur 127.0.0.1:5432)
docker run --rm --network host -v "$PWD":/app -w /app djassa-php:8.4 php artisan migrate:fresh --seed

# Servir l'API (port 8899 — 8000 est déjà occupé sur cette machine)
docker run --rm -d --name djassa-api --network host -v "$PWD":/app -w /app djassa-php:8.4
# → http://127.0.0.1:8899/api/v1/health
```

## Smoke test de bout en bout

```bash
./scripts/smoke-api.sh
```

Réinitialise la base (migrate:fresh --seed), démarre l'API et vérifie le parcours complet :
auth → catalogue FTS → RBAC publication neufs → Mur des Souhaits (match auto) → troc mixte
(proposition → contre-offre → acceptation) → paiement GeniusPay (mock) → webhook HMAC → escrow
`held` → PIN erroné puis correct → `released` + crédit vendeur → reçu PDF → messages.

## Comptes de démonstration (seeder)

Mot de passe unique : **`password`**.

| Rôle | Email |
|---|---|
| Admin | `admin@djassaonline.ci` |
| Particulier (C2C) | `koffi@djassaonline.ci`, `adjoua@djassaonline.ci`, `yao@djassaonline.ci`, `mariame@djassaonline.ci`, `serigne@djassaonline.ci`, `djassa.siline@djassaonline.ci` |
| Boutique Pro vérifiée | `bakayoko@djassaonline.ci` (Quincaillerie Moderne), `awa@djassaonline.ci` (Electro Services Pro) |
| Boutique Pro en attente KYC | `baba@djassaonline.ci` (Bazar de l'Habitat) |

PIN escrow démo : `1234` (T1, held) · `4321` (T2, released). En conditions réelles, le PIN
(généré à l'état `held`) est envoyé par e-mail Brevo à l'acheteur — jamais renvoyé par l'API.

## Surface API `/api/v1` — Étape 2

| Méthode | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/health` | — | Sonde santé + connexion BDD |
| POST | `/auth/register` · `/auth/login` | — | Inscription / connexion email |
| POST | `/auth/google` | — | Connexion Google Cloud OAuth 2.0 (`id_token`) |
| POST | `/auth/logout` · GET `/auth/me` | Sanctum | Session |
| GET | `/products` | — | Catalogue hybride — `?mode=barter\|sale` `?condition=new\|used` `?marche=occ\|neuf` `?category=` `?q=` `?flash=1` `?sort=` `?per_page=` |
| GET | `/products/flash` | — | Carrousel Ventes Flash Boutiques |
| GET | `/products/{id}` · GET `/products/mine` | — / Sanctum | Fiche (incrémente vues) / mes annonces |
| POST / PUT / DELETE | `/products` · `/products/{id}` | Sanctum | Publication rapide (MVC : `neuf` réservé B2C vérifié) / édition / archivage |
| POST | `/products/{id}/flash` · DELETE `/products/{id}/flash` | Sanctum (pro vérifié) | Lancer / arrêter une Vente Flash (Prix flash + durée h) |
| GET | `/boutiques` · `/boutiques/{slug}` | — | Vitrines B2C officielles (`/boutique/:slug`) |
| POST / PUT | `/boutiques` · `/boutiques/{id}` | Sanctum pro | Ouverture (slug unique auto) / édition |
| GET | `/boutiques/me/dashboard` | Sanctum pro | Stats : CA, encaissé séquestré, stock critique ≤ 2, ventes/jour, flash actives |
| POST | `/boutiques/{id}/verify` | Admin | Activation badge Vendeur Vérifié (KYC) |
| GET / POST | `/barter-offers` · `/barter-offers/{id}` | Sanctum | Mes propositions (`?sens=recues\|envoyees`) / création (articles + soulte) |
| PATCH | `/barter-offers/{id}/respond` | Sanctum | `accept` · `reject` · `counter` (vendeur) / `accept_counter` · `decline_counter` (acheteur) |
| POST | `/payments/geniuspay/init` | Sanctum | Session GeniusPay — `type=achat` (article) ou `type=troc_mixte` (soulte) |
| POST | `/webhooks/geniuspay` | **HMAC** | Confirmation GeniusPay → escrow `held` + génération PIN + e-mail acheteur |
| GET | `/transactions` · `/transactions/{id}` | Sanctum | Mes transactions / détail (parties) |
| POST | `/transactions/{id}/verify-pin` | Sanctum (vendeur) | Remise physique : PIN → `released`, crédit vendeur, reçu |
| GET | `/transactions/{id}/receipt` | Sanctum (parties) | Reçu / facture PDF (dompdf) |
| GET / POST / DELETE | `/souhaits` · `/souhaits/{id}` · `/souhaits/mine` | — / Sanctum | Mur des Souhaits (FTS + match auto à la publication) |
| POST | `/souhaits/{id}/respond` | Sanctum | Répondre à un souhait avec l'un de ses articles |
| GET / POST | `/messages/conversations` · `/messages/thread` · `/messages` · `/messages/unread-count` | Sanctum | Chat + cartes d'actions rapides (`offre_prix`, `carte_troc`, `systeme`) |

**Rate limiting** : `throttle:api` — **60 req/min** par utilisateur (ou IP) sur les routes authentifiées (TRD §6).
**En-tête webhook** : `X-GeniusPay-Signature` = `HMAC-SHA256(corps_brut, GENIUSPAY_WEBHOOK_SECRET)` — le endpoint est hors auth mais **exige la signature** hors mode MOCK.
**Format d'erreur** : `422` Validation → `{message, errors{field[]}}` · `403` RBAC/Policy · `404` absent · `409` conflit d'état · `423` PIN bloqué (5 tentatives).

## Services (app/Services)

| Service | Rôle |
|---|---|
| `GeniusPayService` | Initialisation session paiement, **vérif HMAC-SHA256** webhook, `releaseFunds`, frais escrow (défaut 3 %). Mode MOCK auto sans `GENIUSPAY_API_KEY` (référence `GP-FAKE-*`). |
| `EscrowService` | États `initiated → held → released / failed`, **PIN 4 chiffres haché bcrypt**, 5 tentatives max, libération = transaction DB (crédit vendeur, article sold, stock décrémenté, offre → completed). |
| `BarterService` | Moteur troc pur & mixte : création, accept/reject/counter/accept_counter/decline_counter, **verrouillage pessimiste `SELECT … FOR UPDATE`** des articles, anti double-troc, création transaction soulte ou PIN immédiat si soulte = 0. |
| `WishlistMatchService` | Match déterministe souhait ↔ article (≥ 2 tokens significatifs FR, filtre budget) → message in-app + e-mail Brevo. |
| `BrevoNotificationService` | Emails transactionnels (API v3) & SMS OTP ; sans clé → log `[Brevo:DEV]` (PIN visible dans `storage/logs/laravel.log` en dev). |
| `ReceiptService` | Facture / reçu PDF (DomPDF, vue `receipts.transaction`). |

## Intégrations (clés dans `.env`)

`GOOGLE_CLIENT_ID/SECRET` · `GENIUSPAY_API_KEY/API_SECRET/WEBHOOK_SECRET` (+ `GENIUSPAY_FRAIS_ESCROW_PCT`) · `BREVO_API_KEY` · Mailpit local `:1025` (UI `:8025`).

## Décisions techniques

- **RLS PostgreSQL** non activée (rôle propriétaire la contourne) → autorisation par **Laravel Policies** (TRD §7.1 RBAC : `neuf` réservé B2C vérifié, escrow réservé au vendeur, messages réservés aux participants).
- **Queue** `sync` en dev (`MatchWishesJob` inline) · Redis + Horizon recommandé en prod (`QUEUE_CONNECTION=redis`).
- **Images** uploadées sur `storage/app/public/products/{user}` (MIME jpeg/png/webp, max 8 Mo) + `php artisan storage:link`.
- **Pas de suppression physique** : archivage via `statut=archived`.
