# Storyboard — Djassa Online — Promo TikTok / WhatsApp Status

Theme: 099 Overhead Desk · Format: 1080×1920 · Length: 30s · Sound: music (corporate/afrobeats) + SFX

## Message & tone
- **Sentence:** I want to say "Le Djassa dans ta poche — achète, vends, troque en confiance en FCFA." in a **warm → trustworthy → bold → warm** tone, so the viewer feels **reassured then excited then ready to act**.
- **Tone arc:** warm (hook humain) → trustworthy (sécurité escrow) → bold (vente flash / troc) → warm (CTA final)
- accent: #ED0F02 (rouge vif Djassa)
- **Motif (optionnel):** le logo Djassa (runner) apparaît au début (coin), revient sur le CTA final, et scelle la carte « LIVRÉ EN CONFIANCE ».
- **Motif (optionnel):** le logo Djassa (runner) apparaît au début (coin), revient sur le CTA final, et scelle la carte « LIVRÉ EN CONFIANCE ».

## The seven questions
1. **Message & tone** — phrase ci-dessus ; chaque shot est relu contre elle.
2. **Is anything repeating?** — voir ledger ; les transitions sont toutes distinctes, les eases varient (back.out, power3.out, expo.out, sine.inOut). Aucune répétition d'entrée consécutive.
3. **What does each transition carry?** — chaque cut porte une signification (voir colonne notes).
4. **Colours over time** — noir dominant shots 1-3 (hook), rouge flood shot 4 (reveal), crème/blanc shots 5-7 (proof), rouge final shot 8 (CTA). Un seul "colour event" par acte.
5. **New component** — **Receipt Sweep** (voir § forge) : main qui balaie des reçus, le dernier reste et un PIN apparaît. Jamais fait avant.
6. **Surprise** — shot 6 : freeze 0.3 s sur le prix barré de la vente flash, puis drop brutal au prix flash (changement d'échelle).
7. **Did this repeat my last film?** — N/A (premier film Djassa), historique `~/.motion-ledger.json` vide.

## Ledger

One row per shot. Fill it **before** building, then run `python tools/variety_audit.py STORYBOARD.md`.
Use `motif:` for a deliberate repeat, and `surprise:` in *notes* for the pattern-breaking moment.
When a shot borrows from a reference video, write `ref:<id>` in its notes and credit it in `REFERENCES.md` ([creative/references.md](../creative/references.md)).
Transition names come from the [transition atlas](../creative/transition-atlas.md) or HyperFrames (`crossfade`, `push-slide`, `circle-iris`…).
List palette colours lead-first, joined with `+`.

| # | start | dur | beat | tone | entrance | transition_out | ease | direction | palette | camera | components | new_component | sfx | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 0:00 | 3.0 | hook | warm | type-slam | beat-cut-hold | expo.out | center | ink+paper | locked | desk-top-down, printed-dashboard, hand | Receipt Sweep | tick-rise | hook humain : main qui balaie des reçus imprimés |
| 2 | 0:03.0 | 2.5 | reveal | warm | mask-open | push-through | power4.out | top-down | ink+paper+coral | push-in | logo-djassa, wordmark | | stab | logo Djassa se pose sur la surface balayée |
| 3 | 0:05.5 | 4.0 | proof | trustworthy | paper-fold | type-carry | power2.out | radial | coral+ink | dolly-out | escrow-card, pin-badge | Receipt Sweep | confirm-ding | séquestre + PIN : fonds bloqués jusqu'à la remise |
| 4 | 0:09.5 | 4.5 | reveal | bold | object-carry | graphic-match-color | back.out(1.7) | right | ink+coral+cream | push-in | flash-card, price-strike | | price-drop | vente flash meuleuse 32 500 → 27 500 FCFA |
| 5 | 0:14.0 | 4.0 | proof | bold | mask-open | object-carry | power3.out | left | coral+ink | locked | troc-card, soulte | | whoosh | troc mixte : iPhone + 15 000 FCFA de soulte |
| 6 | 0:18.0 | 3.0 | surprise | urgent | freeze-rewind | beat-cut-hold | expo.out | center | ink+coral | crash-zoom | price-strike, flash-card | | hard-stop | surprise: freeze 0.3 s sur le prix barré puis drop |
| 7 | 0:21.0 | 4.0 | proof | trustworthy | type-carry | line-to-horizon | power2.out | radial | cream+ink | dolly-out | boutique-card, verified-badge | | confirm-ding | boutique vérifiée + note 4.8/5 + facture PDF |
| 8 | 0:25.0 | 3.0 | cta | warm | dolly-out-reveal | motif:cut | sine.inOut | center | coral+cream | pull-back | cta-card, logo | | fanfare | CTA « Télécharge Djassa » + logo scelle |
| 9 | 0:28.0 | 2.0 | outro | calm | fade | motif:cut | sine.inOut | center | ink+cream | locked | wordmark, tagline | | airy-pad | tagline finale « Le Djassa dans ta poche » |

## Frames

### Frame 1 · Hook — « Le problème » (0:00 → 0:03)
- **key visual** : vue de dessus d'un bureau, des reçus imprimés éparpillés, une main balaie tout sauf un reçu (celui du troc).
- **moves first** : main entre par la droite (power2.inOut), reçus glissent hors champ.
- **on-screen words** : « Trop cher ? Troque. » (≤ 6 mots)
- **beat hook** : premier coup de kick sur l'entrée de la main.

### Frame 2 · Reveal — « Le Djassa » (0:03 → 0:05.5)
- **key visual** : le logo Djassa (runner) se pose sur la surface balayée, le mot « Djassa » se forme.
- **moves first** : logo scale 0.4→1 (back.out), wordmark type-slam.
- **on-screen words** : « Le Djassa dans ta poche. »
- **transition** : push-through depuis le reçu restant.

### Frame 3 · Proof — « Sécurisé » (0:05.5 → 0:09.5)
- **key visual** : carte escrow noire avec montant 85 000 FCFA, statut HELD, code PIN masqué `••••`, icône ShieldCheck rouge.
- **moves first** : carte monte depuis le bas, PIN apparaît digit par digit (steps).
- **on-screen words** : « Paiement sécurisé · Code PIN »
- **new component** : Receipt Sweep (voir § forge) — la main balaie les reçus, le reçu du paiement reste et un PIN apparaît.
- **transition** : type-carry (« sécurisé » devient le titre de la carte).

### Frame 4 · Reveal — « Vente flash » (0:09.5 → 0:14)
- **key visual** : carte produit meuleuse Makita, prix barré 32 500 → 27 500 FCFA, badge −15% FLASH.
- **moves first** : carte entre par la droite (push-in), prix barré puis prix flash apparaît.
- **on-screen words** : « −15 % · Vente flash »
- **transition** : graphic-match-color (le rouge du badge devient le fond du shot suivant).

### Frame 5 · Proof — « Troc » (0:14 → 0:18)
- **key visual** : iPhone + chariot, soulte 15 000 FCFA, flèche troc.
- **moves first** : objet carry (téléphone glisse depuis le shot précédent).
- **on-screen words** : « Troc + soulte FCFA »
- **transition** : object-carry.

### Frame 6 · Surprise — « Le prix qui drop » (0:18 → 0:21)
- **key visual** : freeze 0.3 s sur le prix barré 32 500, puis zoom crash sur 27 500.
- **moves first** : scale 1→1.4 sur le prix flash, fond qui s'assombrit.
- **on-screen words** : « 27 500 FCFA »
- **surprise** : freeze + silence puis drop brutal.

### Frame 7 · Proof — « Boutique vérifiée » (0:21 → 0:25)
- **key visual** : carte boutique « Quincaillerie Moderne », badge vérifié, note 4.8/5, facture PDF.
- **moves first** : dolly-out reveal (zoom arrière montrant la boutique complète).
- **on-screen words** : « Boutiques Pro vérifiées »
- **transition** : line-to-horizon.

### Frame 8 · CTA (0:25 → 0:28)
- **key visual** : logo Djassa + « Télécharge l'app », QR code, boutons stores.
- **moves first** : dolly-out reveal, logo scale.
- **on-screen words** : « Télécharge Djassa »
- **transition** : dolly-out reveal.

### Frame 9 · Outro (0:28 → 0:30)
- **key visual** : wordmark « Djassa Online » + tagline « Le Djassa dans ta poche » sur fond crème.
- **moves first** : fade-in doux.
- **on-screen words** : « Le Djassa dans ta poche. »
- **transition** : fade.

## Component forge — Receipt Sweep

1. **Verb** : protège (escrow).
2. **Metaphor** : reçus imprimés balayés par une main ; le reçu du paiement reste et un PIN apparaît.
3. **Primitive** : document (reçu) + hand.
4. **Twist** : le reçu qui reste s'allume et un PIN apparaît ; la main repart.
5. **Truth check** : montre vraiment la remise avec PIN — le backend renvoie `pin_visible` masqué jusqu'à held.
6. **Motion signature** : sweep horizontal à `steps(12)` + glow sur le reçu restant + PIN digit par digit.

## Sketch sheet (one-page)

```
┌─────────────────────────────────────────────┐
│  [1] Hook: reçus balayés par la main        │
│  [2] Reveal: logo Djassa sur la surface     │
│  [3] Proof: carte escrow HELD + PIN masqué  │
│  [4] Reveal: vente flash meuleuse -15%      │
│  [5] Proof: troc mixte + soulte 15 000      │
│  [6] Surprise: freeze prix puis drop 27 500  │
│  [7] Proof: boutique vérifiée + 4.8/5       │
│  [8] CTA: logo + QR + stores                │
│  [9] Outro: tagline sur crème               │
└─────────────────────────────────────────────┘
```
EOF
echo "=== written ==="; wc -l video-promo/STORYBOARD.md