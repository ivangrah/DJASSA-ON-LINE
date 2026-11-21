# Cartographie des Flux Applicatifs (App Flow) — Djassa Online

**Version :** 1.0 (MVP)  
**Plateformes :** Web (React JS) & Mobile (React Native)  
**Backend & Services :** Laravel API, PostgreSQL, GeniusPay, Brevo, Google Cloud OAuth  

---

## 1. Architecture Globale de Navigation (Sitemap)

L'application s'articule autour de **5 piliers de navigation principaux** (barre inférieure fixe sur React Native / barre supérieure sticky sur React Web) accessibles après ou avant authentification (mode invité pour la consultation).

```
[Écran de Démarrage / Splash]
       │
       ├──► [Flux d'Authentification] (Google Cloud OAuth / E-mail & OTP Brevo)
       │
       └──► [Navigation Principale (App Shell)]
              ├── 1. ACCUEIL (Feed Hybride : Tout | Occasion & Troc | Boutiques Neuves)
              │     ├──► Détail d'un Article (Achat direct / Proposer un troc / Chat)
              │     └──► Vitrine Boutique Pro (/boutique/:slug)
              │
              ├── 2. MUR DES SOUHAITS (Wishlist Inversée)
              │     └──► Publier un Besoin / Répondre à un Souhait
              │
              ├── 3. PUBLIER (+) [Action Centrale]
              │     └──► Tunnel de Mise en Ligne en 3 Étapes
              │
              ├── 4. MESSAGES & NÉGOCIATIONS
              │     └──► Chat Temps Réel (Offre de prix / Carte de troc / Validation PIN)
              │
              └── 5. MON DJASSA (Profil & Espace Pro)
                    ├──► Mes Annonces & Inventaire de Troc
                    ├──► Mes Transactions & Codes PIN Séquestre
                    ├──► Portefeuille (Retraits Mobile Money GeniusPay)
                    └──► Dashboard Boutique Pro (Stocks neufs, Ventes Flash, Factures PDF)
```

---

## 2. Flux d'Authentification et Onboarding

Ce parcours gère l'entrée de l'utilisateur et l'attribution de son rôle (`Particulier` ou `Boutique Pro`).

