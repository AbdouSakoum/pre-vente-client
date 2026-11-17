import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { LanguageService } from '../../core/services/language.service';
import { PAYMENT_ICONS, SupplierBalance } from '../../shared/models/balance.model';
import { formatMoney } from '../../shared/format';

type Section = 'unpaid' | 'payments' | 'invoices';

/**
 * « Mon solde » chez un fournisseur : ce que le client doit (commandes livrées pas entièrement
 * payées), ses paiements et ses factures. Lecture seule : le paiement se fait à la livraison
 * ou directement avec le fournisseur.
 */
@Component({
  selector: 'app-balance',
  templateUrl: './balance.page.html',
  styleUrls: ['./balance.page.scss'],
  standalone: false,
})
export class BalancePage {
  linkId = '';
  data: SupplierBalance | null = null;
  loading = true;
  errorMsg = '';
  section: Section = 'unpaid';
  readonly payIcons = PAYMENT_ICONS;

  constructor(
    private orders: OrderService,
    private language: LanguageService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  ionViewWillEnter() {
    this.linkId = this.route.snapshot.paramMap.get('linkId') || '';
    this.load();
  }

  load(event?: CustomEvent) {
    this.loading = !this.data; this.errorMsg = '';
    this.orders.balance(this.linkId).subscribe({
      next: d => {
        this.data = d; this.loading = false;
        // Rien à payer : on ouvre directement l'historique des paiements.
        if (!d.unpaid.length && this.section === 'unpaid') this.section = 'payments';
        this.done(event);
      },
      error: err => {
        this.loading = false;
        this.errorMsg = err.status === 0 ? this.language.t('common.networkError') : (err.error?.message || this.language.t('common.error'));
        this.done(event);
      },
    });
  }

  money(v: number | null | undefined): string { return formatMoney(v, this.data?.supplier.currency); }

  call() {
    const phone = this.data?.supplier.phone;
    if (phone) window.location.href = `tel:${phone.replace(/\s/g, '')}`;
  }

  private done(event?: CustomEvent) {
    (event?.target as HTMLIonRefresherElement | undefined)?.complete();
    this.cdr.detectChanges();
  }
}
