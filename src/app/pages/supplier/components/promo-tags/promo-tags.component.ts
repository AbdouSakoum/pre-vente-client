import { Component, Input } from '@angular/core';
import { CatalogVariant } from '../../../../shared/models/order.model';
import { promoPct, shortDate } from '../../../../shared/promo';

/** Étiquettes de promotion d'une variante : « −12 % jusqu'au 30/11 », « 10 achetés + 1 offert ». */
@Component({
  selector: 'app-promo-tags',
  templateUrl: './promo-tags.component.html',
  styleUrls: ['./promo-tags.component.scss'],
  standalone: false,
})
export class PromoTagsComponent {
  @Input({ required: true }) variant!: CatalogVariant;

  readonly date = shortDate;

  get pct(): number { return promoPct(this.variant); }
}
