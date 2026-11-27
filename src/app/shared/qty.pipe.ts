import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from '../core/services/language.service';
import { QTY_DECIMALS, unitOf } from './units';

/** Format des nombres : français partout (chiffres latins, même décision que l'application terrain). */
const LOCALE = 'fr-FR';

/**
 * Quantité lisible avec son unité : `{{ l.quantity | qty: l.unit }}` → « 1,25 kg », « 3 u. ».
 * Entier sans décimales, sinon jusqu'à 3 décimales. `unit` absent : nombre seul.
 * Impur : suit le changement de langue (français / arabe).
 */
@Pipe({ name: 'qty', standalone: true, pure: false })
export class QtyPipe implements PipeTransform {
  private language = inject(LanguageService);

  transform(value: number | string | null | undefined, unit?: string | null): string {
    if (value === null || value === undefined || value === '') return '';
    const n = Number(value);
    if (!Number.isFinite(n)) return String(value);
    const text = n.toLocaleString(LOCALE, { minimumFractionDigits: 0, maximumFractionDigits: QTY_DECIMALS });
    return unit === undefined || unit === null ? text : `${text} ${this.language.t('units.' + unitOf(unit))}`;
  }
}
