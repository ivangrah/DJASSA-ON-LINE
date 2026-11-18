#!/usr/bin/env bash
# ============================================================================
# Djassa Online — smoke test API (Étape 2)
# Réinitialise la base (migrate:fresh --seed), boote l'API sur :8899,
# et exerce le parcours complet : auth → catalogue → troc mixte → escrow → PIN
# → Mur des Souhaits → messages → reçu PDF.
#
# Usage : ./scripts/smoke-api.sh
# ============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API="http://127.0.0.1:8899/api/v1"
DOCKERFILE="docker/php/Dockerfile.local"
CONTAINER="djassa-api-smoke"
PASS=0; FAIL=0

cd "$ROOT"

say()  { printf '\n\033[1;36m▸ %s\033[0m\n' "$*"; }
ok()   { PASS=$((PASS+1)); printf '  \033[32m✓\033[0m %s\n' "$*"; }
bad()  { FAIL=$((FAIL+1)); printf '  \033[31m✗ %s\033[0m\n' "$*"; }

jqpy() { python3 -c "import sys, json; d=json.load(sys.stdin); $1"; }

# ---------- Reset DB + boot --------------------------------------------------
say "Reset BDD + seed"
docker run --rm --network host -v "$ROOT":/app -w /app djassa-php:8.4 php artisan migrate:fresh --seed --force >/dev/null

say "Démarrage API sur :8899"
docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
docker run --rm -d --name "$CONTAINER" --network host -v "$ROOT":/app -w /app djassa-php:8.4 >/dev/null
trap 'docker stop "$CONTAINER" >/dev/null 2>&1 || true' EXIT
for i in $(seq 1 40); do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$API/health" || true)
  [ "$code" = "200" ] && break
  sleep 1
done
[ "$code" = "200" ] && ok "GET /health → 200" || { bad "API ne répond pas sur :8899"; exit 1; }

# ---------- Auth -------------------------------------------------------------
say "Authentification"
login() { curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$1\",\"password\":\"password\"}"; }

TOKEN_KOFFI=$(login koffi@djassaonline.ci  | jqpy "print(d['token'])")
TOKEN_ADJOUA=$(login adjoua@djassaonline.ci | jqpy "print(d['token'])")
TOKEN_BAKAYOKO=$(login bakayoko@djassaonline.ci | jqpy "print(d['token'])")
TOKEN_MARIO=$(login mariame@djassaonline.ci  | jqpy "print(d['token'])")
[ -n "$TOKEN_KOFFI" ] && ok "login koffi / adjoua / bakayoko / mariame" || bad "login"

say "Google id_token (mode dev sans clé)"
g=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/auth/google" \
  -H 'Content-Type: application/json' -d '{"id_token":"dev.testeur-e2e"}')
[ "$g" = "200" ] && ok "POST /auth/google (dev.*) → 200" || bad "auth/google → HTTP $g"

# ---------- Catalogue --------------------------------------------------------
say "Catalogue hybride"
n=$(curl -s "$API/products?mode=barter&condition=used" | jqpy "print(len(d.get('data', [])))")
[ "${n:-0}" -ge 1 ] && ok "GET /products?mode=barter&condition=used → $n article(s)" || bad "feed barter/used vide"

n=$(curl -s "$API/products?marche=neuf" | jqpy "print(len(d.get('data', [])))")
[ "${n:-0}" -ge 3 ] && ok "GET /products?marche=neuf → $n boutique(s) neuve(s)" || bad "feed neuf"

n=$(curl -s "$API/products?q=visseuse" | jqpy "print(len(d.get('data', [])))")
[ "${n:-0}" -ge 1 ] && ok "GET /products?q=visseuse (FTS FR) → $n résultat(s)" || bad "recherche FTS"

n=$(curl -s "$API/products/flash" | jqpy "print(len(d.get('data', [])))")
[ "${n:-0}" -ge 1 ] && ok "GET /products/flash (Ventes Flash) → $n" || bad "ventes flash"

# ---------- RBAC publication --------------------------------------------------
say "RBAC — publication articles neufs"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/products" \
  -H "Authorization: Bearer $TOKEN_KOFFI" -H 'Content-Type: application/json' \
  -d '{"titre":"Perceuse Bosch GSB 18V neuve sous blister","prix":90000,"condition":"neuf","mode_transaction":"vente","categorie":"Outillage"}')
[ "$code" = "422" ] && ok "particulier + condition=neuf → 422 (refusé)" || bad "RBAC neuf → HTTP $code"

code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/products" \
  -H "Authorization: Bearer $TOKEN_BAKAYOKO" -H 'Content-Type: application/json' \
  -d '{"titre":"Clé à chocs pneumatique 1/2 pouce professionnelle","prix":42000,"condition":"neuf","mode_transaction":"mixte","est_trocable":true,"categorie":"Outillage","stock":7,"specs":{"entrainement":"1/2","pression_bar":6.2}}')
