import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SessionService } from './session.service';

/**
 * Appels à l'API de l'application (/api/client-app). Seul point d'accès HTTP des écrans.
 * Aucun identifiant d'entreprise n'est envoyé : le serveur déduit le compte du jeton.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = `${environment.apiUrl}/client-app`;

  constructor(private http: HttpClient, private session: SessionService) {}

  get<T>(path: string): Observable<T> {
    return this.http.get<T>(`${this.base}${path}`, { headers: this.headers() });
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${this.base}${path}`, body, { headers: this.headers() });
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.base}${path}`, { headers: this.headers() });
  }

  private headers(): HttpHeaders {
    const token = this.session.token;
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }
}
