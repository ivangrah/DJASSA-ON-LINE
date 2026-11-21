# Audit application — Djassa Online

> Audit en lecture seule de l'arbre de travail courant (nombreuses modifications **non commitées**).
> Périmètre : `backend-laravel/`, `frontend-web/`, `frontend/mobile/`, documentation et outillage.
> Méthode : revue statique ciblée (3 auditeurs parallèles) + vérifications `php -l`, `vite build`, `oxlint`.
> Date : 2026-11-21

---

## 1. Synthèse exécutive

L'application est un monorepo cohérent et relativement abouti (API Laravel 11 / PostgreSQL, SPA React 19, client Expo 58). **Le problème central est un refactor métier à moitié propagé** : la séparation stricte `particulier` / `vendeur_pro` + abonnements (`plan_abonnement`) a été appliquée au backend et au web, mais **pas du tout au mobile**, et son point d'entrée (`select-plan`) contient une faille de sécurité majeure.

| Domaine | 🔴 Critique | 🟠 Élevé | 🟡 Moyen | 🔵 Faible |
|---|---:|---:|---:|---:|
| Backend (API, migrations, paiement) | 1 | 5 | 3 | 2 |
| Frontend web | 0 | 3 | 7 | 3 |
| Mobile (Expo) | 3 | 3 | 6 | 1 |
| Transverse (tests, CI, dette outillage) | 0 | 1 | 1 | 0 |

**Verdict :** ne pas passer en production avant d'avoir corrigé les 4 blocants (§3.1). Le build web passe et aucun import cassé ne subsiste ; la qualité de base est bonne, les défauts sont concentrés sur le nouveau modèle rôles/offres et sur le circuit de paiement.

---

## 2. Ce qui est vérifié correct

**Backend**
- Aucune référence résiduelle aux anciennes valeurs (`pro_seller`, `plan_expire_at`, rôle `user`, formule `free`) hors migrations historiques et chemins `down()`.
- Migrations `refactor_users_roles_and_plans` et `align_abonnements_formule` : SQL Postgres valide, `up()`/`down()` symétriques, conversion `free → gratuit` sans perte, ordre de rollback correct.
- Alias middleware `role` enregistré (`bootstrap/app.php:15-17`) ; contournement admin volontaire et correct.
- Protection IDOR effective sur les endpoints `update` via `authorize()` dans les FormRequests (`UpdateBoutiqueRequest`, `UpdateProductRequest`).
- Webhook HMAC : corps brut + `hash_hmac('sha256')` + `hash_equals`, avec gardes d'idempotence.
- PIN : bcrypt, regex 4 chiffres, verrouillage après 5 tentatives, jamais sérialisé (`pin_visible=false`).
- `UserResource` masque le solde aux non-propriétaires ; aucun mot de passe/token exposé.
- Tous les fichiers PHP (`app/`, `database/`, `routes/`, `config/`) passent `php -l`.

**Frontend web**
- `vite build` réussit (2828 modules, seul un avertissement de taille de chunk) ; `oxlint` ne remonte que des warnings.
- Aucun import restant de `TopNav`, `MonDjassa`, `ProDashboard` (fichiers supprimés).
- Arbre de routes cohérent, redirections de compatibilité présentes, pas de boucle de redirection dans les flux normaux.
- Contrat d'authentification aligné backend (`role`, `plan_abonnement`, `needs_plan`, ISO date).
- Aucun `dangerouslySetInnerHTML` ; formulaires étiquetés, `aria-label` sur les dialogues, `alt=""` sur les images décoratives.

**Mobile**
- Tous les endpoints appelés existent dans `routes/api.php` ; formes de réponse ({data,meta}, conversations, stats) cohérentes avec le backend.
- SecureStore + intercepteur Bearer, révocation serveur au logout, gestion du 401.
- Versions Expo 58 / RN 0.88.1 cohérentes ; bonnes pratiques RN (FlatList, keyExtractor, RefreshControl, KeyboardAvoidingView, accessibilité).

---

## 3. Findings détaillés

### 3.1 🔴 Blocants

#### B1. `select-plan` accorde le statut Pro payant sans paiement, de façon répétable
`backend-laravel/app/Http/Controllers/Api/V1/AuthController.php:132-180` (surtout 148-167)

