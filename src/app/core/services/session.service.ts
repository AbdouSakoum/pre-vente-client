import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { TokenPair } from '../../shared/models/account.model';

/**
 * Détenteur des jetons et mécanique de renouvellement (CONVENTIONS.md §3.8).
 * Isolé de `AuthService` : l'intercepteur a besoin du renouvellement, et `AuthService` passe par
 * l'intercepteur pour ses propres appels — les réunir créerait un cycle d'injection.
 */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private http = inject(HttpClient);

  /** Renouvellement en cours, partagé : un seul à la fois, sinon le serveur y voit un rejeu. */
  private refreshing$: Observable<string> | null = null;

  get token(): string | null { return localStorage.getItem('sc_token'); }
  get refreshToken(): string | null { return localStorage.getItem('sc_refresh_token'); }

  store(pair: TokenPair) {
    localStorage.setItem('sc_token', pair.token);
    if (pair.refresh_token) localStorage.setItem('sc_refresh_token', pair.refresh_token);
  }

  clear() {
    localStorage.removeItem('sc_token');
    localStorage.removeItem('sc_refresh_token');
    localStorage.removeItem('sc_account');
    this.refreshing$ = null;
  }

  /** Renouvelle le jeton d'accès. Les appels concurrents partagent la requête. */
  refresh(): Observable<string> {
    if (this.refreshing$) return this.refreshing$;

    const refreshToken = this.refreshToken;
    if (!refreshToken) return throwError(() => new Error('no_refresh_token'));

    this.refreshing$ = this.http
      .post<TokenPair>(`${environment.apiUrl}/client-app/auth/refresh`, { refresh_token: refreshToken })
      .pipe(
        tap(res => this.store(res)),
        map(res => res.token),
        catchError(err => { this.refreshing$ = null; return throwError(() => err); }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    this.refreshing$.subscribe({
      next: () => { this.refreshing$ = null; },
      error: () => { this.refreshing$ = null; },
    });
    return this.refreshing$;
  }

  /** Sans réponse du serveur, rien n'a été refusé : on ne ferme pas la session. */
  isNetworkFailure(err: { status?: number }): boolean {
    return err?.status === 0 || err?.status === 504 || !err?.status;
  }
}
