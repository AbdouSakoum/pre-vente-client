import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { BrandService } from '../../brand/brand.service';

const MIN_PASSWORD = 6;

/** Création du compte : nom du commerce, email ou téléphone, mot de passe. */
@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false,
})
export class RegisterPage {
  name = '';
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

  submit() {
    if (this.loading) return;
    if (!this.name.trim() || !this.identifier.trim()) { this.errorMsg = this.language.t('auth.required'); return; }
    if (this.password.length < MIN_PASSWORD) { this.errorMsg = this.language.t('auth.passwordTooShort', { n: MIN_PASSWORD }); return; }
    this.loading = true; this.errorMsg = '';
    this.auth.register(this.name.trim(), this.identifier.trim(), this.password).subscribe({
      next: () => { this.loading = false; this.password = ''; this.router.navigateByUrl('/suppliers', { replaceUrl: true }); },
      error: err => {
        this.loading = false;
        this.errorMsg = err.status === 0 ? this.language.t('common.networkError') : (err.error?.message || this.language.t('common.error'));
      },
    });
  }
}
