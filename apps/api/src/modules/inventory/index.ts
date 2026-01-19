/**
 * Inventory Module Exports
 * @see Story 3.7 - Inventory Tracking
 * @see Story 3.8 - Oversell Prevention
 */
export { InventoryModule } from './inventory.module';
export { InventoryService } from './inventory.service';
export { CartValidationService } from './cart-validation.service';
export { ExpireReservationsJob } from './jobs';
export type {
  InventoryReservedEvent,
  InventoryReservationReleasedEvent,
} from './cart-validation.service';
export type { ReservationExpiredEvent } from './jobs';
