# Tests de sécurité ciblés

Voir `security/checklists/OWASP_TOP10_DJASSA.md` pour la checklist complète et `AUDIT_APPLICATION.md` pour les findings.

## À automatiser en priorité

| Risque | Test |
|---|---|
| B1 — Pro gratuit | `POST /auth/select-plan {plan:pro}` puis vérifier que `role` reste `particulier` et `/dashboard-pro` répond 403 |
| B5 — Webhook non signé | POST sans `X-Signature` valide → 401, aucune transaction `held` |
| B2 — Brute force | 11 tentatives de login en 1 min → 429 |
| IDOR | User A tente de lire la boutique/transaction/conversation de User B → 403/404 |
| PIN | 5 PIN erronés → verrouillage ; le PIN n'apparaît ni dans la réponse ni dans les logs |
| Escalade | `particulier` envoie `X-User-Role: vendeur_pro` au gateway → header écrasé |

Outils : Semgrep (`security/semgrep/`), OWASP ZAP, Postman/Newman (`test/postman/`).
