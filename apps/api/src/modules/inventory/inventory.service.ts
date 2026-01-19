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
  InventoryAdjustmentReason as PrismaInventoryAdjustmentReason,
} from '@generated/prisma/client';
import { PrismaService } from '@database/prisma.service';
import type {
  AdjustInventoryInput,
  SetInventoryInput,
  UpdateInventorySettingsInput,
  ListInventoryHistoryInput,
  VariantInventory,
  InventoryHistoryResponse,
  InventoryHistoryListResult,
  InventoryAdjustedEvent,
  InventoryLowStockEvent,
  InventorySettingsUpdatedEvent,
} from '@trafi/types';

/**
 * Inventory management service
 *
 * Handles inventory tracking, adjustments, and history.
 * All inventory updates use Serializable transactions for atomicity.
 *
 * IMPORTANT: Use `protected` methods (not `private`) to support
 * merchant overrides in @trafi/core distribution model (RETRO-2).
 *
 * Key behaviors:
 * - Inventory is tracked per variant (tenant-scoped via Product relation)
 * - All changes logged to InventoryHistory with audit trail
 * - Low stock alerts when quantity falls below threshold
 * - Allow oversell flag enables negative inventory for pre-orders
 * - Serializable isolation prevents race conditions
 *
 * @see Story 3.7 - Inventory Tracking
 */
