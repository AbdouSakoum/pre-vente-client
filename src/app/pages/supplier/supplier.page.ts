import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CartService } from '../../core/services/cart.service';
import { LanguageService } from '../../core/services/language.service';
import { OrderService } from '../../core/services/order.service';
import { CatalogProduct, CatalogVariant, SupplierCatalog, SupplierInfo, SupplierUsuals } from '../../shared/models/order.model';
import { formatMoney, initials, mediaUrl } from '../../shared/format';

type Tab = 'usuals' | 'all';

/** Variante dont la quantité se saisit au pavé numérique. */
export interface QtyTarget { product: CatalogProduct; variant: CatalogVariant; }

/**
 * Espace d'un fournisseur (écran de prise de commande) : recherche, « Mes habituels » et
 * « Tout le catalogue », barre panier. Le fournisseur est désigné par le lien du compte (`:linkId`).
 */
@Component({
  selector: 'app-supplier',
  templateUrl: './supplier.page.html',
  styleUrls: ['./supplier.page.scss'],
  standalone: false,
})
export class SupplierPage {
  linkId = '';
  tab: Tab = 'all';
  query = '';
  catalog: SupplierCatalog | null = null;
  usuals: SupplierUsuals | null = null;
  supplier: SupplierInfo | null = null;
  loading = false;
  /** Le fournisseur a coupé la prise de commande dans l'application (403). */
  closed = false;
  errorMsg = '';
  qtyTarget: QtyTarget | null = null;

  readonly media = mediaUrl;
  readonly initials = initials;

  constructor(
    public cart: CartService,
    private orders: OrderService,
    private language: LanguageService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  get total(): string { return formatMoney(this.cart.total(this.linkId), this.cart.currency(this.linkId)); }

  get hasUsuals(): boolean { return !!(this.usuals?.items.length || this.usuals?.last_order); }

  ionViewWillEnter() {
    const linkId = this.route.snapshot.paramMap.get('linkId') || '';
    if (linkId !== this.linkId) { this.catalog = null; this.usuals = null; this.supplier = null; this.query = ''; }
    this.linkId = linkId;
    this.cart.pull(linkId).then(() => this.cdr.detectChanges());
    this.load();
  }

  load(event?: { target: { complete: () => void } }) {
    this.loading = true; this.errorMsg = ''; this.closed = false;
    forkJoin({
      catalog: this.orders.catalog(this.linkId),
      // Sans historique (ou en cas d'erreur), l'écran s'ouvre sur tout le catalogue.
      usuals: this.orders.usuals(this.linkId).pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ catalog, usuals }) => {
        const first = !this.catalog;
        this.catalog = catalog; this.usuals = usuals; this.supplier = catalog.supplier;
        this.cart.refresh(this.linkId, catalog);
        if (first) this.tab = this.hasUsuals ? 'usuals' : 'all';
        this.done(event);
      },
      error: err => {
        if (err.status === 403) this.closed = true;
        else this.errorMsg = err.status === 0 ? this.language.t('common.networkError') : (err.error?.message || this.language.t('common.error'));
        this.done(event);
      },
    });
  }

  onSearch(value: string | null | undefined) {
    this.query = value || '';
    // Une recherche porte sur tout le catalogue.
    if (this.query.trim()) this.tab = 'all';
  }

  openQty(target: QtyTarget) { this.qtyTarget = target; }

  setQty(qty: number) {
    if (this.qtyTarget) this.cart.set(this.linkId, this.qtyTarget.product, this.qtyTarget.variant, qty);
    this.qtyTarget = null;
  }

  openCart() { this.router.navigate(['/supplier', this.linkId, 'cart']); }
  openOrders() { this.router.navigate(['/tabs/orders']); }

  call() { if (this.supplier?.phone) window.location.href = `tel:${this.supplier.phone.replace(/\s/g, '')}`; }

  private done(event?: { target: { complete: () => void } }) {
    this.loading = false;
    event?.target.complete();
    this.cdr.detectChanges();
  }
}
