# Animations Rive — assets Djassa Online

Ce dossier accueille les fichiers `.riv` chargés par le frontend (`@rive-app/react-canvas`).

## `djassa-pin-success.riv` (en attente de connexion Rive)

Source : `/rive-animations/djassa-pin-success/scene.rml` — animation « Fonds libérés »
(coche Noir & Rouge, flat line-art bichrome, 1,1 s).

Le CLI Rive refuse d'écrire un `.riv` tant que la machine n'est pas connectée (`rive login`).
Pour générer le fichier :

```bash
export PATH="$HOME/.rive/bin:$PATH"
cd rive-animations/djassa-pin-success
rive login            # une seule fois (compte rivet.app)
rive . --publish      # signe et écrit build/djassa-pin-success.riv
cp build/djassa-pin-success.riv frontend-web/public/animations/
```

L'application détecte alors automatiquement le fichier (HEAD `/animations/djassa-pin-success.riv`)
et l'utilise à la place du repli SVG animé (dessin CSS, rendu identique).
Scène **sans script** : un build local non signé fonctionne sur les runtimes web.
