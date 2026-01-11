/**
 * @trafi/types
 *
 * Shared TypeScript types for the Trafi platform.
 * Types are inferred from Zod schemas in @trafi/validators where possible.
 */

export * from './api.types';
export * from './events.types';

// Re-export inferred types from validators
export type { Pagination, Money, Currency, Price } from '@trafi/validators';
