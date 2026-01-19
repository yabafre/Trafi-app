import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { InventoryService } from './inventory.service';
import { CartValidationService } from './cart-validation.service';
import { CartValidationController } from './cart-validation.controller';
import { ExpireReservationsJob } from './jobs';

/**
 * Inventory module for tracking stock levels, reservations, and history.
 *
 * Provides:
 * - InventoryService: Inventory adjustments, settings, and history (tRPC for dashboard)
 * - CartValidationService: Cart validation and inventory reservations
 * - CartValidationController: REST endpoints for storefront (SDK/REST consumers)
 * - ExpireReservationsJob: Background job to expire stale reservations
 *
 * Architecture Note:
 * - Dashboard uses tRPC (InventoryService via inventory.router.ts)
 * - Storefront uses REST (CartValidationController)
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
  controllers: [CartValidationController],
  providers: [InventoryService, CartValidationService, ExpireReservationsJob],
  exports: [InventoryService, CartValidationService, ExpireReservationsJob],
})
export class InventoryModule {}
