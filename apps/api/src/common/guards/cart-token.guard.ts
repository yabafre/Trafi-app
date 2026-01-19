/**
 * Cart Token Guard
 *
 * Validates cart token for checkout/reservation endpoints.
 * This is the "scaffold" implementation - full token signing/validation
 * will be added in Epic 4 (Cart).
 *
 * SECURITY POSTURE: DENY BY DEFAULT
 * - No token = reject (unless @CartTokenOptional)
 * - Invalid format = reject
 * - Expired token = reject
 * - Wrong store binding = reject
 * - No signature validation yet (Epic 4) but structure is in place
 *
 * Current behavior (scaffold):
 * - Requires X-Trafi-Cart-Token header
 * - Validates token format: ct_{storeId}_{cartId}_{expUnix}_{nonce}
 * - Validates expiration (exp must be > now)
 * - Validates store binding (token storeId must match request storeId)
 * - Validates nonce format (min 6 chars)
 * - Logs token fingerprint (sha256 first 8 chars) for debugging
 *
 * Future behavior (Epic 4):
 * - HMAC/JWT signed cart tokens with secret
 * - Token scopes (read/write)
 * - Token rotation on sensitive operations
 *
 * Token Format (v0.2):
 *   ct_{storeId}_{cartId}_{expUnix}_{nonce}
 *   Example: ct_store_abc123_cart_xyz789_1705678800_a1b2c3d4
 *
 * Default TTL: 30 minutes (configurable via CART_TOKEN_TTL_MINUTES)
 *
 * @see Story 3.8 - Oversell Prevention
 * @see Epic 4 - Shopping Cart & Checkout
 */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Logger,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createHash } from 'crypto';
import { STOREFRONT_HEADERS, StorefrontContext } from './storefront.guard';

/**
 * Cart token metadata added to request
 *
 * Recommended TTL: 30 minutes (configurable via CART_TOKEN_TTL_MINUTES env var)
 * Token expiration is embedded in the token itself (expUnix field).
 */
export interface CartTokenContext {
  cartId: string;
  storeId: string;
  expiresAt: Date;
  nonce: string;
  fingerprint: string; // sha256(token).slice(0, 8) for debugging
  // Future: scopes, signature, etc.
}

/**
 * Decorator key for optional cart token
 */
export const CART_TOKEN_OPTIONAL_KEY = 'cartTokenOptional';

@Injectable()
export class CartTokenGuard implements CanActivate {
  private readonly logger = new Logger(CartTokenGuard.name);

  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const requestId = request.requestId || 'unknown';

    // Check if cart token is optional for this endpoint
    const isOptional = this.reflector.getAllAndOverride<boolean>(
      CART_TOKEN_OPTIONAL_KEY,
      [context.getHandler(), context.getClass()],
    );

    const cartToken = request.headers[STOREFRONT_HEADERS.CART_TOKEN];

    // DENY BY DEFAULT: No token = reject (unless optional)
    if (!cartToken) {
      if (isOptional) {
        return true;
      }
      this.logger.warn({
        event: 'cart_token_missing',
        requestId,
        path: request.url,
      });
      throw new UnauthorizedException(
        'Cart token required. Provide X-Trafi-Cart-Token header.',
      );
    }

    // Generate fingerprint for logging (never log raw token)
    const fingerprint = this.getTokenFingerprint(cartToken);

    // Validate token format and extract context
    const tokenContext = this.validateCartToken(cartToken, fingerprint);

    if (!tokenContext) {
      this.logger.warn({
        event: 'cart_token_invalid_format',
        requestId,
        tokenFingerprint: fingerprint,
        path: request.url,
      });
      throw new UnauthorizedException('Invalid cart token format');
    }

    // Check expiration
    if (tokenContext.expiresAt < new Date()) {
      this.logger.warn({
        event: 'cart_token_expired',
        requestId,
        tokenFingerprint: fingerprint,
        expiredAt: tokenContext.expiresAt.toISOString(),
        path: request.url,
      });
      throw new UnauthorizedException('Cart token has expired');
    }

    // CRITICAL: Verify store binding
    // Token must be scoped to the same store as the request
    const storefrontContext: StorefrontContext | undefined =
      request.storefront;
    if (storefrontContext && tokenContext.storeId !== storefrontContext.storeId) {
      this.logger.warn({
        event: 'cart_token_store_mismatch',
        requestId,
        tokenFingerprint: fingerprint,
        tokenStoreId: tokenContext.storeId,
        requestStoreId: storefrontContext.storeId,
        path: request.url,
      });
      throw new ForbiddenException('Cart token does not match store context');
    }

    // Audit log (fingerprint only, no raw token)
    this.logger.log({
      event: 'cart_token_validated',
      requestId,
      tokenFingerprint: fingerprint,
      cartId: tokenContext.cartId,
      storeId: tokenContext.storeId,
      expiresAt: tokenContext.expiresAt.toISOString(),
      path: request.url,
    });

    // Inject cart token context into request
    request.cartTokenContext = tokenContext;

    return true;
  }

  /**
   * Generate a short fingerprint of the token for logging
   * Uses sha256 hash, first 8 characters
   */
  protected getTokenFingerprint(token: string): string {
    return createHash('sha256').update(token).digest('hex').slice(0, 8);
  }

  /**
   * Validate cart token (scaffold implementation)
   *
   * Format v0.2: ct_{storeId}_{cartId}_{expUnix}_{nonce}
   * Example: ct_store_abc123_cart_xyz789_1705678800_a1b2c3d4
   *
   * Validation rules:
   * - Must start with 'ct_'
   * - Must have storeId, cartId, expUnix, and nonce
   * - expUnix must be a valid unix timestamp
   * - Nonce must be at least 6 characters
   * - StoreId and cartId must be non-empty
   *
   * Future (Epic 4): HMAC signature validation
   */
  protected validateCartToken(
    token: string,
    fingerprint: string,
  ): CartTokenContext | null {
    // Must start with ct_ prefix
    if (!token.startsWith('ct_')) {
      return null;
    }

    // Remove ct_ prefix and split
    const payload = token.slice(3);
    const parts = payload.split('_');

    // Minimum: storeId (2 parts), cartId (2 parts), expUnix (1 part), nonce (1+ parts) = 6 parts
    // Example: store_abc123_cart_xyz789_1705678800_a1b2c3d4
    if (parts.length < 6) {
      return null;
    }

    // Extract storeId (first two parts: store_xxx)
    const storeId = `${parts[0]}_${parts[1]}`;
    if (!storeId.startsWith('store_')) {
      return null;
    }

    // Extract cartId (next two parts: cart_xxx)
    const cartId = `${parts[2]}_${parts[3]}`;
    if (!cartId.startsWith('cart_')) {
      return null;
    }

    // Extract expiration (unix timestamp)
    const expUnix = parseInt(parts[4], 10);
    if (isNaN(expUnix) || expUnix <= 0) {
      return null; // Invalid expiration timestamp
    }
    const expiresAt = new Date(expUnix * 1000);

    // Extract nonce (remaining parts joined)
    const nonce = parts.slice(5).join('_');
    if (nonce.length < 6) {
      return null; // Nonce too short
    }

    return {
      storeId,
      cartId,
      expiresAt,
      nonce,
      fingerprint,
    };
  }
}

/**
 * Decorator to mark cart token as optional for an endpoint
 *
 * Usage:
 * ```typescript
 * @CartTokenOptional()
 * @UseGuards(CartTokenGuard)
 * async getStock() { ... }
 * ```
 */
export const CartTokenOptional = () => SetMetadata(CART_TOKEN_OPTIONAL_KEY, true);
