# Décisions d'architecture

| Décision | Raison |
|---|---|
| Database-per-Service | Isolation des données et des responsabilités ; aucune FK inter-bases. |
| Gateway centralise JWT et headers `X-User-*` | Évite que chaque service réimplémente la validation. |
| Séquestre isolé dans `escrow-payment-service` | Résilience : compromis catalogue/chat ne donne pas accès aux fonds. |
| Modèles et routes à la racine | Source de vérité commune aux microservices et aux deux frontends. |
| `security/` séparé de `test/` | `test/` valide le fonctionnel ; `security/` porte les garde-fous défensifs. |
| Design system cible `#780000` | Nouvelle direction validée dans `skills/react-ui-djassa/`. |

Les décisions antérieures sont dans `DESIGN_SYSTEM_SUMMARY.md` et `docs/` (désormais `documents/`).


## Décisions validées (2026-11-21) — D1 à D5

| ID | Décision | Conséquence |
|---|---|---|
| **D1** | ✅ **RÉALISÉ (Phase 4).** **Strangler Fig.** `backend-laravel/` est l'orchestrateur de transition et disparaît en Phase 4 au profit de `backend/gateway` + 5 microservices autonomes. | Aucun nouveau code métier dans le monolithe après la Phase 1 ; chaque extraction passe par une façade + shadow traffic. |
| **D2** | ✅ **ACTIVE (2026-11-21) — Isolation PostgreSQL immédiate.** Positionner `DB_AUTH_DATABASE`, `DB_CATALOG_DATABASE`, `DB_TROC_DATABASE`, `DB_ESCROW_DATABASE`, `DB_CHAT_DATABASE` vers les 5 bases de `database/schemas/`. | Interdiction des JOIN cross-domaines dès la Phase 1 ; les UUID logiques sont les seules références inter-services. |
| **D3** | **HTTP interne sécurisé** (réseau Docker privé + header signé) pour le synchrone ; **Redis Streams** pour l'asynchrone. Pas de gRPC, pas de mTLS. | Appels `/internal/*` avec token signé ; les headers `X-User-*` ne sont acceptés que s'ils viennent du gateway. Événements idempotents `(reference, payload_hash)`. |
| **D4** | **Bloquants d'abord.** Corriger B1, B5, W1/W2 **avec tests PHPUnit** avant d'extraire le premier service. | Ne pas extraire une faille. Les tests `incomplete` deviennent des assertions réelles. |
| **D5** | **Rester en `/api/v1`** tant qu'il n'y a pas de breaking change sur les contrats JSON de `models/schemas/`. | Le versionnage `/api/v2` est déclenché par un changement de contrat, pas par une date. |

### Séquence d'extraction (Strangler Fig)

```
Phase 0 (fait)   connexions nommées + modèle $connection, repli DB_DATABASE
Phase 0.5        D2 activé + B1/B5/W1/W2 corrigés et testés
Phase 1          contrats extraits vers models/ ; monolithe = orchestrateur
Phase 2          escrow-payment-service (premier extrait, façade + shadow traffic)
Phase 3          auth-subscription → catalog-boutique → troc-engine → notification-chat
Phase 4 ✅       backend-laravel retiré ; backend/gateway seul point d'entrée
```

### État D2 (vérifié)

- 5 bases créées et migrées : 17 migrations, 19 tables chacune (schéma complet répliqué pendant la transition ; le découpage fin par domaine viendra en Phase 1/2).
- 0 contrainte `FOREIGN KEY` cross-domaine : `App\Support\DomainSchema::isolated()` les désactive à la migration ; l'intégrité inter-domaines est applicative (API interne signée + événements).
- `php artisan test` : 21 tests réussis / 51 assertions ; API `:8899` HTTP 200.
