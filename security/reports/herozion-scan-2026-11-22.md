# Herozion — Scan sécurité Djassa Online (2026-11-22)

- **Outil** : `herozion 2.0.19` (`--offline`, 363 fichiers, hors `node_modules`/`vendor`)
- **Score brut** : 0/100 (F) — biaisé par le tier free (36 résultats verrouillés) et par des faux positifs
- **Détections** : 46 (35 high · 5 medium · 1 low · 5 info)
- **Tri manuel** : **6 réelles · 2 à durcir · 38 faux positifs**

## Résumé du tri

| Verdict | Nb | Détail |
|---|---:|---|
| 🔴 Réel | 6 | `.gitignore`, CSP, localStorage, Dockerfile root, image non épinglée, BOLA troc |
| 🟠 À durcir | 2 | Idempotency sur checkout/soulte |
| ⚪ Faux positif | 38 | HTTP interne Docker (13), `.env.example` (5), endpoints internes signés (10), guards existants (3), hors périmètre `video/` (7) |

## Détail des 46 détections

### 🔴 Réels (6)

| # | Sév. | Fichier:Ligne | Problème | Remédiation |
|---|---|---|---|---|
| 7 | high | `frontend/web/.gitignore:1` | `.env` non exclu du Git | Ajouter `.env`, `.env.*`, `!.env.example` (aucun `.env` n'est tracké aujourd'hui) |
| 8 | medium | `frontend/web/index.html:1` | Aucune **Content-Security-Policy** | CSP en tête HTTP : `default-src 'self'`, `object-src 'none'`, `base-uri 'none'`, `script-src 'self'` (+ nonces pour l'existant) |
| 9 | high | `frontend/web/src/context/AuthContext.jsx:45` | JWT en `localStorage` (lisible par tout XSS) | Passer en cookie **HttpOnly** ; à défaut durcir la CSP + échapper toute injection |
| 11 | high | `services/Dockerfile:0` | Aucun `USER` → conteneur en **root** | `RUN addgroup -S app && adduser -S app -G app` puis `USER app` |
| 12 | low | `services/Dockerfile:4` | Image `php:8.4-cli-alpine` non épinglée | Épingler `8.4.x` (idéalement `@sha256:…`) |
| 36 | high | `services/troc-engine-service/app/Http/Controllers/TrocController.php:35` | **BOLA** : `show()` exposé via le gateway (`/api/v1/trocs/{offre}`) sans vérifier que l'appelant est `acheteur_id` ou `vendeur_id` | `abort_unless(in_array($userId, [$offre->acheteur_id, $offre->vendeur_id], true), 403)` |

### 🟠 À durcir (2)

| # | Sév. | Fichier:Ligne | Problème | Remédiation |
|---|---|---|---|---|
| 29 | medium | `escrow…/InternalController.php:37` | `checkout` interne sans clé d'idempotence | `Idempotency-Key` (UUID) en entrée, `firstOrCreate` sur la référence |
| 30 | medium | `escrow…/PaymentController.php:49` | `init` public sans idempotence (double-clic → 2 transactions) | Accepter/générer une clé d'idempotence avant `Transaction::create` |

### ⚪ Faux positifs (38)

**HTTP interne Docker (13)** — `#1,2,3,4,5,16,17,18,24,31,37,38,39`
Trafic entre conteneurs sur le réseau privé (`api-gateway:8081`, `escrow-payment-service:8080`). Aucune exposition au monde (port 8081 non publié sur l'hôte). MITM impossible hors réseau Docker. → *Durcissement optionnel : mTLS interne.*

**`.env.example` (5)** — `#13,19,25,32,34`
`APP_DEBUG=true` dans des fichiers d'exemple. Aucun `.env` Réel tracké. → *Bonne pratique : basculer les exemples sur `APP_DEBUG=false` (défense en profondeur).*

**Endpoints internes signés (10)** — `#14,15,20,26,27,28,35`
Les `InternalController` sont derrière `X-Djassa-Signature` (HMAC `hash_equals`) et le port 8081 n'est pas publié. Le `#28` (`verifierPin` avec `vendeur_id` du body) reste à surveiller : le service appelant doit être fiable. → *Durcissement optionnel : supprimer le fallback `X-Gateway-Internal` du controller auth.*

**Guards déjà présents (3)** — `#21,22,33`
- `#21` `ProductController::show` → article **public** par conception.
- `#22` `ProductController::destroy` → `abort_unless($article->utilisateur_id === userId, 403)` (l.101).
- `#33` `MessageController::thread` → `abort_unless($conversation->hasParticipant($id), 403)` (l.25).

**Validation (1)** — `#23`
`whereRaw('COALESCE(...) >= ?', [(float) $request->input('min_price')])` : requête **paramétrée** et valeur castée → pas d'injection SQL.

**Message d'erreur (1)** — `#10`
`Cart.jsx:60` affiche `err.response?.data?.message` (message métier renvoyé par l'API) — pas une stack trace.

**Hors périmètre `video/` (7)** — `#40,41,42,43,44,45,46`
Fichiers de la promo vidéo (`.hyperframes`, `index.html` statique), pas l'application Djassa.

## Plan de remédiation proposé (ordre)

1. **#36 BOLA troc** — correctif + test de non-régression (accès croisé refusé 403).
2. **#8 CSP** — header nginx + repli meta, vérifier que l'app marche toujours.
3. **#7 `.gitignore`** — exclure `.env` (et auditer l'historique Git).
4. **#11 / #12 Dockerfile** — `USER` non-root + image épinglée.
5. **#9 JWT** — étude cookie HttpOnly (impact d'architecture SPA/API).
6. **#29 / #30 idempotence** — clé d'idempotence sur les flux financiers.
7. **#13/19/25/32/34** — `.env.example` sur `APP_DEBUG=false`.
