import { SetMetadata } from '@nestjs/common';
import type { Permission } from '../../../common/types/permissions';

/**
 * Metadata key for permissions decorator
 */
export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to require specific permissions for an endpoint
 *
 * Used with PermissionsGuard to enforce permission-based access control.
 *
 * @example
 * ```typescript
 * @RequirePermissions('products:read')
 * @Get()
 * findAll() { ... }
 *
 * @RequirePermissions('products:create', 'products:update')
 * @Post()
 * create() { ... }
 * ```
 *
 * @param permissions - One or more permissions required to access the endpoint
 */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
