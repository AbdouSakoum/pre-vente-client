import { ChangeDetectorRef, Component } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { BiometricLockService } from '../../core/services/biometric-lock.service';
import { LanguageService } from '../../core/services/language.service';
import { BrandService } from '../../brand/brand.service';
import { environment } from '../../../environments/environment';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { baseVersion } from '../../core/services/app-update.service';
import { SupplierService } from '../../core/services/supplier.service';
import { Supplier } from '../../shared/models/supplier.model';
import { initials, mediaUrl } from '../../shared/format';

/** Mon compte : identité, position du commerce, langue, déconnexion, suppression du compte. */
@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false,
})
export class ProfilePage {
  /** Version installée (celle du Play Store sur téléphone), sinon celle de la configuration. */
  version = baseVersion(environment.appVersion);
  /** Feuille de confirmation de la suppression du compte. */
  deleting = false;
  password = '';
  busy = false;
  errorMsg = '';
  /** Fournisseurs que le client a retirés de sa liste (lien intact), à remettre d'un geste. */
  removed: Supplier[] = [];
  restoring: string | null = null;
  readonly media = mediaUrl;
  readonly initials = initials;
  /** Lecture de la position du téléphone puis enregistrement en cours. */
  locating = false;
  locateError = '';
  /** Empreinte ou code du téléphone disponible (téléphone seulement), et option activée. */
  lockAvailable = false;
  lockEnabled = false;

  constructor(
    public auth: AuthService,
    public brand: BrandService,
    private language: LanguageService,
    private toast: ToastController,
    private suppliers: SupplierService,
    private cdr: ChangeDetectorRef,
    private alerts: AlertController,
    private lock: BiometricLockService,
  ) {}

  get identifier(): string {
    const a = this.auth.account();
    return a?.email || a?.phone || '';
  }

  // Le compte gardé sur le téléphone peut dater d'avant la position : on le relit à chaque visite.
  ionViewWillEnter() {
    this.auth.reload().subscribe({ next: () => this.cdr.detectChanges(), error: () => {} });
    this.loadRemoved();
    this.lockEnabled = this.lock.enabled;
    this.lock.isAvailable().then(a => { this.lockAvailable = a; this.cdr.detectChanges(); });
    if (Capacitor.isNativePlatform()) {
      App.getInfo().then(i => { this.version = baseVersion(i.version); this.cdr.detectChanges(); }).catch(() => {});
    }
  }

  get hasLocation(): boolean { const a = this.auth.account(); return a?.latitude != null && a?.longitude != null; }

  get mapUrl(): string {
    const a = this.auth.account();
    return `https://www.google.com/maps?q=${a?.latitude},${a?.longitude}`;
  }

  /** Position actuelle du téléphone, enregistrée comme celle du commerce. */
  useLocation() {
    if (this.locating) return;
    this.locateError = '';
    if (!('geolocation' in navigator)) { this.locateError = this.language.t('profile.place.error'); return; }
    this.locating = true;
    navigator.geolocation.getCurrentPosition(
      pos => this.save(pos.coords.latitude, pos.coords.longitude),
      err => {
        this.locating = false;
        this.locateError = this.language.t(err.code === err.PERMISSION_DENIED ? 'profile.place.denied' : 'profile.place.error');
        this.cdr.detectChanges();
      },
      // Position fraîche : une position gardée en cache peut être celle de chez le fournisseur.
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  }

  /** Remet le fournisseur dans la liste de l'accueil. */
  restore(s: Supplier) {
    if (this.restoring) return;
    this.restoring = s.link_id;
    this.suppliers.setHidden(s.link_id, false).subscribe({
      next: async () => {
        this.restoring = null;
        this.removed = this.removed.filter(r => r.link_id !== s.link_id);
        this.cdr.detectChanges();
        (await this.toast.create({ message: this.language.t('profile.removed.restored', { name: s.name }), duration: 3000, position: 'top' })).present();
      },
      error: () => { this.restoring = null; this.cdr.detectChanges(); },
    });
  }

  /** Déconnexion confirmée : un geste malheureux ne doit pas fermer la session. */
  async logout() {
    const alert = await this.alerts.create({
      header: this.language.t('profile.logoutConfirm.title'),
      message: this.language.t('profile.logoutConfirm.text'),
      buttons: [
        { text: this.language.t('common.cancel'), role: 'cancel' },
        { text: this.language.t('profile.logout'), role: 'destructive', handler: () => this.auth.logout() },
      ],
    });
    await alert.present();
  }

  /** Interrupteur « Déverrouiller avec l'empreinte » : l'empreinte est vérifiée avant d'activer. */
  async toggleLock(on: boolean) {
    if (!on) { this.lock.disable(); this.lockEnabled = false; return; }
    const ok = await this.lock.enable();
    this.lockEnabled = ok;
    this.cdr.detectChanges();
    const key = ok ? 'profile.lock.enabled' : 'profile.lock.failed';
    (await this.toast.create({ message: this.language.t(key), duration: 2500, position: 'top' })).present();
  }

  private loadRemoved() {
    this.suppliers.list().subscribe({
      next: rows => { this.removed = rows.filter(s => s.hidden); this.cdr.detectChanges(); },
      error: () => {},
    });
  }

  private save(latitude: number, longitude: number) {
    this.auth.updateLocation(latitude, longitude).subscribe({
      next: async r => {
        this.locating = false; this.cdr.detectChanges();
        const message = r.suppliers_updated
          ? this.language.t('profile.place.savedSuppliers', { n: r.suppliers_updated })
          : this.language.t('profile.place.savedToast');
        (await this.toast.create({ message, duration: 3500, position: 'top' })).present();
      },
      error: err => {
        this.locating = false;
        this.locateError = err.error?.message || this.language.t(err.status === 0 ? 'common.networkError' : 'common.error');
        this.cdr.detectChanges();
      },
    });
  }

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
