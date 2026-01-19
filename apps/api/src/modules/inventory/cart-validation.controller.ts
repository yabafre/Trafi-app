/**
 * REST Controller for Cart Validation and Inventory Reservations
 *
 * Provides availability checks, cart validation, and inventory reservations
 * for STOREFRONT use (SDK/REST consumers).
 *
 * Store Resolution (via headers, NOT URL):
 * - X-Trafi-Store-Id: store_... (dev/debug)
 * - X-Trafi-Publishable-Key: pk_... (future - Epic 12)
 * - Host header (future - Epic 14)
 *
 * Cart Auth (for reservation endpoints):
 * - X-Trafi-Cart-Token: ct_... (scaffold - full impl in Epic 4)
 *
 * NOTE: This is NOT for dashboard/backoffice. Dashboard uses tRPC.
 *
 * @see Story 3.8 - Oversell Prevention
 * @see Epic 12 - SDK & API Experience
 * @see Epic 14 - Cloud & Multi-tenancy
 */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiHeader } from '@nestjs/swagger';
import { CartValidationService } from './cart-validation.service';

/**
 * Maximum stock quantity to expose publicly.
 * Prevents exact inventory scraping while indicating "plenty in stock".
 * Values above this threshold are reported as this cap.
 */
const PUBLIC_STOCK_CAP = 20;

/**
 * Helper to set cache Vary headers based on environment
 * In production, only vary by publishable key (better cache hit rate)
 * In dev/staging, also vary by store-id header
 */
function setCacheVaryHeaders(res: Response): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const allowStoreIdHeader = process.env.ALLOW_STORE_ID_HEADER === 'true';

  // In production (without override), only vary by publishable key
  // This improves CDN cache hit rate since store-id-header is blocked
  if (isProduction && !allowStoreIdHeader) {
    res.setHeader('Vary', STOREFRONT_HEADERS.PUBLISHABLE_KEY);
  } else {
    // In dev/staging, vary by both headers
    res.setHeader('Vary', `${STOREFRONT_HEADERS.STORE_ID}, ${STOREFRONT_HEADERS.PUBLISHABLE_KEY}`);
  }
}

/**
 * Rate Limiting Configuration (scaffold - implement in Epic 12)
 *
 * TODO: Implement rate limiting using @nestjs/throttler or similar
 *
 * Recommended limits:
 * - GET /availability/:variantId: 100 req/min per IP (burst: 20)
 * - GET /stock/:variantId: 100 req/min per IP (burst: 20)
 * - POST /cart/validate: 30 req/min per IP (burst: 5) - DB heavy
 * - POST /reservations: 20 req/min per cart token (burst: 3)
 *
 * @see Epic 12 - SDK & API Experience
 */
import { StorefrontGuard, STOREFRONT_HEADERS } from '@common/guards/storefront.guard';
import { CartTokenGuard } from '@common/guards/cart-token.guard';
import { StorefrontStoreId } from '@common/decorators/storefront.decorator';
import {
  CheckAvailabilityInputSchema,
  ValidateCartItemSchema,
  CreateReservationInputSchema,
  ReleaseReservationInputSchema,
} from '@trafi/validators';
import { z } from '@trafi/zod';

/**
 * Common API header documentation for storefront endpoints
 */
const STOREFRONT_HEADER_DOCS = [
  {
    name: STOREFRONT_HEADERS.STORE_ID,
    description: 'Store ID (required for dev/debug)',
    required: true,
    example: 'store_abc123',
  },
  {
    name: STOREFRONT_HEADERS.PUBLISHABLE_KEY,
    description: 'Publishable API key (future - Epic 12)',
    required: false,
    example: 'pk_live_abc123',
  },
];

const CART_TOKEN_HEADER_DOC = {
  name: STOREFRONT_HEADERS.CART_TOKEN,
  description: 'Cart token for checkout operations',
  required: true,
  example: 'ct_cart_abc123_x7k9m2',
};

/**
 * Cart Validation REST Controller
 *
 * All endpoints use header-based store resolution (not URL params).
 *
 * Public Endpoints (no cart token required):
 * - GET  /storefront/availability/:variantId - Check variant availability
 * - GET  /storefront/stock/:variantId - Get available stock details
 * - POST /storefront/cart/validate - Validate cart items
 *
 * Protected Endpoints (cart token required):
 * - POST /storefront/reservations - Create reservation
 * - POST /storefront/reservations/release - Release reservation
 * - POST /storefront/reservations/release-cart - Release all cart reservations
 * - GET  /storefront/reservations/:cartId - Get cart reservations
 */
@ApiTags('storefront')
@Controller('storefront')
@UseGuards(StorefrontGuard)
@ApiHeader(STOREFRONT_HEADER_DOCS[0])
@ApiHeader(STOREFRONT_HEADER_DOCS[1])
export class CartValidationController {
  constructor(private readonly cartValidationService: CartValidationService) {}

