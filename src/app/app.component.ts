import { Component } from '@angular/core';
import { AppUpdateService } from './core/services/app-update.service';
import { AuthService } from './core/services/auth.service';
import { BiometricLockService } from './core/services/biometric-lock.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  // Mise à jour proposée à chaque ouverture, puis imposée passé le délai réglé sur le serveur.
  // Verrou par empreinte : demandé à l'ouverture et au retour après deux minutes, si activé.
  constructor(updates: AppUpdateService, lock: BiometricLockService, auth: AuthService) {
    updates.start();
    lock.start(() => auth.isLoggedIn);
  }
}
