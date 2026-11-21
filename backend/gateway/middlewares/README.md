# Middlewares du Gateway

## `X-User-Id` / `X-User-Role` — contrat de propagation

Le gateway ne fait **jamais** confiance aux en-têtes envoyés par le client. Il les écrase :

1. `auth_request /_validate` appelle `auth-subscription-service` (`GET /internal/jwt/validate`).
2. `auth-subscription-service` vérifie la signature JWT, l'expiration et l'audience, puis renvoie
   `X-User-Id: <uuid>` et `X-User-Role: particulier | vendeur_pro | admin`.
3. nginx récupère ces valeurs via `auth_request_set` et les injecte dans la requête aval.
4. Tout en-tête `X-User-*` fourni par le client est supprimé (à ajouter dans nginx :
   `proxy_set_header X-User-Role $user_role;` — déjà fait — et ne pas relaye le header client).

## Règles aval

- `catalog-boutique-service` refuse la création d'une boutique ou d'un article **neuf** si `X-User-Role != vendeur_pro`.
- `troc-engine-service` exige un `plan_abonnement` choisi (via auth-subscription-service) avant création d'offre.
- `escrow-payment-service` ignore complètement `X-User-Role` pour les opérations financières :
  il revérifie l'appartenance de la transaction côté base.

## À faire avant production

- Signer les headers eval (HMAC avec secret partagé) ou passer par un service mesh (mTLS),
  car un service aval joint directement pourrait forger ces headers.
- Ajouter un the `trust` CIDR : seul le gateway peut joindre les ports 8080 des services.
