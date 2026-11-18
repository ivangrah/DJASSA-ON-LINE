# Djassa Online

Plateforme hybride e-commerce **C2C seconde main & troc** + **Boutiques Pro B2C** d'articles neufs — marché ouest-africain (Côte d'Ivoire, FCFA).

## Arborescence monorepo

| Dossier | Description |
|---|---|
| `backend-laravel/` | API REST Laravel 11 / PHP 8.3+ · PostgreSQL 16 (UUID, NUMERIC(12,2), JSONB, TSVECTOR) · Sanctum + Google OAuth · GeniusPay (Escrow + PIN) · Brevo (emails/SMS) |
| `frontend-web/` | SPA React (JavaScript / Vite) · Tailwind CSS · GSAP · Lucide Icons |
| `mobile-app/` | Application React Native (Expo) — bottom tab bar avec bouton central `+` |
| `docs/` | PRD, TRD, App Flow, schéma backend (MLD/DDL), charte graphique & maquettes |

## Contraintes métier clés

- **Double marché** : C2C (`condition = used`, troc activable) vs Boutiques Pro B2C (`condition = new`, stock, badge vérifié, `/boutique/:slug`, reçus PDF).
- **Moteur de troc** : pur (objet ⇄ objet) et mixte (objet + soulte FCFA — `montant_soulte_fcfa`) avec contre-offre vendeur.
- **Escrow & PIN** : fonds GeniusPay bloqués (`held`) → code PIN à 4 chiffres (haché bcrypt) → remise physique → `released`.
- **Mur des Souhaits** : recherche inversée, alertes automatiques au match.

## Démarrage (backend)

> ⚠️ Ports locaux : `8000` et `5173` sont déjà occupés sur cette machine — l'API Djassa tourne sur **8899**.
> L'hôte n'a pas `pdo_pgsql` : utiliser l'image Docker de dev (`backend-laravel/docker/php/Dockerfile.local`).

```bash
cd backend-laravel
docker build -t djassa-php:8.4 -f docker/php/Dockerfile.local .
docker run --rm --network host -v "$PWD":/app -w /app djassa-php:8.4 php artisan migrate:fresh --seed
docker run --rm -d --name djassa-api --network host -v "$PWD":/app -w /app djassa-php:8.4   # http://127.0.0.1:8899
```

## Design System

Rouge `#E11D48` / `#E60023` · Noir `#121212` / `#0F172A` · Blanc `#FFFFFF` · `Plus Jakarta Sans` + `Inter` · Lucide Icons.
