---
name: security-escrow-audit
description: Audite et durcit le séquestre Mobile Money de Djassa Online - checkout GeniusPay, webhooks signés HMAC, PIN à 4 chiffres, transitions d'état (initiated, held, released, refunded, failed, disputed), litiges, retraits, appels internes signés entre microservices. À utiliser avant toute modification ou revue de escrow-payment-service, du PIN, des webhooks, des montants, des remboursements ou des délais de libération, et avant une mise en production. Produit un rapport classé par gravité avec preuves (fichier:ligne) et correctifs, sans modifier le code sans accord. Ne pas utiliser pour le style, le catalogue ou la messagerie.
---

# Audit du séquestre Djassa Online

## Périmètre

`services/escrow-payment-service`, base PostgreSQL `djassa_escrow_db`, routes `/escrow/*` et `/internal/escrow/*` du gateway, tests du service. `djassa_escrow_db` est un **nom de base de données**, pas un chemin disque.

## Règle de travail

Lecture seule par défaut. Rapport d'abord, correction après accord explicite. Chaque constat cite `fichier:ligne` + preuve. Écrire « non vérifié » pour ce qui ne peut pas être vérifié.

## Règles d'or

1. Clés GeniusPay et `webhook_secret` jamais en dur : variables d'environnement uniquement, échec du boot en production si absentes.
2. Webhook HMAC-SHA256 calculé sur le corps brut, comparaison avec `hash_equals`, idempotence par clé `(reference, payload_hash)`.
3. Mode mock limité aux environnements `local` et `testing` ; aucun bouton « simuler » en production.
4. PIN à 4 chiffres haché bcrypt **plus** pepper serveur ; 5 tentatives puis verrouillage ; jamais renvoyé dans une réponse ni écrit dans un log.
5. Fonds confinés dans `djassa_escrow_db` + `escrow-payment-service`.
6. Rate limiting `register` / `login` / `google` à 10 req/min.

## Points à contrôler

### PIN

- bcrypt + pepper d'environnement, jamais en clair en base, logs, e-mails ou réponses.
- Tentatives limitées **par transaction et par IP**, journalisées, verrouillage après 5 essais avec durée définie.
- Détenteur du PIN = acheteur ; le vendeur saisit le PIN après remise de l'article.
- Cohérence entre code, textes et notifications.

### Webhooks GeniusPay

- HMAC-SHA256 vérifié **avant** tout traitement, comparaison à temps constant, rejet si absent.
- Idempotence par clé d'événement unique.
- Montant et devise comparés à la transaction.

### Machine d'états

- `initiated → held`, `held → released`, `held → refunded`, `held → disputed`, `initiated → failed`, `disputed → released` ou `disputed → refunded`.
- Toute autre transition refusée par l'application **et** par contrainte en base.
- Libération / remboursement automatique après délai configurable si le PIN n'est jamais saisi.
- Troc sans soulte = confirmation mutuelle.
- Verrous transactionnels contre la double libération.

### Argent et données

- `NUMERIC(12,2)`, jamais de flottant ; arrondi défini.
- Clés uniquement en variables d'environnement.
- Appels internes signés `X-Djassa-Signature`.
- `X-User-Id` / `X-User-Role` jamais fournis par le client.
- Service escrow indisponible ⇒ administration sans 500.

## Outils

```bash
grep -rniE "pin|hmac|signature|secret|geniuspay" services/escrow-payment-service --include=*.php
grep -rnE "float|double" services/escrow-payment-service/database
cd services/escrow-payment-service && ./vendor/bin/phpunit
./security/scripts/run-security-audit.sh
```

## Checklist

Voir `security/checklists/OWASP_TOP10_DJASSA.md` et `AUDIT_APPLICATION.md` (findings B1–B6, W1–W3, M1–M6). Règles Semgrep : `security/semgrep/djassa-rules.yml` (`semgrep scan --config security/semgrep/djassa-rules.yml --error .`).

## Format du rapport

Tableau : gravité (critique / élevée / moyenne / faible), constat, preuve `fichier:ligne`, risque réel, correctif proposé, test à ajouter. Terminer par la liste de ce qui n'a pas pu être vérifié.
