# Escrow & Payment Service (`escrow-payment-service`)

> **Scaffold architectural.** Le code métier réside encore dans `backend-laravel/` (monolithe). Ce dossier définit le contrat cible ; voir `AGENTS.md` et `AUDIT_APPLICATION.md`.

## Responsabilité

Paiements GeniusPay (Wave, Orange Money, MTN, Moov), séquestre des fonds (held → released) et code PIN à 4 chiffres haché.

## Base de données

Propriétaire exclusif : **`djassa_escrow_db`**. Aucun accès SQL direct à une autre base (règle « Database-per-Service »).

## Endpoints

- `POST /api/v1/escrow/checkout — création de session de paiement`
- `POST /api/v1/escrow/webhooks/geniuspay — webhook signé HMAC-SHA256`
- `POST /api/v1/escrow/transactions/{ref}/pin — remise des fonds (PIN bcrypt)`
- `GET  /api/v1/escrow/transactions/{ref} — statut`

## Événements

Publiés :
- `payment.pending`
- `payment.succeeded`
- `payment.failed`
- `escrow.released`

Consommés :
- `troc.accepted (soulte)`
- `plan.chosen (activation Pro)`

## Contrat d'API

Statuts : pending → held → released (ou refunded/failed). Référence unique. Idempotence via webhooks_logs(reference, payload_hash). PIN : 4 chiffres, bcrypt, 5 tentatives max, jamais sérialisé dans une réponse.

## Sécurité

Aucune simulation de paiement accessible hors environnement local/testing. La vérification HMAC est OBLIGATOIRE dès que webhook_secret est configuré ; le mode mock doit exiger app()->environment(['local','testing']). Findings B1, B5, W3, M4.

## Tests Feature attendus

- [ ] Signature HMAC invalide rejetée
- [ ] Webhook rejoué ignoré (idempotence)
- [ ] PIN erroné verrouillé après 5 essais
- [ ] PIN jamais exposé dans les Resources
- [ ] Activation Pro impossible sans webhook valide
