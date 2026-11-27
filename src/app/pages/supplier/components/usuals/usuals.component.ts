import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CartService } from '../../../../core/services/cart.service';
import { CatalogProduct, CatalogVariant, SupplierCatalog, SupplierUsuals } from '../../../../shared/models/order.model';
import { formatMoney, mediaUrl } from '../../../../shared/format';
import { promoPrice } from '../../../../shared/promo';
import { QtyTarget } from '../../supplier.page';
import { countUnits, isDecimalUnit, roundQty } from '../../../../shared/units';

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

  /** Articles de la dernière commande ; une ligne au poids compte pour 1 (unité lue au catalogue). */
  get lastCount(): number {
    const units = new Map<string, string | null>();
    for (const p of this.catalog.products) for (const v of p.variants) units.set(v.id, v.unit ?? null);
    return countUnits((this.usuals.last_order?.lines || []).map(l => ({ quantity: l.quantity, unit: units.get(l.variant_id) ?? null })));
  }

  ngOnChanges() {
    const byVariant = new Map<string, { product: CatalogProduct; variant: CatalogVariant }>();
    for (const p of this.catalog.products) for (const v of p.variants) byVariant.set(v.id, { product: p, variant: v });
    // Seules les variantes encore au catalogue ; les disponibles d'abord.
    const rows = this.usuals.items
      .filter(i => byVariant.has(i.variant_id))
      .map(i => {
        const found = byVariant.get(i.variant_id)!;
        return { ...found, usualQty: this.usualQty(Number(i.last_qty) || 0, found.variant.unit) };
      });
    this.rows = [...rows.filter(r => r.variant.available), ...rows.filter(r => !r.variant.available)];
  }

  money(value: number | null): string { return formatMoney(value, this.currency); }

  /** Quantité habituelle : décimale gardée au poids (0,5 kg), au moins 1 pour une unité comptée. */
  private usualQty(last: number, unit: string | null | undefined): number {
    if (isDecimalUnit(unit)) return last > 0 ? roundQty(last) : 1;
    return Math.max(1, Math.floor(last) || 1);
  }

  addLastOrder() {
    if (!this.usuals.last_order) return;
    this.result = this.cart.addLines(this.linkId, this.catalog, this.usuals.last_order.lines);
  }
}
