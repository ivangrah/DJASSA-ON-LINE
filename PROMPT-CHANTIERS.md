# Prompt de chantiers — à coller dans OpenCode (un chantier par session)

Lis AGENTS.md en entier (règles permanentes, skills à utiliser, commandes de vérification).
Travaille UNIQUEMENT sur le chantier que j'indique. Donne d'abord un plan court et attends mon accord avant de modifier du code.

## Chantier A — Cahier des charges (documentation seulement)
- Unifier les rôles : particulier | vendeur_pro | admin (vérifie le schéma SQL réel et aligne le document sur le code).
- Trancher le KYC (§ 2.3, FR-07 et § 14 se contredisent) et FR-22 ("MVP / V2").
- Corriger les coquilles : "11.2navigation", "Logsstructurés", "committer", "publicly exposés".
- Ajouter : modèle économique, modération et signalement, litiges, conditions d'utilisation.
- Mettre à jour le § 14 pour chaque changement.

## Chantier B — Séquestre, PIN, litiges (spécification d'abord, puis code avec tests)
1. Lance le skill security-escrow-audit en lecture seule et montre le rapport.
2. Détenteur du PIN = l'acheteur ; aligne glossaire, parcours § 6.2, interface, notifications.
3. PIN : bcrypt + pepper serveur, limite par transaction et par IP, verrouillage après 5 essais.
4. Troc pur (soulte = 0) : mécanisme de confirmation mutuelle.
5. Litiges : état "disputed", délai automatique de libération ou remboursement, motif, écran d'arbitrage admin ; délais en configuration.
6. Idempotence des webhooks, escrow indisponible sans 500, transitions interdites refusées en application ET en base.

## Chantier C — Charte graphique (web + Expo)
- Utilise le skill react-ui-djassa. Commence par un audit (tableau fichier / problème / correctif), puis corrige par lots : tokens, polices, composants, pages.
- Recherche et supprime : #E11D48, #E60023, verts citron/olive, dégradés violets/bleus, glow, backdrop-filter, Google Fonts.
- Vérifie dans le navigateur : publication, achat avec PIN, troc, admin ; aucune erreur console.

## Chantier D — Vidéo promo (video/djassa-promo/)
La V1 n'inclut pas la livraison intégrée : remplace les plans "livreur à moto" par la remise en main propre ou le retrait en boutique, et adapte voix off et sous-titres. Logo officiel en SVG uniquement (pas de texte généré par IA dans les images).

## Fin de chaque chantier
Résumé de 10 lignes maximum : ce qui a changé, fichiers touchés, tests lancés avec leur résultat réel, décisions qui m'attendent.
