# Cahier des charges — Djassa Online

| Champ | Valeur |
|---|---|
| Version | 1.0 |
| Date | 24 novembre 2026 |
| Périmètre | Application Djassa Online (web + mobile), API Gateway et microservices |
| Statut | Document de référence — synthèse des documents du dossier `documents/`, arbitrée avec l’état réel du dépôt |
| Public | Produit, développement, QA, design, infrastructure |

---

## 1. Objet du document

Ce cahier des charges consolide les documents de conception présents dans `documents/` (PRD, TRD, App Flow, charte graphique, guide de ressources visuelles, schéma UML/physique) en un référentiel unique : périmètre, exigences fonctionnelles et non fonctionnelles, architecture, contrats, modèle de données, design system et critères de recette.

Les documents sources décrivent l’**intention produit**. Lorsqu’ils divergent de l’implémentation réellement présente dans le dépôt, c’est **l’état réel du code qui fait foi** pour l’implémentation ; les écarts sont explicitement listés en § 14.

---

## 2. Contexte et périmètre

### 2.1 Contexte

Djassa Online est une marketplace hybride inspirée du « Djassa » ivoirien : elle met en relation des particuliers et des commerçants pour la revente d’objets d’occasion et le troc, avec une séparation stricte entre le marché de l’occasion et les boutiques professionnelles de produits neufs. La confiance est apportée par deux mécanismes : le **séquestre (escrow) Mobile Money** et un **PIN à 4 chiffres** validé au moment de la remise.

### 2.2 Périmètre fonctionnel

- Comptes particuliers et comptes Boutique Pro, avec rôles étanches ;
- Publication d’annonces (vente, troc, troc + soulte), aide à la publication « Mode Flash » ;
- Catalogue filtrable et recherche plein texte ;
- Moteur de troc avec propositions, soulte FCFA et match automatique ;
- Messagerie temps réel avec cartes d’offre et actions accepter / refuser / contre-offre ;
- Mur des souhaits avec alertes ;
- Paiement séquestré via GeniusPay et clôture par PIN ;
- Espace Boutique Pro : stocks, ventes flash, chiffre d’affaires, retraits ;
- Espace administration : pilotage des boutiques, offres, notifications, maintenance, profil ;
- Notifications e-mail/SMS (Brevo).

### 2.3 Hors périmètre V1

- KYC complet (seul un KYC léger est prévu) ;
- Programme de fidélité avancé et gamification complète (Match de troc évolué) ;
- Livraison physique intégrée ;
- Multi-langue (le produit est francophone, montants en FCFA).

---

## 3. Sources documentaires

| Document | Apport principal |
|---|---|
| `documents/prd_djassa_online.md` | Vision, UVP, personas, objectifs MVP, parcours type, KPIs, écrans clés |
| `documents/cartographie_des_flux_applicatifs_app_flow_djassa_online.md` | Parcours détaillés auth / publication / achat / troc / boutique Pro, états métier |
| `documents/trd.txt`, `trd_djassa_online.pdf` | Stack technique, modèle de données logique, endpoints, sécurité, déploiement |
| `documents/charte_graphique_et_maquettes_ui_ux_djassa_online.md` | Identité visuelle d’origine et maquettes (feed, détail produit + troc, dashboard Pro) |
| `documents/guide.txt`, `guide_ressources_visuelles.pdf` | Inventaire des icônes, illustrations et contraintes média |
| `documents/backend_schema.txt`, `backend_schema.pdf`, `schema_physique.sql`, `schema_page-*.png` | UML (cas d’utilisation, classes, séquences) et schéma physique PostgreSQL |
| `documents/maquette_1.jpeg`, `maquette_2.jpeg` | Références visuelles des écrans principaux |

---

## 4. Vision, utilisateurs et objectifs

### 4.1 Proposition de valeur