[ "$code" = "201" ] && ok "pro vérifié + condition=neuf → 201" || bad "publication pro → HTTP $code"

# ---------- Mur des Souhaits --------------------------------------------------
say "Mur des Souhaits"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/souhaits" \
  -H "Authorization: Bearer $TOKEN_ADJOUA" -H 'Content-Type: application/json' \
  -d '{"titre":"Recherche groupe electrogene turbo 2.5 kVA occasion","budget_max":100000,"categorie":"Électroménager","accepte_troc":true}')
[ "$code" = "201" ] && ok "souhait publié (adjoua) → 201" || bad "création souhait → HTTP $code"

curl -s -X POST "$API/products" -H "Authorization: Bearer $TOKEN_KOFFI" -H 'Content-Type: application/json' \
  -d '{"titre":"Groupe electrogene Briggs 2.5 kVA demarrage lanceur occasion","prix":70000,"condition":"usage","mode_transaction":"mixte","est_trocable":true,"categorie":"Électroménager","description":"Groupe electrogene compact demarrage lanceur, compteur 600h"}' >/dev/null
unread=$(curl -s "$API/messages/unread-count" -H "Authorization: Bearer $TOKEN_ADJOUA" | jqpy "print(d['unread'])")
[ "${unread:-0}" -ge 1 ] && ok "souhait matché → adjoua a $unread message(s) non lu(s)" || bad "match souhait silencieux (unread=$unread)"

# ---------- Troc mixte : proposition → contre-offre → acceptation → paiement --
say "Troc mixte — proposition sur meuleuse Makita (boutique quincaillerie-moderne)"
MEULEUSE_ID=$(curl -s "$API/products?q=Meuleuse%20Makita" | jqpy "print(d['data'][0]['id'])")
VISSEUSE_ID=$(curl -s "$API/products/mine" -H "Authorization: Bearer $TOKEN_KOFFI" | jqpy "print(next(a['id'] for a in d['data'] if 'Visseuse sans fil Makita' in a['titre']))")

offer=$(curl -s -X POST "$API/barter-offers" -H "Authorization: Bearer $TOKEN_KOFFI" -H 'Content-Type: application/json' \
  -d "{\"article_cible_id\":\"$MEULEUSE_ID\",\"articles_offerts\":[\"$VISSEUSE_ID\"],\"montant_soulte_fcfa\":15000,\"message\":\"Visseuse + 15 000 FCFA contre la meuleuse\"}")
OFFER_ID=$(echo "$offer" | jqpy "print(d.get('data', {}).get('id', ''))")
[ -n "$OFFER_ID" ] && ok "offre créée → $OFFER_ID" || { bad "création offre : $offer"; }

code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/barter-offers" -H "Authorization: Bearer $TOKEN_BAKAYOKO" -H 'Content-Type: application/json' \
  -d "{\"article_cible_id\":\"$MEULEUSE_ID\",\"articles_offerts\":[\"$VISSEUSE_ID\"],\"montant_soulte_fcfa\":1}")
if [ "$code" = "422" ] || [ "$code" = "403" ]; then ok "offre avec articles offerts d'autrui → refusée ($code)"; else bad "offre d'autrui → HTTP $code (attendu 422/403)"; fi

say "Contre-offre du vendeur puis acceptation de la contre-offre"
r=$(curl -s -X PATCH "$API/barter-offers/$OFFER_ID/respond" -H "Authorization: Bearer $TOKEN_BAKAYOKO" -H 'Content-Type: application/json' \
  -d '{"action":"counter","montant_contre_offre_fcfa":20000,"message":"20 000 FCFA de soulte pour équilibrer"}' | jqpy "print(d.get('data', {}).get('statut', '?'))")
[ "$r" = "countered" ] && ok "contre-offre → countered" || bad "contre-offre → $r"

r=$(curl -s -X PATCH "$API/barter-offers/$OFFER_ID/respond" -H "Authorization: Bearer $TOKEN_KOFFI" -H 'Content-Type: application/json' \
  -d '{"action":"accept_counter"}' | jqpy "print(d.get('data', {}).get('statut', '?'))")
[ "$r" = "accepted" ] && ok "contre-offre acceptée → accepted (articles verrouillés)" || bad "accept_counter → $r"

# ---------- Paiement GeniusPay (MOCK) + webhook → escrow held ------------------
say "Paiement GeniusPay (mock) → webhook → escrow held"
init=$(curl -s -X POST "$API/payments/geniuspay/init" -H "Authorization: Bearer $TOKEN_KOFFI" -H 'Content-Type: application/json' \
  -d "{\"type\":\"troc_mixte\",\"offre_troc_id\":\"$OFFER_ID\"}")
