import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { InventoryService } from './inventory.service';
import { CartValidationService } from './cart-validation.service';
import { ExpireReservationsJob } from './jobs';

/**
 * Inventory module for tracking stock levels, reservations, and history.
 *
 * Provides:
 * - InventoryService: Inventory adjustments, settings, and history
 * - CartValidationService: Cart validation and inventory reservations
 * - ExpireReservationsJob: Background job to expire stale reservations
 *
 * Dependencies:
 * - PrismaModule (global): Database access
 * - EventEmitterModule (global): Event emission
 * - ScheduleModule: For @Interval decorator scheduling
 *
 * @see Story 3.7 - Inventory Tracking
 * @see Story 3.8 - Oversell Prevention
 */
@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [InventoryService, CartValidationService, ExpireReservationsJob],
  exports: [InventoryService, CartValidationService, ExpireReservationsJob],
})
export class InventoryModule {}