1. **Flexibilité transactionnelle** : cash, troc pur, troc + soulte FCFA sur la même plateforme.
2. **Deux marchés distincts** : occasion entre particuliers, produits neufs vendus par des boutiques Pro vérifiées.
3. **Confiance par le mécanisme** : fonds séquestrés chez GeniusPay et PIN à 4 chiffres validé à la remise, sans arnaque possible au moment de l’échange.
4. **Rétention** : Mur des souhaits et alertes de correspondance (« Match de troc »).

### 4.2 Personas

| Persona | Besoin principal |
|---|---|
| Particulier débrouillard (C2C) | Vendre ou troquer rapidement un objet d’occasion, en toute sécurité |
| Commerçant / artisan Pro (B2C) | Tenir une vitrine vérifiée, gérer stock, ventes flash et reçus |
| Acheteur opportuniste | Trouver une bonne affaire, payer en Mobile Money, retirer en boutique avec un PIN |

### 4.3 Objectifs et indicateurs (90 jours)

| Objectif | Indicateur |
|---|---|
| Digitaliser les petits commerçants | 50 boutiques Pro vérifiées |
| Alimenter le catalogue | 1 500 annonces publiées |
| Publication rapide | < 90 s par annonce (objectif interface : < 60 s) |
| Réactivité du troc | > 70 % de réponse à une offre sous 24 h |
| Volume traité | 5 000 000 FCFA de GMV + valeur des trocs |
| Fiabilité du PIN | < 1 % de litiges liés au PIN |
| Rétention | MAU > 35 % à M+2 |

### 4.4 Parcours type (Koffi)

Meuleuse Makita 45 000 FCFA + visseuse 20 000 FCFA + soulte de 25 000 FCFA via Wave ; le vendeur saisit son PIN à 4 chiffres au moment de la remise en boutique, les fonds sont libérés et un reçu est émis.

---

## 5. Exigences fonctionnelles

Priorité : **MVP** = version initiale ; **V2** = évolution planifiée.

### 5.1 Comptes, rôles et authentification

| ID | Exigence | Priorité | Critère d’acceptation |
|---|---|---|---|
| FR-01 | Inscription / connexion par e-mail + mot de passe | MVP | `POST /auth/register`, `POST /auth/login` ; session tokenisée (Sanctum) |
| FR-02 | Connexion Google OAuth | MVP | `POST /auth/google` avec `id_token` ; création ou récupération du compte |
| FR-03 | OTP e-mail (Brevo, 6 chiffres) à l’inscription | MVP | Compte créé avec `is_verified=false` tant que l’OTP n’est pas validé |
| FR-04 | Sélection du rôle initial : Particulier ou Boutique Pro | MVP | `POST /auth/select-plan` (choix initial, n’accorde pas d’entitlement Pro) ; rôles étanches `particulier | vendeur_pro | admin` |
| FR-05 | Profil utilisateur consultable | MVP | `GET /auth/me` renvoie l’utilisateur authentifié |
| FR-06 | Vitrine Boutique Pro vérifiée | MVP | `/catalog/boutiques/{slug}` public ; badge « vérifié » ; documentation RCCM ; tableau de bord stocks et reçus PDF |
| FR-07 | KYC léger pour les boutiques Pro | V2 | Contrôle documentaire minimal avant activation de la vente de neuf |

### 5.2 Catalogue et publication

| ID | Exigence | Priorité | Critère d’acceptation |
|---|---|---|---|
| FR-08 | Publication d’annonce d’occasion en 3 étapes | MVP | Médias → détails → mode (Cash / Troc / Mixte) ; redirection vers la fiche « En ligne » |
| FR-09 | Modes de transaction | MVP | `vente`, `troc`, `mixte` ; contrainte CHECK sur `mode_transaction` |
| FR-10 | État du produit | MVP | `neuf`, `comme_neuf`, `bon_etat`, `usage` ; le statut `neuf` exige une boutique associée |
| FR-11 | Prix et négociation | MVP | Prix FCFA `NUMERIC(12,2)` ; indicateur `prix_negociable` ; prix flash optionnel |
| FR-12 | Stock et ventes flash | MVP | `stock >= 0` ; `vente_flash`, `flash_fin_at` ; compte à rebours côté interface |
| FR-13 | Photos compressées | MVP | WebP/AVIF, < 800 Ko ; nettoyage EXIF ; validation MIME JPEG/PNG/WebP |
| FR-14 | Recherche et filtres | MVP | `GET /catalog/articles` : filtres mode / état / catégorie / recherche ; index `recherche` TSVECTOR (config `french`) et GIN |
| FR-15 | Aide à la publication « Mode Flash » | MVP | Guide l’utilisateur photo → catégorie → état ; publication en moins de 60 s |
| FR-16 | Cycle de vie d’une annonce | MVP | `draft → published → reserved → sold` ; archivage possible (`archived`) |

