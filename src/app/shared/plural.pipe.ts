import { inject, Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../core/services/language.service';

/**
 * Texte au bon pluriel : `'offers.articles' | plural:n` lit `offers.articles.one`, `.other`… selon les règles
 * de la langue (Intl.PluralRules : en français 0 et 1 sont au singulier). Un texte sans formes (simple chaîne,
 * comme en arabe où le nom reste au singulier après le nombre) est utilisé tel quel. `{{n}}` vaut le nombre ;
 * `params` ajoute d'autres valeurs. Impur : le texte suit le changement de langue.
 */
@Pipe({ name: 'plural', standalone: true, pure: false })
export class PluralPipe implements PipeTransform {
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);

  transform(key: string, n: number | string | null | undefined, params: Record<string, unknown> = {}): string {
    const count = Number(n) || 0;
    const values = { n: count, ...params };
    const form = new Intl.PluralRules(this.language.current()).select(count);
    for (const k of [`${key}.${form}`, `${key}.other`]) {
      const text = this.translate.instant(k, values);
      if (typeof text === 'string' && text !== k) return text;
    }
    const text = this.translate.instant(key, values);
    return typeof text === 'string' ? text : key;
  }
}
