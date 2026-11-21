# Prompt standard — nouveau microservice

Contexte : projet Djassa Online, architecture décrite dans `AGENTS.md`.

Demande : crée le service `<NOM>` dans `services/<NOM>/` avec :
1. un `README.md` (responsabilité, base propriétaire, endpoints, événements publiés/consommés, contrat, sécurité, tests attendus) ;
2. `app/` et `tests/Feature/` ;
3. son schéma dans `database/schemas/djassa_<domain>_db.sql` (UUID, NUMERIC(12,2), CHECK) ;
4. ses routes dans `routes/api-gateway.routes.json` et le fichier `routes/<role>.routes.php` adapté ;
5. la configuration dans `docker-compose.yml` et `backend/gateway/nginx.conf` ;
6. les tests dans `test/integration/` et `test/feature/`.

Contraintes : Database-per-Service, X-User-Role vérifié, aucune clé en dur. Ne pas modifier `frontend/web` ni `frontend/mobile` sans demande explicite.
