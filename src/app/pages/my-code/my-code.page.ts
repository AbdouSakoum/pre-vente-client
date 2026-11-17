import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { LanguageService } from '../../core/services/language.service';
import { SupplierService } from '../../core/services/supplier.service';
import { BrandService } from '../../brand/brand.service';
import { MyCode, Supplier } from '../../shared/models/supplier.model';

// Vérifie toutes les 3 secondes si le commercial a scanné le code.
const POLL_MS = 3000;

/**
 * « Mon QR code » : le client le montre au commercial, qui le scanne depuis la fiche client de
 * l'application terrain. Le code se renouvelle à l'expiration ; l'écran détecte le rattachement.
 */
@Component({
  selector: 'app-my-code',
  templateUrl: './my-code.page.html',
  styleUrls: ['./my-code.page.scss'],
  standalone: false,
})
export class MyCodePage {
  code: MyCode | null = null;
  remaining = '';
  errorMsg = '';
  /** Fournisseur ajouté par le scan, une fois détecté. */
  added: Supplier | null = null;

  private renewing = false;
  private deadline = 0;
  private known = new Set<string>();
  private tick?: ReturnType<typeof setInterval>;
  private poll?: ReturnType<typeof setInterval>;

  constructor(
    public brand: BrandService,
    private service: SupplierService,
    private language: LanguageService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  /** Le code en morceaux de 4 caractères, plus facile à dicter. */
  get pretty(): string { return this.code ? `${this.code.code.slice(0, 4)} ${this.code.code.slice(4)}` : ''; }

  ionViewWillEnter() {
    this.added = null;
    this.errorMsg = '';
    // Les fournisseurs déjà là servent de référence pour reconnaître le nouveau.
    this.service.list().subscribe({
      next: rows => { this.known = new Set(rows.map(s => s.link_id)); this.renew(); this.startPolling(); },
      error: err => this.fail(err),
    });
  }

  ionViewWillLeave() { this.stop(); }

  renew() {
    if (this.renewing) return;
    this.renewing = true;
    this.errorMsg = '';
    this.service.myCode().subscribe({
      next: code => {
        this.renewing = false;
        this.code = code;
        // Échéance calculée avec l'horloge du téléphone, à partir de la durée donnée par le serveur.
        this.deadline = Date.now() + Math.max(30, code.expires_in) * 1000;
        this.startCountdown();
        this.cdr.detectChanges();
      },
      error: err => { this.renewing = false; clearInterval(this.tick); this.fail(err); },
    });
  }

  done() { this.router.navigateByUrl('/suppliers', { replaceUrl: true }); }

  private startCountdown() {
    clearInterval(this.tick);
    const update = () => {
      const left = Math.max(0, this.deadline - Date.now());
      const s = Math.ceil(left / 1000);
      this.remaining = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
      if (!left) this.renew();
      this.cdr.detectChanges();
    };
    update();
    this.tick = setInterval(update, 1000);
  }

  private startPolling() {
    clearInterval(this.poll);
    this.poll = setInterval(() => {
      this.service.list().subscribe({
        next: rows => {
          const fresh = rows.find(s => !this.known.has(s.link_id));
          if (!fresh) return;
          this.added = fresh;
          this.stop();
          this.cdr.detectChanges();
        },
        error: () => {},
      });
    }, POLL_MS);
  }

  private stop() {
    clearInterval(this.tick);
    clearInterval(this.poll);
  }

  private fail(err: { status?: number; error?: { message?: string } }) {
    this.errorMsg = err.status === 0 ? this.language.t('common.networkError') : (err.error?.message || this.language.t('common.error'));
    this.cdr.detectChanges();
  }
}
