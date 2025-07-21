# server-users
Serveur web sur lequel les usagers vont se connecter


Prompt donné à chatGPT :

J'ai une page client.html connectée à un serveur NodeJs,
Un identifiant unique est créé par utilisateur selon leurs téléphone de façon à ce que si ils se déconnectent/reconnectent au site ils soient reconnu

J'aimerai que la page affiche une série de boutons/champs de textes, adaptés à un affichage sur smartphone (largeur pleine, suffisamment grands)
Les boutons :
Un bouton "pseudo" qui permet lorsque l'on clique dessus ouvre un champ texte et permet de choisir un pseudo (une fois validé le bouton affichera le pseudo)
Un color picker qui permet de choisir une couleur (le bouton prends la couleur)
Un bouton "action" qui émet un évènement,
Un bouton "mouvement" qui demande l'autorisation aux capteurs de mouvements puis ensuite affiche les valeurs (accéléromètre, gyroscope, magnéto)
Un bouton "localisation", qui demande l'accès au GPS puis une fois actif sert à afficher les coordonnées
Un bouton "position x/y" qui transmet des valeurs x et y  qui varient entre 0 et 100 générées aléatoirement (mais qui se suivent), l'appui permet de l'activer ou le désactiver.
Un bouton "selfie" qui demande l'autorisation de prendre un selfie puis transmet l'image compressé au serveur Node.
Un bouton micro, qui demande l'autorisation du micro puis transmet ensuite au serveur une valeur entre 0 et 100 du niveau sonore.
Un bouton "allow notification" qui demande l'autorisation de déclencher des notifications sur le téléphone.
On affiche ensuite une liste des messages transmis par le serveur à destination de l'utilisateur - emit_message( target(str), message(str), notification(bool) ) , l'utilisateur a une liste d'autorisations, initialement son "id" et "all", si la target fait parti de la liste alors le message est ajouté à la liste, si notification true, et que l'autorisation est donnée, on emmet une notification.

Pour les changements ponctuels (pseudo/action/couleurs/envoi selfie) on peut prévoir des fonctions spécifiques de type "update_pseudo(id,pseudo)" et le serveur renvoie une confirmation lorsqu'il l'a enregistré
et pour les données continues (x/y, accellero, GPS, volume sonore...), on structure tout dans un objet js

Peut tu m'aider pour mettre en place ça ? Avec le html css js ?