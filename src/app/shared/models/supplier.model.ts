/** Fournisseur auquel le compte est rattaché. */
export interface Supplier {
  link_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  /** Nom de la fiche du client chez ce fournisseur. */
  client_name: string;
  linked_at: string;
  phone: string | null;
  /** Faux si le fournisseur a coupé la prise de commande dans l'application. */
  ordering_open: boolean;
  /** Dernière commande envoyée depuis l'application chez ce fournisseur. */
  last_order_ref: string | null;
  last_order_status: string | null;
  last_order_reject_reason: string | null;
  /** Reste dû chez ce fournisseur (commandes livrées pas entièrement payées). */
  total_due?: number | string;
  currency?: string;
}

/** QR code du client, à montrer au commercial du fournisseur (usage unique, quelques minutes). */
export interface MyCode {
  code: string;
  url: string;
  /** Image du QR code (data URL PNG). */
  qr: string;
  expires_at: string;
  /** Secondes de validité restantes, à compter de la réponse. */
  expires_in: number;
}

/** Aperçu d'un QR code de rattachement, avant confirmation. */
export interface LinkPreview {
  supplier: { name: string; slug: string; logo_url: string | null };
  client_name: string;
  already_linked: boolean;
}
