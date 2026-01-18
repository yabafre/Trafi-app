/**
 * Centralized ID Prefix Configuration
 *
 * All Trafi models use prefixed IDs for better debugging and self-documentation.
 * Format: {prefix}_{nanoid} (e.g., prod_abc123xyz...)
 *
 * @see Story 3.R2 - Prefixed IDs Foundation
 * @see database-schema-roadmap.md for full model inventory
 */

// Import Prisma types - will be available after models are created
// For now, we use string keys that match model names

export const ID_PREFIXES: Record<string, string> = {
  // ============================================
  // Core Models (Epic 1 & 2)
  // ============================================
  Store: 'store',
  User: 'usr',
  StoreMembership: 'smem', // NEW: Multi-store RBAC
  StoreSettings: 'stset',
  ApiKey: 'apikey',
  AuditLog: 'audit',
  OwnershipTransfer: 'owntx',
  DomainEvent: 'evt', // NEW: Outbox pattern for async jobs
  // StoreCounter: no prefix (compound PK)
  // Country: no prefix (iso2 PK - global)
  // Currency: no prefix (code PK - global)

  // ============================================
  // Products & Catalog (Epic 3)
  // ============================================
  Product: 'prod',
  ProductVariant: 'var',
  ProductMedia: 'med',
  Category: 'cat',
  Collection: 'col',
  ProductCollection: 'prodcol',
  TaxRule: 'tax',
  InventoryHistory: 'invh',
  InventoryReservation: 'invres', // NEW: Stock holds for carts

  // ============================================
  // Marketing & Promotions (Epic 3) - MVP Simplified
  // ============================================
  Promotion: 'promo',
  Coupon: 'coup',
  PromotionRedemption: 'prdm', // NEW: Renamed from PromotionUsage
  GiftCard: 'gc',
  GiftCardTransaction: 'gctx',
  GiftCardTemplate: 'gctpl',

  // ============================================
  // Cart & Checkout (Epic 4)
  // ============================================
  Cart: 'cart',
  CartItem: 'citem',
  CheckoutSession: 'chk',

  // ============================================
  // Shipping (Epic 4)
  // ============================================
  ShippingZone: 'szone',
  ShippingMethod: 'smeth',
  ShippingRate: 'srate',
  // ShippingZoneCountry: no prefix (join table)

  // ============================================
  // Regions & Localization (Epic 4)
  // ============================================
  Region: 'reg',
  // RegionCountry: no prefix (join table)
  // StoreCurrency: no prefix (join table)
  Currency: 'curr',
  ExchangeRate: 'exr',
  PriceList: 'plist',
  PriceListPrice: 'plp',

  // ============================================
  // Payment (Epic 5)
  // ============================================
  StripeConnection: 'sconn',
  PaymentIntent: 'pi',
  Payment: 'pay',
  Refund: 'ref',
  PaymentAuditLog: 'palog',

  // ============================================
  // Orders (Epic 6)
  // ============================================
  Order: 'ord',
  OrderItem: 'oli',
  OrderAddress: 'oadr',
  OrderTimelineEvent: 'ote',

  // ============================================
  // Fulfillment (Epic 6)
  // ============================================
  Fulfillment: 'ful',
  FulfillmentItem: 'fuli',
  FulfillmentTrackingEvent: 'fulte',

  // ============================================
  // Returns (Epic 6)
  // ============================================
  Return: 'ret',
  ReturnItem: 'reti',
  ReturnPolicy: 'rpol',

  // ============================================
  // Customers (Epic 7)
  // ============================================
  Customer: 'cst',
  CustomerSession: 'csess',
  CustomerAddress: 'cadr',
  CustomerGroup: 'cgrp',
  CustomerGroupMembership: 'cgm',
  Wishlist: 'wl',
  WishlistItem: 'wli',

  // ============================================
  // Suppliers & Purchase Orders (Epic 15)
  // ============================================
  Supplier: 'supp',
  SupplierContact: 'scon',
  SupplierProduct: 'spprod',
  PurchaseOrder: 'po',
  PurchaseOrderItem: 'poitem',
  PurchaseOrderReceipt: 'porec',
  PurchaseOrderReceiptItem: 'porecitem',
};

/**
 * Get the ID prefix for a model
 * Returns null if model doesn't have a configured prefix
 */
export function getIdPrefix(modelName: string): string | null {
  return ID_PREFIXES[modelName] ?? null;
}

/**
 * Check if a model has a configured prefix
 */
export function hasIdPrefix(modelName: string): boolean {
  return modelName in ID_PREFIXES;
}

/**
 * Get all configured model names
 */
export function getConfiguredModels(): string[] {
  return Object.keys(ID_PREFIXES);
}
