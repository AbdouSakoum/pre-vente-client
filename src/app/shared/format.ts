import { environment } from '../../environments/environment';

/** Adresse d'une photo : absolue telle quelle, relative (/uploads/…) préfixée par le serveur. */
export function mediaUrl(path: string | null | undefined): string {
  if (!path) return '';
  return /^https?:\/\//.test(path) ? path : environment.uploadsUrl + path;
}

/** Montant affiché : deux décimales, virgule, espace des milliers, devise du fournisseur. */
export function formatMoney(value: number | string | null | undefined, currency = 'DH'): string {
  const n = Number(value) || 0;
  const [int, dec] = n.toFixed(2).split('.');
  return `${int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')},${dec} ${currency}`;
}

/** Date du jour du téléphone au format AAAA-MM-JJ (jamais toISOString : décalage UTC). */
export function localDate(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Texte sans accents ni majuscules, pour la recherche. */
export function searchable(text: string | null | undefined): string {
  return String(text || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/**
 * Numéro au format attendu par wa.me (indicatif pays, chiffres seuls), ou null s'il n'est pas reconnu.
 * « 06 12 34 56 78 » et « 0612345678 » (Maroc) → 212612345678 ; « +212… » et « 00212… » gardent leur indicatif.
 */
export function whatsappNumber(phone: string | null | undefined): string | null {
  const raw = String(phone || '').trim();
  let digits = raw.replace(/\D/g, '');
  if (raw.startsWith('+')) { /* indicatif déjà présent */ }
  else if (digits.startsWith('00')) digits = digits.slice(2);
  else if (digits.length === 10 && digits.startsWith('0')) digits = '212' + digits.slice(1);
  return digits.length >= 10 && digits.length <= 15 ? digits : null;
}

/** Initiales d'un nom (deux lettres au plus). */
export function initials(name: string | null | undefined): string {
  return String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}
