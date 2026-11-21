import { Component, computed } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';
import { STEP_ICONS } from '../../shared/models/order.model';
import { ClientNotification, KIND_STEP } from '../../shared/models/notification.model';

/**
 * Nouveautés : ce qui est arrivé aux commandes du client ces 30 derniers jours, la plus récente
 * d'abord. Ouvrir l'écran marque tout comme lu ; les lignes nouvelles restent en avant pendant la visite.
 */
@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
  standalone: false,
})
export class NotificationsPage {
  loading = true;
  readonly stepIcons = STEP_ICONS;
  readonly kindStep = KIND_STEP;
  readonly events = computed(() => this.notifications.events());

  constructor(public notifications: NotificationService, private router: Router) {}

  async ionViewWillEnter() {
    this.loading = !this.events().length;
    await this.notifications.refresh();
    this.loading = false;
    await this.notifications.markSeen();
  }

  async reload(event: CustomEvent) {
    await this.notifications.refresh();
    (event.target as HTMLIonRefresherElement).complete();
  }

  open(e: ClientNotification) { this.router.navigate(['/supplier', e.link_id, 'order', e.order_id]); }

  /** Une nouveauté par commande : son dernier statut. */
  trackById(_: number, e: ClientNotification) { return e.order_id; }
}
