# Checklist sécurité — Djassa Online

Référence : OWASP ASVS 4.0 / Top 10 2021. Les items cochés doivent être prouvés par un test ou une commande, pas par une affirmation.

## 🔴 Bloquants identifiés lors de l'audit du 2026-11-21

- [ ] **B1** — `select-plan` n'accorde plus jamais `vendeur_pro` sans paiement vérifié ; garde `hasChosenPlan()` ; activation uniquement sur webhook valide.
- [ ] **B5** — Mode mock GeniusPay limité à `local|testing` ; `verifyWebhookSignature()` exige un secret hors local ; échec du boot en production si clés absentes.
- [ ] **B2** — `throttle` sur `register`, `login`, `google` (login/register : 10/min).
- [ ] **B3** — `UserFactory` utilise `particulier` et un `plan_abonnement` valide.
- [ ] **B4** — `OffreTrocPolicy::create()` réellement appelée dans `BarterOfferController::store()`.
- [ ] **W3 / M4** — Aucun bouton « simuler le paiement » accessible en production (web + mobile).
- [ ] **T1** — Tests Feature + CI exécutant `php artisan test`, `npm run lint`, `npm run build`.

## Authentification & session

- [ ] Tokens Stockés de façon sûre (HttpOnly/SameSite en cible ; CSP stricte en attendant).
- [ ] Google `id_token` vérifié côté serveur (audience + expiry), jamais en query string.
- [ ] Déconnexion révoque le token côté serveur avant nettoyage client.
- [ ] Aucune déconnexion sur erreur réseau transitoire (401 uniquement).

## Autorisation / RBAC

- [ ] Rôles exacts : `particulier | vendeur_pro | admin`.
- [ ] Gateway injecte `X-User-Id` / `X-User-Role` après validation JWT, et écrase tout header client.
- [ ] Boutique et article neuf : `X-User-Role === vendeur_pro`.
- [ ] IDOR : chaque ressource vérifie l'appartenance (boutique, article, transaction, conversation).
- [ ] Admin n'est jamais bloqué par l'onboarding « choix d'offre ».

## Paiement & séquestre

- [ ] HMAC-SHA256 sur corps brut + `hash_equals`, secret non vide obligatoire.
- [ ] Idempotence des webhooks : `UNIQUE(reference, payload_hash)`.
- [ ] PIN : 4 chiffres, bcrypt, 5 tentatives, verrouillage, jamais dans une réponse ou un log.
- [ ] Séquestre isolé dans `djassa_escrow_db` ; aucun autre service n'y accède.
- [ ] Aucun `address in use` / simulateur de paiement côté client.

## Données & infrastructure

- [ ] Une base par service, un rôle PostgreSQL par base, `REVOKE ... FROM PUBLIC`.
- [ ] UUID en PK, `NUMERIC(12,2)` pour le FCFA, contraintes `CHECK` sur rôles/formules/statuts.
- [ ] Secrets via variables d'environnement / coffre, jamais commités (`.env` ignoré).
- [ ] TLS obligatoire entre gateway et clients ; mTLS recommandé gateway ↔ services.
- [ ] Sauvegardes `pg_dump` testées par restauration (`database/backups/backup.sh`).

## Exécution

```bash
./security/scripts/run-security-audit.sh
```

Fréquence attendue : avant chaque release, et à chaque modification du circuit d'authentification, de paiement ou de rôles.
