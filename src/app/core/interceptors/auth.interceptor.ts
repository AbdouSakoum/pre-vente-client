import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { SessionService } from '../services/session.service';

/** Les routes du compte ne déclenchent jamais de renouvellement ni de déconnexion. */
function isAuthRoute(url: string): boolean {
  return url.includes('/client-app/auth/');
}

/** Rejoue la requête avec le nouveau jeton ; `setHeaders` écrase celui posé par `ApiService`. */
function withToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

/**
 * Renouvellement transparent du jeton d'accès : sur 401, renouveler puis rejouer.
 * La session n'est fermée que si le serveur refuse explicitement — jamais sur une panne réseau.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SessionService);
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401 || isAuthRoute(req.url)) return throwError(() => err);
      if (!session.refreshToken) { auth.logout(); return throwError(() => err); }

      return session.refresh().pipe(
        switchMap(token => next(withToken(req, token))),
        catchError(refreshErr => {
          if (!session.isNetworkFailure(refreshErr)) auth.logout();
          return throwError(() => err);
        }),
      );
    }),
  );
};
