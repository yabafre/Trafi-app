import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

/**
 * Counter types supported by StoreCounter
 * Used for generating sequential identifiers per store
 */
export type CounterKey = 'order' | 'invoice' | 'return' | 'purchase_order';

/**
 * StoreCounterService - Atomic sequential counter management
 *
 * Provides atomic increment operations for generating sequential identifiers
 * like order numbers, invoice numbers, etc. Uses database-level atomic
 * updates to prevent duplicate numbers under concurrent load.
 *
 * Per Principle #5: Sequential identifiers MUST use atomic counters.
 *
 * Usage:
 * ```typescript
 * const orderNumber = await storeCounterService.getNextOrderNumber(storeId, 2026);
 * // Returns: "ORD-2026-000001"
 * ```
 *
 * @see Story M-1 - V3 Architectural Retroactive Fixes (AC4)
 */
@Injectable()
export class StoreCounterService {
  private readonly logger = new Logger(StoreCounterService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Atomically increment a counter and return the new value.
   *
   * Uses Prisma's atomic update to ensure no duplicates under concurrent load.
   * Creates the counter with value 1 if it doesn't exist (upsert).
   *
   * @param storeId - Store ID for tenant isolation
   * @param key - Counter type (order, invoice, return, purchase_order)
   * @returns New counter value after increment
   */
  async increment(storeId: string, key: CounterKey): Promise<bigint> {
    // Use upsert to handle both new and existing counters atomically
    const result = await this.prisma.$client.storeCounter.upsert({
      where: {
        storeId_key: { storeId, key },
      },
      create: {
        storeId,
        key,
        value: BigInt(1), // First value is 1
      },
      update: {
        value: { increment: 1 },
      },
    });

    this.logger.debug(`Counter ${key} for store ${storeId}: ${result.value}`);
    return result.value;
  }

  /**
   * Get current counter value without incrementing.
   *
   * @param storeId - Store ID for tenant isolation
   * @param key - Counter type
   * @returns Current counter value, or 0 if counter doesn't exist
   */
  async getCurrentValue(storeId: string, key: CounterKey): Promise<bigint> {
    const counter = await this.prisma.$client.storeCounter.findUnique({
      where: {
        storeId_key: { storeId, key },
      },
    });

    return counter?.value ?? BigInt(0);
  }

  /**
   * Generate the next order number with standard format.
   *
   * Format: ORD-{year}-{6-digit-sequence}
   * Example: ORD-2026-000001
   *
   * @param storeId - Store ID for tenant isolation
   * @param year - Year for the order number (optional, defaults to current year)
   * @returns Formatted order number string
   */
  async getNextOrderNumber(storeId: string, year?: number): Promise<string> {
    const orderYear = year ?? new Date().getFullYear();
    const sequence = await this.increment(storeId, 'order');
    return `ORD-${orderYear}-${String(sequence).padStart(6, '0')}`;
  }

  /**
   * Generate the next invoice number with standard format.
   *
   * Format: INV-{year}-{6-digit-sequence}
   * Example: INV-2026-000001
   *
   * @param storeId - Store ID for tenant isolation
   * @param year - Year for the invoice number (optional, defaults to current year)
   * @returns Formatted invoice number string
   */
  async getNextInvoiceNumber(storeId: string, year?: number): Promise<string> {
    const invoiceYear = year ?? new Date().getFullYear();
    const sequence = await this.increment(storeId, 'invoice');
    return `INV-${invoiceYear}-${String(sequence).padStart(6, '0')}`;
  }

  /**
   * Generate the next return number with standard format.
   *
   * Format: RET-{year}-{6-digit-sequence}
   * Example: RET-2026-000001
   *
   * @param storeId - Store ID for tenant isolation
   * @param year - Year for the return number (optional, defaults to current year)
   * @returns Formatted return number string
   */
  async getNextReturnNumber(storeId: string, year?: number): Promise<string> {
    const returnYear = year ?? new Date().getFullYear();
    const sequence = await this.increment(storeId, 'return');
    return `RET-${returnYear}-${String(sequence).padStart(6, '0')}`;
  }

  /**
   * Generate the next purchase order number with standard format.
   *
   * Format: PO-{year}-{6-digit-sequence}
   * Example: PO-2026-000001
   *
   * @param storeId - Store ID for tenant isolation
   * @param year - Year for the PO number (optional, defaults to current year)
   * @returns Formatted purchase order number string
   */
  async getNextPurchaseOrderNumber(storeId: string, year?: number): Promise<string> {
    const poYear = year ?? new Date().getFullYear();
    const sequence = await this.increment(storeId, 'purchase_order');
    return `PO-${poYear}-${String(sequence).padStart(6, '0')}`;
  }

  /**
   * Reset a counter to a specific value.
   *
   * WARNING: Use with caution. This can cause duplicate numbers if not used properly.
   * Typically used for testing or migration scenarios only.
   *
   * @param storeId - Store ID for tenant isolation
   * @param key - Counter type
   * @param value - New counter value
   */
  async reset(storeId: string, key: CounterKey, value: bigint = BigInt(0)): Promise<void> {
    await this.prisma.$client.storeCounter.upsert({
      where: {
        storeId_key: { storeId, key },
      },
      create: {
        storeId,
        key,
        value,
      },
      update: {
        value,
      },
    });

    this.logger.warn(`Counter ${key} for store ${storeId} reset to ${value}`);
  }
}
