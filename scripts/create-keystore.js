/**
 * Crée la clé de signature de Stradi Connect — À LANCER UNE SEULE FOIS.
 *
 *   node scripts/create-keystore.js
 *
 * Écrit android/stradi-connect.keystore et android/keystore.properties (mot de passe aléatoire),
 * tous deux ignorés par git. Le mot de passe n'est jamais affiché : il se lit dans keystore.properties.
 * Ces deux fichiers doivent être sauvegardés hors du poste : sans eux, plus aucune mise à jour possible.
 * Refuse d'écraser une clé existante.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const android = path.join(__dirname, '..', 'android');
const keystore = path.join(android, 'stradi-connect.keystore');
const props = path.join(android, 'keystore.properties');
const keytool = path.join(process.env.JAVA_HOME || 'C:\\Program Files\\Android\\Android Studio\\jbr', 'bin', 'keytool');
const ALIAS = 'stradi-connect';

if (fs.existsSync(keystore) || fs.existsSync(props)) {
  console.error('[keystore] Une clé existe déjà : rien n\'est modifié.');
  process.exit(1);
}

const password = crypto.randomBytes(24).toString('base64url');
execFileSync(keytool, [
  '-genkeypair', '-v',
  '-keystore', keystore, '-storetype', 'PKCS12',
  '-alias', ALIAS, '-keyalg', 'RSA', '-keysize', '2048', '-validity', '10000',
  '-storepass', password, '-keypass', password,
  '-dname', 'CN=STRADIS Performance, O=STRADIS Performance, L=Casablanca, C=MA',
], { stdio: ['ignore', 'ignore', 'inherit'] });

fs.writeFileSync(props, [
  '# Signature release locale — NE PAS COMMITER (ignoré par .gitignore)',
  'storeFile=stradi-connect.keystore',
  `storePassword=${password}`,
  `keyAlias=${ALIAS}`,
  `keyPassword=${password}`,
  '',
].join('\n'));
console.log('[keystore] Clé créée : android/stradi-connect.keystore');
console.log('[keystore] Mot de passe enregistré dans android/keystore.properties (non affiché).');
console.log('[keystore] Sauvegarder ces deux fichiers hors de ce poste.');
