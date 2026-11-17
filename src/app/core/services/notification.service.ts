import { Injectable, signal } from '@angular/core';
import { App } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { ClientNotification, ClientNotifications } from '../../shared/models/notification.model';

/** Relecture tant que l'application est ouverte : assez pour être prévenu vite, sans user la batterie. */
const REFRESH_MS = 60_000;

/**
 * Nouveautés du compte client (notifications dans l'application) : commandes validées, refusées,
 * en livraison, livrées. Relues toutes les minutes et au retour dans l'application ; `unread`
 * alimente la cloche et la pastille de l'onglet Commandes.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly unread = signal(0);
  readonly events = signal<ClientNotification[]>([]);
  private timer: ReturnType<typeof setInterval> | null = null;
  private resume?: PluginListenerHandle;
  private onVisible = () => { if (document.visibilityState === 'visible') this.refresh(); };

  constructor(private api: ApiService) {}

  /** Démarre la relecture (écrans principaux) ; sans effet si elle tourne déjà. */
  start() {
    if (this.timer) return;
    this.refresh();
    this.timer = setInterval(() => this.refresh(), REFRESH_MS);
    document.addEventListener('visibilitychange', this.onVisible);
    App.addListener('resume', () => this.refresh()).then(h => this.resume = h).catch(() => {});
  }

  async refresh(): Promise<void> {
    try {
      const res = await firstValueFrom(this.api.get<ClientNotifications>('/notifications'));
      this.events.set(res.events);
      this.unread.set(res.unread);
    } catch { /* hors ligne : on garde l'état connu */ }
  }

  /** Tout marquer comme lu (écran Nouveautés ouvert). Les lignes gardent leur mise en avant jusqu'à la prochaine lecture. */
  async markSeen(): Promise<void> {
    if (!this.unread()) return;
    this.unread.set(0);
    try { await firstValueFrom(this.api.post('/notifications/seen', {})); } catch { /* repris à la prochaine ouverture */ }
  }

  /** Déconnexion : plus de relecture, plus rien d'affiché. */
  reset() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    document.removeEventListener('visibilitychange', this.onVisible);
    this.resume?.remove(); this.resume = undefined;
    this.events.set([]); this.unread.set(0);
  }
}
