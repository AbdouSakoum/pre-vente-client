import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CartService } from '../../../../core/services/cart.service';
import { CatalogProduct, CatalogVariant } from '../../../../shared/models/order.model';
import { QtyTarget } from '../../supplier.page';

/**
 * Ajout au panier d'une variante (même commande que la prise de commande terrain) :
 * bouton d'ajout tant qu'elle n'est pas au panier, puis compteur −/+ ; un toucher sur la quantité
 * ouvre le pavé de saisie. `step` : quantité ajoutée d'un geste (quantité habituelle).
 */
@Component({
  selector: 'app-qty-control',
  templateUrl: './qty-control.component.html',
  styleUrls: ['./qty-control.component.scss'],
  standalone: false,
})
export class QtyControlComponent {
  @Input({ required: true }) linkId!: string;
  @Input({ required: true }) product!: CatalogProduct;
  @Input({ required: true }) variant!: CatalogVariant;
  @Input() step = 1;
  @Output() keypad = new EventEmitter<QtyTarget>();

  constructor(public cart: CartService) {}

  get quantity(): number { return this.cart.quantity(this.linkId, this.variant.id); }

  add() { if (this.variant.available) this.cart.set(this.linkId, this.product, this.variant, this.step); }

  change(delta: number) {
    if (delta > 0 && !this.variant.available) return;
    this.cart.set(this.linkId, this.product, this.variant, this.quantity + delta);
  }

  openKeypad() { this.keypad.emit({ product: this.product, variant: this.variant }); }
}
