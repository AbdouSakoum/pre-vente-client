import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { SessionService } from './session.service';
import { CartService } from './cart.service';
import { NotificationService } from './notification.service';
import { Account, AuthResponse, ForgotPasswordResponse, RegisterPayload } from '../../shared/models/account.model';

/** Compte du client : inscription, connexion, mot de passe oublié, déconnexion. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly account = signal<Account | null>(this.stored());

  constructor(private api: ApiService, private session: SessionService, private cart: CartService, private notifications: NotificationService, private router: Router) {}

  get isLoggedIn(): boolean { return !!this.session.token && !!this.account(); }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/register', payload).pipe(tap(r => this.open(r)));
  }

  login(identifier: string, password: string): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/login', { identifier, password }).pipe(tap(r => this.open(r)));
  }

  forgotPassword(identifier: string): Observable<ForgotPasswordResponse> {
    return this.api.post<ForgotPasswordResponse>('/auth/forgot-password', { identifier });
  }

  /** Le bon code change le mot de passe et connecte le client. */
  resetPassword(identifier: string, code: string, newPassword: string): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/reset-password', { identifier, code, new_password: newPassword })
      .pipe(tap(r => this.open(r)));
  }

  /** Révoque la session côté serveur sans attendre la réponse, puis revient à la connexion. */
  logout() {
    const refreshToken = this.session.refreshToken;
    if (refreshToken) this.api.post('/auth/logout', { refresh_token: refreshToken }).subscribe({ error: () => {} });
    this.session.clear();
    this.cart.reset();
    this.notifications.reset();
    this.account.set(null);
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  private open(res: AuthResponse) {
    this.session.store(res);
    localStorage.setItem('sc_account', JSON.stringify(res.account));
    this.account.set(res.account);
  }

  private stored(): Account | null {
    try { return JSON.parse(localStorage.getItem('sc_account') || 'null') as Account | null; } catch { return null; }
  }
}
