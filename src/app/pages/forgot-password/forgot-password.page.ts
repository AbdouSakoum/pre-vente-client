import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { BrandService } from '../../brand/brand.service';

const MIN_PASSWORD = 8;

/**
 * Mot de passe oublié, en deux étapes : l'identifiant, puis le code et le nouveau mot de passe.
 * Le code arrive par email, ou il est remis par un fournisseur (compte ouvert avec un téléphone).
 */
@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: false,
})
export class ForgotPasswordPage {
  step: 'identifier' | 'code' = 'identifier';
  channel: 'email' | 'supplier' = 'email';
  identifier = '';
  code = '';
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

  request() {
    if (this.loading) return;
    if (!this.identifier.trim()) { this.errorMsg = this.language.t('auth.required'); return; }
    this.loading = true; this.errorMsg = '';
    this.auth.forgotPassword(this.identifier.trim()).subscribe({
      next: res => { this.loading = false; this.channel = res.channel; this.step = 'code'; },
      error: err => this.fail(err),
    });
  }

  reset() {
    if (this.loading) return;
    if (!this.code.trim()) { this.errorMsg = this.language.t('auth.forgot.codeRequired'); return; }
    if (this.password.length < MIN_PASSWORD) { this.errorMsg = this.language.t('auth.passwordTooShort', { n: MIN_PASSWORD }); return; }
    this.loading = true; this.errorMsg = '';
    this.auth.resetPassword(this.identifier.trim(), this.code.trim(), this.password).subscribe({
      next: () => { this.loading = false; this.password = ''; this.router.navigateByUrl('/suppliers', { replaceUrl: true }); },
      error: err => this.fail(err),
    });
  }

  back() { this.step = 'identifier'; this.code = ''; this.password = ''; this.errorMsg = ''; }

  private fail(err: { status?: number; error?: { message?: string } }) {
    this.loading = false;
    this.errorMsg = err.status === 0 ? this.language.t('common.networkError') : (err.error?.message || this.language.t('common.error'));
  }
}
