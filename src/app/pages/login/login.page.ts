import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { BrandService } from '../../brand/brand.service';

/** Connexion : email ou téléphone, mot de passe. Aucun champ « entreprise ». */
@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {
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
    if (!this.identifier.trim() || !this.password) { this.errorMsg = this.language.t('auth.required'); return; }
    this.loading = true; this.errorMsg = '';
    this.auth.login(this.identifier.trim(), this.password).subscribe({
      next: () => { this.loading = false; this.password = ''; this.router.navigateByUrl('/suppliers', { replaceUrl: true }); },
      error: err => {
        this.loading = false;
        this.errorMsg = err.status === 0 ? this.language.t('common.networkError') : (err.error?.message || this.language.t('common.error'));
      },
    });
  }
}
