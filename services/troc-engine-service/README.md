# Troc Service (`troc-engine-service`)

> Microservice autonome (Phase 4). Base dédiée, `vendor/` propre, aucun appel direct à un autre domaine (API interne signée + événements Redis).

## Responsabilité

Propositions de troc pur (objet ⇄ objet) et mixte (objet + soulte FCFA), contre-offres et verrouillage temporaire du stock.

## Base de données

Propriétaire exclusif : **`djassa_troc_db`**. Aucun accès SQL direct à une autre base (règle « Database-per-Service »).

## Endpoints

- `POST /api/v1/troc/offres — créer une offre (pur ou mixte)`
- `POST /api/v1/troc/offres/{id}/repondre — accepter / refuser / contre-offre`
- `GET  /api/v1/troc/offres — liste par expéditeur ou destinataire`
- `DELETE /api/v1/troc/offres/{id} — retrait`

## Événements

Publiés :
- `troc.offre_created`
- `troc.accepted`
- `troc.countered`
- `troc.stock_locked`

Consommés :
- `article.updated`
- `payment.succeeded (soulte mixte)`

## Contrat d'API

type=pur implique montant_soulte_fcfa=0 ; type=mixte exige une soulte > 0 et un paiement via escrow-service avant acceptation. Un verrou_stock expire automatiquement.

## Sécurité

La Policy create() exige hasChosenPlan() et doit réellement être appelée (finding B4). L'acceptation d'une contre-offre est une action ACHETEUR, pas uniquement vendeur.

## Tests Feature attendus

- [ ] Offre pure sans soulte
- [ ] Soulte mixte positive obligatoire
- [ ] Policy hasChosenPlan appliquée
- [ ] Verrou de stock expiré libéré
