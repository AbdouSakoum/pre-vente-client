import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { BrandService } from '../../brand/brand.service';
import { LinkPreview, MyCode, Supplier } from '../../shared/models/supplier.model';

/** Fournisseurs du compte et rattachement par QR code. */
@Injectable({ providedIn: 'root' })
export class SupplierService {
  constructor(private api: ApiService, private brand: BrandService) {}

  /** « Mes fournisseurs » ; dans une version personnalisée, le seul fournisseur de l'application. */
  list(): Observable<Supplier[]> {
    const slug = this.brand.supplierSlug;
    return this.api.get<Supplier[]>('/suppliers' + (slug ? `?slug=${encodeURIComponent(slug)}` : ''));
  }

  /** `code` : le contenu du QR code (adresse ou jeton seul). */
  preview(code: string): Observable<LinkPreview> {
    return this.api.get<LinkPreview>(`/links/preview?token=${encodeURIComponent(code)}`);
  }

  link(code: string): Observable<unknown> {
    return this.api.post('/links', { token: code });
  }

  /** Nouveau QR code du compte ; remplace le précédent. */
  myCode(): Observable<MyCode> {
    return this.api.post<MyCode>('/my-code', {});
  }

  remove(linkId: string): Observable<unknown> {
    return this.api.delete(`/suppliers/${linkId}`);
  }
}
