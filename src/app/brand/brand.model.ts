/**
 * Version de l'application : Stradi (tous les fournisseurs) ou personnalisée pour un distributeur
 * (un seul fournisseur, son nom, son logo, ses couleurs). Les valeurs viennent de brands/<clé>.json.
 */
export interface BrandConfig {
  key: string;
  appName: string;
  /** Identifiant du distributeur dans une version personnalisée ; `null` dans la version Stradi. */
  supplierSlug: string | null;
  /** Chemin du logo sous src/. */
  logo: string;
  colors: { primary: string; accent: string };
}