N'importe quel utilisateur authentifié peut `POST /api/v1/auth/select-plan {"plan":"pro"}` : le contrôleur force `role=vendeur_pro`, `plan_abonnement=pro` et `abonnement_actif_jusqu_au = now()->addMonth()` **sans aucun paiement GeniusPay**. Il n'y a pas de garde « premier choix » : l'endpoint est rejouable, et un downgrade `pro → gratuit` est également possible à volonté. Cerise amère : `AbonnementController::upgrade():84` refuse alors de facturer car `isProSeller() && hasActiveProPlan()` sont déjà vrais — l'utilisateur ne paie jamais.

**Correctif** : n'autoriser `selectPlan` que si `! $user->hasChosenPlan()` (sinon 422) ; pour `pro`, ne persister qu'une **intention** et renvoyer `redirect_to` vers le paiement ; positionner `role` / `plan_abonnement` / expiry **uniquement** dans `AbonnementController::activer()` après webhook vérifié. Ajouter un test de feature « un utilisateur non payant ne peut pas devenir vendeur_pro ».

#### M1. Refactor rôles non porté sur le mobile → toutes les fonctions Pro sont mortes
`frontend/mobile/src/context/AuthContext.js:101`

`isPro = user?.role === 'pro_seller'` alors que le backend émet désormais `vendeur_pro`. Résultat : `ProDashboardScreen.js:35,49`, `MonDjassaScreen.js:122` et les contrôles « neuf »/stock de `PublishScreen.js:202-231` sont inaccessibles, même pour un vrai Pro.

**Correctif** : reproduire le normaliseur web (`frontend-web/src/context/AuthContext.jsx:7-25`) — accepter `user`/`pro_seller` legacy et mapper vers `particulier`/`vendeur_pro` ; tester `isPro` contre `vendeur_pro` ou `is_pro` de `UserResource`.

#### M2. Aucun onboarding « choix d'offre » sur mobile
`frontend/mobile/src/context/AuthContext.js` (aucun `needsPlan`, aucun `selectPlan`)

L'inscription crée `plan_abonnement = NULL` et le web force `/choisir-offre`. Le mobile n'a ni garde ni écran correspondant : les nouveaux utilisateurs restent sans plan indéfiniment.

**Correctif** : ajouter `selectPlan(plan)` → `POST /auth/select-plan {plan:'gratuit'|'pro'}`, un écran de choix, et conditionner la stack authentifiée à `user.plan_abonnement === null`.

#### M3. Le toggle « Boutique Pro » à l'inscription est purement cosmétique
`frontend/mobile/src/context/AuthContext.js:75-79`, `frontend/mobile/src/pages/RegisterScreen.js:28,42,85,56`

`asBoutique` est affiché mais `submit()` n'envoie que `{nom,email,telephone,password,password_confirmation}` ; le backend crée toujours `particulier`. Le chemin Google envoie `wanted_role`, que `GoogleTokenRequest.php:17` ne valide pas et qu'`AuthController.php:95` ignore explicitement.

**Correctif** : appeler `selectPlan('pro')` après `register()` lorsque `asBoutique`, puis rafraîchir via `/auth/me` ; supprimer `wanted_role` du flux Google ou le prendre en charge côté backend.

### 3.2 🟠 Élevé

#### B2. Pas de rate limiting sur les endpoints d'authentification publics
`backend-laravel/routes/api.php:46-48` — `register`, `login`, `google` n'ont pas de middleware `throttle` (seuls le groupe authentifié et l'alias le sont). Brute force / credential stuffing / rejeu de `id_token` possible.
**Correctif** : `->middleware('throttle:api')`, idéalement `throttle:10,1` sur `login`/`register`.

#### B3. La factory utilisateur écrit un rôle supprimé → violation de contrainte
`backend-laravel/database/factories/UserFactory.php:32` — `'role' => 'user'`, or `users_role_check` n'autorise plus que `particulier|vendeur_pro|admin`. **Toute insertion `User::factory()` échoue.**
**Correctif** : `User::ROLE_PARTICULIER` + `plan_abonnement` explicite.

