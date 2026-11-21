# Tests E2E (navigateur)

Parcours critiques à couvrir avec Playwright :

1. Inscription → `/choisir-offre` → choix `gratuit` → `/dashboard`.
2. Admin sans plan → `/dashboard-pro` (ne doit **pas** être redirigé vers `/choisir-offre` — finding W1).
3. Pro expiré → renovation requise (finding W2).
4. Publication d'une annonce d'occasion → détail → panier → paiement (mode mock local).
5. Mobile : inscription avec « Boutique Pro » → le rôle devient `vendeur_pro` (finding M3).

## Config d'exemple

```js
// tests/e2e/playwright.config.js
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: '.',
  use: { baseURL: 'http://127.0.0.1:5199', trace: 'on-first-retry' },
  webServer: {
    command: 'npm --prefix ../../frontend/web run dev',
    url: 'http://127.0.0.1:5199',
    reuseExistingServer: true,
  },
});
```

Installer une fois : `npm i -D @playwright/test && npx playwright install chromium`.
