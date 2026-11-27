import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CartLine, CartService } from '../../core/services/cart.service';
import { LanguageService } from '../../core/services/language.service';
import { OrderService } from '../../core/services/order.service';
import { CartPricing, OrderCreated, SupplierInfo } from '../../shared/models/order.model';
import { formatMoney, localDate, mediaUrl } from '../../shared/format';
import { roundQty } from '../../shared/units';

/** Choix rapide de date : demain et les deux jours suivants. */
interface DayChoice { value: string; label: string; day: string; }

/**
 * Panier d'un fournisseur : quantités, date souhaitée, note, envoi. Le catalogue est relu à
 * l'ouverture pour les prix et ruptures à jour ; le serveur recalcule tout à l'envoi.
 */
@Component({
  selector: 'app-cart',
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
  standalone: false,
})
export class CartPage {
  linkId = '';
  supplier: SupplierInfo | null = null;
  desiredDate = '';
  note = '';
  sending = false;
  /** Dernier envoi tombé faute de réseau : le bouton devient « Réessayer ». */
  networkFailed = false;
  errorMsg = '';
  /** Lignes écartées en recommandant (produit retiré ou en rupture). */
  skipped = 0;
  sent: { order: OrderCreated['order']; count: number; date: string } | null = null;
  days: DayChoice[] = [];
  readonly today = localDate();
  readonly media = mediaUrl;

  constructor(
    public cart: CartService,
    private orders: OrderService,
    private language: LanguageService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  get lines(): CartLine[] { return this.cart.lines(this.linkId); }
  get outOfStock(): CartLine[] { return this.lines.filter(l => !l.available); }
  get sendable(): CartLine[] { return this.lines.filter(l => l.available); }
  /** Total du serveur (promotions et seuil compris) dès qu'il est à jour, sinon estimation locale. */
  get total(): string { return this.money(this.cart.total(this.linkId)); }
  /** Promotions calculées par le serveur ; null pendant une modification pas encore enregistrée. */
  get pricing(): CartPricing | null { return this.cart.pricing(this.linkId); }
  /** La date choisie n'est pas l'un des trois jours proposés. */
  get otherDate(): boolean { return !!this.desiredDate && !this.days.some(d => d.value === this.desiredDate); }

  ionViewWillEnter() {
    this.linkId = this.route.snapshot.paramMap.get('linkId') || '';
    this.skipped = Number(this.route.snapshot.queryParamMap.get('skipped')) || 0;
    this.sent = null; this.errorMsg = ''; this.networkFailed = false;
    this.days = this.nextDays();
    // Panier du serveur d'abord (modifié ailleurs ?), puis prix et ruptures du catalogue.
    this.cart.pull(this.linkId).finally(() => this.loadCatalog());
  }

  private loadCatalog() {
    this.orders.catalog(this.linkId).subscribe({
      next: c => { this.supplier = c.supplier; this.cart.refresh(this.linkId, c); this.cdr.detectChanges(); },
      // Hors ligne : le panier gardé reste affiché ; l'envoi dira ce qui ne va pas.
      error: () => this.cdr.detectChanges(),
    });
  }

  money(value: number): string { return formatMoney(value, this.supplier?.currency || this.cart.currency(this.linkId)); }

  /** Unités offertes de cette ligne (null sans offre). */
  freeFor(line: CartLine): CartPricing['free'][number] | null {
    return this.pricing?.free.find(f => f.variant_id === line.variant_id) || null;
  }

  change(line: CartLine, delta: number) { this.cart.setQuantity(this.linkId, line.variant_id, roundQty(line.quantity + delta)); }
  remove(line: CartLine) { this.cart.setQuantity(this.linkId, line.variant_id, 0); }
  removeOutOfStock() { this.cart.removeOutOfStock(this.linkId); }
  empty() { this.cart.clear(this.linkId); }

  pickDate(value: string) { this.desiredDate = this.desiredDate === value ? '' : value; }

  openPicker(input: HTMLInputElement) {
    try { (input as HTMLInputElement & { showPicker?: () => void }).showPicker?.(); } catch { input.focus(); }
  }

  send() {
    if (this.sending || !this.sendable.length) return;
    if (this.desiredDate && this.desiredDate < this.today) { this.errorMsg = this.language.t('cart.pastDate'); return; }
    // Les lignes passées en rupture ne partent pas : le client l'a vu dans le bandeau.
    if (this.outOfStock.length) this.cart.removeOutOfStock(this.linkId);
    const count = this.cart.count(this.linkId);
    this.sending = true; this.errorMsg = ''; this.networkFailed = false;
    this.orders.send(this.linkId, {
      // Même clé tant que l'envoi n'a pas abouti : un nouvel essai ne crée pas de doublon.
      client_key: this.cart.key(this.linkId),
      lines: this.lines.map(l => ({ variant_id: l.variant_id, quantity: l.quantity })),
      desired_delivery_date: this.desiredDate || null,
      note: this.note.trim() || null,
    }).subscribe({
      next: res => {
        this.sending = false;
        this.sent = { order: res.order, count, date: this.desiredDate };
        // Le serveur a vidé le panier en créant la commande.
        this.cart.clear(this.linkId, false);
        this.desiredDate = ''; this.note = '';
        this.cdr.detectChanges();
      },
      error: err => {
        this.sending = false;
        this.networkFailed = err.status === 0;
        this.errorMsg = this.networkFailed ? '' : (err.error?.message || this.language.t('common.error'));
        this.cdr.detectChanges();
      },
    });
  }

  backToCatalog() { this.router.navigate(['/supplier', this.linkId], { replaceUrl: true }); }
  seeOrders() { this.router.navigate(['/tabs/orders'], { replaceUrl: true }); }

  private nextDays(): DayChoice[] {
    const lang = this.language.current() === 'ar' ? 'ar-MA' : 'fr-FR';
    return [1, 2, 3].map(offset => {
      const d = new Date();
      d.setDate(d.getDate() + offset);
      const weekday = d.toLocaleDateString(lang, { weekday: 'long' });
      return {
        value: localDate(d),
        label: offset === 1 ? this.language.t('cart.tomorrow') : weekday.charAt(0).toUpperCase() + weekday.slice(1),
        day: d.toLocaleDateString(lang, { weekday: 'short', day: 'numeric' }),
      };
    });
  }
}
