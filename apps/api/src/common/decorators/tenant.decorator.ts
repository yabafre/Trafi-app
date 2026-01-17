/**
 * Tenant Decorator
 *
 * Parameter decorator to inject tenant context from AsyncLocalStorage
 * into controller method parameters.
 *
 * Usage examples:
 * - @Tenant() ctx: TenantContextData - Get full context
 * - @Tenant('storeId') storeId: string - Get just storeId
 * - @Tenant('requestId') requestId: string - Get just requestId
 *
 * @see Story 2.6 - Tenant-Scoped Authorization (AC#6)
 */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { getTenantContext, type TenantContextData } from '../context/tenant.context';

/**
 * Inject tenant context from AsyncLocalStorage
 *
 * Can be used to get the full context or a specific field:
 * - @Tenant() - Returns full TenantContextData or undefined
 * - @Tenant('storeId') - Returns just the storeId string
 * - @Tenant('userId') - Returns just the userId string
 * - @Tenant('role') - Returns just the role string
 * - @Tenant('requestId') - Returns just the requestId string
 */
export const Tenant = createParamDecorator(
  (data: keyof TenantContextData | undefined, _ctx: ExecutionContext) => {
    const tenantCtx = getTenantContext();

    // Return undefined if no context (unauthenticated request)
    if (!tenantCtx) {
      return undefined;
    }

    // If a specific field was requested, return just that field
    if (data) {
      return tenantCtx[data];
    }

    // Otherwise return the full context
    return tenantCtx;
  },
);
