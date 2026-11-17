import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { LanguageService } from '../../core/services/language.service';
import { ScannerService } from '../../core/services/scanner.service';
import { SupplierService } from '../../core/services/supplier.service';
import { LinkPreview } from '../../shared/models/supplier.model';

/**
 * Ajout d'un fournisseur : scanner son QR code (ou coller le lien reçu), vérifier le nom
 * affiché, confirmer. Le rattachement n'est fait qu'après la confirmation.
 */
@Component({
  selector: 'app-link',
  templateUrl: './link.page.html',
  styleUrls: ['./link.page.scss'],
  standalone: false,
})
export class LinkPage {
  /** Contenu du QR code ou lien collé. */
  code = '';
  preview: LinkPreview | null = null;
  /** La caméra n'a pas pu servir : seule la saisie du lien reste proposée. */
  cameraUnavailable = false;
  loading = false;
  linked = false;
  errorMsg = '';

  constructor(
    public scanner: ScannerService,
    private suppliers: SupplierService,
    private language: LanguageService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ionViewWillEnter() {
    this.code = ''; this.preview = null; this.linked = false; this.errorMsg = ''; this.cameraUnavailable = false;
    // Sur téléphone, la caméra s'ouvre directement : c'est le geste attendu.
    if (this.scanner.native) this.scan();
  }

  async scan() {
    this.errorMsg = '';
    const result = await this.scanner.scan();
    if (result.status === 'ok') { this.code = result.value; this.check(); return; }
    if (result.status === 'unavailable') this.cameraUnavailable = true;
    this.cdr.detectChanges();
  }

  /** Lit le QR code auprès du serveur et affiche le fournisseur à confirmer. */
  check() {
    if (this.loading) return;
    if (!this.code.trim()) { this.errorMsg = this.language.t('link.codeRequired'); return; }
    this.loading = true; this.errorMsg = ''; this.preview = null;
    this.suppliers.preview(this.code.trim()).subscribe({
      next: p => { this.preview = p; this.loading = false; this.cdr.detectChanges(); },
      error: err => this.fail(err),
    });
  }

  confirm() {
    if (this.loading) return;
    this.loading = true; this.errorMsg = '';
    this.suppliers.link(this.code.trim()).subscribe({
      next: () => { this.loading = false; this.linked = true; this.cdr.detectChanges(); },
      error: err => this.fail(err),
    });
  }

  cancel() { this.preview = null; this.code = ''; this.errorMsg = ''; }
  done() { this.router.navigateByUrl('/suppliers', { replaceUrl: true }); }

  private fail(err: { status?: number; error?: { message?: string } }) {
    this.loading = false;
    this.errorMsg = err.status === 0 ? this.language.t('common.networkError') : (err.error?.message || this.language.t('common.error'));
    this.cdr.detectChanges();
  }
}
