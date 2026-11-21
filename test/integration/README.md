# Tests d'intégration inter-services

Vérifient que le gateway route correctement, que les rôles sont propagés et que chaque service n'accède qu'à sa base.

## Scénarios prioritaires

1. `X-User-Role: particulier` → `POST /api/v1/catalog/boutiques` répond **403**.
2. `X-User-Role: vendeur_pro` → même appel répond **201**.
3. Un header `X-User-Role` envoyé par le client est **écrasé** par le gateway.
4. `POST /auth/select-plan {"plan":"pro"}` sans paiement → **aucun** entitlement Pro; renvoie `redirect_to`.
5. Webhook GeniusPay avec signature invalide → **401**, aucun `held`, aucun e-mail PIN.
6. Deux webhooks identiques (même référence + hash) → le second est ignoré.
7. Aucun service ne peut ouvrir une connexion SQL vers une base qui n'est pas la sienne.

## Prérequis

```bash
docker compose up -d
docker compose exec postgres psql -U postgres -c '\l'   # vérifier les 5 bases
```