REF=$(echo "$init" | jqpy "print(d.get('geniuspay_ref', ''))")
[ -n "$REF" ] && ok "session GeniusPay initialisée → $REF" || bad "init paiement : $init"

code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/webhooks/geniuspay" \
  -H 'Content-Type: application/json' \
  -d "{\"reference\":\"$REF\",\"status\":\"success\"}")
[ "$code" = "200" ] && ok "webhook success → escrow held" || bad "webhook → HTTP $code"

TX_ID=$(echo "$init" | jqpy "print(d['transaction_id'])")
st=$(curl -s "$API/transactions/$TX_ID" -H "Authorization: Bearer $TOKEN_BAKAYOKO" | jqpy "print(d.get('data', {}).get('escrow_status', '?'))")
[ "$st" = "held" ] && ok "transaction $TX_ID → held" || bad "escrow status = $st"

# PIN généré (envoyé par e-mail — loggé en mode dev Brevo:DEV)
PIN=$(python3 - <<'EOF'
import re
try:
    log = open('storage/logs/laravel.log', encoding='utf-8', errors='ignore').read()
except FileNotFoundError:
    log = ''
m = re.findall(r'"PIN":"(\d{4})"', log)
print(m[-1] if m else '')
EOF
)
[ -n "$PIN" ] && ok "PIN généré (4 chiffres) récupéré depuis le log dev" || bad "PIN introuvable dans laravel.log"

# ---------- PIN erroné puis correct -------------------------------------------
say "Validation PIN à la remise"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/transactions/$TX_ID/verify-pin" \
  -H "Authorization: Bearer $TOKEN_BAKAYOKO" -H 'Content-Type: application/json' \
  -d '{"pin":"0000"}')
[ "$code" = "422" ] && ok "PIN faux → 422 (tentative comptabilisée)" || bad "PIN faux → HTTP $code"

code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/transactions/$TX_ID/verify-pin" \
  -H "Authorization: Bearer $TOKEN_BAKAYOKO" -H 'Content-Type: application/json' \
  -d "{\"pin\":\"$PIN\"}")
[ "$code" = "200" ] && ok "PIN correct → fonds libérés (released)" || bad "PIN correct → HTTP $code"

st=$(curl -s "$API/transactions/$TX_ID" -H "Authorization: Bearer $TOKEN_BAKAYOKO" | jqpy "print(d.get('data', {}).get('escrow_status', '?'))")
[ "$st" = "released" ] && ok "transaction → released" || bad "escrow status après PIN = $st"

solde=$(curl -s "$API/auth/me" -H "Authorization: Bearer $TOKEN_BAKAYOKO" | jqpy "print(d['user'].get('solde_portefeuille', '0'))")
[ "$(python3 -c "print(float('$solde') >= 20000)")" = "True" ] && ok "portefeuille vendeur crédité (solde = $solde FCFA)" || bad "portefeuille = $solde"

# ---------- Reçu PDF -----------------------------------------------------------
say "Reçu / facture PDF"
tmp_pdf=$(mktemp /tmp/djassa-receipt-XXXX.pdf)
curl -s "$API/transactions/$TX_ID/receipt" -H "Authorization: Bearer $TOKEN_BAKAYOKO" -o "$tmp_pdf"
pdf_ok=$(head -c 4 "$tmp_pdf")
rm -f "$tmp_pdf"
[ "$pdf_ok" = "%PDF" ] && ok "reçu PDF généré (%PDF)" || bad "reçu PDF invalide ($pdf_ok)"

# ---------- Messagerie ----------------------------------------------------------
say "Messagerie interactive"
msg_code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/messages" -H "Authorization: Bearer $TOKEN_ADJOUA" -H 'Content-Type: application/json' \
  -d "{\"destinataire_id\":\"$(curl -s "$API/auth/me" -H "Authorization: Bearer $TOKEN_BAKAYOKO" | jqpy "print(d['user']['id'])")\",\"article_id\":\"$MEULEUSE_ID\",\"contenu\":\"Bonjour, toujours disponible ?\"}")
[ "$msg_code" = "201" ] && ok "message envoyé → 201" || bad "envoi message → HTTP $msg_code"

say "Bilan"
echo "  PASS=$PASS  FAIL=$FAIL"
[ "$FAIL" -eq 0 ] && printf '\033[1;32m✔ SMOKE OK — API Djassa Online fonctionnelle de bout en bout\033[0m\n' || { printf '\033[1;31m✘ SMOKE KO — voir échecs ci-dessus\033[0m\n'; exit 1; }
