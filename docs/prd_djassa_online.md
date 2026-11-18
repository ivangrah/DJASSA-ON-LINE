# Document d'Exigences Produit (PRD) — Djassa Online

**Version :** 1.0 (MVP)  
**Date :** Novembre 2026  
**Statut :** Brouillon validé pour développement  
**Stack Technique Recommandée :** Frontend (React, Vite, Tailwind CSS, GSAP) | Backend (PHP / Laravel, API REST, MySQL) | Paiement (Mobile Money via Paystack / GeniusPay)

---

## 1. Aperçu du Produit (Product Overview)

### 1.1 Contexte et Vision
**Djassa Online** est une plateforme web e-commerce hybride de nouvelle génération inspirée de la culture des grands marchés populaires (le *Djassa* en Côte d'Ivoire). Elle fusionne l'économie circulaire (revente d'occasion et troc entre particuliers) avec le commerce traditionnel (boutiques professionnelles vendant du matériel neuf, notamment de l'outillage, du high-tech et de l'équipement).

### 1.2 Proposition de Valeur Unique (UVP)
Contrairement aux sites de petites annonces classiques ou aux plateformes e-commerce rigides, Djassa Online offre :
* **Une flexibilité transactionnelle totale :** Achat direct en cash, troc pur (objet contre objet), ou **paiement mixte (objet + complément financier)**.
* **Une séparation claire et intuitive des marchés :** Un espace dynamique pour la seconde main/troc et des vitrines officielles dédiées aux commerçants professionnels proposant des articles neufs.
* **Une confiance renforcée :** Sécurisation des échanges via un système de validation par code PIN à la remise physique et un système de dépôt fiduciaire (escrow) Mobile Money.

---

## 2. Objectifs et Cibles (Goals & Target Audience)

### 2.1 Objectifs Business et Produit (MVP)
1. **Fluidifier la mise en ligne :** Permettre à un utilisateur de publier un article (vente ou troc) en moins de 60 secondes.
2. **Digitaliser les petits commerçants :** Offrir aux quincailleries, revendeurs d'outils et boutiques locales une vitrine clé en main sans frais techniques complexes.
3. **Sécuriser les transactions locales :** Réduire à zéro le taux d'arnaque lors des remises en main propre grâce au système de validation par PIN et de paiement sécurisé.
4. **Créer une forte rétention :** Utiliser la gamification (Match de troc, Mur des souhaits) pour inciter les utilisateurs à revenir quotidiennement sur la plateforme.

### 2.2 Personas / Cibles Principales
* **Le Particulier "Débrouillard" (C2C - Vendeur / Troqueur) :** Étudiant, jeune actif ou père de famille souhaitant vendre des objets inutilisés (téléphones, vêtements, électroménager) ou les échanger contre d'autres biens sans dépenser de cash.
* **Le Commerçant / Artisan Pro (B2C - Propriétaire de Boutique) :** Gérant de quincaillerie, vendeur d'outillage professionnel ou distributeur souhaitant créer une boutique en ligne officielle pour écouler ses stocks de produits **neufs** avec gestion d'inventaire et facturation simple.
* **L'Acheteur Opportuniste :** Utilisateur à la recherche de bonnes affaires (seconde main certifiée) ou de matériel neuf au meilleur prix local, privilégiant le paiement Mobile Money (Wave, Orange Money, MTN, Moov).

---

## 3. Exigences Fonctionnelles (Functional Requirements)

### 3.1 Gestion des Comptes et Rôles
* **Inscription & Authentification :** Connexion rapide par numéro de téléphone (OTP SMS) ou email/mot de passe.
* **Profil Particulier (Standard) :** Accès à la publication d'annonces d'occasion, au troc, à la messagerie et au mur des souhaits.
* **Profil Boutique Pro :** Création d'une page vitrine personnalisée (`/boutique/nom-enseigne`), logo, bannière, badge "Vendeur Vérifié", accès au tableau de bord de gestion de stocks et génération de reçus PDF.

### 3.2 Catalogue et Publication d'Articles
* **Typologie d'annonces :**
  * *Article d'occasion (C2C) :* Peut être marqué comme "Vente uniquement", "Troc uniquement" ou "Vente & Troc".
  * *Article neuf (B2C - Boutiques uniquement) :* Gestion de quantité en stock, prix fixe ou négociable, option de reprise/troc activable par le commerçant.
* **Aide à la publication (Mode Flash) :** Téléchargement rapide de photos compressées automatiquement, sélection de catégorie, état du produit (*Neuf sous emballage, Comme neuf, Bon état, Usagé*).

### 3.3 Moteur de Troc et Paiement Mixte
* **Proposition de Troc :** Depuis une annonce éligible, l'utilisateur clique sur *"Proposer un troc"* et sélectionne un ou plusieurs articles directement depuis son propre inventaire publié.
* **Option Soulte (Cash + Troc) :** Possibilité d'ajouter un montant financier en FCFA pour équilibrer la valeur de l'échange (ex. : *Ancien téléphone + 20 000 FCFA contre une perceuse neuve*).
* **Match de Troc :** Suggestion automatique d'échanges pertinents en croisant les catégories recherchées et les objets disponibles des utilisateurs.

### 3.4 Messagerie Interactive et Négociation
* **Chat en temps réel :** Discussion intégrée liée à chaque annonce.
* **Actions rapides dans le chat :** Boutons intégrés pour soumettre une offre de prix formelle (*Accepter / Refuser / Contre-offre*) ou soumettre une carte visuelle de troc, évitant les négociations textuelles interminables.

### 3.5 Le "Mur des Souhaits" (Recherche Inversée)
* **Publication de besoin :** Un utilisateur peut poster une annonce de recherche (ex. : *"Recherche groupe électrogène d'occasion, budget 80 000 FCFA ou troc"*).
* **Alerte automatique :** Notification immédiate dès qu'un vendeur publie un article correspondant aux mots-clés du souhait.

### 3.6 Paiement Sécurisé et Validation (Escrow & PIN)
* **Intégration Mobile Money :** Paiement sécurisé via passerelle locale (Wave, Orange Money, MTN Money, Moov Money). Les fonds sont bloqués sur un compte séquestre (*Escrow*).
* **Remise en main propre par PIN :** Lors de la rencontre physique (ou livraison), l'acheteur communique un code PIN unique à 4 chiffres généré par l'application. La saisie de ce code par le vendeur débloque instantanément les fonds sur son portefeuille.

---

## 4. Exigences Non-Fonctionnelles (Non-Functional Requirements)

* **Performance & Réseau :** Temps de chargement initial inférieur à 2,5 secondes même sur connexion 3G/4G instable (lazy loading des images, compression WebP).
* **Design & Ergonomie (Mobile-First) :** Interface responsive pensée d'abord pour les smartphones, avec micro-interactions fluides (GSAP) et navigation par barre inférieure sur mobile.
* **Sécurité :** Chiffrement HTTPS, hachage sécurisé des mots de passe, protection contre les injections SQL/XSS, et vérification d'identité (KYC léger) pour l'ouverture des Boutiques Pro.
* **Disponibilité :** Architecture API découplée permettant une évolution future vers une application mobile native (Flutter) sans refonte du backend.

---

## 5. Expérience Utilisateur et Parcours Clés (UX & User Flows)

### 5.1 Architecture de l'Information (Navigation)
1. **Accueil (Feed Hybride) :** Onglet de bascule rapide en haut de l'écran entre **"Tout"**, **"Seconde Main & Troc"** et **"Boutiques Neuves (Pro)"**, accompagné d'une section **"Ventes Flash Boutiques"**.
2. **Publier (+) :** Bouton central proéminent ouvrant un tunnel en 3 étapes (Photos → Détails & État → Mode de transaction : Cash / Troc / Mixte).
3. **Mur des Souhaits :** Fil d'actualité inversé listant les demandes urgentes des acheteurs.
4. **Messages & Offres :** Centre de négociation regroupant les discussions, les propositions de troc en attente et les codes PIN de transaction.
5. **Mon Djassa (Profil / Boutique) :** Gestion des annonces actives, inventaire de troc, portefeuille et accès au Dashboard Pro pour les commerçants.

### 5.2 Parcours Type : Un Troc avec Complément Financier (Mixte)
1. *Koffi* repère une meuleuse neuve dans la boutique pro *"Quincaillerie Moderne"* à 45 000 FCFA (qui accepte le troc partiel).
2. Koffi clique sur **"Proposer un troc"**, sélectionne sa visseuse d'occasion estimée à 20 000 FCFA et ajoute un complément de **25 000 FCFA**.
3. Le gérant de la boutique reçoit une notification interactive dans le chat avec la photo de la visseuse et le montant proposé, puis clique sur **"Accepter l'offre"**.
4. Koffi règle les 25 000 FCFA via Wave sur la plateforme (fonds sécurisés).
5. Les deux parties se retrouvent en boutique ; le vendeur valide le code PIN de Koffi sur son interface, finalisant l'échange et débloquant l'argent.

---

## 6. Métriques de Succès (KPIs)

Pour évaluer la traction et la viabilité de **Djassa Online** durant les 3 premiers mois suivant le lancement :

| Catégorie | Indicateur Clé (KPI) | Objectif Cible (MVP - 90 jours) |
| :--- | :--- | :--- |
| **Acquisition** | Nombre de boutiques Pro actives créées | 50+ boutiques locales vérifiées |
| **Acquisition** | Volume d'annonces publiées (C2C + B2C) | 1 500+ articles en ligne |
| **Engagement** | Temps moyen de publication d'une annonce | Moins de 90 secondes |
| **Engagement** | Taux de réponse aux propositions de troc | Supérieur à 70 % sous 24h |
| **Conversion** | Volume Mensuel de Transactions (GMV + valeur estimée des trocs) | 5 000 000 FCFA cumulés |
| **Confiance** | Taux de litiges après validation par code PIN | Inférieur à 1 % des transactions |
| **Rétention** | Utilisateurs actifs mensuels (MAU) revenant publier ou troquer | Supérieur à 35 % à M+2 |

---

### Prochaines étapes suggérées pour le développement
1. **Modélisation de la Base de Données (MCD/MLD MySQL) :** Création des tables `users`, `stores`, `products`, `barter_offers` (offres de troc), `wishes` (mur des souhaits) et `transactions`.
2. **Maquettage UI/UX :** Création des écrans clés (Feed hybride, Modale de proposition de troc, Dashboard Boutique Pro).
3. **Développement du Core Backend & Frontend :** Mise en place de l'API d'authentification, du catalogue filtrable et du module de messagerie/négociation.