### 5.3 Moteur de troc et soulte

| ID | Exigence | Priorité | Critère d’acceptation |
|---|---|---|---|
| FR-17 | Proposition de troc depuis une annonce | MVP | `POST /troc/offres` ; offre liée à un utilisateur et à un ou plusieurs articles |
| FR-18 | Soulte FCFA | MVP | Montant de soulte dans l’offre ; séquestre via GeniusPay si soulte > 0 |
| FR-19 | Réponse à une offre | MVP | Accepter / refuser / contre-offre ; états `pending → accepted | rejected | completed` |
| FR-20 | Carte d’offre dans la messagerie | MVP | Offre affichée sous forme de carte interactive dans la conversation |
| FR-21 | Verrouillage des articles échangés | MVP | Passage des articles concernés au statut `reserved` à l’acceptation |
| FR-22 | Match automatique avec le Mur des souhaits | MVP / V2 | Job Redis de scan à la publication ; notification à l’utilisateur concerné |
| FR-23 | Reprise / revente d’un objet reçu | V2 | Option « reprise » sur le détail produit |

### 5.4 Messagerie et notifications

| ID | Exigence | Priorité | Critère d’acceptation |
|---|---|---|---|
| FR-24 | Conversations temps réel | MVP | `GET /messages/conversations` ; événements via Redis / WebSocket |
| FR-25 | Envoi de message lié à une annonce ou une offre | MVP | Persistance dans `messages` ; index sur `article_id`, `conversation_id` |
| FR-26 | Notifications e-mail / SMS | MVP | Brevo : confirmation de commande, reçu, offre de troc, alerte souhait |
| FR-27 | Notifications push mobile | V2 | Appareils enregistrés via Expo |

### 5.5 Mur des souhaits

| ID | Exigence | Priorité | Critère d’acceptation |
|---|---|---|---|
| FR-28 | Créer un souhait | MVP | Mots-clés, budget maximum, acceptation du troc ; index TSVECTOR |
| FR-29 | Alertes de correspondance | MVP | Notification quand une annonce correspond à un souhait actif |
| FR-30 | Gestion du cycle de vie d’un souhait | MVP | `active` → satisfait / expiré / archivé |

### 5.6 Paiement séquestré et PIN

| ID | Exigence | Priorité | Critère d’acceptation |
|---|---|---|---|
| FR-31 | Initiation du paiement | MVP | `POST /escrow/checkout` ; GeniusPay ; verrou anti-double-clic côté client |
| FR-32 | Webhook GeniusPay | MVP | `POST /escrow/webhooks/geniuspay`, non authentifié mais signé HMAC-SHA256 ; idempotence |
| FR-33 | Séquestre des fonds | MVP | État `held` ; fonds non libérés avant remise |
| FR-34 | PIN à 4 chiffres | MVP | PIN haché (bcrypt) dans `transactions.pin_hash` ; jamais stocké en clair |
| FR-35 | Validation du PIN et libération | MVP | `initiated → held → released` ; après 5 tentatives infructueuses, verrouillage |
| FR-36 | Remboursement / échec | MVP | États `refunded` et `failed` traçables |
| FR-37 | Reçus de transaction | MVP | Reçu e-mail (Brevo) et PDF pour les boutiques Pro |
| FR-38 | Consultation des statistiques escrow par vendeur | MVP | Endpoint interne signé `GET /internal/escrow/stats?vendeur_id=…`, utilisé par le dashboard admin |

