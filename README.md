# Stradi Client

Application de commande pour les clients des distributeurs qui utilisent Stradi.
Le client se connecte avec son email ou son téléphone, ajoute ses fournisseurs en scannant
leur QR code, puis commande chez eux.

## Démarrer

```
npm install
npm start        # version Stradi, http://localhost:8200 (backend local sur le port 3000)
```

## Deux versions, un seul code

Chaque version est décrite dans `brands/<clé>.json` : nom, identifiant de l'application,
logo, couleurs et, pour une version distributeur, l'identifiant du seul fournisseur affiché.

```
npm run brand -- stradi                  # version Stradi : tous les fournisseurs
npm run brand -- exemple-distributeur    # version personnalisée d'un distributeur
```

API : routes `/api/client-app/*` du backend Stradi (dépôt pre-vente_be).