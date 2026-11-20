import { Component } from '@angular/core';
import { AppUpdateService } from './core/services/app-update.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  // Mise à jour proposée à chaque ouverture, puis imposée passé le délai réglé sur le serveur.
  constructor(updates: AppUpdateService) { updates.start(); }
}
