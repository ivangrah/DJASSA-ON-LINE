# Prompt standard — audit de sécurité

Contexte : Djassa Online, voir `skills/security-escrow-audit/`.

Demande : auditer `<perimetre>` en lecture seule. Produire un rapport classé 🔴/🟠/🟡/🔵 avec `fichier:ligne`, cause racine et correctif concret. Vérifier en priorité :

- octroi de Pro sans paiement (B1) ;
- signature webhook et mode mock (B5) ;
- rate limiting auth (B2) ;
- policies non appelées (B4) ;
- IDOR boutique / transaction / conversation ;
- PIN jamais journalisé ni sérialisé.

Ne pas modifier de fichier pendant l'audit.
