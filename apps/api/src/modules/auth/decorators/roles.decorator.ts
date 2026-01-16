import { SetMetadata } from '@nestjs/common';
import type { Role } from '../../../common/types/permissions';

/**
 * Metadata key for roles decorator
 */
export const ROLES_KEY = 'roles';

/**
 * Decorator to require specific roles for an endpoint
 *
 * Used with RolesGuard to enforce role-based access control.
 * User must have one of the specified roles to access the endpoint.
 *
 * @example
 * ```typescript
 * @Roles('OWNER', 'ADMIN')
 * @Get('admin-only')
 * adminOnly() { ... }
 *
 * @Roles('OWNER')
 * @Post('transfer-ownership')
 * transferOwnership() { ... }
 * ```
 *
 * @param roles - One or more roles that can access the endpoint
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