| Étape / Écran | Action Utilisateur | Réaction Immédiate (UI) & Traitement Backend (Laravel / Services) |
| :--- | :--- | :--- |
| **1. Écran d'Accueil / Connexion** | Clique sur *"Continuer avec Google"* | • **UI :** Ouverture de la modale Google Identity.<br>• **Backend :** Réception de l'`id_token` sur `POST /api/v1/auth/google`, vérification Google Cloud, création ou liaison dans PostgreSQL (`users`), génération du jeton Sanctum.<br>• **Redirection :** Vers l'écran d'accueil (si compte existant) ou sélection du profil (si 1er accès). |
| **2. Choix du Type de Compte** *(1ère connexion)* | Sélectionne **"Particulier (Vendre / Troquer)"** ou **"Ouvrir une Boutique Pro"** | • **Si Particulier :** Attribution immédiate du rôle `user` et accès direct au Feed.<br>• **Si Boutique Pro :** Affichage du formulaire de création de vitrine (Nom de boutique, catégorie d'outils/produits neufs, numéro de téléphone). |
| **3. Vérification Boutique Pro** *(Optionnel)* | Soumet les infos de la boutique + numéro de téléphone | • **Backend :** Envoi d'un code OTP à 6 chiffres via l'API SMS **Brevo** et création de l'entrée dans la table `stores` (`is_verified = false` en attente de validation KYC rapide).<br>• **Redirection :** Vers le **Dashboard Boutique Pro** prêt à accueillir les premiers articles neufs. |

---

## 3. Flux de Publication d'un Article (Tunnel en 3 Étapes)

Accessible depuis le bouton central **`+ Publier`**, ce flux est optimisé pour prendre moins de 60 secondes.

```
[Clic sur "+ Publier"]
       │
       ▼
[Étape 1 : Médias] ──► Prise de photo caméra (React Native) ou upload (React Web)
       │               └─► Action : Compression WebP automatique (< 800 Ko) + prévisualisation
       ▼
[Étape 2 : Détails] ──► Titre, Catégorie, État (Neuf [Boutiques Pro uniquement] / Occasion)
       │               └─► Action : Chargement dynamique des champs JSONB (ex: marque, puissance)
       ▼
[Étape 3 : Mode] ────► Choix : [Vente Cash] | [Troc Uniquement] | [Mixte : Troc + Cash]
       │
       ▼
[Clic sur "Publier l'annonce"]
       │
       ├──► 1. Requête POST /api/v1/products + Upload images vers Google Cloud Storage.
       ├──► 2. Insertion dans PostgreSQL + Indexation plein texte (TSVECTOR).
       ├──► 3. Job asynchrone (Queue) : Scan du "Mur des Souhaits" pour notifier via Brevo
       │       les acheteurs ayant enregistré un souhait correspondant.
       └──► 4. Redirection vers la fiche produit publiée avec badge "En ligne".
```

---

## 4. Flux d'Achat Direct & Séquestre Sécurisé (GeniusPay + PIN)

Ce flux s'applique à l'achat d'un article d'occasion (C2C) ou d'un outil neuf dans une boutique (B2C).

| Étape | Écran & Action Utilisateur | Ce qui se passe en arrière-plan & État suivant |
| :--- | :--- | :--- |
| **1. Fiche Produit** | L'acheteur consulte l'article et clique sur **"Acheter maintenant"** | • **UI :** Ouverture du récapitulatif de commande (Prix + Frais de sécurisation + Mode de remise : Main propre / Point relais). |
| **2. Paiement** | L'acheteur clique sur **"Payer via Mobile Money"** | • **Backend :** Appel à `POST /api/v1/payments/geniuspay/init`.<br>• **UI :** Redirection ou ouverture du widget **GeniusPay** (Wave, Orange Money, MTN, Moov). |
| **3. Confirmation** | L'acheteur valide le paiement sur son téléphone | • **Webhook :** GeniusPay notifie `POST /api/v1/webhooks/geniuspay`.<br>• **PostgreSQL :** La transaction passe au statut `held` (fonds bloqués). Génération d'un **Code PIN à 4 chiffres** haché (`pin_hash`).<br>• **Brevo :** Envoi d'un e-mail de confirmation avec reçu à l'acheteur et notification au vendeur *"Article vendu — Préparez la remise"*. |
| **4. Rencontre & Remise** | L'acheteur inspecte l'article physiquement et dicte son **Code PIN** au vendeur | • **UI Vendeur :** Saisit les 4 chiffres dans l'écran de commande (`POST /api/v1/transactions/{id}/verify-pin`).<br>• **Si PIN valide :** Le séquestre passe à `released`. Les fonds sont crédités sur le solde du vendeur et le stock de l'article est décrémenté (ou marqué `Vendu`).<br>• **Si Boutique Pro :** Génération automatique de la facture PDF envoyée par Brevo. |

---

## 5. Flux de Troc Pur et Troc Mixte (Objet + Soulte Financière)

Le cœur différenciant de **Djassa Online** permettant d'échanger un bien contre un autre avec ou sans complément d'argent.

```
[Consultation d'un article éligible au troc]
       │
       ▼
[Clic sur "Proposer un troc"]
       │
       ▼
[Modale "Mon Inventaire de Troc"]
  ├──► L'utilisateur coche 1 ou plusieurs de ses propres articles publiés
  └──► (Optionnel) Ajoute un complément financier en FCFA (Soulte)
       │
       ▼
[Clic sur "Envoyer la proposition"]
  ├──► Backend : Création d'une entrée dans `barter_offers` (statut: `pending`).
  ├──► UI : Ouverture automatique du Chat avec une "Carte Interactive d'Offre".
  └──► Notification : Alerte Push + E-mail Brevo envoyé au propriétaire de l'article.
       │
       ▼
[Réaction du Vendeur dans le Chat]
  ├──► CAS A : Clique sur "Refuser" ──► Statut `rejected`, notification dans le chat.
  ├──► CAS B : Clique sur "Contre-offre" ──► Ajuste la soulte FCFA et renvoie la carte.
  └──► CAS C : Clique sur "Accepter l'échange"
         │
         ├──► 1. Verrouillage des articles concernés (indisponibles pour d'autres acheteurs).
         ├──► 2. Si soulte FCFA > 0 : L'initiateur est invité à régler le complément via GeniusPay
         │       (fonds bloqués en séquestre).
         └──► 3. Génération d'un Code PIN de validation d'échange. Lors de la rencontre,
                 la saisie du PIN clôt le troc et libère l'éventuelle soulte financière.
```

---

## 6. Flux Spécifique "Boutique Pro" (Gestion B2C & Ventes Flash)

Depuis l'onglet **Mon Djassa → Dashboard Boutique Pro**, le commerçant gère son activité professionnelle :

1. **Ajout au catalogue neuf :** Le commerçant publie un outil neuf avec gestion de quantité (`stock = 15`). À chaque vente validée par PIN, le stock décrémente automatiquement ; à `stock = 2`, une alerte visuelle **"Stock Critique"** apparaît.
2. **Lancement d'une Vente Flash :**
   * *Action :* Le commerçant sélectionne un article neuf, applique une réduction temporaire et définit une durée (ex. : `24h`).
   * *Résultat :* L'article remonte immédiatement dans le carrousel **"Ventes Flash Boutiques"** en haut de la page d'accueil avec un compte à rebours temps réel.
3. **Retrait des gains (Payout) :**
   * *Action :* Le commerçant clique sur **"Retirer mes fonds"** et indique son numéro Wave / Orange Money.
   * *Résultat :* Laravel déclenche un ordre de virement via l'API **GeniusPay** et envoie le récapitulatif comptable par e-mail via **Brevo**.

---

## 7. Matrice de Synthèse des Transitions d'États

| Entité | État Initial | Événement Déclencheur | Nouvel État | Effet de Bord Système |
| :--- | :--- | :--- | :--- | :--- |
| **Article (`product`)** | `draft` | Validation du tunnel de publication | `published` | Indexation recherche + Scan alertes *Mur des Souhaits*. |
| **Article (`product`)** | `published` | Acceptation d'une offre de troc ou paiement | `reserved` | Masqué du feed public pour éviter les doubles commandes. |
| **Offre Troc (`barter`)** | `pending` | Clic vendeur sur *"Accepter"* | `accepted` | Déclenche le paiement de la soulte (si > 0) ou génère le PIN. |
| **Transaction (`escrow`)** | `initiated` | Webhook de succès **GeniusPay** | `held` | Génère le Code PIN acheteur + envoie reçu **Brevo**. |
| **Transaction (`escrow`)** | `held` | Saisie du Code PIN valide par le vendeur | `released` | Crédite le portefeuille vendeur + passe l'article à `sold`. |