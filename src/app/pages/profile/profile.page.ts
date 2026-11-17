import { Component } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { BrandService } from '../../brand/brand.service';
import { environment } from '../../../environments/environment';

/** Mon compte : identité, langue, déconnexion. */
@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false,
})
export class ProfilePage {
  readonly version = environment.appVersion;

  constructor(public auth: AuthService, public brand: BrandService) {}

  get identifier(): string {
    const a = this.auth.account();
    return a?.email || a?.phone || '';
  }

  logout() { this.auth.logout(); }
}
