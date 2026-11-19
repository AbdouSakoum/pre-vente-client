import { CatalogVariant } from './models/order.model';

/**
 * Affichage des promotions (docs/prd/PRD_MODULE_PROMOTIONS.md). Le serveur calcule les prix ;
 * ces fonctions ne font que présenter ce qu'il renvoie.
 */

/** Prix promo de la variante s'il est plus bas que le prix du tarif, sinon null. */
export function promoPrice(v: Pick<CatalogVariant, 'price' | 'promo_price'>): number | null {
  const p = v.promo_price;
  return p !== null && p !== undefined && Number(p) < Number(v.price) ? Number(p) : null;
}

/** Remise en % arrondie, pour l'étiquette « −12 % ». */
export function promoPct(v: Pick<CatalogVariant, 'price' | 'promo_price'>): number {
  const p = promoPrice(v);
  return p === null || !Number(v.price) ? 0 : Math.round((1 - p / Number(v.price)) * 100);
}

/**
 * Jours restants avant la fin d'une promotion (date de fin AAAA-MM-JJ incluse) : 0 le dernier jour,
 * null si la date est absente. Calcul sur les dates du calendrier local, sans heure ni fuseau.
 */
export function daysLeft(endsOn: string | null | undefined, today = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(endsOn || '');
  if (!m) return null;
  const end = Date.UTC(+m[1], +m[2] - 1, +m[3]);
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.max(0, Math.round((end - now) / 86400000));
}

/** JJ/MM d'une date AAAA-MM-JJ, sans passer par Date (pas de décalage de fuseau). */
export function shortDate(iso: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  return m ? `${m[3]}/${m[2]}` : '';
}
