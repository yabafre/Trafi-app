/**
 * @trafi/types
 *
 * Shared TypeScript types for the Trafi platform.
 * Types are inferred from Zod schemas in @trafi/validators where possible.
 */

// API and event types
export * from './api.types';
export * from './events.types';

// Domain types (re-exported from validators)
export * from './product.types';
export * from './order.types';
export * from './customer.types';
export * from './store.types';
export * from './auth.types';

// Common types from validators
export type {
  // Base types
  Id,
  Timestamps,
  TenantScoped,
  BaseEntity,
  Slug,
  Email,
  Status,
  // Pagination
  Pagination,
  // Money
  Money,
  Currency,
  Price,
} from '@trafi/validators';
