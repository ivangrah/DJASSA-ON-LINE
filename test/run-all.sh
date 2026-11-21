#!/usr/bin/env bash
# Lance les suites de tests transverses disponibles (tolère les outils absents).
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

log() { printf '\n\033[1;36m==> %s\033[0m\n' "$1"; }
skip() { printf '\033[1;33m[skip] %s\033[0m\n' "$1"; }

log "Feature / Unit — monolithe Laravel"
if [ -f backend-laravel/artisan ]; then
  if command -v docker >/dev/null && docker image inspect djassa-php:8.4 >/dev/null 2>&1; then
    (cd backend-laravel && docker run --rm --network host -v "$PWD":/app -w /app \
      -e DB_DATABASE=djassa_test -e DB_AUTH_DATABASE=djassa_test -e DB_CATALOG_DATABASE=djassa_test \
      -e DB_TROC_DATABASE=djassa_test -e DB_ESCROW_DATABASE=djassa_test -e DB_CHAT_DATABASE=djassa_test \
      djassa-php:8.4 php artisan test) || echo "ÉCHEC: backend tests"
  else
    (cd backend-laravel && php artisan test) || echo "ÉCHEC: backend tests"
  fi
else skip "backend-laravel/artisan"; fi

log "Lint + build frontend"
if [ -f frontend/web/package.json ]; then
  (cd frontend/web && npm run lint && npm run build) || echo "ÉCHEC: frontend"
else skip "frontend/web"; fi

log "Contrats OpenAPI"
if [ -f tests/contract/openapi.yaml ] && command -v npx >/dev/null; then
  npx --yes schemathesis run tests/contract/openapi.yaml || echo "ÉCHEC: contrats"
else skip "schemathesis / openapi.yaml"; fi

log "E2E navigateur"
if [ -f tests/e2e/playwright.config.js ] && command -v npx >/dev/null; then
  npx playwright test --config tests/e2e/playwright.config.js || echo "ÉCHEC: e2e"
else skip "playwright"; fi

log "Charge (k6)"
if [ -f tests/performance/smoke.js ] && command -v k6 >/dev/null; then
  k6 run tests/performance/smoke.js || echo "ÉCHEC: k6"
else skip "k6"; fi

log "Sécurité"
if [ -x security/scripts/run-security-audit.sh ]; then
  ./security/scripts/run-security-audit.sh || echo "ÉCHEC: sécurité"
else skip "audit sécurité"; fi

log "Terminé"
