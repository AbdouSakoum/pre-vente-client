import { ClientOrderStep } from './order.model';

/** Ce qui est arrivé à une commande (GET /client-app/notifications). */
export type NotificationKind = 'validated' | 'refused' | 'delivering' | 'delivered';

export interface ClientNotification {
  order_id: string;
  order_ref: string;
  link_id: string;
  supplier_name: string;
  kind: NotificationKind;
  at: string;
  reject_reason: string | null;
  total_ttc: number | string;
  unread: boolean;
}

export interface ClientNotifications {
  events: ClientNotification[];
  unread: number;
}

/** Pastille de statut correspondante (mêmes couleurs et icônes que « Mes commandes »). */
export const KIND_STEP: Record<NotificationKind, ClientOrderStep> = {
  validated: 'validated',
  refused: 'refused',
  delivering: 'delivering',
  delivered: 'delivered',
};
