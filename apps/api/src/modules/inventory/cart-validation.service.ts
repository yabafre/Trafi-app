import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  Prisma,
  ReservationStatus as PrismaReservationStatus,
} from '@generated/prisma/client';
import { PrismaService } from '@database/prisma.service';
import type {
  CheckAvailabilityInput,
  CheckAvailabilityResult,
  ValidateCartItem,
  CartValidationResult,
  CartAdjustment,
  CreateReservationInput,
  InventoryReservation,
  ReleaseReservationInput,
  GetAvailableStockResult,
} from '@trafi/validators';

/**
 * Event payload for inventory.reserved
 */
export interface InventoryReservedEvent {
  reservationId: string;
  storeId: string;
  cartId: string;
  variantId: string;
  quantity: number;
}

/**
 * Event payload for inventory.reservation.released
 */
export interface InventoryReservationReleasedEvent {
  reservationId: string;
  storeId: string;
  cartId: string;
  variantId: string;
  quantity: number;
  reason: 'RELEASED' | 'EXPIRED';
}

/**
 * Cart validation and inventory reservation service
 *
 * Handles availability checks, cart validation, and inventory reservations
 * to prevent overselling during checkout.
 *
 * IMPORTANT: Use `protected` methods (not `private`) to support
 * merchant overrides in @trafi/core distribution model (RETRO-2).
 *
 * Key behaviors:
 * - Available stock is COMPUTED (quantity - active reservations), not stored
 * - Reservations use Serializable transactions with P2034 retry logic
 * - Reservations expire after configurable time (default 15 minutes)
 * - Events emitted for all reservation lifecycle changes
 *
 * @see Story 3.8 - Oversell Prevention
 */
