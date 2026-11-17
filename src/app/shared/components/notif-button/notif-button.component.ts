import { Component } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';

/** Cloche de l'en-tête : ouvre les Nouveautés, pastille du nombre non lu. */
@Component({
  selector: 'app-notif-button',
  templateUrl: './notif-button.component.html',
  styleUrls: ['./notif-button.component.scss'],
  standalone: false,
})
export class NotifButtonComponent {
  constructor(public notifications: NotificationService) {}

  /** « 9+ » au-delà de 9 pour garder la pastille lisible. */
  get badge(): string { const n = this.notifications.unread(); return n > 9 ? '9+' : String(n); }
}
