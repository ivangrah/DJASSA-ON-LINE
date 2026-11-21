# Policies — source unique

Les Policies Laravel **actives** sont exclusivement dans :

`backend-laravel/app/Policies/`

| Policy | Rôle |
|---|---|
| `ArticlePolicy.php` | Propriété d'un article |
| `BoutiquePolicy.php` | Propriété d'une boutique |
| `OffreTrocPolicy.php` | `create()` exige un plan choisi ; doit être appelée dans `BarterOfferController::store()` (finding B4) |
| `MessagePolicy.php`, `SouhaitPolicy.php`, `TransactionPolicy.php` | Autres domaines |

Aucune copie locale : modifier la policy dans `backend-laravel/` uniquement. Ce dossier ne contient volontairement aucun `.php`.
