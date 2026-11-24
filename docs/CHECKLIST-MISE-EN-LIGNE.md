# Checklist avant mise en ligne — Djassa Online

À donner à l'agent (ou à passer toi-même) avant d'ouvrir au public. Chaque case doit être cochée avec une **preuve** (résultat de commande, capture, lien), pas avec « je pense que c'est bon ».

## 1. Séquestre et PIN
- [ ] Le détenteur du PIN est le même partout (code, textes, notifications, documentation).
- [ ] PIN haché avec secret serveur (pepper) ; aucune trace en clair dans la base, les logs ou les réponses.
- [ ] Limite de tentatives par transaction **et** par IP, verrouillage testé.
- [ ] Webhooks GeniusPay : signature vérifiée avant traitement, rejeu d'un même événement sans double effet.
- [ ] Troc sans soulte : mécanisme de confirmation défini et testé.
- [ ] Litiges : état `disputed`, délais de libération ou de remboursement automatiques, écran d'arbitrage admin.
- [ ] Transition d'état interdite refusée par l'application et par la base.
- [ ] Test avec de petits montants réels sur Wave, Orange Money, MTN et Moov : paiement, blocage, libération, remboursement.

## 2. Données et sécurité
- [ ] `./security/scripts/run-security-audit.sh` sans finding bloquant.
- [ ] Aucun secret dans le dépôt (historique Git compris) ; clés de production différentes de celles de développement.
- [ ] HTTPS partout, en-têtes de sécurité actifs, rate limiting vérifié (60 req/min, 10/min sur l'authentification).
- [ ] Sauvegardes automatiques des 5 bases **et restauration testée** au moins une fois.
- [ ] Accès administrateur protégé (mot de passe fort, journalisation des actions).

## 3. Fiabilité
- [ ] `./test/run-all.sh` vert, `phpunit` vert dans chaque service.
- [ ] Service escrow arrêté : l'administration reste utilisable (pas de 500).
- [ ] Monitoring et alertes (erreurs 5xx, webhooks en échec, file Redis qui grossit).
- [ ] Plan de retour arrière écrit pour la première mise en production.

## 4. Performance
- [ ] Chunk principal < 150 Ko ; pages testées sur smartphone d'entrée de gamme en Fast 3G.
- [ ] Images WebP/AVIF compressées, chargement différé sous la ligne de flottaison.
- [ ] Recherche avec délai de 300 ms, aucune requête sans pagination.

## 5. Charte et accessibilité
- [ ] Aucune occurrence de `#E11D48`, `#E60023`, `backdrop-filter`, dégradé violet ou bleu, appel Google Fonts (vérifier avec `grep`).
- [ ] Polices `.woff2` locales, `font-display: swap`.
- [ ] Contraste ≥ 4,5:1 ; aucun texte rouge sur fond sombre.
- [ ] Parcours complet au clavier ; `prefers-reduced-motion` respecté.
- [ ] Pages 403, 404, 500 et hors-ligne dans la charte.
- [ ] Logo en SVG, variantes sur fond clair et sombre, icône d'application et favicon.

## 6. Légal et confiance
- [ ] Conditions d'utilisation et politique de confidentialité publiées et liées depuis l'inscription.
- [ ] Règles de litige et de remboursement visibles par les utilisateurs.
- [ ] Règles sur les objets interdits et signalement d'une annonce.
- [ ] Vérification du cadre réglementaire du séquestre auprès de GeniusPay (qui détient les fonds, quel agrément) et, si possible, d'un conseil juridique.
- [ ] Critères de vérification du badge « Boutique Pro » écrits et appliqués.

## 7. Lancement
- [ ] Catégorie et communes de départ choisies ; 20 à 30 vendeurs recrutés avant l'ouverture.
- [ ] Support défini (numéro WhatsApp ou e-mail, délai de réponse promis).
- [ ] Modèle économique décidé (commission, abonnements Pro) et affiché.
- [ ] Vidéo promo cohérente avec la V1 (pas de livraison intégrée), voix off et sous-titres à jour, logo officiel en SVG.
- [ ] Page d'attente ou d'inscription en ligne avant la campagne.
- [ ] Indicateurs suivis dès le premier jour : inscriptions, annonces publiées, offres de troc, paiements séquestrés, litiges.
