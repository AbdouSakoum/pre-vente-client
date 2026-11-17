import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { LanguageService } from '../../core/services/language.service';
import { OrderService } from '../../core/services/order.service';
import { ClientOrderDetail, ClientOrderStep, STEP_ICONS, clientStep } from '../../shared/models/order.model';
import { formatMoney, mediaUrl } from '../../shared/format';

/** Étape de la frise : faite, en cours ou à venir. */
interface TimelineStep { key: string; state: 'done' | 'current' | 'todo' | 'refused'; at: string | null; icon: string; }

const VISIBLE_LINES = 6;

/** Détail d'une commande : étapes datées, motif de refus, lignes ; recommander ou appeler le fournisseur. */
@Component({
  selector: 'app-order-detail',
  templateUrl: './order-detail.page.html',
  styleUrls: ['./order-detail.page.scss'],
  standalone: false,
})
export class OrderDetailPage {
  linkId = '';
  detail: ClientOrderDetail | null = null;
  loading = false;
  busy = false;
  errorMsg = '';
  showAll = false;

  readonly media = mediaUrl;
  readonly stepIcons = STEP_ICONS;
  readonly visibleLines = VISIBLE_LINES;

  constructor(
    private orders: OrderService,
    private cart: CartService,
    private language: LanguageService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  get step(): ClientOrderStep | null { return this.detail ? clientStep(this.detail.order) : null; }

  get units(): number { return this.detail?.lines.reduce((n, l) => n + Number(l.quantity), 0) || 0; }

  get lines() { return this.showAll ? this.detail!.lines : this.detail!.lines.slice(0, VISIBLE_LINES); }

  /** Frise : envoyée → validée → en livraison → livrée, ou envoyée → refusée / annulée. */
  get timeline(): TimelineStep[] {
    const o = this.detail!.order;
    const step = this.step!;
    if (step === 'refused' || step === 'cancelled') {
      return [
        { key: 'sent', state: 'done', at: o.created_at, icon: 'checkmark' },
        { key: step, state: 'refused', at: o.validated_at, icon: 'close' },
      ];
    }
    const order: ClientOrderStep[] = ['waiting', 'validated', 'delivering', 'delivered'];
    const reached = order.indexOf(step);
    const dates = [o.created_at, o.validated_at, o.started_at, o.delivered_at];
    return ['sent', 'validated', 'delivering', 'delivered'].map((key, i) => ({
      key,
      // Livrée : toutes les étapes sont faites ; sinon l'étape atteinte est « en cours ».
      state: i < reached || step === 'delivered' || i === 0 ? 'done' : i === reached ? 'current' : 'todo',
      at: dates[i],
      icon: i === reached && step !== 'delivered' && i > 0 ? STEP_ICONS[step] : 'checkmark',
    }));
  }

  ionViewWillEnter() {
    this.linkId = this.route.snapshot.paramMap.get('linkId') || '';
    const orderId = this.route.snapshot.paramMap.get('orderId') || '';
    this.loading = true; this.errorMsg = '';
    this.orders.detail(this.linkId, orderId).subscribe({
      next: d => { this.detail = d; this.loading = false; this.cdr.detectChanges(); },
      error: err => this.fail(err),
    });
  }

  money(value: number): string { return formatMoney(value, this.detail?.supplier.currency); }

  /** Remet les lignes de la commande dans le panier, aux prix du jour, puis ouvre le panier. */
  reorder() {
    if (!this.detail || this.busy) return;
    this.busy = true; this.errorMsg = '';
    this.orders.catalog(this.linkId).subscribe({
      next: catalog => {
        this.busy = false;
        // Les unités offertes ne se recommandent pas : la promotion les redonnera si elle court encore.
        const lines = this.detail!.lines.filter(l => !l.is_free).map(l => ({ variant_id: l.variant_id, quantity: Number(l.quantity) }));
        const { skipped } = this.cart.addLines(this.linkId, catalog, lines);
        this.router.navigate(['/supplier', this.linkId, 'cart'], { queryParams: skipped ? { skipped } : {} });
      },
      error: err => this.fail(err),
    });
  }

  call() {
    const phone = this.detail?.supplier.phone;
    if (phone) window.location.href = `tel:${phone.replace(/\s/g, '')}`;
  }

  private fail(err: { status?: number; error?: { message?: string } }) {
    this.loading = false; this.busy = false;
    this.errorMsg = err.status === 0 ? this.language.t('common.networkError') : (err.error?.message || this.language.t('common.error'));
    this.cdr.detectChanges();
  }
}
