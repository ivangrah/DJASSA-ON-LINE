---
name: security-escrow-audit
description: Audit de sécurité ciblé sur le séquestre Djassa — GeniusPay, webhooks HMAC, PIN 4 chiffres haché, anti-brute-force et règles Semgrep. Utiliser avant toute modification du paiement, des rôles ou de l'authentification.
---

# Sécurité & Séquestre (Djassa)

## Règles d'or

1. Clés GeniusPay et `webhook_secret` jamais en dur ; échec du boot en production si absentes.
2. Webhook HMAC-SHA256 sur le **corps brut** + `hash_equals`, idempotence `(reference, payload_hash)`.
3. Mode mock limité à `local|testing`. Aucun bouton « simuler le paiement » accessible en production (web et mobile).
4. PIN : 4 chiffres, bcrypt, 5 tentatives puis verrouillage, jamais dans une réponse ni un log.
5. Fonds en séquestre confinés dans `djassa_escrow_db` + `escrow-payment-service`.
6. Rate limiting sur `register`, `login`, `google` (10/min).

## Outils

```bash
./security/scripts/run-security-audit.sh
semgrep scan --config security/semgrep/djassa-rules.yml --error .
```

## Checklist

Voir `security/checklists/OWASP_TOP10_DJASSA.md` et `AUDIT_APPLICATION.md` (findings B1–B6, W1–W3, M1–M6).
