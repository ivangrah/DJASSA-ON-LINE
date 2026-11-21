#!/usr/bin/env bash
# pg_dump de toutes les bases Djassa (une archive par base, horodatée).
set -euo pipefail
OUT="${1:-./database/backups/dumps}"
mkdir -p "$OUT"
for DB in djassa_auth_db djassa_catalog_db djassa_troc_db djassa_escrow_db djassa_chat_db; do
  echo "→ sauvegarde de $DB"
  pg_dump "${PG_DJASSA_URL:-postgresql://postgres@localhost:5433/$DB}" \
    --format=custom --no-owner --file="$OUT/${DB}_$(date +%Y%m%d_%H%M%S).dump"
done
echo "Terminé : $OUT"
