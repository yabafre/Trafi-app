/**
 * Inventory Module Exports
 * @see Story 3.7 - Inventory Tracking
 * @see Story 3.8 - Oversell Prevention
 *
 * Architecture Note:
 * - InventoryService: Used by dashboard via tRPC (inventory.router.ts)
 * - CartValidationService: Used by storefront via REST (CartValidationController)
 * - CartValidationController: REST endpoints at /storefront/:storeId/*
 */
export { InventoryModule } from './inventory.module';
export { InventoryService } from './inventory.service';
export { CartValidationService } from './cart-validation.service';
export { CartValidationController } from './cart-validation.controller';
export { ExpireReservationsJob } from './jobs';
export type {
  InventoryReservedEvent,
  InventoryReservationReleasedEvent,
} from './cart-validation.service';
export type { ReservationExpiredEvent } from './jobs';
