/**
 * Tenant Context with AsyncLocalStorage
 *
 * Provides request-scoped tenant context that is available anywhere
 * in the request lifecycle without explicit parameter passing.
 *
 * Uses Node.js AsyncLocalStorage for thread-safe context propagation.
 *
 * @see Story 2.6 - Tenant-Scoped Authorization
 */
import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';

/**
 * Tenant context data available throughout a request
 */
export interface TenantContextData {
  /** The tenant/store ID from JWT */
  storeId: string;
  /** The authenticated user ID */
  userId: string;
  /** User's role in the tenant */
  role: string;
  /** Unique request ID for tracing */
  requestId: string;
}

/**
 * AsyncLocalStorage instance for tenant context
 * Provides request-scoped context without explicit parameter passing
 */
export const tenantContext = new AsyncLocalStorage<TenantContextData>();

/**
 * Get current tenant context if available
 * Returns undefined for unauthenticated requests or system operations
 */
export function getTenantContext(): TenantContextData | undefined {
  return tenantContext.getStore();
}

/**
 * Get current tenant context, throwing if not available
 * Use this in code paths that require authentication
 *
 * @throws Error if called outside of authenticated request context
 */
export function requireTenantContext(): TenantContextData {
  const ctx = tenantContext.getStore();
  if (!ctx) {
    throw new Error('Tenant context not available - ensure request is authenticated');
  }
  return ctx;
}

/**
 * Generate a unique request ID for tracing
 * Uses Node.js crypto.randomUUID() for cryptographically random IDs
 */
export function generateRequestId(): string {
  return randomUUID();
}
