import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { BrandService } from '../../brand/brand.service';
import { CLIENT_CATEGORIES, ClientCategory } from '../../shared/models/account.model';

const MIN_PASSWORD = 6;
const STEPS = 3;

/** Icône de chaque type de commerce (ionicons). */
const CATEGORY_ICONS: Record<ClientCategory, string> = {
  grossiste: 'business-outline',
  semi_grossiste: 'cube-outline',
  hanout: 'storefront-outline',
  epicerie: 'bag-handle-outline',
  supermarche: 'cart-outline',
  laiterie: 'pint-outline',
  cafe: 'cafe-outline',
  snack: 'fast-food-outline',
  consommateur: 'person-outline',
  autre: 'ellipsis-horizontal-circle-outline',
};

type LocateState = 'idle' | 'loading' | 'done' | 'denied' | 'error';

/**
 * Inscription en trois étapes courtes :
 * 1. type de commerce (un toucher fait avancer) ; 2. nom, ville et position ; 3. identifiant et mot de passe.
 */
@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false,
})
export class RegisterPage {
  readonly categories = CLIENT_CATEGORIES;
  readonly icons = CATEGORY_ICONS;
  readonly steps = STEPS;
  step = 1;

  category: ClientCategory | null = null;
  name = '';
  city = '';
  latitude: number | null = null;
  longitude: number | null = null;
  accuracy: number | null = null;
  locate: LocateState = 'idle';
  identifier = '';
  password = '';
  showPassword = false;
  loading = false;
  errorMsg = '';

  constructor(
    public brand: BrandService,
    private auth: AuthService,
    private language: LanguageService,
    private router: Router,
  ) {}

  /** Un particulier donne son nom, un commerce le nom de son enseigne. */
  get isConsumer(): boolean { return this.category === 'consommateur'; }

  pick(c: ClientCategory) {
    this.category = c;
    this.errorMsg = '';
    // Laisse voir la sélection un instant avant de passer à l'étape suivante.
    setTimeout(() => { if (this.step === 1) this.step = 2; }, 180);
  }

  back() {
    this.errorMsg = '';
    if (this.step > 1) this.step--;
  }

  next() {
    if (this.step !== 2) return;
    if (!this.name.trim() || !this.city.trim()) { this.errorMsg = this.language.t('auth.required'); return; }
    this.errorMsg = '';
    this.step = 3;
  }

  /** Position du téléphone ; facultative, le client peut continuer sans. */
  useLocation() {
    if (!('geolocation' in navigator)) { this.locate = 'error'; return; }
    this.locate = 'loading';
    navigator.geolocation.getCurrentPosition(
      pos => {
        this.latitude = pos.coords.latitude;
        this.longitude = pos.coords.longitude;
        this.accuracy = Math.round(pos.coords.accuracy);
        this.locate = 'done';
      },
      err => { this.locate = err.code === err.PERMISSION_DENIED ? 'denied' : 'error'; },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }

  clearLocation() {
    this.latitude = this.longitude = this.accuracy = null;
    this.locate = 'idle';
  }

  submit() {
    if (this.step === 2) { this.next(); return; }
    if (this.loading || !this.category) return;
    if (!this.identifier.trim()) { this.errorMsg = this.language.t('auth.required'); return; }
    if (this.password.length < MIN_PASSWORD) { this.errorMsg = this.language.t('auth.passwordTooShort', { n: MIN_PASSWORD }); return; }
    this.loading = true; this.errorMsg = '';
    this.auth.register({
      category: this.category,
      name: this.name.trim(),
      city: this.city.trim(),
      latitude: this.latitude,
      longitude: this.longitude,
      identifier: this.identifier.trim(),
      password: this.password,
    }).subscribe({
      next: () => { this.loading = false; this.password = ''; this.router.navigateByUrl('/suppliers', { replaceUrl: true }); },
      error: err => {
        this.loading = false;
        this.errorMsg = err.status === 0 ? this.language.t('common.networkError') : (err.error?.message || this.language.t('common.error'));
      },
    });
  }
}
