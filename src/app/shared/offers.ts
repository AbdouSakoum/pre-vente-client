import { PromoBrief, SupplierCatalog } from './models/order.model';
import { daysLeft } from './promo';

/** Une carte d'offre : une promotion en cours d'un fournisseur (bandeau du fournisseur, carrousel de l'accueil). */
export interface OfferCard {
  promo: PromoBrief;
  /** Articles concernés (0 pour une remise sur toute la commande). */
  count: number;
  /** Photo d'un article de l'offre (bandeau du fournisseur). */
  image: string | null;
  /** Bannière chargée par le distributeur sur la promotion (carrousel de l'accueil) ; null : bannière dessinée. */
  banner: string | null;
  daysLeft: number | null;
  currency: string;
  /** Accueil seulement : fournisseur de l'offre. */
  linkId?: string;
  supplierName?: string;
  supplierLogo?: string | null;
}

/** Offre telle que GET /client-app/offers la renvoie (accueil, tous les fournisseurs). */
export interface SupplierOffer {
  link_id: string;
  supplier: { name: string; logo_url: string | null; currency: string };
  promotion: PromoBrief;
  articles: number;
  image_url: string | null;
}

/** Celles qui finissent le plus tôt d'abord : c'est l'urgence que le client doit voir. */
const byUrgency = (a: OfferCard, b: OfferCard) => (a.daysLeft ?? 999) - (b.daysLeft ?? 999);

/** Cartes de l'espace d'un fournisseur, à partir de son catalogue (articles disponibles seulement). */
export function cardsFromCatalog(catalog: SupplierCatalog): OfferCard[] {
  const currency = catalog.supplier.currency;
  const byId = new Map<string, OfferCard>();
  for (const p of catalog.products) {
    for (const v of p.variants) {
      if (!v.available) continue;
      for (const promo of [v.promo, v.free_offer]) {
        if (!promo) continue;
        const card = byId.get(promo.id)
          || { promo, count: 0, image: null, banner: promo.image_url || null, daysLeft: daysLeft(promo.ends_on), currency };
        card.count++;
        card.image = card.image || v.image_url || p.image_url;
        byId.set(promo.id, card);
      }
    }
  }
  for (const t of catalog.order_promotions || []) {
    byId.set(t.id, { promo: t, count: 0, image: null, banner: t.image_url || null, daysLeft: daysLeft(t.ends_on), currency });
  }
  return [...byId.values()].sort(byUrgency);
}

/** Cartes du carrousel de l'accueil, tous fournisseurs confondus. */
export function cardsFromOffers(offers: SupplierOffer[]): OfferCard[] {
  return offers.map(o => ({
    promo: o.promotion, count: o.articles, image: o.image_url, banner: o.promotion.image_url || null,
    daysLeft: daysLeft(o.promotion.ends_on), currency: o.supplier.currency,
    linkId: o.link_id, supplierName: o.supplier.name, supplierLogo: o.supplier.logo_url,
  })).sort(byUrgency);
}
