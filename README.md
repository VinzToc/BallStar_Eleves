# Ball Star (Applis EPS Élèves)
Challenge XP pour les activités d'opposition : tennis de table, badminton, tennis, pickleball, padel, boxe française, lutte, judo.
L'élève enregistre ses matchs, gagne de l'expérience, monte de niveau (Bronze, Argent, Or, Star) et débloque des avatars originaux avec les niveaux et des défis spéciaux.

Dépôt conseillé : `BallStar_Eleves` → https://vinztoc.github.io/BallStar_Eleves/

## Gain d'XP (réglable par le professeur dans Ball Star Prof)
| Source | Par défaut |
|---|---|
| Match joué | +10 XP |
| Victoire | +25 XP |
| Écart au score (victoire seulement) | ≥ 3 pts : +5 · ≥ 6 pts : +10 · ≥ 10 pts : +15 |
| Chaque bonus BallStar validé pendant le match (action motrice choisie avant le match) | +5 XP, 5 au maximum par match |

Niveaux : Bronze (0), Argent (500), Or (1000), Star (1500 XP), pensés pour un cycle d'au moins 16 séances. Chaque niveau débloque un avatar.

## Défis spéciaux : 3 étoiles chacun
La 1re étoile débloque l'avatar du défi, la 2e et la 3e s'affichent en haut à droite de l'avatar. Paliers par défaut (modifiables dans Ball Star Prof) :

| Défi (avatar) | ★ | ★★ | ★★★ |
|---|---|---|---|
| Série de feu (Combo) : victoires d'affilée | 4 | 7 | 10 |
| Tour du monde (Globe) : adversaires différents | 6 | 10 | 15 |
| Œil de lynx (Lynx) : bonus BallStar validés | 20 | 50 | 100 |
| Increvable (Turbo) : matchs joués | 15 | 35 | 60 |
| Rouleau compresseur (Titan) : victoires avec le plus gros bonus d'écart | 3 | 8 | 15 |
| Maîtrise totale (Zen) : matchs d'affilée avec au moins un bonus validé | 5 | 10 | 15 |

## Avatars légendaires (aura étoilée)
Débloqués avec le total d'étoiles de défis (sur 18) : Comète (6), Éclipse (10), Galaxie (14), Supernova (18). 14 avatars en tout.

## Bonus BallStar
10 actions motrices par APSA (liste de référence « 50 actions motrices à valoriser en matchs-défis en EPS », complétée pour le tennis). Le professeur peut modifier les listes ou imposer un bonus dans Ball Star Prof.

## Installation
À l'ouverture, l'appli propose de s'installer si ce n'est pas déjà fait (bouton « Installer » sur Chrome, Edge et Android ; rappel « Partager → Sur l'écran d'accueil » sur iPhone et iPad). « Plus tard » la masque jusqu'à la prochaine ouverture.

## Deux façons d'enregistrer un match
- **📝 Match terminé** : on saisit le score et le nombre de bonus BallStar après le match.
- **🔴 En direct** : un observateur suit **un seul joueur** avec son téléphone. Il touche « +1 point » pour chaque point et « Bonus BallStar réussi ! » à chaque bonus. L'XP s'affiche en direct avec les animations (+10 au départ, +5 par bonus, puis victoire et écart à la fin). L'écran reste allumé, et un direct interrompu (appel, rechargement) reprend à la réouverture. Chaque match garde sa façon d'être saisi (colonne « Saisie » : Direct ou Après le match).

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
