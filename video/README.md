# video — production vidéo

Contenu déplacé depuis `video-promo/` (aucun fichier perdu).

| Élément | Description |
|---|---|
| `djassa-promo/` | Film de lancement HyperFrames (≈30,5 s, 9 plans, musique corporate) |
| `BRIEF.md`, `STORYBOARD.md` | Brief créatif et découpage |
| `capture/`, `capture2/` | Captures d'écran et notes de tournage |

## Rendu

```bash
cd djassa-promo && npm install && npx hyperframes render
```

Les dépendances Playwright/ffmpeg sont nécessaires pour les captures. Ne pas committer de clés d'API de services d'image.