#### B4. `OffreTrocPolicy` n'est jamais appliquée
`app/Policies/OffreTrocPolicy.php:21-25` vs `BarterOfferController.php:58-75` et `StoreBarterOfferRequest.php:9-11`. `create()` vérifie `hasChosenPlan()` mais `store()` n'appelle jamais `authorize()` : un utilisateur sans plan peut créer une offre de troc. `respond()`/`delete()` sont du code mort et `respond()` contredit `RespondBarterOfferRequest.php:25-29`.
**Correctif** : appeler `$this->authorize('create', OffreTroc::class)` ; aligner ou supprimer les méthodes inutilisées.

#### B5. Mode paiement factice + webhooks non signés activables en production
`app/Services/GeniusPayService.php:25-28,49-59,100-116`, `config/services.php:46-51`, `.env.example:76-78`, `WebhookController.php:52-67,82-112`.

`isMock()` = `empty(api_key)`. Avec des clés vides en production, les paiements sont simulés **et** `verifyWebhookSignature()` renvoie `true` inconditionnellement : n'importe qui peut POSTer un webhook pour activer un Pro ou passer un escrow en `held` et recevoir le PIN par e-mail. Le commentaire « Jamais en production » n'est pas appliqué par le code.
**Correctif** : exiger `app()->environment(['local','testing'])` dans `isMock()` ; exiger un `webhook_secret` non vide hors local/testing ; faire échouer le boot en production si les clés manquent.

#### B6. Relation `hasOne` sur l'abonnement casse les upgrades répétés
`app/Models/User.php:114-117`, `AbonnementController.php:89-98,128-142`, `AbonnementsSeeder.php:19-32`. Le seeder crée un abonnement `gratuit` actif pour chaque utilisateur ; `upgrade()` insère une nouvelle ligne Pro en attente, mais `$user->abonnement` (non ordonné) continue de renvoyer l'ancienne ligne. Conséquences : accumulation de sessions de paiement, affichage du mauvais plan, `cancel()` qui annule la mauvaise ligne.
**Correctif** : `latestOfMany()` ou requête ordonnée explicite ; réutiliser une ligne Pro `pending` existante.

#### W1. Admin sans plan verrouillé hors de tous les dashboards
`frontend-web/src/components/RouteGuards.jsx:76-78`, `src/pages/ChoisirOffre.jsx:57-60`, `src/App.jsx:31`. `ProRoute` teste `needsPlan` **avant** le rôle, mais `choose()` refuse explicitement les admins et `/choisir-offre` n'offre aucun chemin de sortie. La migration convertit les rôles sans attribuer de plan : tout admin migré avec `NULL` est coincé.
**Correctif** : contourner `needsPlan` pour `isAdmin` dans les trois guards ; ajouter un lien « Accéder à la supervision » sur `/choisir-offre`.

#### W2. Un Pro expiré conserve tous les droits dans l'UI
`frontend-web/src/context/AuthContext.jsx:118-131`, `RouteGuards.jsx:68-80`, `UserResource.php:23`. `has_active_pro_plan` est renvoyé par le backend mais ignoré par le front ; `ProRoute` laisse passer n'importe quel `vendeur_pro`.
**Correctif** : exposer `hasActiveProPlan` dans le contexte ; rediriger les Pro expirés vers `/choisir-offre` avec message de renouvellement.

#### W3. Simulation de paiement et lien localhost en production
`frontend-web/src/components/CheckoutModal.jsx:128-133,144`, `src/lib/api.js:37`. Le bouton « Simuler le paiement réussi (dev) » POSTe sur `/webhooks/geniuspay` (route non authentifiée) et un lien `http://127.0.0.1:8025` est affiché à tous les visiteurs.
**Correctif** : envelopper dans `import.meta.env.DEV && ...` ; message neutre en production ; signature webhook obligatoire hors `local`.

#### M4. Le client mobile POSTe directement au webhook de paiement
`frontend/mobile/src/pages/ProductDetailScreen.js:381`. Même problème que W3 : cassé avec de vraies clés (401), et dangereux en mode mock.
**Correctif** : endpoint de simulation authentifié + vérification de propriété, ou UI gated par `EXPO_PUBLIC_DEV_PAYMENTS`.

#### M5. Profil utilisateur non persisté sur natif
`frontend/mobile/src/context/AuthContext.js:10,21` — `readUser`/`writeUser` utilisent `globalThis.localStorage`, inexistant en React Native. Seul le token survit au redémarrage ; si `/auth/me` échoue, l'utilisateur est déconnecté.
**Correctif** : stocker le JSON utilisateur dans `expo-secure-store` (`djassa_user`), repli mémoire web uniquement.

