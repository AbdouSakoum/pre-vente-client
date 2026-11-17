import { Component, EventEmitter, Input, Output } from '@angular/core';
import { OrderCreated, SupplierInfo } from '../../../../shared/models/order.model';
import { formatMoney } from '../../../../shared/format';

/** Confirmation d'envoi : numéro, total, date souhaitée et prochaines étapes. */
@Component({
  selector: 'app-order-sent',
  templateUrl: './order-sent.component.html',
  styleUrls: ['./order-sent.component.scss'],
  standalone: false,
})
export class OrderSentComponent {
  @Input({ required: true }) order!: OrderCreated['order'];
  @Input() supplier: SupplierInfo | null = null;
  /** Nombre d'unités envoyées. */
  @Input() count = 0;
  /** Date de livraison souhaitée (AAAA-MM-JJ), ou vide. */
  @Input() date = '';
  @Output() orders = new EventEmitter<void>();
  @Output() more = new EventEmitter<void>();

  get total(): string { return formatMoney(this.order.total_ttc, this.supplier?.currency); }
}
