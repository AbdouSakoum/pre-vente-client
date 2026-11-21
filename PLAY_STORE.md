# Stradi Connect — préparation de la fiche Play Store

Préparé le 18 nov. 2026. Compte Play Console : celui de l'application Stradi (`com.keepon.mobile`).
Rien n'est encore créé dans la Play Console.

## Identité de l'application

| Champ | Valeur |
| --- | --- |
| Nom de l'application | Stradi Connect |
| Identifiant (nom du package) | `com.stradi.client` — **définitif** : il ne peut plus être changé après le premier envoi |
| Langue par défaut | Français (France) |
| Application ou jeu | Application |
| Gratuite ou payante | Gratuite |
| Catégorie | Professionnel |
| Adresse email de contact | contact@stradis-performance.com |
| Site web | https://stra-di.com |

## Textes de la fiche

**Description courte** (80 caractères maximum, 78 ici) :

> Commandez chez vos fournisseurs et suivez vos commandes depuis votre téléphone

**Description complète** :

> Stradi Connect est l'application de commande pour les clients des distributeurs qui utilisent Stradi.
>
> Reliez votre compte à vos fournisseurs, consultez leur catalogue et passez vos commandes quand vous voulez, sans attendre le passage du commercial.
>
> CE QUE VOUS POUVEZ FAIRE
> • Ajouter un fournisseur en scannant son QR code, ou laisser son commercial scanner le vôtre
> • Consulter le catalogue et les prix de chaque fournisseur
> • Voir les promotions en cours
> • Remplir votre panier et envoyer votre commande
> • Suivre vos commandes : envoyée, validée, livrée
> • Recevoir les nouveautés de vos fournisseurs dans l'application
> • Consulter votre solde chez chaque fournisseur
>
> COMMENT ÇA MARCHE
> 1. Créez votre compte avec votre email ou votre numéro de téléphone.
> 2. Reliez-vous à un fournisseur avec son QR code.
> 3. Commandez. Votre fournisseur valide la commande, puis vous livre.
>
> L'application est disponible en français et en arabe.
>
> Stradi Connect fonctionne avec les distributeurs équipés de Stradi, l'application de gestion terrain éditée par STRADIS Performance. Si votre fournisseur ne l'utilise pas encore, parlez-lui de Stradi : https://stra-di.com

Version arabe des textes : à rédiger avant la mise en production (facultative pour les pistes de test).

## Visuels

| Visuel | Exigence Google | Fichier |
| --- | --- | --- |
| Icône | PNG 512 × 512 | `resources/play-store/icone-512.png` (prêt) |
| Image de présentation | PNG ou JPEG 1024 × 500 | `resources/play-store/banniere-1024x500.png` (prêt) |
| Captures d'écran téléphone | 2 minimum, 8 maximum, format portrait | **à faire** sur un téléphone avec l'APK « Connect DEV » : connexion, liste des fournisseurs, catalogue, panier, suivi de commande |

## Questionnaires de la Play Console (section « Contenu de l'application »)