### 5.7 Espace Boutique Pro et administration

| ID | Exigence | Priorité | Critère d’acceptation |
|---|---|---|---|
| FR-39 | Tableau de bord Pro | MVP | Chiffre d’affaires, fonds détenus/libérés, volume de ventes, alertes stock |
| FR-40 | Gestion des stocks | MVP | Alerte « Stock critique » à partir de 2 unités |
| FR-41 | Ventes flash Pro | MVP | Prix barré, compte à rebours, bandeau dédié dans le feed |
| FR-42 | Retrait de fonds | MVP | Via GeniusPay, avec récapitulatif e-mail |
| FR-43 | Administration des boutiques et finances | MVP | Liste paginée ; statuts fiables même si le service escrow est indisponible (valeur par défaut 0) |
| FR-44 | Administration des offres / abonnements | MVP | Gestion des plans dans `djassa_auth_db.offres_abonnement` |
| FR-45 | Administration des notifications | MVP | Campagnes dans `djassa_chat_db.admin_campaigns`, file Redis `admin.campaign` |
| FR-46 | Maintenance et profil admin | MVP | Onglet accessible dans la sidebar (défilement autorisé) |
| FR-47 | Suppression et mise à jour avec confirmation | MVP | Modale de confirmation, feedback visuel et sonore, plus de `window.confirm` |

---

## 6. Parcours critiques

### 6.1 Publication d’une annonce

1. Authentification ; le rôle `vendeur_pro` est exigé pour poster une annonce « neuf » ou créer une boutique.
2. Étape 1 — médias : sélection / compression WebP, aucun prix exigé à cette étape.
3. Étape 2 — détails : titre, description, catégorie, état, ville/quartier (facultatifs), prix, `specs` JSONB.
4. Étape 3 — mode : vente / troc / mixte.
5. `POST /catalog/articles` : upload des images dans `public/uploads/` du service catalogue, URLs `/uploads/<uuid>.<ext>` exposées via le gateway.
6. Indexation plein texte, job Redis de scan du Mur des souhaits.
7. Redirection vers la fiche « Votre annonce est en ligne ! ».

### 6.2 Achat avec séquestre et retrait

1. Fiche produit → `POST /escrow/checkout`.
2. Redirection vers le widget GeniusPay (Wave / Orange Money / MTN / Moov).
3. Webhook signé → statut `held`, génération du PIN, e-mails Brevo.
4. Remise en main propre → saisie du PIN par le vendeur.
5. Validation → `released`, décrémentation du stock, reçu PDF pour le Pro.

### 6.3 Troc avec soulte

1. Depuis l’annonce : « Proposer un troc + cash » ; sélection des articles de son inventaire et montant de la soulte.
2. `POST /troc/offres` → statut `pending` ; carte dans la messagerie + notification.
3. Réception : accepter / refuser / contre-offre.
4. Acceptation : articles verrouillés (`reserved`), soulte séquestrée si > 0, PIN de clôture à la remise.

### 6.4 Matrice des états

| Objet | États |
|---|---|
| Article | `draft → published → reserved → sold` (`archived`) |
| Offre de troc | `pending → accepted / rejected → completed` |
| Transaction escrow | `initiated → held → released / refunded / failed` |
| Souhait | `active → satisfait / expiré / archivé` |

---

## 7. Exigences non fonctionnelles

### 7.1 Performance

