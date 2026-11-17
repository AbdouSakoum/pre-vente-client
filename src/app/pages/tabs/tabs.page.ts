import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../core/services/notification.service';

/**
 * Écrans principaux et barre d'onglets flottante, comme l'application terrain Stradi.
 * Les écrans de commande (espace fournisseur, panier, détail) s'ouvrent par-dessus, sans la barre.
 */
@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  standalone: false,
})
export class TabsPage implements OnInit {
  readonly tabs = [
    { tab: 'suppliers', icon: 'storefront-outline', label: 'tabs.suppliers' },
    { tab: 'orders', icon: 'receipt-outline', label: 'tabs.orders' },
    { tab: 'profile', icon: 'person-outline', label: 'tabs.profile' },
  ];

  constructor(public notifications: NotificationService) {}

  /** Écrans principaux ouverts : les nouveautés sont relues toutes les minutes et au retour dans l'app. */
  ngOnInit() { this.notifications.start(); }
}
