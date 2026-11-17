/** Fournisseur auquel le compte est rattaché. */
export interface Supplier {
  link_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  /** Nom de la fiche du client chez ce fournisseur. */
  client_name: string;
  linked_at: string;
}

/** Aperçu d'un QR code de rattachement, avant confirmation. */
export interface LinkPreview {
  supplier: { name: string; slug: string; logo_url: string | null };
  client_name: string;
  already_linked: boolean;
}