| ID | Exigence | Cible |
|---|---|---|
| NFR-01 | Chargement des pages | < 2,5 s sur 3G/4G |
| NFR-02 | Budget bundle frontend | < 150 Ko pour le chunk principal (état réel : 133,43 Ko / 41 Ko gzip) |
| NFR-03 | Squelettes de chargement | Jamais de spinner nu ; reproduire la structure des cartes / dashboards |
| NFR-04 | Images | WebP/AVIF, `loading="lazy"` et `decoding="async"` sous la ligne de flottaison |
| NFR-05 | Polices | Auto-hébergées en `.woff2`, graisses 400/500/600/700 uniquement (Space Grotesk + DM Sans) |
| NFR-06 | Découpage du code | `React.lazy()` + `Suspense` par route ; chunks lourds isolés via `manualChunks` |
| NFR-07 | Virtualisation | Listes longues (catalogue, transactions, messagerie) via `@tanstack/react-virtual` |
| NFR-08 | Re-renders | `React.memo`, `useMemo`, `useCallback`, contextes cloisonnés (Auth, Panier) |
| NFR-09 | Recherche | Debounce 300 ms avant appel API |
| NFR-10 | Pagination | `paginate(20)` ou curseur ; interdiction de `Model::all()` |
| NFR-11 | Appels indépendants | Parallélisation (`Http::pool()`, `Promise.all()`) |
| NFR-12 | Cache Redis | Catalogue public, boutiques populaires, catégories ; invalidation par événements |
| NFR-13 | Jobs asynchrones | E-mails/SMS Brevo, PDF, compression d’images, matching souhaits |
| NFR-14 | Timeouts | `connectTimeout(3)` / `timeout(8)` sur GeniusPay, Brevo, Google OAuth + retry contrôlé |
| NFR-15 | Base de données | Sélection explicite des colonnes, zéro N+1, index sur FK/filtres/tri, PgBouncer |
| NFR-16 | Infrastructure | Gzip/Brotli au gateway, `Cache-Control: immutable` sur les assets, CDN, co-localisation régionale, SSG/SSR pour les pages vitrines, multi-instances derrière le gateway |
| NFR-17 | Métrologie | Core Web Vitals (RUM) + tests CPU 4× / Fast 3G sur smartphone d’entrée de gamme |

### 7.2 Sécurité

| ID | Exigence | Mesure |
|---|---|---|
| NFR-18 | Transport | HTTPS obligatoire |
| NFR-19 | Accès API | JWT validé par `auth_request` au gateway ; en-têtes `X-User-Id` / `X-User-Role` injectés par le gateway, jamais trustés depuis le client |
| NFR-20 | Rôles | `particulier | vendeur_pro | admin` étanches ; boutique et article neuf réservés aux Pros |
| NFR-21 | PIN | 4 chiffres, haché bcrypt, expiration après 5 tentatives |
| NFR-22 | Webhooks | Signature HMAC-SHA256 vérifiée avant traitement |
| NFR-23 | Appels internes | Signature `X-Djassa-Signature` (HMAC) entre microservices |
| NFR-24 | Isolation des données | Une base PostgreSQL par service, un rôle par base, zéro requête SQL cross-service ; références croisées en UUID logiques |
| NFR-25 | Isolation financière | Clés GeniusPay et PIN confinés dans `escrow-payment-service` / `djassa_escrow_db` |
| NFR-26 | Validation des entrées | Protection SQLi/XSS, validation MIME des images, nettoyage EXIF, rate limiting (60 req/min ; 10/min sur auth) |
| NFR-27 | Journalisation | Logsstructurés, traçabilité des transactions et des accès admin |

### 7.3 Disponibilité et qualité

| ID | Exigence | Cible |
|---|---|---|
| NFR-28 | Résilience | Un service escrow indisponible ne doit pas provoquer de 500 dans l’administration |
| NFR-29 | Pages d’erreur | 403 (dont Pro expiré), 404, 500, hors-ligne, dans la charte |
| NFR-30 | Accessibilité | Contraste AA, `prefers-reduced-motion` respecté, navigation clavier |
| NFR-31 | Qualité terrain | Tests automatisés unitaires / intégration / fonctionnels / E2E ; suite globale `test/run-all.sh` |
| NFR-32 | Audit de sécurité | `security/scripts/run-security-audit.sh` exécuté avant livraison |

---

## 8. Architecture cible

### 8.1 Vue d’ensemble

```
Frontends  ──┬─ frontend/web/    React + Vite + Tailwind (:5199)
             └─ frontend/mobile/ Expo
                    │  /api/v1
              backend/gateway/   nginx :8080
              JWT auth_request · rate limiting · Gzip · /uploads/
                    │
     ┌──────────────┼──────────────┬──────────────┬──────────────┐
auth-subscription  catalog-boutique troc-engine  escrow-payment  notification-chat
   djassa_auth_db   djassa_catalog_db djassa_troc_db djassa_escrow_db djassa_chat_db
                    │
             Redis Streams + files de jobs · PgBouncer
```

