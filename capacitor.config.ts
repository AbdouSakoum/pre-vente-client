import type { CapacitorConfig } from '@capacitor/cli';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const brand = require('./brand.active.json');

// En développement, l'application charge le serveur local (ng serve) ; NODE_ENV=production
// avant `cap sync` pour embarquer le build, sinon l'APK pointe vers localhost.
const isDev = process.env['NODE_ENV'] !== 'production';
const DEV_HOST = process.env['DEV_HOST'] || 'localhost';

const config: CapacitorConfig = {
  // Identifiant et nom de la version appliquée (scripts/apply-brand.js).
  appId: brand.appId,
  appName: brand.appName,
  webDir: 'www',
  server: {
    androidScheme: 'http',
    ...(isDev && { url: `http://${DEV_HOST}:8200` }),
  },
};

export default config;
