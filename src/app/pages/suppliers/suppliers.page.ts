import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { SupplierService } from '../../core/services/supplier.service';
import { BrandService } from '../../brand/brand.service';
import { Supplier } from '../../shared/models/supplier.model';

/**
 * Accueil : « Mes fournisseurs ». Version Stradi : tous les fournisseurs du compte, et l'ajout
 * par QR code. Version personnalisée : le seul fournisseur de l'application, à rattacher une fois.
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
  /** Fournisseur dont le retrait attend une confirmation. */
  removing: Supplier | null = null;
  busy = false;

  constructor(
    public brand: BrandService,
    public auth: AuthService,
    private service: SupplierService,
    private language: LanguageService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  /** L'ajout reste proposé tant que la version personnalisée n'a pas son fournisseur. */
  get canAdd(): boolean { return !this.brand.single || !this.suppliers.length; }

  // À chaque retour sur l'écran : un fournisseur a pu être ajouté depuis l'écran de rattachement.
  ionViewWillEnter() { this.load(); }

  load(event?: { target: { complete: () => void } }) {
    this.loading = true; this.errorMsg = '';
    this.service.list().subscribe({
      next: rows => { this.suppliers = rows; this.done(event); },
      error: err => {
        this.errorMsg = err.status === 0 ? this.language.t('common.networkError') : (err.error?.message || this.language.t('common.error'));
        this.done(event);
      },
    });
  }

  add() { this.router.navigateByUrl('/link'); }
  profile() { this.router.navigateByUrl('/profile'); }

  initials(name: string): string {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  }

  confirmRemove() {
    if (!this.removing || this.busy) return;
    this.busy = true;
    this.service.remove(this.removing.link_id).subscribe({
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