### 8.2 Services et responsabilités

| Service | Responsabilité | Base dédiée |
|---|---|---|
| `auth-subscription-service` | Comptes, rôles, OTP, Google OAuth, offres d’abonnement | `djassa_auth_db` |
| `catalog-boutique-service` | Articles, boutiques, upload des images, recherche | `djassa_catalog_db` |
| `troc-engine-service` | Offres de troc, soulte, match | `djassa_troc_db` |
| `escrow-payment-service` | Checkout GeniusPay, webhooks, PIN, séquestre | `djassa_escrow_db` |
| `notification-chat-service` | Conversations, messages, campagnes, e-mail/SMS | `djassa_chat_db` |

### 8.3 Règles d’architecture

1. Database-per-Service : aucune requête SQL cross-service.
2. Communication inter-services par API interne signée (`X-Djassa-Signature`) ou événements Redis Streams.
3. Les contrats d’échange sont définis dans `models/schemas/` (JSON Schema) et déclarés dans `routes/api-gateway.routes.json`.
4. Le monolithe Laravel historique a été supprimé ; aucune nouvelle logique métier n’y est ajoutée.
5. Stack techniques : PHP 8.4 / Laravel, PostgreSQL 16, Redis 7, nginx 1.27, PgBouncer, React 19/Vite 8, Expo.

---

## 9. Contrats d’interface

Base : `http://127.0.0.1:8080`, préfixe `/api/v1`.

| Méthode | Route | Service | Auth | Règle |
|---|---|---|---|---|
| POST | `/auth/register` | auth | non | throttle 10/min |
| POST | `/auth/login` | auth | non | throttle 10/min |
| POST | `/auth/google` | auth | non | throttle 10/min |
| GET | `/auth/me` | auth | oui | — |
| POST | `/auth/select-plan` | auth | oui | choix initial uniquement |
| GET | `/catalog/articles` | catalogue | non | filtres et recherche |
| POST | `/catalog/articles` | catalogue | oui | rôle `vendeur_pro` |
| POST | `/catalog/boutiques` | catalogue | oui | rôle `vendeur_pro` |
| GET | `/catalog/boutiques/{slug}` | catalogue | non | vitrine publique |
| POST | `/troc/offres` | troc | oui | exige un plan choisi |
| POST | `/escrow/checkout` | escrow | oui | anti-double-clic client |
| POST | `/escrow/webhooks/geniuspay` | escrow | non | signé HMAC-SHA256 |
| GET | `/messages/conversations` | chat | oui | — |

Endpoints internes (non exposés publiquement) : `GET /internal/escrow/stats`, `GET /internal/escrow/transactions/{id}`, `POST /internal/escrow/hold`, `POST /internal/escrow/release`, `POST /internal/escrow/checkout`, `POST /internal/escrow/webhooks/log` ; signature HMAC sur `"GET\n/internal/escrow/stats\n"` avec la clé partagée `services.internal.signing_key`.

**Convention de réponse** : succès HTTP 2xx avec charge JSON ; erreurs 4xx/5xx avec message exploitable ; aucune information sensible (PIN, clés GeniusPay) dans les réponses.

---

## 10. Modèle de données

Les tables métier du schéma physique PostgreSQL (UUID en clé primaire) :