  // ==========================================================================
  // Public Endpoints (Storefront - no cart token required)
  // ==========================================================================

  /**
   * Check availability for a single variant
   *
   * SECURITY:
   * - Available quantity is CAPPED at PUBLIC_STOCK_CAP (20) in response
   *
   * CACHING:
   * - Varies by X-Trafi-Store-Id and X-Trafi-Publishable-Key headers
   */
  @Get('availability/:variantId')
  @ApiOperation({
    summary: 'Check variant availability',
    description:
      'Check if a variant has sufficient stock for a requested quantity. ' +
      'Considers physical stock minus active reservations. ' +
      'Available quantity capped at 20 for privacy.',
  })
  @ApiParam({ name: 'variantId', description: 'Product variant ID' })
  @ApiQuery({
    name: 'quantity',
    description: 'Requested quantity',
    type: Number,
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Availability check result',
    schema: {
      type: 'object',
      properties: {
        available: { type: 'boolean', example: true },
        availableQuantity: {
          type: 'number',
          example: 20,
          description: 'Capped at 20 for privacy',
        },
        allowOversell: { type: 'boolean', example: false },
        trackInventory: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Missing store context header',
  })
  async checkAvailability(
    @StorefrontStoreId() storeId: string,
    @Param('variantId') variantId: string,
    @Query('quantity') quantity: string,
    @Res({ passthrough: true }) res: Response
  ) {
    // Set Vary headers for CDN/proxy cache safety (env-aware)
    setCacheVaryHeaders(res);

    const input = CheckAvailabilityInputSchema.parse({
      variantId,
      requestedQuantity: parseInt(quantity, 10),
    });

    const result = await this.cartValidationService.checkAvailability(storeId, input);

    // Cap available quantity in response
    return {
      ...result,
      availableQuantity: Math.min(result.availableQuantity, PUBLIC_STOCK_CAP),
    };
  }

  /**
   * Get available stock details for a variant
   *
   * SECURITY:
   * - Physical/reserved quantities are NOT exposed (prevents inventory scraping)
   * - Available quantity is CAPPED at PUBLIC_STOCK_CAP (20)
   * - Only returns: inStock boolean + capped availableQuantity
   *
   * CACHING:
   * - Varies by X-Trafi-Store-Id and X-Trafi-Publishable-Key headers
   * - CDN/proxy must respect Vary header to avoid cross-store cache pollution
   */
  @Get('stock/:variantId')
  @ApiOperation({
    summary: 'Get available stock for variant',
    description:
      'Returns stock availability. Quantity is capped at 20+ for privacy. ' +
      'Use inStock boolean for UI display.',
  })
  @ApiParam({ name: 'variantId', description: 'Product variant ID' })
  @ApiResponse({
    status: 200,
    description: 'Stock details (quantity capped for privacy)',
    schema: {
      type: 'object',
      properties: {
        variantId: { type: 'string', example: 'var_abc123' },
        inStock: { type: 'boolean', example: true },
        availableQuantity: {
          type: 'number',
          example: 20,
          description: 'Capped at 20 for privacy',
        },
        trackInventory: { type: 'boolean', example: true },
        allowOversell: { type: 'boolean', example: false },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Variant not found',
  })
  async getAvailableStock(
    @StorefrontStoreId() storeId: string,
    @Param('variantId') variantId: string,
    @Res({ passthrough: true }) res: Response
  ) {
    // Set Vary headers for CDN/proxy cache safety
    // Prevents serving Store A's data to Store B via cache
    res.setHeader('Vary', `${STOREFRONT_HEADERS.STORE_ID}, ${STOREFRONT_HEADERS.PUBLISHABLE_KEY}`);

    const stock = await this.cartValidationService.getAvailableStock(storeId, variantId);

    // Cap quantity to prevent exact inventory scraping
    // Returns inStock boolean for simple UI checks
    return {
      variantId: stock.variantId,
      inStock: stock.availableQuantity > 0,
      availableQuantity: Math.min(stock.availableQuantity, PUBLIC_STOCK_CAP),
      trackInventory: stock.trackInventory,
      allowOversell: stock.allowOversell,
      // NOTE: physicalQuantity and reservedQuantity are NOT exposed
    };
  }

  /**
   * Validate multiple cart items
   */
  @Post('cart/validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate cart items',
    description:
      'Validates multiple cart items and returns adjustments needed. ' +
      'Use this before checkout to ensure all items are available.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cart validation result',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean', example: true },
        adjustments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variantId: { type: 'string' },
              requestedQuantity: { type: 'number' },
              availableQuantity: { type: 'number' },
              adjusted: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
        outOfStockItems: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  })
  async validateCart(@StorefrontStoreId() storeId: string, @Body() body: unknown) {
    const schema = z.object({
      items: z.array(ValidateCartItemSchema),
    });
    const { items } = schema.parse(body);

    return this.cartValidationService.validateCartItems(storeId, items);
  }

  // ==========================================================================
  // Protected Endpoints (Checkout flow - cart token required)
  // ==========================================================================

  /**
   * Create inventory reservation
   */
  @UseGuards(CartTokenGuard)
  @Post('reservations')
  @HttpCode(HttpStatus.CREATED)
  @ApiHeader(CART_TOKEN_HEADER_DOC)
  @ApiOperation({
    summary: 'Create inventory reservation',
    description:
      'Creates or updates an inventory reservation for a cart item. ' +
      'Used during checkout to hold stock temporarily (default 15 minutes). ' +
      'Requires X-Trafi-Cart-Token header.',
  })
  @ApiResponse({
    status: 201,
    description: 'Reservation created',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'invres_abc123' },
        storeId: { type: 'string' },
        cartId: { type: 'string' },
        variantId: { type: 'string' },
        quantity: { type: 'number' },
        status: { type: 'string', enum: ['ACTIVE', 'RELEASED', 'EXPIRED'] },
        expiresAt: { type: 'string', format: 'date-time' },
        createdAt: { type: 'string', format: 'date-time' },
        releasedAt: { type: 'string', format: 'date-time', nullable: true },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Insufficient stock',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid cart token',
  })
  @ApiResponse({
    status: 404,
    description: 'Variant not found',
  })
  async createReservation(@StorefrontStoreId() storeId: string, @Body() body: unknown) {
    const bodyObj = body as Record<string, unknown>;
    const input = CreateReservationInputSchema.parse({
      ...bodyObj,
      storeId,
    });

    return this.cartValidationService.createReservation(input);
  }

  /**
   * Release a specific reservation
   */
  @UseGuards(CartTokenGuard)
  @Post('reservations/release')
  @HttpCode(HttpStatus.OK)
  @ApiHeader(CART_TOKEN_HEADER_DOC)
  @ApiOperation({
    summary: 'Release inventory reservation',
    description:
      'Releases a specific reservation (marks as RELEASED or EXPIRED). ' +
      'Called after order completion or checkout cancellation. ' +
      'Requires X-Trafi-Cart-Token header.',
  })
  @ApiResponse({
    status: 200,
    description: 'Reservation released',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid cart token',
  })
  @ApiResponse({
    status: 404,
    description: 'Active reservation not found',
  })
  async releaseReservation(@StorefrontStoreId() storeId: string, @Body() body: unknown) {
    const input = ReleaseReservationInputSchema.parse(body);

    return this.cartValidationService.releaseReservation(storeId, input);
  }

  /**
   * Release all reservations for a cart
   */
  @UseGuards(CartTokenGuard)
  @Post('reservations/release-cart')
  @HttpCode(HttpStatus.OK)
  @ApiHeader(CART_TOKEN_HEADER_DOC)
  @ApiOperation({
    summary: 'Release all cart reservations',
    description:
      'Releases all active reservations for a cart. ' +
      'Called after order completion to free up the reserved stock. ' +
      'Requires X-Trafi-Cart-Token header.',
  })
  @ApiResponse({
    status: 200,
    description: 'Reservations released',
    schema: {
      type: 'object',
      properties: {
        released: { type: 'number', example: 3 },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid cart token',
  })
  async releaseCartReservations(@StorefrontStoreId() storeId: string, @Body() body: unknown) {
    const schema = z.object({
      cartId: z.string(),
      reason: z.enum(['RELEASED', 'EXPIRED']),
    });
    const { cartId, reason } = schema.parse(body);

    const count = await this.cartValidationService.releaseCartReservations(storeId, cartId, reason);

    return { released: count };
  }

  /**
   * Get all active reservations for a cart
   */
  @UseGuards(CartTokenGuard)
  @Get('reservations/:cartId')
  @ApiHeader(CART_TOKEN_HEADER_DOC)
  @ApiOperation({
    summary: 'Get cart reservations',
    description:
      'Returns all active reservations for a cart. ' + 'Requires X-Trafi-Cart-Token header.',
  })
  @ApiParam({ name: 'cartId', description: 'Cart ID' })
  @ApiResponse({
    status: 200,
    description: 'List of active reservations',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          variantId: { type: 'string' },
          quantity: { type: 'number' },
          status: { type: 'string' },
          expiresAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid cart token',
  })
  async getCartReservations(@StorefrontStoreId() storeId: string, @Param('cartId') cartId: string) {
    return this.cartValidationService.getCartReservations(storeId, cartId);
  }
}
