/**
 * Storefront Context Decorators
 *
 * Decorators for accessing storefront context in controllers.
 * Used with StorefrontGuard for header-based store resolution.
 *
 * @see Story 3.8 - Oversell Prevention
 */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { StorefrontContext } from '@common/guards/storefront.guard';

/**
 * Get the full storefront context from request
 *
 * Usage:
 * ```typescript
 * @Get('products')
 * @UseGuards(StorefrontGuard)
 * async getProducts(@Storefront() ctx: StorefrontContext) {
 *   console.log(ctx.storeId, ctx.resolvedVia);
 * }
 * ```
 */
export const Storefront = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): StorefrontContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.storefront;
  },
);

/**
 * Get just the storeId from storefront context
 *
 * Usage:
 * ```typescript
 * @Get('products')
 * @UseGuards(StorefrontGuard)
 * async getProducts(@StorefrontStoreId() storeId: string) {
 *   console.log(storeId);
 * }
 * ```
 */
export const StorefrontStoreId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.storefront?.storeId;
  },
);

/**
 * Get the cart token from storefront context (if provided)
 *
 * Usage:
 * ```typescript
 * @Post('reservations')
 * @UseGuards(StorefrontGuard, CartTokenGuard)
 * async createReservation(@CartToken() token: string) {
 *   console.log(token);
 * }
 * ```
 */
export const CartToken = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.storefront?.cartToken;
  },
);
