import { Component } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { BiometricLockService } from '../../../core/services/biometric-lock.service';
import { BrandService } from '../../../brand/brand.service';

/**
 * Écran verrouillé, par-dessus l'application : « Déverrouiller » relance l'empreinte ; si elle
 * n'est plus possible (téléphone changé, empreintes effacées), « Se déconnecter » ramène à la connexion.
 */
@Component({
  selector: 'app-lock-screen',
  templateUrl: './lock-screen.component.html',
  styleUrls: ['./lock-screen.component.scss'],
  standalone: false,
})
export class LockScreenComponent {
  constructor(public lock: BiometricLockService, public brand: BrandService, private auth: AuthService) {}

  unlock() { this.lock.unlock(); }

  logout() { this.auth.logout(); }
}
