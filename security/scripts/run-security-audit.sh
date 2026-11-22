#!/usr/bin/env bash
# Audit global Djassa : dépendances, SAST, lint PHP, tests des 5 services et build frontend.
# Usage : ./security/scripts/run-security-audit.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

SERVICES=(auth-subscription-service catalog-boutique-service escrow-payment-service notification-chat-service troc-engine-service)

log() { printf '\n\033[1;36m==> %s\033[0m\n' "$1"; }
warn() { printf '\033[1;33m[skip] %s\033[0m\n' "$1"; }

log "1/6 Audit des dépendances PHP (5 services)"
if command -v composer >/dev/null; then
  for svc in "${SERVICES[@]}"; do
    if [ -f "services/$svc/composer.json" ]; then
      (cd "services/$svc" && composer audit || true)
    fi
  done
else warn "composer indisponible"; fi

log "2/6 Audit des dépendances JS"
for d in frontend/web frontend/mobile; do
  if [ -f "$d/package.json" ] && command -v npm >/dev/null; then
    (cd "$d" && npm audit --omit=dev || true)
  else warn "$d: npm indisponible"; fi
done

log "3/6 Semgrep (règles Djassa)"
if command -v semgrep >/dev/null; then
  semgrep scan --config security/semgrep/djassa-rules.yml \
    --exclude 'vendor' --exclude 'node_modules' --error .
else warn "semgrep indisponible — installer: pip install semgrep"; fi

log "4/6 Lint PHP des services"
if command -v php >/dev/null; then
  for svc in "${SERVICES[@]}"; do
    find "services/$svc/app" "services/$svc/database" "services/$svc/routes" \
      -name '*.php' -print0 2>/dev/null | xargs -0 -n1 php -l >/dev/null
  done
  echo "PHP OK"
else warn "php indisponible"; fi

log "5/6 Tests des 5 microservices (voir test/run-all.sh)"
warn "lancés séparément par ./test/run-all.sh pour éviter une récursion"

log "6/6 Build + lint frontend"
if [ -f frontend/web/package.json ]; then
  (cd frontend/web && npm run lint && npm run build)
else warn "frontend/web/package.json introuvable"; fi

log "Terminé — consigner les résultats dans security/checklists/OWASP_TOP10_DJASSA.md"
