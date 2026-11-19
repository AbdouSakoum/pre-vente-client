import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { SupplierCatalog } from '../../../../shared/models/order.model';
import { mediaUrl } from '../../../../shared/format';

/** Une tuile de rayon : une catégorie du catalogue du fournisseur. */
export interface Aisle {
  name: string;
  count: number;
  /** Photo du premier article du rayon qui en a une. */
  image: string | null;
}

/** Nom du rayon des articles sans catégorie (jamais montré tel quel : traduit « Autres »). */
export const NO_CATEGORY = '';

/**
 * « Rayons » de la boutique d'un fournisseur : une tuile par catégorie, avec la photo d'un article et le
 * nombre de produits, comme la grille de marques des applications de commande pour épiciers. Toucher une
 * tuile ouvre les articles du rayon. Les marques prendront la même place quand les articles en auront.
 */
@Component({
  selector: 'app-aisles',
  templateUrl: './aisles.component.html',
  styleUrls: ['./aisles.component.scss'],
  standalone: false,
})
export class AislesComponent implements OnChanges {
  @Input({ required: true }) catalog!: SupplierCatalog;
  @Output() pick = new EventEmitter<string>();

  aisles: Aisle[] = [];

  readonly media = mediaUrl;
  readonly noCategory = NO_CATEGORY;

  ngOnChanges() {
    const byName = new Map<string, Aisle>();
    for (const p of this.catalog.products) {
      const name = p.category_name || NO_CATEGORY;
      const aisle = byName.get(name) || { name, count: 0, image: null };
      aisle.count++;
      aisle.image = aisle.image || p.image_url || p.variants.find(v => v.image_url)?.image_url || null;
      byName.set(name, aisle);
    }
    // Ordre du catalogue (alphabétique côté serveur) ; « Autres » en dernier.
    this.aisles = [...byName.values()].sort((a, b) => Number(a.name === NO_CATEGORY) - Number(b.name === NO_CATEGORY));
  }

  /** Première lettre du rayon, quand aucun article n'a de photo. */
  letter(a: Aisle): string { return (a.name || '·').charAt(0).toUpperCase(); }

  track(_: number, a: Aisle) { return a.name; }
}
