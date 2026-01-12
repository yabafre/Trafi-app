/**
 * @trafi/validators
 *
 * Shared Zod schemas for validation across the Trafi platform.
 * All types, DTOs, and Zod schemas MUST be defined here for sharing between API and Dashboard.
 */

// Common schemas (base, pagination, money)
export * from './common';

// Domain schemas
export * from './product';
export * from './order';
export * from './customer';
export * from './store';
