# Auth Service (`auth-subscription-service`)

> **Scaffold architectural.** Le code métier réside encore dans `backend-laravel/` (monolithe). Ce dossier définit le contrat cible ; voir `AGENTS.md` et `AUDIT_APPLICATION.md`.

## Responsabilité

Identités, authentification Sanctum/Google OAuth, choix d'offre (gratuit/pro) et RBAC (particulier / vendeur_pro / admin).

## Base de données

Propriétaire exclusif : **`djassa_auth_db`**. Aucun accès SQL direct à une autre base (règle « Database-per-Service »).

## Endpoints

- `POST /api/v1/auth/register — inscription (crée toujours un particulier sans plan)`
- `POST /api/v1/auth/google — connexion Google OAuth`
- `POST /api/v1/auth/login — délivrance du token Sanctum`
- `POST /api/v1/auth/select-plan — CHOIX INITIAL UNIQUEMENT (gratuit | pro)`
- `GET  /api/v1/auth/me — profil + rôle + plan + has_active_pro_plan`
- `GET  /internal/jwt/validate — validation interne pour le gateway (auth_request)`

## Événements

Publiés :
- `user.registered`
- `plan.chosen`
- `plan.expired`
- `user.role_changed`

Consommés :
- `payment.succeeded (pour activer le plan Pro après paiement vérifié)`

## Contrat d'API

Réponse /me : { id (UUID), role, plan_abonnement, abonnement_actif_jusqu_au, has_active_pro_plan }. Les rôles sont exactement particulier | vendeur_pro | admin ; les formules gratuit | pro.

## Sécurité

Le endpoint select-plan ne doit JAMAIS accorder d'entitlement Pro : il enregistre une intention et renvoie redirect_to vers escrow-payment-service. L'activation réelle se fait uniquement sur payment.succeeded vérifié. Voir AUDIT_APPLICATION.md finding B1.

## Tests Feature attendus

- [ ] Un utilisateur gratuit ne peut pas obtenir vendeur_pro sans paiement
- [ ] select-plan est refusé si le plan est déjà choisi (422)
- [ ] admin ne peut pas être rétrogradé
- [ ] Google id_token vérifié (audience + expiry, jamais en query string)