#### M6. Race condition au boot/auth
`frontend/mobile/src/context/AuthContext.js:50-54` — `booted=true` avant la résolution de `/auth/me`, et le gestionnaire 401 est enregistré plus tard dans un effet. Un 401 au boot peut effacer le token alors que l'UI annonce `isAuthenticated=true`.
**Correctif** : enregistrer le handler de façon synchrone et attendre la revalidation avant `setBooted(true)`.

#### T1. Aucun test applicatif ni CI (transverse)
`backend-laravel/tests/` ne contient que `ExampleTest.php` (stub Laravel) ; aucun test frontend/mobile ; aucun workflow GitHub Actions applicatif (ceux trouvés appartiennent à des skills vendor).
**Correctif** : au minimum des tests de feature sur `select-plan`, le webhook HMAC, les policies et le refactor de rôles ; puis un pipeline CI exécutant `php artisan test`, `vite build`, `oxlint`.

### 3.3 🟡 Moyen

**Backend**
- B7. Admin seédé avec un état d'abonnement contradictoire : `UsersSeeder.php:26` (`pro`) vs `AbonnementsSeeder.php:13-17,25` (`gratuit`).
- B8. Dates d'expiration divergentes entre seeders : `+1 mois` (`UsersSeeder.php:22,37-39`) vs `+25 jours` (`AbonnementsSeeder.php:30`).
- B9. Recherche de transaction floue dans le webhook (`WebhookController.php:75`) avec `where('id','like','%...%')` → correspondances accidentelles possibles. Utiliser une correspondance exacte de la référence.

**Frontend web**
- W4. `/choisir-offre` accessible aux utilisateurs déjà onboardés (`App.jsx:42-45`) : un Pro peut revenir et se rétrograder, la seule protection est un `window.confirm`. Guarder la route ou rebaptiser en « Gérer mon offre » avec bouton d'annulation.
- W5. `refreshMe` déconnecte sur toute erreur réseau (`AuthContext.jsx:102-116`) : un simple timeout au montage vide le token. Ne clearing que sur `401`.
- W6. `OnboardingGuard` duplique et affaiblit `needsPlan` (`RouteGuards.jsx:33-41`) en testant `plan_abonnement === null` directement ; un champ `undefined` contourne l'onboarding. Utiliser le `needsPlan` du contexte.
- W7. Aucune gestion globale de `prefers-reduced-motion` en CSS (`index.css:164,255,268-271`) : marquee, `flashUrgent`, `.route-enter`, `drawerIn` tournent en boucle. Ajouter le media query standard.
- W8. Tiroir mobile `ProLayout` (`ProLayout.jsx:185-195`) sans `role="dialog"`, `aria-modal`, focus ni touche Échap, contrairement à `Navbar.jsx:149-158`.
- W9. URLs externes non validées (`CheckoutModal.jsx:122`, `Cart.jsx:107`) : `href={...}` sans liste blanche de protocole. Valider avec `new URL()` et n'autoriser que `https:`.
- W10. Token dans `localStorage` (`AuthContext.jsx:36,43-46`, `api.js:14-18`) : lisible par XSS. Atténuation : aucun `dangerouslySetInnerHTML`. Ajouter une CSP stricte, puis migrer vers cookies HttpOnly/SameSite.
- W11. Bundle JS unique de 1,94 Mo (`dist/assets/index-*.js`, 546 ko gzip) : Three.js/drei/postprocessing, Rive et GSAP chargés eagerly. `React.lazy` sur `DjassaLogo3D` et `PinSuccess`, puis découpage par route pour le dashboard Pro.