| Table | Champs clés | Contraintes notables |
|---|---|---|
| `users` | `id`, `email`, `phone`, `google_id`, `role`, `kyc_status` | `role ∈ {user, pro, admin}` |
| `boutiques` | `id`, `utilisateur_id`, `slug`, `nom_boutique`, `is_verified`, `rccm_doc` | slug unique, vérification |
| `articles` | `id`, `utilisateur_id`, `boutique_id`, `titre`, `prix`, `prix_flash`, `prix_negociable`, `condition`, `mode_transaction`, `est_trocable`, `stock`, `categorie`, `specs`, `images`, `ville`, `quartier`, `statut`, `vente_flash`, `flash_fin_at`, `vues`, `favoris`, `recherche` | `prix NUMERIC(12,2) ≥ 0` ; `statut ∈ {draft, published, reserved, sold, archived}` ; `neuf ⇒ boutique_id NOT NULL` ; `recherche tsvector` généré (french) |
| `offres_troc` | `id`, `article_id`, `utilisateur_id`, `cash_supplement`, `statut` | `statut ∈ {pending, accepted, rejected, completed}` |
| `offres_troc_articles` | liaison offre ↔ articles proposés | — |
| `transactions` | `id`, `article_id`, `acheteur_id`, `vendeur_id`, `montant`, `escrow_status`, `pin_hash` | `escrow_status ∈ {initiated, held, released, refunded, failed}` ; `pin_hash VARCHAR(255)` |
| `souhaits` | `id`, `utilisateur_id`, `keywords` (TSVECTOR), `max_budget`, `accepts_barter`, `statut` | `statut = active` par défaut |
| `messages` | `id`, `conversation_id`, `article_id`, `offre_troc_id`, `expediteur_id`, `contenu`, `non_lus` | index sur conversation / article / offre |

Index BTree et GIN présents sur : catégorie, état, mode, statut, boutique, trocable, vente flash, recherche plein texte, specs JSONB, conversations, transactions et rôles.

---

## 11. Design system et expérience utilisateur

### 11.1 Charte active (référence d’implémentation)

| Token | Valeur |
|---|---|
| Accent | `#780000` |
| Encre | `#121212` |
| Blanc | `#FFFFFF` |
| Surfaces | `#F6F6F6`, `#EFEFEF` |
| Titres | Space Grotesk |
| Corps | DM Sans |
| Composants | `border-none`, coins arrondis, icônes Lucide ≥ 16 px, trait 2 px |
| Mouvement | GSAP sobre, transitions courtes, `prefers-reduced-motion` respecté |

Interdits : verts citron/olive, anciens tokens `#E11D48` / `#E60023`, dégradés violets/bleus, glow/bloom, verre, HUD, serif + mono caps sur fond crème.

### 11.2navigation

Cinq piliers : **Accueil** (Tout / Occasion & Troc / Boutiques Neuves + Ventes Flash), **Publier** (bouton +, tunnel 3 étapes), **Mur des souhaits**, **Messages & Offres**, **Mon Djassa**. L’espace Pro/admin ajoute boutiques, finances, offres, notifications, maintenance et profil ; la sidebar doit rester défilable sur toutes les hauteurs d’écran.

### 11.3 Ressources visuelles

- Icônes Lucide sur grille 24×24, trait 2 px ; jeux : navigation, catégories, paiements.
- Illustrations onboarding 320×240, états vides 200×160, confirmation PIN 180×180 (Lottie).
- Médias : photos 1:1 ou 4:5, 1080 px, ≤ 350 Ko + miniature 400×400 ; bannières flash 1200×500 ≤ 250 Ko ; bannières Pro 1500×500 ≤ 300 Ko ; avatars 256×256 ≤ 80 Ko ; logos de paiement hauteur 28 px.
- Arborescence : `/assets/icons/{navigation,categories,payments}`, `/assets/illustrations`, `/assets/placeholders`.

---

## 12. Recette et critères d’acceptation

| Porte | Commande / contrôle | Résultat attendu |
|---|---|---|
| Build frontend | `cd frontend/web && npm run build` | Succès, chunk principal < 150 Ko |
| Stack | `docker compose config && docker compose up -d` | 9 conteneurs Up ; gateway :8080, Vite :5199 |
| Santé HTTP | `GET :5199/`, `GET :8080/api/v1/products` | 200 |
| Tests globaux | `./test/run-all.sh` | 5 suites, 51 tests / 168 assertions |
| Tests métier | `./vendor/bin/phpunit` dans chaque service | Vert, dont le test de résistance escrow indisponible |
| Audit sécurité | `./security/scripts/run-security-audit.sh` | Aucun finding bloquant |
| Contrats | `models/schemas/` vs `routes/api-gateway.routes.json` | Cohérence des champs échangés |
| Validation visuelle | Parcours navigateur : publication, achat PIN, troc, admin | Aucune erreur console bloquante ; sidebar accessible |

