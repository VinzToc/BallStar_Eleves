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
- **👀 Observer en direct** : l'élève est **observateur** d'un match entre deux camarades (il ne peut pas être l'un des joueurs). Il saisit les deux joueurs et le bonus BallStar de chacun, puis touche « +1 point » et « Bonus ! » pour chaque joueur. L'XP des joueurs et la sienne s'affichent en direct avec les animations. L'écran reste allumé, et un direct interrompu reprend à la réouverture.
- Le match observé **ne compte pas** dans les matchs de l'observateur : il apparaît dans son historique avec la mention « Observateur » et lui rapporte de l'XP d'observateur (+20 XP par match observé, +2 XP par bonus noté, 5 bonus maximum comptés par joueur ; réglable dans Ball Star Prof).
- **QR code** : à la fin du match, l'observateur affiche un QR code signé (réaffichable depuis son Bilan). Depuis la v1.9, le code est compact (environ 85 caractères, 37×37 modules au lieu de 77×77, marge blanche réglementaire) pour être lu par les appareils anciens ; les anciens codes restent acceptés. Chaque joueur le scanne dans son appli (Arène → 📷 Scanner un match observé, ou avec une photo du QR code) et le match s'ajoute à son historique avec son XP. Un QR code modifié ou déjà scanné est refusé.
- Si un joueur n'a pas scanné, Ball Star Prof lui attribue quand même le match en important le fichier de l'observateur.

## Arène
Boutons « 📜 Règles du jeu » (pop-up avec le barème, les niveaux et les paliers des défis) et « 📥 Importer les règles du prof ».

## Réglages : uniquement dans Ball Star Prof
- L'élève **ne peut pas modifier** le barème ni les observables : le bouton « Règles du jeu » de l'Arène les affiche en lecture seule.
- Le professeur règle le jeu dans **Ball Star Prof** (https://vinztoc.github.io/BallStar_Prof/) et exporte `BallStar_Reglages_<code>.xlsx`.
- L'élève l'importe depuis l'Arène. Un fichier modifié à la main est refusé (code de contrôle).
- Chaque match enregistre le code des réglages utilisés (colonne « Réglages »).
- De toute façon, Ball Star Prof recalcule l'XP avec les réglages du professeur.

## Envoyer vers Nuage (facultatif)
Si le professeur colle dans Ball Star Prof le lien de partage d'un dossier Nuage (cloud de l'Éducation nationale, ou tout Nextcloud), le Bilan de l'élève affiche « ☁️ Envoyer vers Nuage ». Sans lien dans les réglages, aucun bouton.
- Envoi direct du fichier `NOM_Prenom_Classe_BallStar_AAAA-MM-JJ_HHhMM.xlsx` sur le partage (WebDAV public).
- Si le serveur ou le navigateur refuse l'envoi direct, le fichier est enregistré sur l'appareil et la page de dépôt Nuage s'ouvre pour le déposer.
- Le lien arrive chez l'élève par le fichier de réglages signé : un lien modifié à la main est refusé.
- Partage protégé : le prof coche « mot de passe » ; l'élève tape le mot de passe au premier envoi, il est retenu sur son appareil (bouton « Oublier le mot de passe »). Le mot de passe ne figure jamais dans les réglages ni dans les fichiers.

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

## Bibliothèques incluses (dossier `lib/`)
- `qrcode.js` : QR Code Generator for JavaScript, Kazuhiko Arase, licence MIT.
- `jsQR.js` : lecture de QR codes, Cosmo Wolfe, licence Apache-2.0.

## Compatibilité des fichiers de réglages (v2.2 élève / v1.7 prof)
- Le code de contrôle « R2 » est calculé sur le contenu du fichier : un fichier de réglages reste valable d'une version à l'autre.
- Le fichier contient aussi l'ancien code, pour les applis élèves pas encore mises à jour.
- Les deux applis utilisent désormais la dernière version dès qu'il y a du réseau (service worker « réseau d'abord »).
