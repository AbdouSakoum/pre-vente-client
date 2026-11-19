import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CartService } from '../../core/services/cart.service';
import { LanguageService } from '../../core/services/language.service';
import { OrderService } from '../../core/services/order.service';
import { CatalogProduct, CatalogVariant, PromoBrief, SupplierCatalog, SupplierInfo, SupplierUsuals } from '../../shared/models/order.model';
import { formatMoney, initials, mediaUrl, whatsappNumber } from '../../shared/format';
import { cardsFromCatalog, OfferCard } from '../../shared/offers';

/** Onglets de la boutique, comme les applications de commande pour épiciers (Chari…). */
export type ShopTab = 'home' | 'aisles' | 'offers' | 'usuals';

/** Variante dont la quantité se saisit au pavé numérique. */
export interface QtyTarget { product: CatalogProduct; variant: CatalogVariant; }

/** Barre d'onglets du bas : icône et libellé. */
const TABS: { tab: ShopTab; icon: string; label: string }[] = [
  { tab: 'home', icon: 'home-outline', label: 'shop.tabs.home' },
  { tab: 'aisles', icon: 'grid-outline', label: 'shop.tabs.aisles' },
  { tab: 'offers', icon: 'pricetag-outline', label: 'shop.tabs.offers' },
  { tab: 'usuals', icon: 'repeat-outline', label: 'shop.tabs.usuals' },
];

/**
 * Boutique d'un fournisseur (prise de commande). Recherche toujours en haut, quatre onglets en bas :
 * Accueil (offres, « Commander à nouveau », rayons), Rayons (grille, puis les articles d'un rayon),
 * Offres (bannières et articles en promotion), Habituels (réachat). Une recherche porte sur tout le
 * catalogue, quel que soit l'onglet. Le fournisseur est désigné par le lien du compte (`:linkId`).
 */
@Component({
  selector: 'app-supplier',
  templateUrl: './supplier.page.html',
  styleUrls: ['./supplier.page.scss'],
  standalone: false,
})
export class SupplierPage {
  linkId = '';
  tab: ShopTab = 'home';
  query = '';
  catalog: SupplierCatalog | null = null;
  usuals: SupplierUsuals | null = null;
  supplier: SupplierInfo | null = null;
  loading = false;
  /** Le fournisseur a coupé la prise de commande dans l'application (403). */
  closed = false;
  errorMsg = '';
  qtyTarget: QtyTarget | null = null;
  /** Onglet Rayons : rayon ouvert ('' : articles sans catégorie) ; null : la grille. */
  aisle: string | null = null;
  /** Onglet Offres : offre choisie dans les bannières ; null : toutes les offres. */
  offer: PromoBrief | null = null;
  /** Bannières « Offres du moment », tirées du catalogue. */
  offerCards: OfferCard[] = [];
  /** Offre demandée depuis l'accueil de l'application (?offer=), appliquée à la lecture du catalogue. */
  private pendingOffer: string | null = null;

  readonly tabs = TABS;
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

  get searching(): boolean { return !!this.query.trim(); }

  /** Articles en promotion (pastille de l'onglet Offres). */
  get promoCount(): number {
    return (this.catalog?.products || []).filter(p => p.variants.some(v => v.promo || v.free_offer)).length;
  }

  ionViewWillEnter() {
    const linkId = this.route.snapshot.paramMap.get('linkId') || '';
    if (linkId !== this.linkId) {
      this.catalog = null; this.usuals = null; this.supplier = null; this.query = '';
      this.tab = 'home'; this.aisle = null; this.offer = null;
    }
    this.linkId = linkId;
    this.pendingOffer = this.route.snapshot.queryParamMap.get('offer');
    this.cart.pull(linkId).then(() => this.cdr.detectChanges());
    this.load();
  }

  load(event?: { target: { complete: () => void } }) {
    this.loading = true; this.errorMsg = ''; this.closed = false;
    forkJoin({
      catalog: this.orders.catalog(this.linkId),
      // Sans historique (ou en cas d'erreur), pas de « Commander à nouveau ».
      usuals: this.orders.usuals(this.linkId).pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ catalog, usuals }) => {
        this.catalog = catalog; this.usuals = usuals; this.supplier = catalog.supplier;
        this.cart.refresh(this.linkId, catalog);
        this.offerCards = cardsFromCatalog(catalog);
        // Offre touchée sur l'accueil de l'application : l'onglet Offres, sur ses articles.
        const wanted = this.offerCards.find(c => c.promo.id === this.pendingOffer);
        if (wanted) this.pickOffer(wanted);
        this.pendingOffer = null;
        this.done(event);
      },
      error: err => {
        if (err.status === 403) this.closed = true;
        else this.errorMsg = err.status === 0 ? this.language.t('common.networkError') : (err.error?.message || this.language.t('common.error'));
        this.done(event);
      },
    });
  }

  onSearch(value: string | null | undefined) { this.query = value || ''; }

  /** Onglet du bas ; retoucher l'onglet ouvert revient à sa première vue (grille des rayons, toutes les offres). */
  setTab(tab: ShopTab) {
    if (tab === this.tab) { this.aisle = null; this.offer = null; }
    this.tab = tab; this.query = '';
  }

  openAisle(name: string) { this.tab = 'aisles'; this.aisle = name; this.query = ''; }

  /** Bannière touchée : onglet Offres, sur les articles de cette offre (une remise de commande n'en a pas : toutes). */
  pickOffer(card: OfferCard) {
    this.tab = 'offers'; this.query = '';
    this.offer = card.count ? card.promo : null;
  }

  openQty(target: QtyTarget) { this.qtyTarget = target; }

  setQty(qty: number) {
    if (this.qtyTarget) this.cart.set(this.linkId, this.qtyTarget.product, this.qtyTarget.variant, qty);
    this.qtyTarget = null;
  }

  openCart() { this.router.navigate(['/supplier', this.linkId, 'cart']); }
  openOrders() { this.router.navigate(['/tabs/orders']); }

  call() { if (this.supplier?.phone) window.location.href = `tel:${this.supplier.phone.replace(/\s/g, '')}`; }

  /** Lien WhatsApp vers le fournisseur, avec un premier message qui présente le client ; null sans numéro. */
  get whatsapp(): string | null {
    const number = whatsappNumber(this.supplier?.phone);
    if (!number || !this.supplier) return null;
    const text = this.language.t('supplier.whatsappText', { name: this.supplier.client_name });
    return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
  }

  /** Nom affiché d'un rayon ('' : articles sans catégorie). */
  aisleLabel(name: string): string { return name || this.language.t('shop.otherAisle'); }

  private done(event?: { target: { complete: () => void } }) {
    this.loading = false;
    event?.target.complete();
    this.cdr.detectChanges();
  }
}
