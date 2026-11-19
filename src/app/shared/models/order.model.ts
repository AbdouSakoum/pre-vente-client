/** Fournisseur vu depuis son espace (catalogue, commandes). */
export interface SupplierInfo {
  name: string;
  slug: string;
  logo_url: string | null;
  phone: string | null;
  currency: string;
  /** Nom de la fiche du client chez ce fournisseur. */
  client_name: string;
}

/** Variante commandable : prix TTC du compte, prix par quantité éventuel, disponibilité. */
export interface CatalogVariant {
  id: string;
  name: string;
  image_url: string | null;
  price: number;
  /** Prix à partir de `bulk_min_qty` (consommateur, quand le fournisseur en définit un). */
  bulk_price: number | null;
  bulk_min_qty: number | null;
  available: boolean;
  /** Promotions en cours (absentes quand le fournisseur n'en a aucune). Prix promo TTC à l'unité. */
  promo_price?: number | null;
  promo?: PromoBrief | null;
  /** « X achetés = Y offerts ». */
  free_offer?: PromoBrief | null;
}

/** Promotion telle que l'application l'affiche (docs/prd/PRD_MODULE_PROMOTIONS.md). */
export interface PromoBrief {
  id: string;
  name: string;
  kind: 'price' | 'percent' | 'free_goods' | 'order_threshold';
  ends_on: string;
  promo_price: number | null;
  discount_pct: number | null;
  buy_qty: number | null;
  free_qty: number | null;
  min_order_ttc: number | null;
  /** Bannière chargée par le distributeur (carrousel « Offres du moment ») ; absente d'un serveur plus ancien. */
  image_url?: string | null;
}

/** Prix du panier calculé par le serveur : la seule vérité avant l'envoi. */
export interface CartPricing {
  free: { variant_id: string; quantity: number; promotion: PromoBrief }[];
  subtotal: number;
  threshold: (PromoBrief & { discount: number }) | null;
  next_threshold: (PromoBrief & { missing: number }) | null;
  total: number;
  savings: number;
}

export interface CatalogProduct {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  category_name: string | null;
  variants: CatalogVariant[];
}

/** Tarif du client chez ce fournisseur : `wholesale` prix de gros, `retail` prix normal. */
export interface SupplierCatalog {
  supplier: SupplierInfo;
  price_type: 'wholesale' | 'retail';
  products: CatalogProduct[];
  /** Remises de seuil en cours (« −x % dès N DH »). */
  order_promotions?: PromoBrief[];
}

export type OrderStatus = 'to_validate' | 'pending' | 'assigned' | 'in_progress' | 'delivered' | 'cancelled';

/** Commande envoyée depuis l'application. */
export interface ClientOrder {
  id: string;
  order_ref: string;
  status: OrderStatus;
  total_ttc: number;
  created_at: string;
  /** AAAA-MM-JJ. */
  desired_delivery_date: string | null;
  delivered_at: string | null;
  reject_reason: string | null;
  items_count: number;
}

export interface SupplierOrders {
  supplier: SupplierInfo;
  /** Faux si le fournisseur a coupé la prise de commande dans l'application. */
  ordering_open: boolean;
  orders: ClientOrder[];
}

export interface OrderPayload {
  client_key: string;
  lines: { variant_id: string; quantity: number }[];
  desired_delivery_date: string | null;
  note: string | null;
}

export interface OrderCreated {
  order: { id: string; order_ref: string; status: OrderStatus; total_ttc: number; created_at: string };
  duplicate: boolean;
}

/** Commande de « Mes commandes », tous fournisseurs confondus. */
export interface ClientOrderSummary extends ClientOrder {
  link_id: string;
  supplier_name: string;
  currency: string;
  lines_count: number;
}

export interface OrderLineDetail {
  variant_id: string;
  product_name: string;
  variant_name: string;
  image_url: string | null;
  category_name: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  /** Prix avant remise (null sans remise), unités offertes, promotion appliquée. */
  list_price: number | null;
  is_free: boolean;
  promotion_name: string | null;
}

/** Détail d'une commande : lignes et dates des étapes. */
export interface ClientOrderDetail {
  supplier: SupplierInfo;
  order: ClientOrder & {
    total_ht: number;
    total_tva: number;
    note: string | null;
    validated_at: string | null;
    started_at: string | null;
    payment_status: string;
    threshold_promotion_name: string | null;
    threshold_discount_pct: number | null;
  };
  lines: OrderLineDetail[];
}

/** Produits habituels de la fiche chez ce fournisseur et dernière commande, à reprendre en un geste. */
export interface SupplierUsuals {
  items: { variant_id: string; times: number; last_qty: number; last_at: string }[];
  last_order: {
    order_ref: string;
    created_at: string;
    total_ttc: number;
    lines: { variant_id: string; quantity: number }[];
  } | null;
}

/** Statut tel que le client le comprend. */
export type ClientOrderStep = 'waiting' | 'validated' | 'delivering' | 'delivered' | 'refused' | 'cancelled';

/** Icône de chaque statut (mêmes pastilles partout). */
export const STEP_ICONS: Record<ClientOrderStep, string> = {
  waiting: 'time-outline',
  validated: 'checkmark-outline',
  delivering: 'car-outline',
  delivered: 'cube-outline',
  refused: 'close-outline',
  cancelled: 'remove-circle-outline',
};

/** Commande encore en cours (ni livrée, ni refusée, ni annulée). */
export function isOpenStep(step: ClientOrderStep): boolean {
  return step === 'waiting' || step === 'validated' || step === 'delivering';
}

export function clientStep(order: Pick<ClientOrder, 'status' | 'reject_reason'>): ClientOrderStep {
  switch (order.status) {
    case 'to_validate': return 'waiting';
    case 'pending':
    case 'assigned': return 'validated';
    case 'in_progress': return 'delivering';
    case 'delivered': return 'delivered';
    default: return order.reject_reason ? 'refused' : 'cancelled';
  }
}
