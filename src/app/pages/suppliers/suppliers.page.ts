import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { ActionSheetController } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { LanguageService } from '../../core/services/language.service';
import { SupplierService } from '../../core/services/supplier.service';
import { BrandService } from '../../brand/brand.service';
import { Supplier } from '../../shared/models/supplier.model';
import { ClientOrderStep, STEP_ICONS, clientStep, isOpenStep } from '../../shared/models/order.model';
import { formatMoney, initials, mediaUrl } from '../../shared/format';
import { cardsFromOffers, OfferCard } from '../../shared/offers';

/**
 * Accueil : « Mes fournisseurs ». Chaque carte montre le panier en cours, sinon l'état de la
 * dernière commande, ou que le fournisseur ne prend pas les commandes. En haut, des lignes « à reprendre »
 * (commandes en cours, paniers en attente) n'apparaissent que si elles servent. La ligne sous la liste
 * ajoute un fournisseur (scanner son QR code ou montrer le sien). Version personnalisée : un seul fournisseur.
 */
@Component({
  selector: 'app-suppliers',
  templateUrl: './suppliers.page.html',
  styleUrls: ['./suppliers.page.scss'],
  standalone: false,
})
export class SuppliersPage {
  suppliers: Supplier[] = [];
  loading = false;
  loaded = false;
  errorMsg = '';
  /** Fournisseur à retirer de la liste, en attente de confirmation. */
  removing: Supplier | null = null;
  /** Offres du moment, tous fournisseurs confondus (vide si la lecture échoue : l'accueil reste utilisable). */
  offerCards: OfferCard[] = [];
  busy = false;

  readonly media = mediaUrl;
  readonly initials = initials;
  readonly stepIcons = STEP_ICONS;

  constructor(
    public brand: BrandService,
    public auth: AuthService,
    public cart: CartService,
    private service: SupplierService,
    private language: LanguageService,
    private actionSheet: ActionSheetController,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  /** L'ajout reste proposé tant que la version personnalisée n'a pas son fournisseur. */
  get canAdd(): boolean { return !this.brand.single || !this.suppliers.length; }

  get firstName(): string { return (this.auth.account()?.name || '').split(/\s+/)[0] || ''; }

  /** Fournisseurs chez qui un panier attend : une ligne « Panier en cours chez … » chacun. */
  get cartSuppliers(): Supplier[] { return this.visible.filter(s => s.ordering_open && this.cart.count(s.link_id) > 0); }

  get openOrders(): number { return this.visible.filter(s => this.lastStep(s) && isOpenStep(this.lastStep(s)!)).length; }

  /** Fournisseurs affichés ; ceux que le client a retirés sont dans Mon compte › Fournisseurs retirés. */
  get visible(): Supplier[] { return this.suppliers.filter(s => !s.hidden); }

  // À chaque retour : un fournisseur a pu être ajouté, un panier rempli, une commande validée.
  ionViewWillEnter() { this.load(); }

  load(event?: { target: { complete: () => void } }) {
    this.loading = true; this.errorMsg = '';
    this.service.offers().subscribe({
      next: rows => { this.offerCards = cardsFromOffers(rows); this.cdr.detectChanges(); },
      error: () => {},
    });
    this.service.list().subscribe({
      next: rows => {
        this.suppliers = rows;
        this.done(event);
        // Paniers gardés sur le serveur : ceux remplis sur un autre appareil apparaissent ici.
        Promise.all(rows.map(s => this.cart.pull(s.link_id))).then(() => this.cdr.detectChanges());
      },
      error: err => {
        this.errorMsg = err.status === 0 ? this.language.t('common.networkError') : (err.error?.message || this.language.t('common.error'));
        this.done(event);
      },
    });
  }

  open(s: Supplier) { this.router.navigate(['/supplier', s.link_id]); }

  openCart(s: Supplier) { this.router.navigate(['/supplier', s.link_id, 'cart']); }

  openOrdersTab() { this.router.navigate(['/tabs/orders']); }

  /** Offre touchée sur l'accueil : l'espace du fournisseur s'ouvre sur ses articles. */
  openOffer(card: OfferCard) {
    if (card.linkId) this.router.navigate(['/supplier', card.linkId], { queryParams: { offer: card.promo.id } });
  }

  openBalance(s: Supplier, event: Event) { event.stopPropagation(); this.router.navigate(['/supplier', s.link_id, 'balance']); }

  due(s: Supplier): string { return formatMoney(s.total_due, s.currency); }

  lastStep(s: Supplier): ClientOrderStep | null {
    return s.last_order_status ? clientStep({ status: s.last_order_status as never, reject_reason: s.last_order_reject_reason }) : null;
  }

  cartTotal(s: Supplier): string { return formatMoney(this.cart.total(s.link_id), this.cart.currency(s.link_id)); }

  /** Ajouter un fournisseur : scanner son QR code, ou montrer le sien au commercial. */
  async add() {
    const sheet = await this.actionSheet.create({
      header: this.language.t('suppliers.addTitle'),
      buttons: [
        { text: this.language.t('suppliers.scan'), icon: 'scan-outline', handler: () => { this.router.navigateByUrl('/link'); } },
        { text: this.language.t('suppliers.showMyCode'), icon: 'qr-code-outline', handler: () => { this.router.navigateByUrl('/my-code'); } },
        { text: this.language.t('common.cancel'), role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  scan() { this.router.navigateByUrl('/link'); }
  myCode() { this.router.navigateByUrl('/my-code'); }

  askRemove(s: Supplier, event: Event) { event.stopPropagation(); this.removing = s; }

  /** Retire le fournisseur de la liste (le lien reste : le client ne délie jamais). */
  confirmRemove() {
    if (!this.removing || this.busy) return;
    this.busy = true;
    this.service.setHidden(this.removing.link_id, true).subscribe({
      next: () => { this.busy = false; this.removing = null; this.load(); },
      error: err => {
        this.busy = false; this.removing = null;
        this.errorMsg = err.error?.message || this.language.t('common.error');
        this.cdr.detectChanges();
      },
    });
  }

  private done(event?: { target: { complete: () => void } }) {
    this.loading = false; this.loaded = true;
    event?.target.complete();
    this.cdr.detectChanges();
  }
}
