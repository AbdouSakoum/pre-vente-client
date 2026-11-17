/**
 * Langue de l'interface — source unique de vérité. Seuls les textes changent : la mise en page
 * reste de gauche à droite en arabe (même décision que l'application terrain).
 */
import { Injectable, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { TranslateLoader, TranslateService, TranslationObject } from '@ngx-translate/core';
import { Observable, firstValueFrom, from } from 'rxjs';

export type Lang = 'fr' | 'ar';
export const LANGS: readonly Lang[] = ['fr', 'ar'];

const STORAGE_KEY = 'sc_lang';
const DEFAULT_LANG: Lang = 'fr';

/** Dictionnaires chargés depuis le bundle : aucun appel réseau. */
export class BundledTranslateLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<TranslationObject> {
    const load = lang === 'ar' ? import('../../i18n/ar.json') : import('../../i18n/fr.json');
    return from(load.then(m => m.default as TranslationObject));
  }
}

@Injectable({ providedIn: 'root' })
export class LanguageService {
  readonly current = signal<Lang>(DEFAULT_LANG);

  private readonly translate = inject(TranslateService);
  private readonly document = inject(DOCUMENT);

  /** Au démarrage : charge le français (repli) puis la langue mémorisée. */
  async init(): Promise<void> {
    await firstValueFrom(this.translate.setFallbackLang(DEFAULT_LANG));
    await this.use(this.stored());
  }

  async use(lang: Lang): Promise<void> {
    const next = LANGS.includes(lang) ? lang : DEFAULT_LANG;
    await firstValueFrom(this.translate.use(next));
    this.current.set(next);
    this.document.documentElement.lang = next;
    this.document.documentElement.dir = 'ltr';
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* choix non mémorisé */ }
  }

  toggle(): Promise<void> { return this.use(this.current() === 'fr' ? 'ar' : 'fr'); }

  /** Traduction ponctuelle depuis le TypeScript (messages d'erreur, confirmations). */
  t(key: string, params?: Record<string, unknown>): string {
    return this.translate.instant(key, params) as string;
  }

  private stored(): Lang {
    try {
      const v = localStorage.getItem(STORAGE_KEY) as Lang | null;
      return v && LANGS.includes(v) ? v : DEFAULT_LANG;
    } catch { return DEFAULT_LANG; }
  }
}
