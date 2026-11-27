/**
 * Unités de vente d'une variante — même liste et même règle que backend/src/utils/units.js
 * et frontend/src/app/shared/units.ts. L'unité décide seule des décimales : poids, volume et
 * longueur (kg, g, L, ml, m) acceptent 3 chiffres après la virgule ; les unités comptées
 * (pièce, carton…) restent entières. Unité absente = pièce (comportement d'avant).
 * Libellés courts : clés de traduction `units.<clé>`.
 */
export type Unit = 'piece' | 'carton' | 'pack' | 'sac' | 'boite' | 'kg' | 'g' | 'l' | 'ml' | 'm';

export const UNITS: Unit[] = ['piece', 'carton', 'pack', 'sac', 'boite', 'kg', 'g', 'l', 'ml', 'm'];
export const DEFAULT_UNIT: Unit = 'piece';
const DECIMAL_UNITS: Unit[] = ['kg', 'g', 'l', 'ml', 'm'];
export const QTY_DECIMALS = 3;

/** Unité reconnue, sinon « pièce » (donnée ancienne ou absente). */
export function unitOf(unit: string | null | undefined): Unit {
  return (UNITS as string[]).includes(unit || '') ? unit as Unit : DEFAULT_UNIT;
}

export function isDecimalUnit(unit: string | null | undefined): boolean {
  return DECIMAL_UNITS.includes(unitOf(unit));
}

/** Décimales autorisées à la saisie pour cette unité (0 = entiers). */
export function qtyDecimals(unit: string | null | undefined): number {
  return isDecimalUnit(unit) ? QTY_DECIMALS : 0;
}

/** Arrondi à 3 décimales (évite 0.30000000000000004 dans les sommes). */
export function roundQty(n: number): number {
  return Math.round(Number(n) * 1000) / 1000;
}

/** Pas d'un champ de saisie : 0,001 pour une unité décimale, 1 sinon. */
export function qtyStep(unit: string | null | undefined): number {
  return isDecimalUnit(unit) ? 0.001 : 1;
}

/** Quantité valide pour l'unité (entière, ou 3 décimales au plus), strictement positive par défaut. */
export function isValidQty(value: number, unit: string | null | undefined, allowZero = false): boolean {
  if (!Number.isFinite(value) || (allowZero ? value < 0 : value <= 0)) return false;
  return isDecimalUnit(unit) ? Math.abs(roundQty(value) - value) < 1e-9 : Number.isInteger(value);
}

/** Clavier du téléphone pour la saisie : avec virgule seulement pour une unité décimale. */
export function qtyInputMode(unit: string | null | undefined): 'decimal' | 'numeric' {
  return isDecimalUnit(unit) ? 'decimal' : 'numeric';
}

/** Plus petite quantité saisissable : 1 (unité comptée) ou 0,001 (unité décimale). */
export function minQty(unit: string | null | undefined): number {
  return qtyStep(unit);
}

/**
 * Saisie libre (virgule ou point) → quantité pour l'unité ; NaN si illisible.
 * Unité comptée : partie entière (comme l'ancien parseInt) ; unité décimale : 3 décimales.
 */
export function toQty(raw: unknown, unit: string | null | undefined): number {
  const text = typeof raw === 'number' ? String(raw) : String(raw ?? '').trim().replace(',', '.');
  const n = text === '' ? NaN : Number(text);
  if (!Number.isFinite(n)) return NaN;
  return isDecimalUnit(unit) ? roundQty(n) : Math.trunc(n);
}

/**
 * Boutons − / + : pas de 1 quelle que soit l'unité. Sous le minimum, on garde la valeur
 * courante si elle est déjà inférieure à 1 (0,5 kg), sinon on retombe à 1.
 */
export function bumpQty(current: number, delta: number, unit: string | null | undefined): number {
  const cur = Number(current) || 1;
  const next = roundQty(cur + delta);
  return next >= minQty(unit) ? next : Math.min(cur, 1);
}

/** Nombre d'articles d'un panier : une ligne au poids compte pour 1, sinon sa quantité. */
export function countUnits(lines: { qty?: number | string; quantity?: number | string; unit?: string | null }[]): number {
  return roundQty(lines.reduce((s, l) => s + (isDecimalUnit(l.unit) ? 1 : Number(l.qty ?? l.quantity) || 0), 0));
}
