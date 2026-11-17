import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { BRAND } from './brand.generated';
import { BrandConfig } from './brand.model';

/**
 * Version appliquée à l'application — seul endroit qui lit la configuration de marque.
 * Aucun écran ne teste le nom d'un distributeur : il lit `single`, `supplierSlug`, `logo`.
 */
@Injectable({ providedIn: 'root' })
export class BrandService {
  readonly config: BrandConfig = BRAND;

  private readonly document = inject(DOCUMENT);
  private readonly title = inject(Title);

  get appName(): string { return this.config.appName; }
  get logo(): string { return this.config.logo; }
  /** Identifiant du fournisseur unique, ou `null` dans la version Stradi. */
  get supplierSlug(): string | null { return this.config.supplierSlug; }
  /** Version personnalisée : un seul fournisseur. */
  get single(): boolean { return !!this.config.supplierSlug; }

  /** Au démarrage : couleurs de la version sur les variables CSS, nom dans le titre. */
  init(): void {
    const style = this.document.documentElement.style;
    style.setProperty('--sc-primary', this.config.colors.primary);
    style.setProperty('--sc-primary-rgb', this.rgb(this.config.colors.primary));
    style.setProperty('--sc-accent', this.config.colors.accent);
    style.setProperty('--sc-accent-rgb', this.rgb(this.config.colors.accent));
    this.title.setTitle(this.appName);
    this.document.querySelector('meta[name="theme-color"]')?.setAttribute('content', this.config.colors.primary);
  }

  /** « #0A1F44 » → « 10, 31, 68 ». */
  private rgb(hex: string): string {
    const n = parseInt(hex.slice(1), 16);
    return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
  }
}