**Mobile**
- M7. Pagination qui peut dupliquer une page (`FeedScreen.js:83-88`, `SouhaitsScreen.js:45-49`) : `page+1` calculé depuis un state capturé. Utiliser un `loadingRef`.
- M8. `<Animated.View style={scale}>` (`MonDjassaScreen.js:223`) passe une `Animated.Value` comme objet de style — l'animation ne s'affiche pas.
- M9. Textes blancs sur fond blanc pour les offres reçues (`ThreadScreen.js:362-365`) : illisible.
- M10. `SafeAreaView` importé de `react-native` avec la prop `edges` (ignorée) dans 4 écrans (`PublishScreen.js:3,137`, `ProDashboardScreen.js:3,65`, `MonDjassaScreen.js:3,82`, `ThreadScreen.js:3,98`). Importer depuis `react-native-safe-area-context`.
- M11. `api.js:10-12` : URLs localhost/10.0.2.2 codées en dur sans défaut production ; préfixe de deep-link sur le port obsolète `8099` (`RootNavigator.js:167`).
- M12. `app.json:31-34` : plugin `expo-image-picker` non déclaré → usage string iOS manquante en build standalone.
- M13. Erreurs avalées silencieusement (`FeedScreen.js:60-62`, `ProDashboardScreen.js:27-28`, `MessagesScreen.js:24-25`) : panne indistinguable de « aucune donnée ».

### 3.4 🔵 Faible

- B10. Logique d'autorisation dupliquée : `ArticlePolicy::update()` / `BoutiquePolicy::update()` jamais appelées, réimplémentées dans les FormRequests.
- B11. `id_token` Google transmis en query string (`AuthController.php:225`) → traces dans les logs proxy. Audience/expiry vérifiés correctement (238-246).
- W12. Imports inutilisés dans `Navbar.jsx:3,5` ; `new Date()` / `Date.now()` appelés pendant le rendu (`AppShell.jsx:89`, `ProLayout.jsx:28`).
- W13. Primitives UI dupliquées (`pages/pro/ui.jsx:28-84` vs `particulier/DashboardParticulier.jsx:25-75`) : `StatCard`, `TinyBadge`, `ProductThumb`. Risque de divergence.
- M14. Imports inutilisés (`flashCountdownLabel`, `useMemo`) et styles inline divers ; extraire en `StyleSheet`.

---

## 4. Causes racines transverses

1. **Refactor non atomique.** Le passage `pro_seller/free → vendeur_pro/gratuit` a touché backend + web ; le mobile est resté sur l'ancien contrat. C'est la source des findings M1–M3.
2. **Frontière paiement/confiance floue.** Le choix d'offre et la simulation de paiement sont exposés côté client et/ou sans garde serveur. C'est la source de B1, B5, W3, M4.
3. **Absence de tests/CI.** Aucune de ces régressions n'aurait survécu à un test de feature sur `select-plan` ou à un test de contrat sur le mobile.

---

## 5. Roadmap de remédiation (ordre recommandé)

**Blocants — avant toute mise en production**
1. B1 — empêcher l'octroi gratuit de Pro ; découpler `select-plan` de l'activation payante.
2. B5 — verrouiller le mode mock et la vérification de signature webhook par environnement.
3. M1/M2/M3 — porter le modèle rôles/offres sur le mobile (normaliseur + écran de choix + inscription Pro).
4. W1/W2 — corriger les guards (admin sans plan, expiration Pro).

**Sécurité — immédiatement après**
5. B2 — rate limiting sur `login`/`register`/`google`.
6. B3 — réparer `UserFactory`.
7. B4 — appliquer `OffreTrocPolicy`.
8. W3/W10 + M4 — retirer les artefacts de paiement dev de l'UI de production ; CSP stricte.

**Qualité / robustesse**
9. B6 + B7/B8/B9 — cohérence des abonnements, seeders et webhook.
10. T1 — tests de feature + CI minimale.
11. W5/W6/W4 — corrections AuthContext et guards web.
12. W7/W8 — accessibilité (reduced motion, tiroir Pro).
13. W11 + M7–M13 — performance et finitions mobiles.

---

## 6. Remarque sur l'outillage (skills)

386 skills uniques sont installés (229 dans `.opencode/skills/`, 162 dans `.agents/skills/`, 5 doublons) — voir `SKILLS_SUMMARY.md` et l'inventaire généré. Ce volume, largement supérieur aux besoins du projet, n'a **aucun impact** sur les findings ci-dessus mais augmente la charge de contexte et le risque de skills concurrents (ex. `impeccable`, `frontend-design`, `web-design-guidelines`, `find-skills`, `unslop` une fois installé, couvrent des besoins qui se recouvrent). Un sous-ensemble curaté d'une vingtaine de skills serait plus efficace.
