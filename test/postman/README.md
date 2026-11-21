# Collections Postman

Déposer ici les collections exportées (format JSON Postman v2.1) pour les tests inter-services.

Collection attendue : `djassa-microservices.json` — environnements `local` (`:8899` monolithe) et `target` (`:8080` gateway).

Exécution : `newman run tests/postman/djassa-microservices.json -e tests/postman/local.postman_environment.json`
