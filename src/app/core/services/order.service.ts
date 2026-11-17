import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  ClientOrderDetail, ClientOrderSummary, OrderCreated, OrderPayload, SupplierCatalog, SupplierOrders, SupplierUsuals,
} from '../../shared/models/order.model';
import { SupplierBalance } from '../../shared/models/balance.model';

/** Catalogue d'un fournisseur et commandes ; le fournisseur est désigné par le lien du compte. */
@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private api: ApiService) {}

  /** « Mon solde » : reste dû, commandes à payer, paiements et factures chez ce fournisseur. */
  balance(linkId: string): Observable<SupplierBalance> { return this.api.get<SupplierBalance>(`/suppliers/${linkId}/balance`); }

  catalog(linkId: string): Observable<SupplierCatalog> {
    return this.api.get<SupplierCatalog>(`/suppliers/${linkId}/catalog`);
  }

  usuals(linkId: string): Observable<SupplierUsuals> {
    return this.api.get<SupplierUsuals>(`/suppliers/${linkId}/usuals`);
  }

  orders(linkId: string): Observable<SupplierOrders> {
    return this.api.get<SupplierOrders>(`/suppliers/${linkId}/orders`);
  }

  /** Toutes les commandes envoyées depuis l'application, tous fournisseurs confondus. */
  allOrders(): Observable<ClientOrderSummary[]> {
    return this.api.get<ClientOrderSummary[]>('/orders');
  }

  detail(linkId: string, orderId: string): Observable<ClientOrderDetail> {
    return this.api.get<ClientOrderDetail>(`/suppliers/${linkId}/orders/${orderId}`);
  }

  /** Les prix sont recalculés par le serveur ; la clé rend l'envoi sans doublon. */
  send(linkId: string, payload: OrderPayload): Observable<OrderCreated> {
    return this.api.post<OrderCreated>(`/suppliers/${linkId}/orders`, payload);
  }
}
