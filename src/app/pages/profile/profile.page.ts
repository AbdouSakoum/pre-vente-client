import { ChangeDetectorRef, Component } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { BrandService } from '../../brand/brand.service';
import { environment } from '../../../environments/environment';

/** Mon compte : identité, langue, déconnexion, suppression du compte. */
@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false,
})
export class ProfilePage {
  readonly version = environment.appVersion;
  /** Feuille de confirmation de la suppression du compte. */
  deleting = false;
  password = '';
  busy = false;
  errorMsg = '';

  constructor(
    public auth: AuthService,
    public brand: BrandService,
    private language: LanguageService,
    private toast: ToastController,
    private cdr: ChangeDetectorRef,
  ) {}

  get identifier(): string {
    const a = this.auth.account();
    return a?.email || a?.phone || '';
  }

  logout() { this.auth.logout(); }

  askDelete() { this.deleting = true; this.password = ''; this.errorMsg = ''; }
  cancelDelete() { if (!this.busy) this.deleting = false; }

  confirmDelete() {
    if (this.busy || !this.password) return;
    this.busy = true; this.errorMsg = '';
    this.auth.deleteAccount(this.password).subscribe({
      next: async () => {
        this.busy = false; this.deleting = false;
        const toast = await this.toast.create({ message: this.language.t('profile.deleted'), duration: 4000, position: 'top' });
        toast.present();
      },
      error: err => {
        this.busy = false;
        this.errorMsg = err.error?.message || this.language.t(err.status === 0 ? 'common.networkError' : 'common.error');
        this.cdr.detectChanges();
      },
    });
  }
}
