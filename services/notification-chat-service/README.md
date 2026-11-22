# Notification & Chat Service (`notification-chat-service`)

> Microservice autonome (Phase 4). Base dédiée, `vendor/` propre, aucun appel direct à un autre domaine (API interne signée + événements Redis).

## Responsabilité

Messagerie temps réel (WebSockets via Redis Streams) et notifications Brevo (e-mails/SMS).

## Base de données

Propriétaire exclusif : **`djassa_chat_db`**. Aucun accès SQL direct à une autre base (règle « Database-per-Service »).

## Endpoints

- `GET  /api/v1/messages/conversations — liste des conversations`
- `GET  /api/v1/messages/conversations/{id} — messages`
- `POST /api/v1/messages/conversations/{id} — envoyer un message`
- `WS   /ws/conversations/{id} — diffusion temps réel`

## Événements

Publiés :
- `message.sent`
- `notification.created`

Consommés :
- `troc.offre_created`
- `payment.succeeded`
- `souhait.created`
- `plan.expired`

## Contrat d'API

Un message contient au plus 4000 caractères. LesNotifications sont classées par type (troc, vente, souhait, abonnement, securite) et canal (email, sms, push, in_app).

## Sécurité

Vérifier l'appartenance à la conversation avant lecture/envoi (IDOR). Ne jamais inclure de PIN ni de données bancaires dans une notification.

## Tests Feature attendus

- [ ] Accès refusé à une conversation étrangère
- [ ] Message > 4000 refusé
- [ ] Notification de séquestre sans PIN
