# Modèles Eloquent — source de vérité

Les modèles PHP actifs se trouvent dans `backend-laravel/app/Models/` (monolithe en cours d'exécution). Ce dossier est le **registre cible** des entités partagées :

| Entité | Modèle source | Base propriétaire |
|---|---|---|
| User | `User.php` | djassa_auth_db |
| Abonnement | `Abonnement.php` | djassa_auth_db |
| Boutique | `Boutique.php` | djassa_catalog_db |
| Article | `Article.php` | djassa_catalog_db |
| OffreTroc | `OffreTroc.php` | djassa_troc_db |
| Transaction | `Transaction.php` | djassa_escrow_db |
| Souhait | `Souhait.php` | djassa_catalog_db |

Règle : aucun modèle ne porte de relation Eloquent vers une table d'une autre base. Les références croisées sont des UUID logiques (voir `../schemas/`).
