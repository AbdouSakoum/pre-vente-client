import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { formatMoney } from '../../../../shared/format';
import { QtyTarget } from '../../supplier.page';

const MAX_DIGITS = 5;

/**
 * Saisie d'une quantité au pavé numérique, pour les grosses commandes (24, 48, 120…).
 * Quantités rapides proposées ; le prix par quantité s'affiche dès qu'il s'applique. 0 retire la ligne.
 */
@Component({
  selector: 'app-qty-sheet',
  templateUrl: './qty-sheet.component.html',
  styleUrls: ['./qty-sheet.component.scss'],
  standalone: false,
})
export class QtySheetComponent implements OnInit {
  @Input({ required: true }) target!: QtyTarget;
  @Input() current = 0;
  @Input() currency = 'DH';
  @Output() done = new EventEmitter<number>();
  @Output() cancel = new EventEmitter<void>();

  value = '';
  readonly keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  get qty(): number { return Number(this.value) || 0; }

  /** Quantités rapides : multiples du seuil de prix par quantité, sinon des colisages courants. */
  get presets(): number[] {
    const min = this.target.variant.bulk_min_qty;
    return min ? [min, min * 2, min * 4, min * 8].filter(n => n <= 99999) : [6, 12, 24, 48];
  }

  get bulkApplies(): boolean {
    const v = this.target.variant;
    return v.bulk_price !== null && v.bulk_min_qty !== null && this.qty >= v.bulk_min_qty;
  }

  /** Prix de départ (tarif ou prix par quantité), puis prix promo s'il est plus bas (estimation : le serveur tranche). */
  get listPrice(): number { return Number(this.bulkApplies ? this.target.variant.bulk_price : this.target.variant.price); }

  get unitPrice(): number {
    const promo = this.target.variant.promo_price;
    return promo !== null && promo !== undefined && Number(promo) < this.listPrice ? Number(promo) : this.listPrice;
  }

  /** Unités offertes pour la quantité saisie (« X achetés + Y offerts »). */
  get freeUnits(): number {
    const f = this.target.variant.free_offer;
    return f && f.buy_qty && f.free_qty ? Math.floor(this.qty / f.buy_qty) * f.free_qty : 0;
  }

  get total(): string { return this.money(Math.round(this.qty * this.unitPrice * 100) / 100); }

  ngOnInit() { this.value = this.current ? String(this.current) : ''; }

  money(n: number | null): string { return formatMoney(n, this.currency); }

  press(key: string) { if (this.value.length < MAX_DIGITS) this.value = (this.value === '0' ? '' : this.value) + key; }
  back() { this.value = this.value.slice(0, -1); }
  clear() { this.value = ''; }
  preset(n: number) { this.value = String(n); }

  confirm() { this.done.emit(this.target.variant.available ? this.qty : Math.min(this.qty, this.current)); }
}
