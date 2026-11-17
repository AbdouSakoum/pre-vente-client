/** Compte du client dans l'application. */
export interface Account {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
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
