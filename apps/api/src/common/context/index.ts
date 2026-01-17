/**
 * Common Context Module - Public API
 *
 * Exports tenant context utilities for use across the application.
 * RETRO-3: Explicit public API for @trafi/core extensibility.
 */
export {
  tenantContext,
  getTenantContext,
  requireTenantContext,
  generateRequestId,
} from './tenant.context';

export type { TenantContextData } from './tenant.context';
