import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CartService } from '../../../../core/services/cart.service';
import { CatalogProduct, CatalogVariant, SupplierCatalog, SupplierUsuals } from '../../../../shared/models/order.model';
import { formatMoney, mediaUrl } from '../../../../shared/format';
import { promoPrice } from '../../../../shared/promo';
import { QtyTarget } from '../../supplier.page';

interface UsualRow { product: CatalogProduct; variant: CatalogVariant; usualQty: number; }

/**
 * « Mes habituels » : reprendre la dernière commande en un geste, puis les produits que ce client
 * commande d'habitude chez ce fournisseur, avec sa quantité habituelle en ajout rapide.
 */
@Component({
  selector: 'app-usuals',
  templateUrl: './usuals.component.html',
  styleUrls: ['./usuals.component.scss'],
  standalone: false,
})
export class UsualsComponent implements OnChanges {
  @Input({ required: true }) linkId!: string;
  @Input({ required: true }) catalog!: SupplierCatalog;
  @Input({ required: true }) usuals!: SupplierUsuals;
  @Output() qty = new EventEmitter<QtyTarget>();

  rows: UsualRow[] = [];
  /** Résultat du dernier « Tout ajouter » : lignes ajoutées et écartées. */
  result: { added: number; skipped: number } | null = null;

  readonly media = mediaUrl;
  readonly promo = promoPrice;

  constructor(public cart: CartService) {}

  get currency(): string { return this.catalog.supplier.currency; }

  /** Lignes de la dernière commande encore au catalogue. */
  get lastCount(): number { return this.usuals.last_order?.lines.reduce((n, l) => n + l.quantity, 0) || 0; }

  ngOnChanges() {
    const byVariant = new Map<string, { product: CatalogProduct; variant: CatalogVariant }>();
    for (const p of this.catalog.products) for (const v of p.variants) byVariant.set(v.id, { product: p, variant: v });
    // Seules les variantes encore au catalogue ; les disponibles d'abord.
    const rows = this.usuals.items
      .filter(i => byVariant.has(i.variant_id))
      .map(i => ({ ...byVariant.get(i.variant_id)!, usualQty: Math.max(1, i.last_qty || 1) }));
    this.rows = [...rows.filter(r => r.variant.available), ...rows.filter(r => !r.variant.available)];
  }

  money(value: number | null): string { return formatMoney(value, this.currency); }

  addLastOrder() {
    if (!this.usuals.last_order) return;
    this.result = this.cart.addLines(this.linkId, this.catalog, this.usuals.last_order.lines);
  }
}
