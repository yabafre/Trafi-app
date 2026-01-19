/**
 * REST Controller for Cart Validation and Inventory Reservations
 *
 * Provides availability checks, cart validation, and inventory reservations
 * for STOREFRONT use (SDK/REST consumers).
 *
 * NOTE: This is NOT for dashboard/backoffice. Dashboard uses tRPC.
 * Storefront templates and SDK consumers use these REST endpoints.
 *
 * @see Story 3.8 - Oversell Prevention
 * @see Architecture: Storefront -> SDK/REST -> API
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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CartValidationService } from './cart-validation.service';
import { Public } from '@common/decorators/public.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import {
  CheckAvailabilityInputSchema,
  ValidateCartItemSchema,
  CreateReservationInputSchema,
  ReleaseReservationInputSchema,
} from '@trafi/validators';
import { z } from '@trafi/zod';

/**
 * Cart Validation REST Controller
 *
 * Endpoints:
 * - GET  /storefront/:storeId/availability/:variantId - Check variant availability
 * - GET  /storefront/:storeId/stock/:variantId - Get available stock details
 * - POST /storefront/:storeId/cart/validate - Validate cart items
 * - POST /storefront/:storeId/reservations - Create reservation (auth required)
 * - POST /storefront/:storeId/reservations/release - Release reservation (auth required)
 * - POST /storefront/:storeId/reservations/release-cart - Release all cart reservations (auth required)
 * - GET  /storefront/:storeId/reservations/:cartId - Get cart reservations (auth required)
 */
@ApiTags('storefront')
@Controller('storefront')
export class CartValidationController {
  constructor(private readonly cartValidationService: CartValidationService) {}

  // ==========================================================================
  // Public Endpoints (Storefront - no auth required)
  // ==========================================================================

  /**
   * Check availability for a single variant
   */
  @Public()
  @Get(':storeId/availability/:variantId')
  @ApiOperation({
    summary: 'Check variant availability',
    description:
      'Check if a variant has sufficient stock for a requested quantity. ' +
      'Considers physical stock minus active reservations.',
  })
  @ApiParam({ name: 'storeId', description: 'Store ID' })
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
        availableQuantity: { type: 'number', example: 50 },
        allowOversell: { type: 'boolean', example: false },
        trackInventory: { type: 'boolean', example: true },
      },
    },
  })
  async checkAvailability(
    @Param('storeId') storeId: string,
    @Param('variantId') variantId: string,
    @Query('quantity') quantity: string,
  ) {
    const input = CheckAvailabilityInputSchema.parse({
      variantId,
      requestedQuantity: parseInt(quantity, 10),
    });

    return this.cartValidationService.checkAvailability(storeId, input);
  }

  /**
   * Get available stock details for a variant
   */
  @Public()
  @Get(':storeId/stock/:variantId')
  @ApiOperation({
    summary: 'Get available stock for variant',
    description:
      'Returns detailed stock information including physical quantity, ' +
      'reserved quantity, and available quantity.',
  })
  @ApiParam({ name: 'storeId', description: 'Store ID' })
  @ApiParam({ name: 'variantId', description: 'Product variant ID' })
  @ApiResponse({
    status: 200,
    description: 'Stock details',
    schema: {
      type: 'object',
      properties: {
        variantId: { type: 'string', example: 'var_abc123' },
        physicalQuantity: { type: 'number', example: 100 },
        reservedQuantity: { type: 'number', example: 30 },
        availableQuantity: { type: 'number', example: 70 },
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
    @Param('storeId') storeId: string,
    @Param('variantId') variantId: string,
  ) {
    return this.cartValidationService.getAvailableStock(storeId, variantId);
  }

  /**
   * Validate multiple cart items
   */
  @Public()
  @Post(':storeId/cart/validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate cart items',
    description:
      'Validates multiple cart items and returns adjustments needed. ' +
      'Use this before checkout to ensure all items are available.',
  })
  @ApiParam({ name: 'storeId', description: 'Store ID' })
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
  async validateCart(
    @Param('storeId') storeId: string,
    @Body() body: unknown,
  ) {
    const schema = z.object({
      items: z.array(ValidateCartItemSchema),
    });
    const { items } = schema.parse(body);

    return this.cartValidationService.validateCartItems(storeId, items);
  }

  // ==========================================================================
  // Protected Endpoints (Checkout flow - auth required)
  // ==========================================================================

  /**
   * Create inventory reservation
   */
  @UseGuards(JwtAuthGuard)
  @Post(':storeId/reservations')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create inventory reservation',
    description:
      'Creates or updates an inventory reservation for a cart item. ' +
      'Used during checkout to hold stock temporarily (default 15 minutes).',
  })
  @ApiParam({ name: 'storeId', description: 'Store ID' })
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
    status: 404,
    description: 'Variant not found',
  })
  async createReservation(
    @Param('storeId') storeId: string,
    @Body() body: unknown,
  ) {
    // Parse body first, then add storeId
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
  @UseGuards(JwtAuthGuard)
  @Post(':storeId/reservations/release')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Release inventory reservation',
    description:
      'Releases a specific reservation (marks as RELEASED or EXPIRED). ' +
      'Called after order completion or checkout cancellation.',
  })
  @ApiParam({ name: 'storeId', description: 'Store ID' })
  @ApiResponse({
    status: 200,
    description: 'Reservation released',
  })
  @ApiResponse({
    status: 404,
    description: 'Active reservation not found',
  })
  async releaseReservation(
    @Param('storeId') storeId: string,
    @Body() body: unknown,
  ) {
    const input = ReleaseReservationInputSchema.parse(body);

    return this.cartValidationService.releaseReservation(storeId, input);
  }

  /**
   * Release all reservations for a cart
   */
  @UseGuards(JwtAuthGuard)
  @Post(':storeId/reservations/release-cart')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Release all cart reservations',
    description:
      'Releases all active reservations for a cart. ' +
      'Called after order completion to free up the reserved stock.',
  })
  @ApiParam({ name: 'storeId', description: 'Store ID' })
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
  async releaseCartReservations(
    @Param('storeId') storeId: string,
    @Body() body: unknown,
  ) {
    const schema = z.object({
      cartId: z.string(),
      reason: z.enum(['RELEASED', 'EXPIRED']),
    });
    const { cartId, reason } = schema.parse(body);

    const count = await this.cartValidationService.releaseCartReservations(
      storeId,
      cartId,
      reason,
    );

    return { released: count };
  }

  /**
   * Get all active reservations for a cart
   */
  @UseGuards(JwtAuthGuard)
  @Get(':storeId/reservations/:cartId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get cart reservations',
    description: 'Returns all active reservations for a cart.',
  })
  @ApiParam({ name: 'storeId', description: 'Store ID' })
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
  async getCartReservations(
    @Param('storeId') storeId: string,
    @Param('cartId') cartId: string,
  ) {
    return this.cartValidationService.getCartReservations(storeId, cartId);
  }
}
