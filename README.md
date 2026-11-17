# Stradi Client

Application de commande pour les clients des distributeurs qui utilisent Stradi.
Le client se connecte avec son email ou son téléphone, relie son compte à ses fournisseurs (il scanne
leur QR code, ou le commercial scanne le sien), commande dans leur catalogue, suit ses commandes,
ses nouveautés et son solde.

## Démarrer

```
npm install
npm start        # version Stradi, http://localhost:8200 (backend local sur le port 3000)
```

## Écrans

| Écran | Dossier |
| --- | --- |
| Connexion, inscription (3 étapes), mot de passe oublié | `pages/login`, `pages/register`, `pages/forgot-password` |
| Onglets : Fournisseurs, Commandes, Compte | `pages/tabs`, `pages/suppliers`, `pages/orders`, `pages/profile` |
| Ajouter un fournisseur, Mon QR code | `pages/link`, `pages/my-code` |
| Espace fournisseur (habituels, catalogue, pavé de quantité, promotions) | `pages/supplier` |
| Panier et envoi | `pages/cart` |
| Détail d'une commande | `pages/order-detail` |
| Nouveautés (notifications dans l'application) | `pages/notifications` |
| Mon solde | `pages/balance` |

Design : composants `.st-*` de `src/theme/stradi.scss` (système de l'application terrain Stradi), jetons de couleur
dans `src/theme/variables.scss` (`--sc-primary`, `--sc-accent`… recolorables pour une version distributeur).
Arabe : textes traduits, mise en page du français conservée.

## Deux versions, un seul code

Chaque version est décrite dans `brands/<clé>.json` : nom, identifiant de l'application,
logo, couleurs et, pour une version distributeur, l'identifiant du seul fournisseur affiché.

```
npm run brand -- stradi                  # version Stradi : tous les fournisseurs
npm run brand -- exemple-distributeur    # version personnalisée d'un distributeur
```

## Documentation

- Référence complète (modèle, parcours, API, migrations, compatibilité) : `docs/STRADI_CLIENT.md` du projet (`app/docs/`).
- Règles métier : `docs/prd/PRD_MODULE_STRADI_CLIENT_COMMANDE.md`, `docs/prd/PRD_MODULE_PROMOTIONS.md`.
- Reste à faire : `docs/STRADI_CLIENT_RESTE_A_FAIRE.md`.

API : routes `/api/client-app/*` du backend Stradi (`keepon/backend`).