@Injectable()
export class InventoryService {
  protected readonly logger = new Logger(InventoryService.name);
  protected readonly MAX_RETRIES = 5;

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly eventEmitter: EventEmitter2,
  ) {}

  // ==========================================================================
  // Inventory Adjustment Methods
  // ==========================================================================

  /**
   * Adjust inventory by a delta amount.
   * Uses Serializable transaction for atomicity.
   * Protected for @trafi/core consumers to customize.
   *
   * @param storeId - Store ID for tenant verification
   * @param input - Adjustment input (variantId, quantityChange, reason, note)
   * @param userId - Optional user ID for audit trail
   * @returns Updated variant inventory info
   */
  async adjustInventory(
    storeId: string,
    input: AdjustInventoryInput,
    userId?: string,
  ): Promise<VariantInventory> {
    return this.executeWithRetry(async () => {
      return this.prisma.$transaction(
        async (tx) => {
          // Load variant with product for tenant verification
          const variant = await tx.productVariant.findUnique({
            where: { id: input.variantId },
            select: {
              id: true,
              quantity: true,
              trackInventory: true,
              allowOversell: true,
              lowStockThreshold: true,
              product: { select: { storeId: true } },
            },
          });

          if (!variant || variant.product.storeId !== storeId) {
            throw new NotFoundException('Variant not found');
          }

          // If not tracking inventory, return current state (no-op)
          if (!variant.trackInventory) {
            return this.toVariantInventory(variant);
          }

          const newQuantity = variant.quantity + input.quantityChange;

          // Prevent negative inventory unless overselling is allowed
          if (newQuantity < 0 && !variant.allowOversell) {
            throw new BadRequestException(
              `Insufficient inventory. Current: ${variant.quantity}, Requested change: ${input.quantityChange}`,
            );
          }

          // Update variant quantity
          const updated = await tx.productVariant.update({
            where: { id: input.variantId },
            data: { quantity: newQuantity },
          });

          // Log the adjustment to history
          await tx.inventoryHistory.create({
            data: {
              variantId: input.variantId,
              quantityBefore: variant.quantity,
              quantityAfter: newQuantity,
              quantityChange: input.quantityChange,
              reason: input.reason as PrismaInventoryAdjustmentReason,
              note: input.note,
              createdById: userId,
            },
          });

          // Emit inventory adjusted event
          const adjustedEvent: InventoryAdjustedEvent = {
            variantId: input.variantId,
            storeId,
            quantityBefore: variant.quantity,
            quantityAfter: newQuantity,
            quantityChange: input.quantityChange,
            reason: input.reason,
          };
          this.eventEmitter.emit('inventory.adjusted', adjustedEvent);

          // Emit low stock event if quantity dropped to/below threshold
          if (
            newQuantity <= variant.lowStockThreshold &&
            input.quantityChange < 0
          ) {
            const lowStockEvent: InventoryLowStockEvent = {
              variantId: input.variantId,
              storeId,
              quantity: newQuantity,
              threshold: variant.lowStockThreshold,
            };
            this.eventEmitter.emit('inventory.low_stock', lowStockEvent);
          }

          return this.toVariantInventory({
            ...variant,
            quantity: updated.quantity,
          });
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
   * Set inventory to an absolute value.
   * Uses Serializable transaction to calculate delta atomically.
   *
   * @param storeId - Store ID for tenant verification
   * @param input - Set input (variantId, quantity, reason, note)
   * @param userId - Optional user ID for audit trail
   * @returns Updated variant inventory info
   */
  async setInventory(
    storeId: string,
    input: SetInventoryInput,
    userId?: string,
  ): Promise<VariantInventory> {
    return this.executeWithRetry(async () => {
      return this.prisma.$transaction(
        async (tx) => {
          // Load variant with product for tenant verification
          const variant = await tx.productVariant.findUnique({
            where: { id: input.variantId },
            select: {
              id: true,
              quantity: true,
              trackInventory: true,
              allowOversell: true,
              lowStockThreshold: true,
              product: { select: { storeId: true } },
            },
          });

          if (!variant || variant.product.storeId !== storeId) {
            throw new NotFoundException('Variant not found');
          }

          const quantityChange = input.quantity - variant.quantity;

          // If no change, return current state
          if (quantityChange === 0) {
            return this.toVariantInventory(variant);
          }

          // If not tracking inventory, return current state (no-op)
          if (!variant.trackInventory) {
            return this.toVariantInventory(variant);
          }

          // Update variant quantity
          const updated = await tx.productVariant.update({
            where: { id: input.variantId },
            data: { quantity: input.quantity },
          });

          // Log the adjustment to history
          const reason = input.reason || 'MANUAL_ADJUSTMENT';
          await tx.inventoryHistory.create({
            data: {
              variantId: input.variantId,
              quantityBefore: variant.quantity,
              quantityAfter: input.quantity,
              quantityChange,
              reason: reason as PrismaInventoryAdjustmentReason,
              note: input.note,
              createdById: userId,
            },
          });

          // Emit inventory adjusted event
          const adjustedEvent: InventoryAdjustedEvent = {
            variantId: input.variantId,
            storeId,
            quantityBefore: variant.quantity,
            quantityAfter: input.quantity,
            quantityChange,
            reason,
          };
          this.eventEmitter.emit('inventory.adjusted', adjustedEvent);

          // Emit low stock event if quantity dropped to/below threshold
          if (
            input.quantity <= variant.lowStockThreshold &&
            quantityChange < 0
          ) {
            const lowStockEvent: InventoryLowStockEvent = {
              variantId: input.variantId,
              storeId,
              quantity: input.quantity,
              threshold: variant.lowStockThreshold,
            };
            this.eventEmitter.emit('inventory.low_stock', lowStockEvent);
          }

          return this.toVariantInventory({
            ...variant,
            quantity: updated.quantity,
          });
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5000,
          timeout: 10000,
        },
      );
    });
  }

  // ==========================================================================
  // Settings Methods
  // ==========================================================================

  /**
   * Update inventory settings for a variant.
   *
   * @param storeId - Store ID for tenant verification
   * @param input - Settings update (trackInventory, lowStockThreshold, allowOversell)
   * @returns Updated variant inventory info
   */
  async updateSettings(
    storeId: string,
    input: UpdateInventorySettingsInput,
  ): Promise<VariantInventory> {
    // Verify tenant via product
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: input.variantId },
      select: {
        id: true,
        quantity: true,
        trackInventory: true,
        lowStockThreshold: true,
        allowOversell: true,
        product: { select: { storeId: true } },
      },
    });

    if (!variant || variant.product.storeId !== storeId) {
      throw new NotFoundException('Variant not found');
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (input.trackInventory !== undefined)
      updateData.trackInventory = input.trackInventory;
    if (input.lowStockThreshold !== undefined)
      updateData.lowStockThreshold = input.lowStockThreshold;
    if (input.allowOversell !== undefined)
      updateData.allowOversell = input.allowOversell;

    // Update variant
    const updated = await this.prisma.productVariant.update({
      where: { id: input.variantId },
      data: updateData,
    });

    // Emit settings updated event
    const settingsEvent: InventorySettingsUpdatedEvent = {
      variantId: input.variantId,
      storeId,
      trackInventory: input.trackInventory,
      lowStockThreshold: input.lowStockThreshold,
      allowOversell: input.allowOversell,
    };
    this.eventEmitter.emit('inventory.settings_updated', settingsEvent);

    this.logger.log(
      `Inventory settings updated for variant ${input.variantId}`,
    );

    return this.toVariantInventory({
      ...variant,
      quantity: updated.quantity,
      trackInventory: updated.trackInventory,
      lowStockThreshold: updated.lowStockThreshold,
      allowOversell: updated.allowOversell,
    });
  }

  // ==========================================================================
  // Query Methods
  // ==========================================================================

  /**
   * Get inventory info for a variant.
   *
   * @param storeId - Store ID for tenant verification
   * @param variantId - Variant ID
   * @returns Variant inventory info
   */
  async getVariantInventory(
    storeId: string,
    variantId: string,
  ): Promise<VariantInventory> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      select: {
        id: true,
        quantity: true,
        trackInventory: true,
        lowStockThreshold: true,
        allowOversell: true,
        product: { select: { storeId: true } },
      },
    });

    if (!variant || variant.product.storeId !== storeId) {
      throw new NotFoundException('Variant not found');
    }

    return this.toVariantInventory(variant);
  }

  /**
   * Get paginated inventory history for a variant.
   *
   * @param storeId - Store ID for tenant verification
   * @param input - List input (variantId, page, limit)
   * @returns Paginated inventory history
   */
  async getHistory(
    storeId: string,
    input: ListInventoryHistoryInput,
  ): Promise<InventoryHistoryListResult> {
    // Verify tenant via product
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: input.variantId },
      select: {
        product: { select: { storeId: true } },
      },
    });

    if (!variant || variant.product.storeId !== storeId) {
      throw new NotFoundException('Variant not found');
    }

    const skip = (input.page - 1) * input.limit;

    // Get history with user names
    const [items, total] = await Promise.all([
      this.prisma.inventoryHistory.findMany({
        where: { variantId: input.variantId },
        include: {
          createdBy: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: input.limit,
      }),
      this.prisma.inventoryHistory.count({
        where: { variantId: input.variantId },
      }),
    ]);

    const historyItems: InventoryHistoryResponse[] = items.map((item) => ({
      id: item.id,
      variantId: item.variantId,
      quantityBefore: item.quantityBefore,
      quantityAfter: item.quantityAfter,
      quantityChange: item.quantityChange,
      reason: item.reason,
      note: item.note,
      createdById: item.createdById,
      createdByName: item.createdBy?.name ?? null,
      createdAt: item.createdAt,
    }));

    return {
      items: historyItems,
      total,
      page: input.page,
      limit: input.limit,
      hasMore: skip + items.length < total,
    };
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
   * Convert variant data to VariantInventory response.
   * Protected for @trafi/core customization.
   */
  protected toVariantInventory(variant: {
    id: string;
    quantity: number;
    trackInventory: boolean;
    lowStockThreshold: number;
    allowOversell: boolean;
  }): VariantInventory {
    // Out of stock when quantity is zero or negative (even if oversell enabled)
    const isOutOfStock = variant.trackInventory && variant.quantity <= 0;
    // Low stock when at or below threshold, but still has positive stock
    const isLowStock =
      variant.trackInventory &&
      variant.quantity <= variant.lowStockThreshold &&
      variant.quantity > 0;

    return {
      variantId: variant.id,
      quantity: variant.quantity,
      trackInventory: variant.trackInventory,
      lowStockThreshold: variant.lowStockThreshold,
      allowOversell: variant.allowOversell,
      isLowStock,
      isOutOfStock,
    };
  }
}
