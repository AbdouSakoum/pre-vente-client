import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { LanguageService } from '../../core/services/language.service';
import { OrderService } from '../../core/services/order.service';
import { ClientOrderStep, ClientOrderSummary, STEP_ICONS, clientStep, isOpenStep } from '../../shared/models/order.model';
import { formatMoney } from '../../shared/format';

type Filter = 'all' | 'open' | 'done';

/** « Mes commandes » : commandes envoyées depuis l'application, tous fournisseurs confondus. */
@Component({
  selector: 'app-orders',
  templateUrl: './orders.page.html',
  styleUrls: ['./orders.page.scss'],
  standalone: false,
})
export class OrdersPage {
  orders: ClientOrderSummary[] = [];
  filter: Filter = 'all';
  /** Lien du fournisseur filtré, ou vide pour tous. */
  supplier = '';
  loading = false;
  loaded = false;
  errorMsg = '';

  readonly stepIcons = STEP_ICONS;

  constructor(
    private service: OrderService,
    private language: LanguageService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  /** Fournisseurs présents dans la liste, pour le filtre. */
  get suppliers(): { id: string; name: string }[] {
    const seen = new Map<string, string>();
    for (const o of this.orders) seen.set(o.link_id, o.supplier_name);
    return [...seen].map(([id, name]) => ({ id, name }));
  }

  get visible(): ClientOrderSummary[] {
    return this.orders.filter(o =>
      (!this.supplier || o.link_id === this.supplier)
      && (this.filter === 'all' || (this.filter === 'open') === isOpenStep(this.step(o))));
  }

  get openCount(): number { return this.orders.filter(o => isOpenStep(this.step(o))).length; }
  get deliveringCount(): number { return this.orders.filter(o => this.step(o) === 'delivering').length; }
  get monthCount(): number {
    const now = new Date();
    return this.orders.filter(o => {
      const d = new Date(o.created_at);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
  }

  ionViewWillEnter() { this.load(); }

  load(event?: { target: { complete: () => void } }) {
    this.loading = true; this.errorMsg = '';
    this.service.allOrders().subscribe({
      next: rows => { this.orders = rows; this.done(event); },
      error: err => {
        this.errorMsg = err.status === 0 ? this.language.t('common.networkError') : (err.error?.message || this.language.t('common.error'));
        this.done(event);
      },
    });
  }

  step(o: ClientOrderSummary): ClientOrderStep { return clientStep(o); }

  money(o: ClientOrderSummary): string { return formatMoney(o.total_ttc, o.currency); }

  open(o: ClientOrderSummary) { this.router.navigate(['/supplier', o.link_id, 'order', o.id]); }

  private done(event?: { target: { complete: () => void } }) {
    this.loading = false; this.loaded = true;
    event?.target.complete();
    this.cdr.detectChanges();
  }
}
