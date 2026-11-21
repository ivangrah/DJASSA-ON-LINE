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
