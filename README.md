# Ball Star (Applis EPS Élèves)
Challenge XP pour les activités d'opposition individuelle : tennis de table, badminton, tennis, sports de combat.
L'élève enregistre ses matchs, gagne de l'expérience, monte de niveau (Bronze, Argent, Or, Star) et débloque des avatars originaux avec les niveaux et des défis spéciaux.

Dépôt conseillé : `BallStar_Eleves` → https://vinztoc.github.io/BallStar_Eleves/

## Gain d'XP (réglable par le professeur)
| Source | Par défaut |
|---|---|
| Match joué | +10 XP |
| Victoire | +25 XP |
| Écart au score (victoire seulement) | ≥ 3 pts : +5 · ≥ 6 pts : +10 · ≥ 10 pts : +15 |
| Observable réussi (validé par l'adversaire, un observateur ou l'élève) | +5 XP |

Niveaux : Bronze (0), Argent (150), Or (400), Star (750 XP). Chaque niveau débloque un avatar.

## Défis spéciaux (un avatar bonus chacun)
Série de feu (3 victoires d'affilée) · Tour du monde (5 adversaires différents) · Œil de lynx (5 observables réussis) · Increvable (10 matchs) · Rouleau compresseur (victoire avec le plus gros bonus d'écart) · Maîtrise totale (3 observables réussis d'affilée).

## Observables
- Le professeur règle la liste par activité (⚙️), et peut imposer un observable à la classe.
- Sinon l'élève choisit dans la liste ou écrit le sien.
- Diffusion : ⚙️ → « Exporter les réglages » produit `BallStar_Reglages.xlsx` (feuille `BallStar_Config`, modifiable dans un tableur). Les élèves l'importent depuis l'écran « Match ».

## Données (consignes du portail)
- Identification par `eleve-core.js` (nom, prénom, classe issus du portail Applis EPS Élèves, sinon saisis par l'élève).
- Une ligne par match dans la feuille **ballstar** de la base locale « EPSEleves » : récupérée automatiquement par le portail.
- « Exporter mes données » : `NOM_Prenom_Classe_BallStar.xlsx` (colonnes Nom, Prénom, Classe + détail du match), importable dans Mes Apps EPS.
- « Effacer mes données » : avertissement avec proposition d'exporter d'abord.
- Toute la progression est recalculée à partir des matchs : réimporter une sauvegarde dans le portail restaure XP, niveau et avatars.

## Mise à jour
`APP_VERSION` dans `version.js` et `VERSION` dans `sw.js`. Fonctionne hors ligne (PWA).
`eps-core.js` et `eleve-core.js` sont des copies de celles du portail : les recopier si le portail évolue.

## Ajout au portail
Dans `apps.json` du dépôt `Applis_EPS_Eleves`, ajouter (et copier `icons/icon-192-BallStar.png` dans `icons/` du portail) :
```json
{"id":"ballstar","nom":"Ball Star","desc":"Challenge XP en raquettes et combat : gagne des niveaux et débloque des avatars","url":"https://vinztoc.github.io/BallStar_Eleves/","icon":"icons/icon-192-BallStar.png","emoji":"⭐","couleur":"#ffe14a,#8f5bff","categorie":"Performances"}
```