**Définition de « terminé »** : exigence livrée, test automatisé correspondant vert, build vert, documentation mise à jour, aucun secret ni PIN en clair dans le code ou les réponses.

Le rendu de la vidéo promotionnelle est livré séparément dans `video/djassa-promo/` avec son `REVIEW.md`.

---

## 13. Décisions et conventions

1. Les montants sont exprimés en FCFA, arrondis à la pièce, stockés en `NUMERIC(12,2)`.
2. Les identifiants publicly exposés sont des UUID ; aucune clé séquentielle n’est utilisée dans les contrats.
3. Le statut d’une ressource est toujours une chaîne contrainte par CHECK en base et validée côté application.
4. Toute suppression sensible passe par une modale de confirmation avec feedback utilisateur.
5. Aucun secret (clé GeniusPay, PIN, clé HMAC) ne doit être committer ; les valeurs de développement restent dans l’environnement Docker.
6. Toute évolution de contrat est d’abord déclarée dans `models/schemas/` puis dans `routes/api-gateway.routes.json`.

---

## 14. Écarts entre les documents sources et l’implémentation

| Sujet | Document source | État réel / décision | Action |
|---|---|---|---|
| SGBD | PRD : MySQL | PostgreSQL 16, Database-per-Service | Conserver PostgreSQL |
| Passerelle de paiement | PRD : Paystack | GeniusPay + webhooks HMAC | Conserver GeniusPay |
| Architecture | TRD : API Laravel monolithique | 5 microservices derrière nginx | Conserver les microservices |
| Mobile | TRD : React Native | Expo (client actif) | Conserver Expo |
| Charte | Charte historique : `#E11D48`, `#0F172A`, Plus Jakarta Sans, Inter | `#780000`, `#121212`, Space Grotesk, DM Sans | Appliquer la charte active ; mettre à jour les maquettes |
| Routes catalogue | TRD : `/products`, `/barter-offers` | `/catalog/articles`, `/troc/offres` | Utiliser les routes du gateway |
| Rôles | TRD : `user`, `pro_seller`, `admin` | `particulier`, `vendeur_pro`, `admin` | Utiliser les rôles réels |
| Statuts transaction | TRD : `held`, `released`, `refunded` | `initiated`, `held`, `released`, `refunded`, `failed` | Aligner sur le schéma physique |
| Polices | Charte historique | Auto-hébergées `.woff2` en local | Aucun appel Google Fonts bloquant |
| Images | GCS dans l’App Flow | `public/uploads/` du service catalogue + `/uploads/` au gateway | Conserver l’implémentation actuelle |
| Auth OTP | SMS ou e-mail selon les documents | OTP e-mail Brevo | Conserver e-mail |
| KYC | « complet » suggéré dans certains visuels | KYC léger | Maintenir le périmètre MVP |

---

## 15. Glossaire

| Terme | Définition |
|---|---|
| **Djassa** | Marché de l’occasion et du troc, ici transposé en plateforme numérique |
| **Escrow / séquestre** | Conservation des fonds par GeniusPay jusqu’à la remise validée par PIN |
| **PIN** | Code à 4 chiffres haché, remis par le vendeur à la livraison |
| **Soulte** | Complément en FCFA ajouté à un troc |
| **Match de troc** | Correspondance automatique entre une annonce et un souhait |
| **Boutique Pro** | Vitrine vérifiée d’un commerçant, seule habilitée à vendre du neuf |
| **Database-per-Service** | Chaque microservice possède sa base et son rôle PostgreSQL, sans requête cross-service |

---

*Document établi à partir des livrables de conception du dossier `documents/` ; toute divergence avec le dépôt est arbitrée en § 14.*
