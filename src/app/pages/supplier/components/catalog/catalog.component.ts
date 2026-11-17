import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CartService } from '../../../../core/services/cart.service';
import { CatalogProduct, CatalogVariant, SupplierCatalog } from '../../../../shared/models/order.model';
import { formatMoney, mediaUrl, searchable } from '../../../../shared/format';
import { promoPrice, shortDate } from '../../../../shared/promo';
import { QtyTarget } from '../../supplier.page';

/** « Tout le catalogue » : catégories, cartes produit à variantes, ajout au panier. */
@Component({
  selector: 'app-catalog',
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.scss'],
  standalone: false,
})
export class CatalogComponent implements OnChanges {
  @Input({ required: true }) linkId!: string;
  @Input({ required: true }) catalog!: SupplierCatalog;
  /** Recherche saisie dans le bandeau de l'écran. */
  @Input() query = '';
  @Output() qty = new EventEmitter<QtyTarget>();

  category: string | null = null;
  categories: string[] = [];

  readonly media = mediaUrl;
  readonly promo = promoPrice;
  readonly date = shortDate;

  constructor(public cart: CartService) {}

  get currency(): string { return this.catalog.supplier.currency; }

  ngOnChanges() {
    this.categories = [...new Set(this.catalog.products.map(p => p.category_name).filter((c): c is string => !!c))];
    if (this.category && !this.categories.includes(this.category)) this.category = null;
  }

  /**
   * Produits visibles : catégorie choisie, puis recherche sans accents sur produit, variante et
   * catégorie. Les produits entièrement en rupture passent en fin de liste (ordre stable).
   */
  get products(): CatalogProduct[] {
    const q = searchable(this.query.trim());
    const visible = this.catalog.products.filter(p =>
      (!this.category || p.category_name === this.category)
      && (!q || searchable([p.name, p.category_name, ...p.variants.map(v => v.name)].join(' ')).includes(q)));
    const orderable = (p: CatalogProduct) => p.variants.some(v => v.available);
    return [...visible.filter(orderable), ...visible.filter(p => !orderable(p))];
  }

  money(value: number | null): string { return formatMoney(value, this.currency); }

  /** Quantité de ce produit déjà au panier, toutes variantes confondues. */
  inCart(p: CatalogProduct): number { return p.variants.reduce((n, v) => n + this.cart.quantity(this.linkId, v.id), 0); }

  trackProduct(_: number, p: CatalogProduct) { return p.id; }
  trackVariant(_: number, v: CatalogVariant) { return v.id; }
}