@Injectable()
export class CartValidationService {
  protected readonly logger = new Logger(CartValidationService.name);
  protected readonly MAX_RETRIES = 5;
  protected readonly DEFAULT_RESERVATION_MINUTES = 15;

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly eventEmitter: EventEmitter2,
  ) {}

  // ==========================================================================
  // Availability Check Methods
  // ==========================================================================

  /**
   * Get available stock for a variant.
   * Available = physical quantity - active reservations.
   * Protected for @trafi/core consumers to customize.
   *
   * @param storeId - Store ID for tenant verification
   * @param variantId - Variant ID to check
   * @returns Available stock details
   */
  async getAvailableStock(
    storeId: string,
    variantId: string,
  ): Promise<GetAvailableStockResult> {
    // Load variant with product for tenant verification
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, product: { storeId } },
      select: {
        id: true,
        quantity: true,
        trackInventory: true,
        allowOversell: true,
      },
    });

    if (!variant) {
      throw new NotFoundException('Variant not found');
    }

    // If not tracking inventory, return unlimited
    if (!variant.trackInventory) {
      return {
        variantId,
        physicalQuantity: variant.quantity,
        reservedQuantity: 0,
        availableQuantity: Number.MAX_SAFE_INTEGER,
        trackInventory: false,
        allowOversell: variant.allowOversell,
      };
    }

    // Calculate reserved quantity from active reservations
    const reserved = await this.prisma.inventoryReservation.aggregate({
      where: { variantId, status: 'ACTIVE' },
      _sum: { quantity: true },
    });

    const reservedQuantity = reserved._sum.quantity ?? 0;
    const availableQuantity = Math.max(0, variant.quantity - reservedQuantity);

    return {
      variantId,
      physicalQuantity: variant.quantity,
      reservedQuantity,
      availableQuantity,
      trackInventory: true,
      allowOversell: variant.allowOversell,
    };
  }

  /**
   * Check if a variant has sufficient stock for a requested quantity.
   * Protected for @trafi/core consumers to customize.
   *
   * @param storeId - Store ID for tenant verification
   * @param input - Check availability input (variantId, requestedQuantity)
   * @returns Availability result
   */
  async checkAvailability(
    storeId: string,
    input: CheckAvailabilityInput,
  ): Promise<CheckAvailabilityResult> {
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: input.variantId, product: { storeId } },
      select: {
        id: true,
        quantity: true,
        trackInventory: true,
        allowOversell: true,
      },
    });

    if (!variant) {
      return {
        available: false,
        availableQuantity: 0,
        allowOversell: false,
        trackInventory: false,
      };
    }

    // Not tracking inventory = always available
    if (!variant.trackInventory) {
      return {
        available: true,
        availableQuantity: input.requestedQuantity,
        allowOversell: true,
        trackInventory: false,
      };
    }

    // Allow oversell bypasses stock check
    if (variant.allowOversell) {
      return {
        available: true,
        availableQuantity: input.requestedQuantity,
        allowOversell: true,
        trackInventory: true,
      };
    }

    // Calculate available stock
    const stockInfo = await this.getAvailableStock(storeId, input.variantId);

    return {
      available: stockInfo.availableQuantity >= input.requestedQuantity,
      availableQuantity: stockInfo.availableQuantity,
      allowOversell: false,
      trackInventory: true,
    };
  }

  // ==========================================================================
  // Cart Validation Methods
  // ==========================================================================

  /**
   * Validate multiple cart items and return adjustments needed.
   * Protected for @trafi/core consumers to customize.
   *
   * @param storeId - Store ID for tenant verification
   * @param items - Array of cart items to validate
   * @returns Validation result with adjustments and out-of-stock items
   */
  async validateCartItems(
    storeId: string,
    items: ValidateCartItem[],
  ): Promise<CartValidationResult> {
    const adjustments: CartAdjustment[] = [];
    const outOfStockItems: string[] = [];

    for (const item of items) {
      const availability = await this.checkAvailability(storeId, {
        variantId: item.variantId,
        requestedQuantity: item.quantity,
      });

      if (!availability.available) {
        if (availability.availableQuantity === 0) {
          // Completely out of stock
          outOfStockItems.push(item.variantId);
          adjustments.push({
            variantId: item.variantId,
            requestedQuantity: item.quantity,
            availableQuantity: 0,
            adjusted: true,
            message: 'Item is out of stock',
          });
        } else {
          // Partial availability - adjust quantity
          adjustments.push({
            variantId: item.variantId,
            requestedQuantity: item.quantity,
            availableQuantity: availability.availableQuantity,
            adjusted: true,
            message: `Quantity adjusted from ${item.quantity} to ${availability.availableQuantity}`,
          });
        }
      } else {
        // Available as requested
        adjustments.push({
          variantId: item.variantId,
          requestedQuantity: item.quantity,
          availableQuantity: availability.availableQuantity,
          adjusted: false,
        });
      }
    }

    const hasAdjustments = adjustments.some((a) => a.adjusted);

    return {
      valid: !hasAdjustments,
      adjustments,
      outOfStockItems,
    };
  }

  // ==========================================================================
  // Reservation Methods
  // ==========================================================================

  /**
   * Create or update an inventory reservation for a cart item.
   * Uses Serializable transaction with P2034 retry logic.
   * Protected for @trafi/core consumers to customize.
   *
   * @param input - Create reservation input
   * @returns Created or updated reservation
   */
  async createReservation(
    input: CreateReservationInput,
  ): Promise<InventoryReservation> {
    const expiresInMinutes =
      input.expiresInMinutes ?? this.DEFAULT_RESERVATION_MINUTES;

    return this.executeWithRetry(async () => {
      return this.prisma.$transaction(
        async (tx) => {
          // Check if reservation already exists for this cart+variant
          const existing = await tx.inventoryReservation.findUnique({
            where: {
              cartId_variantId: {
                cartId: input.cartId,
                variantId: input.variantId,
              },
            },
          });

          if (existing && existing.status === 'ACTIVE') {
            // Update existing reservation
            const updated = await tx.inventoryReservation.update({
              where: { id: existing.id },
              data: {
                quantity: input.quantity,
                expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000),
              },
            });

            this.logger.log(
              `Updated reservation ${updated.id} for cart ${input.cartId}`,
            );

            return this.toInventoryReservation(updated);
          }

          // Verify stock available (check inside transaction for consistency)
          const variant = await tx.productVariant.findFirst({
            where: { id: input.variantId, product: { storeId: input.storeId } },
            select: {
              quantity: true,
              trackInventory: true,
              allowOversell: true,
            },
          });

          if (!variant) {
            throw new NotFoundException('Variant not found');
          }

          // Check availability if tracking inventory and not allowing oversell
          if (variant.trackInventory && !variant.allowOversell) {
            const reserved = await tx.inventoryReservation.aggregate({
              where: { variantId: input.variantId, status: 'ACTIVE' },
              _sum: { quantity: true },
            });

            const reservedQuantity = reserved._sum.quantity ?? 0;
            const availableQuantity = variant.quantity - reservedQuantity;

            if (availableQuantity < input.quantity) {
              throw new BadRequestException(
                `Insufficient stock for variant ${input.variantId}. Available: ${availableQuantity}`,
              );
            }
          }

          // Create new reservation
          const reservation = await tx.inventoryReservation.create({
            data: {
              storeId: input.storeId,
              cartId: input.cartId,
              variantId: input.variantId,
              quantity: input.quantity,
              status: 'ACTIVE',
              expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000),
            },
          });

          // Emit inventory.reserved event
          const reservedEvent: InventoryReservedEvent = {
            reservationId: reservation.id,
            storeId: input.storeId,
            cartId: input.cartId,
            variantId: input.variantId,
            quantity: input.quantity,
          };
          this.eventEmitter.emit('inventory.reserved', reservedEvent);

          this.logger.log(
            `Created reservation ${reservation.id} for cart ${input.cartId}`,
          );

          return this.toInventoryReservation(reservation);
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5000,
          timeout: 10000,
        },
      );
    });
  }

  /**
   * Release a specific reservation (mark as RELEASED or EXPIRED).
   * Protected for @trafi/core consumers to customize.
   *
   * @param storeId - Store ID for tenant verification
   * @param input - Release reservation input
   * @returns Released reservation
   */
  async releaseReservation(
    storeId: string,
    input: ReleaseReservationInput,
  ): Promise<InventoryReservation> {
    const reservation = await this.prisma.inventoryReservation.findFirst({
      where: {
        cartId: input.cartId,
        variantId: input.variantId,
        storeId,
        status: 'ACTIVE',
      },
    });

    if (!reservation) {
      throw new NotFoundException('Active reservation not found');
    }

    const updated = await this.prisma.inventoryReservation.update({
      where: { id: reservation.id },
      data: {
        status: input.reason as PrismaReservationStatus,
        releasedAt: new Date(),
      },
    });

    // Emit inventory.reservation.released event
    const releasedEvent: InventoryReservationReleasedEvent = {
      reservationId: updated.id,
      storeId,
      cartId: input.cartId,
      variantId: input.variantId,
      quantity: updated.quantity,
      reason: input.reason,
    };
    this.eventEmitter.emit('inventory.reservation.released', releasedEvent);

    this.logger.log(
      `Released reservation ${updated.id} with reason ${input.reason}`,
    );

    return this.toInventoryReservation(updated);
  }

  /**
   * Release all active reservations for a cart.
   * Protected for @trafi/core consumers to customize.
   *
   * @param storeId - Store ID for tenant verification
   * @param cartId - Cart ID
   * @param reason - Release reason (RELEASED or EXPIRED)
   * @returns Number of reservations released
   */
  async releaseCartReservations(
    storeId: string,
    cartId: string,
    reason: 'RELEASED' | 'EXPIRED',
  ): Promise<number> {
    // Get all active reservations for this cart
    const reservations = await this.prisma.inventoryReservation.findMany({
      where: { storeId, cartId, status: 'ACTIVE' },
    });

    if (reservations.length === 0) {
      return 0;
    }

    // Update all to released/expired
    const result = await this.prisma.inventoryReservation.updateMany({
      where: { storeId, cartId, status: 'ACTIVE' },
      data: {
        status: reason as PrismaReservationStatus,
        releasedAt: new Date(),
      },
    });

    // Emit events for each released reservation
    for (const reservation of reservations) {
      const releasedEvent: InventoryReservationReleasedEvent = {
        reservationId: reservation.id,
        storeId,
        cartId,
        variantId: reservation.variantId,
        quantity: reservation.quantity,
        reason,
      };
      this.eventEmitter.emit('inventory.reservation.released', releasedEvent);
    }

    this.logger.log(
      `Released ${result.count} reservations for cart ${cartId} with reason ${reason}`,
    );

    return result.count;
  }

  /**
   * Get all active reservations for a cart.
   * Protected for @trafi/core consumers to customize.
   *
   * @param storeId - Store ID for tenant verification
   * @param cartId - Cart ID
   * @returns Array of active reservations
   */
  async getCartReservations(
    storeId: string,
    cartId: string,
  ): Promise<InventoryReservation[]> {
    const reservations = await this.prisma.inventoryReservation.findMany({
      where: { storeId, cartId, status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' },
    });

    return reservations.map((r) => this.toInventoryReservation(r));
  }

  // ==========================================================================
  // Internal Helper Methods
  // ==========================================================================

  /**
   * Execute a function with retry logic for transaction conflicts (P2034).
   * Protected for merchant override.
   */
  protected async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let retries = 0;

    while (retries < this.MAX_RETRIES) {
      try {
        return await fn();
      } catch (error: unknown) {
        const prismaError = error as { code?: string };
        if (prismaError.code === 'P2034') {
          retries++;
          this.logger.warn(
            `Transaction conflict, retry ${retries}/${this.MAX_RETRIES}`,
          );
          // Add small delay before retry with exponential backoff
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, retries) * 100),
          );
          continue;
        }
        throw error;
      }
    }

    throw new ConflictException(
      'Transaction conflict after maximum retries. Please try again.',
    );
  }

  /**
   * Convert Prisma InventoryReservation to response type.
   * Protected for @trafi/core customization.
   */
  protected toInventoryReservation(reservation: {
    id: string;
    storeId: string;
    cartId: string;
    variantId: string;
    quantity: number;
    status: PrismaReservationStatus;
    expiresAt: Date;
    createdAt: Date;
    releasedAt: Date | null;
  }): InventoryReservation {
    return {
      id: reservation.id,
      storeId: reservation.storeId,
      cartId: reservation.cartId,
      variantId: reservation.variantId,
      quantity: reservation.quantity,
      status: reservation.status,
      expiresAt: reservation.expiresAt.toISOString(),
      createdAt: reservation.createdAt.toISOString(),
      releasedAt: reservation.releasedAt?.toISOString() ?? null,
    };
  }
}
