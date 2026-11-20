import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { BrandService } from '../../brand/brand.service';
import { LinkPreview, MyCode, Supplier } from '../../shared/models/supplier.model';
import { SupplierOffer } from '../../shared/offers';

/** Fournisseurs du compte et rattachement par QR code. */
@Injectable({ providedIn: 'root' })
export class SupplierService {
  constructor(private api: ApiService, private brand: BrandService) {}

  /** « Mes fournisseurs » ; dans une version personnalisée, le seul fournisseur de l'application. */
  list(): Observable<Supplier[]> {
    const slug = this.brand.supplierSlug;
    return this.api.get<Supplier[]>('/suppliers' + (slug ? `?slug=${encodeURIComponent(slug)}` : ''));
  }

  /** Offres du moment de l'accueil : promotions en cours de tous les fournisseurs du compte. */
  offers(): Observable<SupplierOffer[]> {
    const slug = this.brand.supplierSlug;
    return this.api.get<SupplierOffer[]>('/offers' + (slug ? `?slug=${encodeURIComponent(slug)}` : ''));
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

  /** Masque (true) ou réaffiche (false) un fournisseur : le lien n'est jamais rompu par le client. */
  setHidden(linkId: string, hidden: boolean): Observable<unknown> {
    return this.api.post(`/suppliers/${linkId}/${hidden ? 'hide' : 'show'}`, {});
  }
}
