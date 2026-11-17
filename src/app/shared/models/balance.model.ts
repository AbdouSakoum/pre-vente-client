import { SupplierInfo } from './order.model';

/** « Mon solde » chez un fournisseur (GET /client-app/suppliers/:linkId/balance). */
export interface SupplierBalance {
  supplier: SupplierInfo;
  /** Reste dû : commandes livrées pas entièrement payées. */
  total_due: number;
  unpaid: { order_ref: string; created_at: string; delivered_at: string | null; total_ttc: number; paid_amount: number; due: number }[];
  payments: { amount: number; payment_method: 'especes' | 'cheque' | 'virement' | null; collected_at: string; order_ref: string | null }[];
  invoices: { number: string; issue_date: string | null; total_ttc: number; order_ref: string | null }[];
}

/** Icône de chaque mode de paiement. */
export const PAYMENT_ICONS: Record<string, string> = {
  especes: 'cash-outline',
  cheque: 'document-text-outline',
  virement: 'swap-horizontal-outline',
};
