import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';

/**
 * Inventory module for tracking stock levels and history.
 *
 * Provides:
 * - InventoryService: Inventory adjustments, settings, and history
 *
 * Dependencies:
 * - PrismaModule (global): Database access
 * - EventEmitterModule (global): Event emission
 *
 * @see Story 3.7 - Inventory Tracking
 */
@Module({
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
