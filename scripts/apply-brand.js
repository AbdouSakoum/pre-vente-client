/**
 * Applique une version de l'application (Stradi, ou personnalisée pour un distributeur).
 *
 *   node scripts/apply-brand.js                  → version Stradi (ou variable BRAND)
 *   node scripts/apply-brand.js mon-distributeur → brands/mon-distributeur.json
 *
 * Écrit src/app/brand/brand.generated.ts (lu par l'application) et brand.active.json
 * (lu par capacitor.config.ts : identifiant et nom de l'application). Le code ne change pas
 * d'une version à l'autre : tout ce qui diffère est dans brands/<clé>.json.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const key = process.argv[2] || process.env.BRAND || 'stradi';
const file = path.join(root, 'brands', `${key}.json`);

function fail(message) {
  console.error(`[brand] ${message}`);
  process.exit(1);
}

if (!/^[a-z0-9-]+$/.test(key)) fail(`Clé invalide : « ${key} » (minuscules, chiffres, tirets).`);
if (!fs.existsSync(file)) fail(`Fichier introuvable : brands/${key}.json`);

const brand = JSON.parse(fs.readFileSync(file, 'utf8'));
const HEX = /^#[0-9a-fA-F]{6}$/;

if (brand.key !== key) fail(`« key » doit valoir « ${key} ».`);
if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(brand.appId || '')) fail('« appId » invalide (ex. com.stradi.client).');
if (!brand.appName) fail('« appName » est obligatoire.');
if (!HEX.test(brand.colors?.primary || '') || !HEX.test(brand.colors?.accent || '')) {
  fail('« colors.primary » et « colors.accent » doivent être au format #RRGGBB.');
}
if (!brand.logo || !fs.existsSync(path.join(root, 'src', brand.logo))) fail(`Logo introuvable : src/${brand.logo}`);
if (brand.supplierSlug !== null && typeof brand.supplierSlug !== 'string') {
  fail('« supplierSlug » : identifiant du distributeur, ou null pour la version Stradi.');
}

const config = {
  key: brand.key,
  appName: brand.appName,
  supplierSlug: brand.supplierSlug || null,
  logo: brand.logo,
  colors: { primary: brand.colors.primary, accent: brand.colors.accent },
};

const outDir = path.join(root, 'src', 'app', 'brand');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, 'brand.generated.ts'),
  `// Fichier généré par scripts/apply-brand.js — ne pas modifier à la main.\n`
  + `import { BrandConfig } from './brand.model';\n\n`
  + `export const BRAND: BrandConfig = ${JSON.stringify(config, null, 2)};\n`
);
fs.writeFileSync(
  path.join(root, 'brand.active.json'),
  JSON.stringify({ key: brand.key, appId: brand.appId, appName: brand.appName }, null, 2) + '\n'
);

console.log(`[brand] Version appliquée : ${brand.appName} (${brand.key})`
  + (config.supplierSlug ? ` — fournisseur unique : ${config.supplierSlug}` : ' — tous les fournisseurs'));
