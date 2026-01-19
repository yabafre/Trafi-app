/**
 * Cart Token Guard
 *
 * Validates cart token for checkout/reservation endpoints.
 * This is the "scaffold" implementation - full token signing/validation
 * will be added in Epic 4 (Cart).
 *
 * Current behavior (scaffold):
 * - Requires X-Trafi-Cart-Token header
 * - Validates token format (ct_... prefix)
 * - Does NOT validate signature yet (Epic 4)
 *
 * Future behavior (Epic 4):
 * - HMAC/JWT signed cart tokens
 * - Token expiration
 * - Token scopes (read/write)
 * - Token rotation
 *
 * @see Story 3.8 - Oversell Prevention
 * @see Epic 4 - Shopping Cart & Checkout
 */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { STOREFRONT_HEADERS } from './storefront.guard';

/**
 * Cart token metadata added to request
 */
export interface CartTokenContext {
  token: string;
  cartId: string;
  // Future: expiresAt, scopes, etc.
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

    // Check if cart token is optional for this endpoint
    const isOptional = this.reflector.getAllAndOverride<boolean>(
      CART_TOKEN_OPTIONAL_KEY,
      [context.getHandler(), context.getClass()],
    );

    const cartToken = request.headers[STOREFRONT_HEADERS.CART_TOKEN];

    if (!cartToken) {
      if (isOptional) {
        return true;
      }
      throw new UnauthorizedException(
        'Cart token required. Provide X-Trafi-Cart-Token header.',
      );
    }

    // Validate token format (scaffold - just check prefix)
    // Future: Full HMAC/JWT validation in Epic 4
    const tokenContext = this.validateCartToken(cartToken);

    if (!tokenContext) {
      throw new UnauthorizedException('Invalid cart token format');
    }

    // Inject cart token context into request
    request.cartTokenContext = tokenContext;

    return true;
  }

  /**
   * Validate cart token (scaffold implementation)
   *
   * Current: Just validates format (ct_{cartId}_{random})
   * Future: Full HMAC signature validation
   */
  protected validateCartToken(token: string): CartTokenContext | null {
    // Expected format: ct_{cartId}_{random}
    // Example: ct_cart_abc123_x7k9m2
    if (!token.startsWith('ct_')) {
      return null;
    }

    // Extract cartId from token (scaffold - naive parsing)
    // Future: Decode signed token to get cartId + verify signature
    const parts = token.split('_');
    if (parts.length < 3) {
      return null;
    }

    // Reconstruct cartId (could be cart_xxx format)
    // Token format: ct_cart_abc123_random -> cartId = cart_abc123
    const cartId = parts.slice(1, -1).join('_');

    if (!cartId) {
      return null;
    }

    this.logger.debug(`Cart token validated for cart: ${cartId}`);

    return {
      token,
      cartId,
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
import { SetMetadata } from '@nestjs/common';
export const CartTokenOptional = () => SetMetadata(CART_TOKEN_OPTIONAL_KEY, true);
