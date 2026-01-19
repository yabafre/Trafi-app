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
 * - Wrong store binding = reject
 * - No signature validation yet (Epic 4) but structure is in place
 *
 * Current behavior (scaffold):
 * - Requires X-Trafi-Cart-Token header
 * - Validates token format: ct_{storeId}_{cartId}_{nonce}
 * - Validates store binding (token storeId must match request storeId)
 * - Validates nonce format (min 6 chars)
 *
 * Future behavior (Epic 4):
 * - HMAC/JWT signed cart tokens with secret
 * - Token expiration (exp claim)
 * - Token scopes (read/write)
 * - Token rotation on sensitive operations
 *
 * Token Format (scaffold):
 *   ct_{storeId}_{cartId}_{nonce}
 *   Example: ct_store_abc123_cart_xyz789_a1b2c3
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
import { STOREFRONT_HEADERS, StorefrontContext } from './storefront.guard';

/**
 * Cart token metadata added to request
 */
export interface CartTokenContext {
  cartId: string;
  storeId: string;
  nonce: string;
  // Future: expiresAt, scopes, signature, etc.
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

    // Validate token format and extract context
    const tokenContext = this.validateCartToken(cartToken);

    if (!tokenContext) {
      this.logger.warn({
        event: 'cart_token_invalid_format',
        requestId,
        path: request.url,
        // Never log the raw token
      });
      throw new UnauthorizedException('Invalid cart token format');
    }

    // CRITICAL: Verify store binding
    // Token must be scoped to the same store as the request
    const storefrontContext: StorefrontContext | undefined =
      request.storefront;
    if (storefrontContext && tokenContext.storeId !== storefrontContext.storeId) {
      this.logger.warn({
        event: 'cart_token_store_mismatch',
        requestId,
        tokenStoreId: tokenContext.storeId,
        requestStoreId: storefrontContext.storeId,
        path: request.url,
      });
      throw new ForbiddenException('Cart token does not match store context');
    }

    // Audit log (no raw token)
    this.logger.log({
      event: 'cart_token_validated',
      requestId,
      cartId: tokenContext.cartId,
      storeId: tokenContext.storeId,
      path: request.url,
    });

    // Inject cart token context into request
    request.cartTokenContext = tokenContext;

    return true;
  }

  /**
   * Validate cart token (scaffold implementation)
   *
   * Format: ct_{storeId}_{cartId}_{nonce}
   * Example: ct_store_abc123_cart_xyz789_a1b2c3
   *
   * Validation rules:
   * - Must start with 'ct_'
   * - Must have storeId, cartId, and nonce
   * - Nonce must be at least 6 characters
   * - StoreId and cartId must be non-empty
   *
   * Future (Epic 4): HMAC signature validation
   */
  protected validateCartToken(token: string): CartTokenContext | null {
    // Must start with ct_ prefix
    if (!token.startsWith('ct_')) {
      return null;
    }

    // Remove ct_ prefix and split
    const payload = token.slice(3);
    const parts = payload.split('_');

    // Minimum: storeId (2 parts), cartId (2 parts), nonce (1 part) = 5 parts
    // Example: store_abc123_cart_xyz789_a1b2c3
    if (parts.length < 5) {
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

    // Extract nonce (remaining parts joined)
    const nonce = parts.slice(4).join('_');
    if (nonce.length < 6) {
      return null; // Nonce too short
    }

    return {
      storeId,
      cartId,
      nonce,
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
