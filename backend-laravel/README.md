# Djassa Online — Backend Laravel 11 (API REST)

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

# Servir l'API
docker run --rm -d --name djassa-api --network host -v "$PWD":/app -w /app djassa-php:8.4
# → http://127.0.0.1:8899/api/v1/health
```

## Démarrage rapide (hôte **avec** pdo_pgsql)

```bash
cp .env.example .env && php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve --port=8899   # http://127.0.0.1:8899
```

## Comptes de démonstration (seeder)

Mot de passe unique : **`password`** — PIN escrow démo : `1234` (T1, held) · `4321` (T2, released).

| Rôle | Email |
|---|---|
| Admin | `admin@djassaonline.ci` |
| Particulier (C2C) | `koffi@djassaonline.ci`, `adjoua@djassaonline.ci`, `yao@djassaonline.ci`, `mariame@djassaonline.ci`, `serigne@djassaonline.ci`, `djassa.siline@djassaonline.ci` |
| Boutique Pro vérifiée | `bakayoko@djassaonline.ci` (Quincaillerie Moderne), `awa@djassaonline.ci` (Electro Services Pro) |
| Boutique Pro en attente KYC | `baba@djassaonline.ci` (Bazar de l'Habitat) |

## Base de données — règles d'intégrité

- PK **UUID** (`gen_random_uuid()`), montants **NUMERIC(12,2) FCFA**, dates `timestamptz`
- `CHECK` : prix ≥ 0, quantité stock ≥ 0, rôles/statuts énumérés, tentatives PIN ≤ 5
- `condition = 'neuf'` réservé aux articles rattachés à une boutique (`boutique_id NOT NULL`)
- FTS français (`to_tsvector('french', …)`) + index **GIN** sur `articles.recherche`, `souhaits.mots_cles`, `articles.specs`
- Index partiels (`statut = 'published'`, `est_trocable`, `vente_flash`)
- Trigger `set_updated_at()` sur toutes les tables métier (filet de sécurité du `updated_at`)

> **Note RLS** : la figure 5 du DDD suggère du Row Level Security. Ici, le rôle applicatif
> (`postgres` côté conteneur dev) est propriétaire des tables → RLS serait contourné.
> L'autorisation est donc garantie par les **Laravel Policies** (cf. TRD §7.1 RBAC) :
> publication d'articles neufs réservée aux comptes `pro_seller` vérifiés, libération
> escrow réservée au vendeur, etc. (Étape 2)

## Intégrations (clés à renseigner dans `.env`)

`GOOGLE_CLIENT_ID/SECRET` · `GENIUSPAY_API_KEY/API_SECRET/WEBHOOK_SECRET` · `BREVO_API_KEY` · Mailpit local sur `:1025` (UI `:8025`).
