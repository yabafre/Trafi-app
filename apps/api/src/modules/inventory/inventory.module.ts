import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { InventoryService } from './inventory.service';
import { CartValidationService } from './cart-validation.service';
import { CartValidationController } from './cart-validation.controller';
import { ExpireReservationsJob } from './jobs';
import { StorefrontGuard, CartTokenGuard } from '@common/guards';

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
 * - Store resolution via headers (X-Trafi-Store-Id, X-Trafi-Publishable-Key)
 * - Cart auth via X-Trafi-Cart-Token (scaffold for Epic 4)
 *
 * Dependencies:
 * - PrismaModule (global): Database access
 * - EventEmitterModule (global): Event emission
 * - ConfigModule (global): Environment config
 * - ScheduleModule: For @Interval decorator scheduling
 *
 * @see Story 3.7 - Inventory Tracking
 * @see Story 3.8 - Oversell Prevention
 */
@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [CartValidationController],
  providers: [
    InventoryService,
    CartValidationService,
    ExpireReservationsJob,
    StorefrontGuard,
    CartTokenGuard,
  ],
  exports: [InventoryService, CartValidationService, ExpireReservationsJob],
})
export class InventoryModule {}
