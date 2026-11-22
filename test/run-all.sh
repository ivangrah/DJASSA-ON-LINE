#!/usr/bin/env bash
# Lance toutes les suites de test des 5 microservices (architecture 100 % Strangler Fig).
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

log() { printf '\n\033[1;36m==> %s\033[0m\n' "$1"; }

declare -A TEST_DB=(
  [auth-subscription-service]=djassa_auth_test
  [catalog-boutique-service]=djassa_catalog_test
  [escrow-payment-service]=djassa_escrow_test
  [notification-chat-service]=djassa_chat_test
  [troc-engine-service]=djassa_troc_test
)

log "Microservices — suites PHPUnit"
for svc in auth-subscription-service catalog-boutique-service escrow-payment-service notification-chat-service troc-engine-service; do
  log "$svc"
  docker compose exec -T \
    -e DB_DATABASE="${TEST_DB[$svc]}" -e DB_HOST=postgres -e DB_USERNAME=postgres \
    -e DB_PASSWORD=djassa_dev -e CACHE_STORE=array \
    "$svc" ./vendor/bin/phpunit || echo "ÉCHEC: $svc"
done

log "Lint + build frontend"
if [ -f frontend/web/package.json ]; then
  (cd frontend/web && npm run lint && npm run build) || echo "ÉCHEC: frontend"
fi

log "Sécurité"
if [ -x security/scripts/run-security-audit.sh ]; then
  ./security/scripts/run-security-audit.sh || echo "ÉCHEC: sécurité"
fi

log "Terminé"
