import { Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { CartPricing, CatalogProduct, CatalogVariant, PromoBrief, SupplierCatalog } from '../../shared/models/order.model';
import { countUnits, isDecimalUnit, roundQty } from '../../shared/units';

/** Ligne du panier ; prix gardés pour l'affichage, le serveur recalcule tout à l'envoi. */
export interface CartLine {
  variant_id: string;
  product_name: string;
  variant_name: string;
  image_url: string | null;
  price: number;
  bulk_price: number | null;
  bulk_min_qty: number | null;
  quantity: number;
  /** Unité de vente (absente = pièce : quantités entières ; kg, L… : 3 décimales). */
  unit?: string | null;
  /** Faux quand le catalogue relu indique une rupture. */
  available: boolean;
  /** Prix promo du catalogue (à l'unité) : estimation locale tant que le serveur n'a pas répondu. */
  promo_price?: number | null;
  /** Prix calculé par le serveur pour `priced_qty` unités (promotion produit, avant remise de seuil). */
  net_price?: number | null;
  priced_qty?: number;
  promotion?: PromoBrief | null;
}

/** Panier tel que le serveur le renvoie (GET / PUT /suppliers/:linkId/cart). */
interface ServerCart {
  client_key: string | null;
  version: number;
  currency: string;
  lines: (CartLine & { net_price: number | null; promotion: PromoBrief | null })[];
  pricing?: CartPricing;
}

interface StoredCart {
  /** Clé d'envoi : la même tant que la commande n'est pas passée, pour qu'un renvoi ne crée pas de doublon. */
  key: string;
  lines: CartLine[];
  /** Devise du fournisseur, connue à la lecture du catalogue. */
  currency?: string;
  /** Version du serveur que ce panier reflète (0 : aucun panier enregistré). */
  version?: number;
  /** Modifié ici et pas encore enregistré sur le serveur. */
  dirty?: boolean;
  /** Prix du serveur (promotions, offerts, seuil) pour le contenu enregistré. */
  pricing?: CartPricing | null;
}

const PREFIX = 'sc_cart_';
/** Délai avant l'envoi au serveur : une rafale de « + » ne fait qu'un enregistrement. */
const PUSH_DELAY_MS = 700;
const round2 = (n: number) => Math.round(n * 100) / 100;
/** Quantité ramenée à la règle de l'unité (entière ou 3 décimales), entre 0 et 100 000. */
const normQty = (n: number, unit: string | null | undefined) =>
  Math.max(0, Math.min(100000, isDecimalUnit(unit) ? roundQty(Number(n) || 0) : Math.floor(Number(n) || 0)));

/**
 * Un panier par fournisseur (par lien). Il est gardé sur le serveur, pour le retrouver sur un
 * autre appareil, avec une copie sur le téléphone pour le hors ligne. Chaque modification est
 * envoyée au serveur ; à l'ouverture d'un écran, `pull` reprend la version du serveur si le
 * téléphone n'a rien en attente. `version` (signal) change à chaque modification.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  readonly version = signal(0);
  private carts = new Map<string, StoredCart>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  /** Compteur de modifications par panier : une réponse ancienne n'écrase pas un changement récent. */
  private revisions = new Map<string, number>();

  constructor(private api: ApiService) {}

  lines(linkId: string): CartLine[] { return this.cart(linkId).lines; }

  quantity(linkId: string, variantId: string): number {
    return this.cart(linkId).lines.find(l => l.variant_id === variantId)?.quantity || 0;
  }

  /** Articles du panier : une ligne au poids compte pour 1. */
  count(linkId: string): number { return countUnits(this.cart(linkId).lines); }

  /** Total à payer : celui du serveur (promotions, seuil) dès qu'il est à jour, sinon l'estimation locale. */
  total(linkId: string): number {
    const pricing = this.pricing(linkId);
    if (pricing) return Number(pricing.total);
    return round2(this.cart(linkId).lines.filter(l => l.available).reduce((s, l) => s + this.lineTotal(l), 0));
  }

  /** Prix du serveur pour le panier enregistré ; null pendant une modification pas encore enregistrée. */
  pricing(linkId: string): CartPricing | null {
    const cart = this.cart(linkId);
    return cart.dirty ? null : cart.pricing || null;
  }

  /** Prix de départ : prix par quantité dès le seuil, sinon prix du tarif (même règle que le serveur). */
  listPrice(line: Pick<CartLine, 'price' | 'bulk_price' | 'bulk_min_qty' | 'quantity'>): number {
    const bulk = line.bulk_price !== null && line.bulk_min_qty !== null && line.quantity >= line.bulk_min_qty;
    return Number(bulk ? line.bulk_price : line.price);
  }

  /**
   * Prix unitaire appliqué : celui du serveur s'il a été calculé pour cette quantité, sinon le prix
   * promo du catalogue s'il est plus bas que le prix de départ (estimation), sinon le prix de départ.
   */
  unitPrice(line: Pick<CartLine, 'price' | 'bulk_price' | 'bulk_min_qty' | 'quantity' | 'promo_price' | 'net_price' | 'priced_qty'>): number {
    if (line.net_price !== null && line.net_price !== undefined && line.priced_qty !== undefined
      && Math.abs(Number(line.priced_qty) - Number(line.quantity)) < 1e-9) return Number(line.net_price);
    const start = this.listPrice(line);
    const promo = line.promo_price === null || line.promo_price === undefined ? null : Number(line.promo_price);
    return promo !== null && promo < start ? promo : start;
  }

  lineTotal(line: CartLine): number { return round2(line.quantity * this.unitPrice(line)); }

  key(linkId: string): string { return this.cart(linkId).key; }

  currency(linkId: string): string { return this.cart(linkId).currency || 'DH'; }

  hasOutOfStock(linkId: string): boolean { return this.cart(linkId).lines.some(l => !l.available); }

  /** Retire du panier les lignes passées en rupture. */
  removeOutOfStock(linkId: string) {
    const cart = this.cart(linkId);
    cart.lines = cart.lines.filter(l => l.available);
    this.changed(linkId, cart);
  }

  /**
   * Remet des lignes dans le panier (recommander, reprendre la dernière commande) avec les prix et
   * la disponibilité du catalogue. Renvoie le nombre de lignes ajoutées et celles écartées
   * (produit retiré du catalogue ou en rupture).
   */
  addLines(linkId: string, catalog: SupplierCatalog, lines: { variant_id: string; quantity: number }[]): { added: number; skipped: number } {
    const byVariant = new Map<string, { product: CatalogProduct; variant: CatalogVariant }>();
    for (const p of catalog.products) for (const v of p.variants) byVariant.set(v.id, { product: p, variant: v });
    let added = 0;
    let skipped = 0;
    for (const l of lines) {
      const found = byVariant.get(l.variant_id);
      const qty = Number(l.quantity) || 0;
      if (!found || !found.variant.available || qty <= 0) { skipped++; continue; }
      this.set(linkId, found.product, found.variant, Math.max(this.quantity(linkId, l.variant_id), qty));
      added++;
    }
    return { added, skipped };
  }

  /** Fixe la quantité d'une variante ; 0 la retire du panier. */
  set(linkId: string, product: CatalogProduct, variant: CatalogVariant, quantity: number) {
    const cart = this.cart(linkId);
    const qty = normQty(quantity, variant.unit);
    const index = cart.lines.findIndex(l => l.variant_id === variant.id);
    if (!qty) {
      if (index >= 0) cart.lines.splice(index, 1);
    } else if (index >= 0) {
      cart.lines[index].quantity = qty;
      cart.lines[index].unit = variant.unit ?? null;
    } else {
      cart.lines.push({
        variant_id: variant.id, product_name: product.name, variant_name: variant.name,
        image_url: variant.image_url || product.image_url, price: Number(variant.price),
        bulk_price: variant.bulk_price === null ? null : Number(variant.bulk_price),
        bulk_min_qty: variant.bulk_min_qty, quantity: qty, available: variant.available,
        promo_price: variant.promo_price ?? null, unit: variant.unit ?? null,
      });
    }
    this.changed(linkId, cart);
  }

  setQuantity(linkId: string, variantId: string, quantity: number) {
    const cart = this.cart(linkId);
    const line = cart.lines.find(l => l.variant_id === variantId);
    if (!line) return;
    const qty = normQty(quantity, line.unit);
    if (qty) line.quantity = qty; else cart.lines.splice(cart.lines.indexOf(line), 1);
    this.changed(linkId, cart);
  }

  /** Reprend prix et disponibilité du catalogue relu ; retire les variantes qui n'y sont plus. */
  refresh(linkId: string, catalog: SupplierCatalog) {
    const cart = this.cart(linkId);
    const variants = new Map<string, CatalogVariant>();
    for (const p of catalog.products) for (const v of p.variants) variants.set(v.id, v);
    cart.currency = catalog.supplier.currency;
    const before = cart.lines.length;
    cart.lines = cart.lines.filter(l => variants.has(l.variant_id));
    for (const l of cart.lines) {
      const v = variants.get(l.variant_id)!;
      l.price = Number(v.price);
      l.bulk_price = v.bulk_price === null ? null : Number(v.bulk_price);
      l.bulk_min_qty = v.bulk_min_qty;
      l.available = v.available;
      l.promo_price = v.promo_price ?? null;
      l.unit = v.unit ?? null;
    }
    // Seul un retrait de ligne change le contenu à enregistrer ; les prix viennent du serveur.
    if (cart.lines.length !== before) this.changed(linkId, cart); else this.store(linkId, cart);
  }

  /**
   * Vide le panier. `sync` : l'enregistrer vide sur le serveur (« Vider ») ; après l'envoi d'une
   * commande, le serveur l'a déjà vidé lui-même.
   */
  clear(linkId: string, sync = true) {
    const cart: StoredCart = { key: this.newKey(), lines: [], currency: this.cart(linkId).currency, version: 0 };
    if (sync) this.changed(linkId, cart); else { this.cancelPush(linkId); this.store(linkId, cart); }
  }

  /**
   * À l'ouverture d'un écran : envoie le panier s'il a des changements en attente, sinon reprend
   * celui du serveur (modifié sur un autre appareil). Hors ligne : la copie du téléphone reste.
   */
  async pull(linkId: string): Promise<void> {
    const cart = this.cart(linkId);
    // Changements en attente, ou panier d'avant la synchronisation (sans version) : on l'envoie.
    if (cart.dirty || (cart.version === undefined && cart.lines.length)) { await this.push(linkId); return; }
    try {
      const server = await firstValueFrom(this.api.get<ServerCart>(`/suppliers/${linkId}/cart`));
      // Un changement fait pendant la lecture garde la main.
      if (!this.cart(linkId).dirty) this.applyServer(linkId, server);
    } catch { /* hors ligne ou fournisseur retiré : on garde la copie locale */ }
  }

  /** Déconnexion : les paniers du compte quittent le téléphone (ils restent sur le serveur). */
  reset() {
    for (const t of this.timers.values()) clearTimeout(t);
    this.timers.clear();
    this.carts.clear();
    try {
      Object.keys(localStorage).filter(k => k.startsWith(PREFIX)).forEach(k => localStorage.removeItem(k));
    } catch { /* stockage indisponible */ }
    this.version.update(v => v + 1);
  }

  private applyServer(linkId: string, server: ServerCart) {
    const cart = this.cart(linkId);
    // Même contenu : seuls les prix sont repris (une promotion a pu commencer ou finir).
    if ((server.version === (cart.version || 0) && server.version !== 0) || (server.version === 0 && !cart.lines.length)) {
      this.applyPricing(cart, server);
      this.store(linkId, cart);
      return;
    }
    const promoPrices = new Map(cart.lines.map(l => [l.variant_id, l.promo_price ?? null]));
    this.store(linkId, {
      key: server.client_key || cart.key,
      lines: server.lines.map(l => ({ ...l, priced_qty: l.quantity, promo_price: promoPrices.get(l.variant_id) ?? null })),
      currency: server.currency || cart.currency,
      version: server.version,
      pricing: server.pricing || null,
    });
  }

  /** Reprend les prix du serveur sur les lignes de même quantité, et le détail promotions du panier. */
  private applyPricing(cart: StoredCart, server: ServerCart) {
    const byId = new Map(server.lines.map(l => [l.variant_id, l]));
    for (const l of cart.lines) {
      const s = byId.get(l.variant_id);
      l.net_price = s ? s.net_price : null;
      l.priced_qty = s ? s.quantity : undefined;
      l.promotion = s ? s.promotion : null;
    }
    cart.pricing = server.pricing || null;
  }

  /** Contenu modifié : copie locale tout de suite, envoi au serveur après une courte pause. */
  private changed(linkId: string, cart: StoredCart) {
    cart.dirty = true;
    this.revisions.set(linkId, (this.revisions.get(linkId) || 0) + 1);
    this.store(linkId, cart);
    this.cancelPush(linkId);
    this.timers.set(linkId, setTimeout(() => { this.push(linkId); }, PUSH_DELAY_MS));
  }

  private async push(linkId: string): Promise<void> {
    this.cancelPush(linkId);
    const cart = this.cart(linkId);
    const revision = this.revisions.get(linkId) || 0;
    try {
      const server = await firstValueFrom(this.api.put<ServerCart>(`/suppliers/${linkId}/cart`, {
        client_key: cart.key,
        lines: cart.lines.map(l => ({ variant_id: l.variant_id, quantity: l.quantity })),
      }));
      // Rien n'a changé depuis l'envoi : la copie locale est à jour du serveur.
      if ((this.revisions.get(linkId) || 0) === revision) {
        const current = this.cart(linkId);
        current.dirty = false;
        current.version = server.version;
        this.applyPricing(current, server);
        if (server.client_key) current.key = server.client_key;
        this.store(linkId, current);
      }
    } catch { /* hors ligne : reste « à envoyer », repris au prochain changement ou écran */ }
  }

  private cancelPush(linkId: string) {
    const timer = this.timers.get(linkId);
    if (timer) { clearTimeout(timer); this.timers.delete(linkId); }
  }

  private cart(linkId: string): StoredCart {
    let cart = this.carts.get(linkId);
    if (!cart) {
      cart = this.read(linkId) || { key: this.newKey(), lines: [] };
      this.carts.set(linkId, cart);
    }
    return cart;
  }

  private read(linkId: string): StoredCart | null {
    try {
      const stored = JSON.parse(localStorage.getItem(PREFIX + linkId) || 'null') as StoredCart | null;
      return stored && typeof stored.key === 'string' && Array.isArray(stored.lines) ? stored : null;
    } catch { return null; }
  }

  private store(linkId: string, cart: StoredCart) {
    this.carts.set(linkId, cart);
    try { localStorage.setItem(PREFIX + linkId, JSON.stringify(cart)); } catch { /* stockage plein : le panier reste en mémoire */ }
    this.version.update(v => v + 1);
  }

  private newKey(): string {
    return typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = Math.random() * 16 | 0;
          return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
  }
}
