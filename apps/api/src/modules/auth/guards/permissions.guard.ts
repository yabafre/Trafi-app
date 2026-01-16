import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import {
  type Permission,
  type Role,
  ROLE_PERMISSIONS,
} from '../../../common/types/permissions';
import type { AuthenticatedUser } from '@trafi/types';

/**
 * Guard to enforce permission-based access control
 *
 * Works with @RequirePermissions() decorator to check if the authenticated user
 * has the required permissions to access an endpoint.
 *
 * @example
 * ```typescript
 * @Controller('products')
 * @UseGuards(JwtAuthGuard, PermissionsGuard)
 * export class ProductsController {
 *   @RequirePermissions('products:read')
 *   @Get()
 *   findAll() { ... }
 *
 *   @RequirePermissions('products:delete')
 *   @Delete(':id')
 *   remove() { ... }
 * }
 * ```
 *
 * @see epic-02-admin-auth.md#Story-2.3
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  /**
   * Check if user has required permissions
   */
  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No permissions required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;

    if (!user) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Authentication required',
        requiredPermissions,
      });
    }

    const userRole = user.role as Role;
    const userPermissions = ROLE_PERMISSIONS[userRole] || [];

    // Check if user has ALL required permissions
    const hasAllPermissions = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Insufficient permissions',
        requiredPermissions,
      });
    }

    return true;
  }
}
