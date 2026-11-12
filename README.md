# Ball Star (Applis EPS Élèves)
Challenge XP pour les activités d'opposition individuelle : tennis de table, badminton, tennis, sports de combat.
L'élève enregistre ses matchs, gagne de l'expérience, monte de niveau (Bronze, Argent, Or, Star) et débloque des avatars originaux avec les niveaux et des défis spéciaux.

Dépôt conseillé : `BallStar_Eleves` → https://vinztoc.github.io/BallStar_Eleves/

## Gain d'XP (réglable par le professeur dans Ball Star Prof)
| Source | Par défaut |
|---|---|
| Match joué | +10 XP |
| Victoire | +25 XP |
| Écart au score (victoire seulement) | ≥ 3 pts : +5 · ≥ 6 pts : +10 · ≥ 10 pts : +15 |
| Chaque observable validé pendant le match (par l'adversaire, un observateur ou l'élève) | +5 XP, 5 au maximum par match |

Niveaux : Bronze (0), Argent (150), Or (400), Star (750 XP). Chaque niveau débloque un avatar.

## Défis spéciaux : 3 étoiles chacun
La 1re étoile débloque l'avatar du défi, la 2e et la 3e s'affichent en haut à droite de l'avatar. Paliers par défaut (modifiables dans Ball Star Prof) :

| Défi (avatar) | ★ | ★★ | ★★★ |
|---|---|---|---|
| Série de feu (Combo) : victoires d'affilée | 3 | 5 | 7 |
| Tour du monde (Globe) : adversaires différents | 5 | 8 | 12 |
| Œil de lynx (Lynx) : observables validés | 5 | 15 | 30 |
| Increvable (Turbo) : matchs joués | 10 | 20 | 35 |
| Rouleau compresseur (Titan) : victoires avec le plus gros bonus d'écart | 1 | 3 | 5 |
| Maîtrise totale (Zen) : matchs d'affilée avec au moins un observable validé | 3 | 5 | 8 |

## Arène
Boutons « 📜 Règles du jeu » (pop-up avec le barème, les niveaux et les paliers des défis) et « 📥 Importer les règles du prof ».

## Réglages : uniquement dans Ball Star Prof
- L'élève **ne peut pas modifier** le barème ni les observables : le bouton « Règles du jeu » de l'Arène les affiche en lecture seule.
- Le professeur règle le jeu dans **Ball Star Prof** (https://vinztoc.github.io/BallStar_Prof/) et exporte `BallStar_Reglages_<code>.xlsx`.
- L'élève l'importe depuis l'Arène. Un fichier modifié à la main est refusé (code de contrôle).
- Chaque match enregistre le code des réglages utilisés (colonne « Réglages »).
- De toute façon, Ball Star Prof recalcule l'XP avec les réglages du professeur.

## Données (consignes du portail)
- Identification par `eleve-core.js` (nom, prénom, classe issus du portail Applis EPS Élèves, sinon saisis par l'élève).
- Une ligne par match dans la feuille **ballstar** de la base locale « EPSEleves » : récupérée automatiquement par le portail.
- « Exporter mes données » : `NOM_Prenom_Classe_BallStar.xlsx` (colonnes Nom, Prénom, Classe + détail du match), importable dans Mes Apps EPS.
- « Effacer mes données » : avertissement avec proposition d'exporter d'abord.
- Toute la progression est recalculée à partir des matchs : réimporter une sauvegarde dans le portail restaure XP, niveau et avatars.

## Mise à jour
`APP_VERSION` dans `version.js` et `VERSION` dans `sw.js`. Fonctionne hors ligne (PWA).
`eps-core.js` et `eleve-core.js` sont des copies de celles du portail : les recopier si le portail évolue. `bs-rules.js` doit rester identique à celui de BallStar_Prof.

## Ajout au portail
Dans `apps.json` du dépôt `Applis_EPS_Eleves`, ajouter (et copier `icons/icon-192-BallStar.png` dans `icons/` du portail) :
```json
{"id":"ballstar","nom":"Ball Star","desc":"Challenge XP en raquettes et combat : gagne des niveaux et débloque des avatars","url":"https://vinztoc.github.io/BallStar_Eleves/","icon":"icons/icon-192-BallStar.png","emoji":"⭐","couleur":"#ffe14a,#8f5bff","categorie":"Performances"}
```
