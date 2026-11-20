/** Types de commerce : ceux de la fiche client du distributeur, plus le particulier. */
export const CLIENT_CATEGORIES = [
  'grossiste', 'semi_grossiste', 'hanout', 'epicerie', 'supermarche', 'laiterie', 'cafe', 'snack', 'consommateur', 'autre',
] as const;
export type ClientCategory = typeof CLIENT_CATEGORIES[number];

/** Compte du client dans l'application. */
export interface Account {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  category: ClientCategory | null;
  city: string | null;
  address: string | null;
  /** Position du commerce ; absente tant que le client ne l'a pas donnée. */
  latitude?: number | null;
  longitude?: number | null;
}

/** Réponse de PUT /account/location : `suppliers_updated` = fiches de fournisseurs mises à jour. */
export interface LocationUpdate {
  latitude: number;
  longitude: number;
  suppliers_updated: number;
}

/** Données saisies à l'inscription. */
export interface RegisterPayload {
  name: string;
  category: ClientCategory;
  city: string;
  latitude: number | null;
  longitude: number | null;
  identifier: string;
  password: string;
}

export interface TokenPair {
  token: string;
  refresh_token: string;
  refresh_expires_at?: string;
}

/** Réponse d'une inscription, d'une connexion ou d'une réinitialisation réussie. */
export interface AuthResponse extends TokenPair {
  account: Account;
}

/** `email` : code envoyé par mail ; `supplier` : code remis par un fournisseur. */
export interface ForgotPasswordResponse {
  channel: 'email' | 'supplier';
  message: string;
}