| Rubrique | Réponse |
| --- | --- |
| Règles de confidentialité | `https://stra-di.com/mentions-legales` (section « Application Stradi Connect ») |
| Accès à l'application | « Tout ou partie des fonctionnalités est limité » : fournir à Google un **compte de test** (identifiant + mot de passe) relié à un fournisseur de démonstration |
| Annonces | Non, l'application ne contient pas d'annonces |
| Classification du contenu | Questionnaire à remplir ; application utilitaire sans contenu sensible |
| Public cible | 18 ans et plus (application professionnelle) |
| Sécurité des données | Données collectées : nom, email ou téléphone, type de commerce, ville, adresse, **position approximative et précise (facultative, à l'inscription)**, historique de commandes. Finalité : fonctionnement de l'application et gestion du compte. Chiffrées en transit (HTTPS en production). Pas de vente ; transmises aux seuls fournisseurs que l'utilisateur relie. L'appareil photo lit les QR codes, aucune image n'est collectée |
| Suppression de compte | Dans l'application : Compte → Supprimer mon compte. URL à déclarer : `https://stra-di.com/connect/suppression-compte` |
| Statut de professionnel | « Oui, mon statut de professionnel s'applique à cette appli » |
| Conditions d'utilisation (facultatif) | `https://stra-di.com/connect/conditions-utilisation` — page écrite le 18 nov. 2026, à faire relire par un juriste ; en ligne après déploiement du site |
| Applications gouvernementales, financières, santé | Non |

## Avant la publication : ce qui manque

- [x] **Suppression de compte dans l'application** (18 nov. 2026, non commité) : onglet Compte → « Supprimer mon compte » → mot de passe. Route `POST /api/client-app/account/delete`. À tester sur le dev avec un compte créé par le fondateur.
- [x] **Page web de suppression de compte** : `https://stra-di.com/connect/suppression-compte` (écrite le 18 nov. 2026 ; **en ligne seulement après déploiement du site**).
- [x] **Règles de confidentialité** : section « Application Stradi Connect » ajoutée à `https://stra-di.com/mentions-legales` (même réserve : après déploiement du site).
- [ ] **Déployer le site** `stra-di.com` (`/deploy site`) : Google vérifie que les deux adresses répondent.
- [x] **Clé de signature** créée le 18 nov. 2026 (`node scripts/create-keystore.js`) : `android/stradi-connect.keystore` + `android/keystore.properties`, tous deux hors git. **À sauvegarder hors du PC** : sans eux, plus aucune mise à jour possible (sauf demande de réinitialisation à Google).
- [x] **Premier fichier pour les tests internes** : `stradi-connect-0.1.0.aab` (code 100), branché sur le dev (`--configuration dev` + `-PallowHttp=true`).
- [x] **0.2.3** (code 203, 21 nov. 2026) : déverrouillage par empreinte, confirmation de déconnexion.
- [x] **Première version de production** : `stradi-connect-0.2.2.aab` (code 202, 21 nov. 2026 ; bibliothèques natives compressées pour la règle des 16 Ko — 0.2.1 en tests internes), API `https://app.stra-di.com/api`. Publication à faire.
- [ ] **Captures d'écran** (voir Visuels).
- [ ] **Compte de test pour Google** (créé par le fondateur).
- [ ] **Adresse de l'API** : la première version envoyée sur une piste de test pointe sur le dev (HTTP, adresse IP). La version de production doit pointer sur `https://app.stra-di.com/api` — `environment.prod.ts` indique encore `app.kep-on.com`, à décider.

## Étapes dans la Play Console

1. **Créer l'application** : Toutes les applications → Créer une application → nom, langue, type, gratuite ; accepter les déclarations.
2. **Configurer l'application** : le tableau de bord liste les rubriques de « Contenu de l'application » (tableau ci-dessus).
3. **Fiche principale du Store** : textes et visuels de ce document.
4. **Tests internes** (piste la plus rapide, sans examen complet, jusqu'à 100 testeurs) : créer une liste de testeurs par email, puis envoyer le premier fichier AAB signé. Google propose alors « Signature d'application Play » : accepter.
5. **Tests fermés puis production** : la Play Console indique si l'application doit d'abord passer par un test fermé (12 testeurs pendant 14 jours pour les comptes personnels récents) avant de demander l'accès à la production.

## Construire le fichier à envoyer (sur demande uniquement)

```powershell
cd C:\Users\HP\Desktop\Personnel\stradis\app\keepon\client-app
npx ng build --configuration production      # ou dev pour une piste de test branchée sur le dev
$env:NODE_ENV = 'production'
npx cap sync android
cd android
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
.\gradlew.bat :app:bundleRelease '-PappVersionCode=100' '-PappVersionName=0.1.0'
```

Code de version : majeur × 10000 + mineur × 100 + correctif (0.1.0 → 100), strictement croissant à chaque envoi.
Le type `release` interdit le HTTP. Pour une version de test branchée sur le dev (HTTP) : construire le web
avec `--configuration dev` et ajouter `'-PallowHttp=true'` à la commande Gradle. Jamais pour la production.
