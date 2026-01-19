/**
 * Storefront API Headers and Types
 *
 * Shared constants for storefront SDK/REST API headers.
 * Use these to avoid typos and ensure consistency across packages.
 *
 * @see Story 3.8 - Oversell Prevention
 * @see Epic 12 - SDK & API Experience
 */

/**
 * HTTP Header names for Storefront API authentication and context
 *
 * Usage patterns:
 * - X-Trafi-Publishable-Key: ALWAYS required in production (SDK auto-injects)
 * - X-Trafi-Store-Id: DEV/STAGING only (blocked in prod unless ALLOW_STORE_ID_HEADER=true)
 * - X-Trafi-Cart-Token: Only for stateful endpoints (reservations, checkout)
 *
 * @example
 * ```typescript
 * import { STOREFRONT_HEADERS } from '@trafi/types';
 *
 * fetch('/api/storefront/stock/var_123', {
 *   headers: {
 *     [STOREFRONT_HEADERS.PUBLISHABLE_KEY]: 'pk_live_xxx',
 *   }
 * });
 * ```
 */
export const STOREFRONT_HEADERS = {
  /**
   * Store ID header (dev/staging only)
   * Format: store_{id}
   * BLOCKED in production - use PUBLISHABLE_KEY instead
   */
  STORE_ID: 'x-trafi-store-id',

  /**
   * Publishable API key (production-safe)
   * Format: pk_live_{random} or pk_test_{random}
   * Auto-injected by SDK, required for all storefront requests in production
   */
  PUBLISHABLE_KEY: 'x-trafi-publishable-key',

  /**
   * Cart token for stateful operations (reservations, checkout)
   * Format: ct_{storeId}_{cartId}_{expUnix}_{nonce}
   * Only required for endpoints that modify cart state
   */
  CART_TOKEN: 'x-trafi-cart-token',
} as const;

/**
 * Type for header names (for type-safe header access)
 */
export type StorefrontHeaderName = (typeof STOREFRONT_HEADERS)[keyof typeof STOREFRONT_HEADERS];

/**
 * Storefront request context (attached to request by StorefrontGuard)
 */
export interface StorefrontContext {
  storeId: string;
  resolvedVia: 'store-id-header' | 'publishable-key' | 'host';
  cartToken?: string;
}

/**
 * Cart token context (attached to request by CartTokenGuard)
 */
export interface CartTokenContext {
  cartId: string;
  storeId: string;
  expiresAt: Date;
  nonce: string;
  fingerprint: string; // sha256(token).slice(0, 8) for debugging
}

/**
 * Cart token format version
 * v0.2: ct_{storeId}_{cartId}_{expUnix}_{nonce}
 */
export const CART_TOKEN_VERSION = '0.2';

/**
 * Recommended cart token TTL in minutes
 */
export const CART_TOKEN_TTL_MINUTES = 30;

/**
 * Public stock quantity cap (prevents inventory scraping)
 */
export const PUBLIC_STOCK_CAP = 20;
