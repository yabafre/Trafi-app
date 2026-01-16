import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { Role } from '../../../common/types/permissions';
import type { AuthenticatedUser } from '@trafi/types';

/**
 * Guard to enforce role-based access control
 *
 * Works with @Roles() decorator to check if the authenticated user
 * has one of the required roles to access an endpoint.
 *
 * @example
 * ```typescript
 * @Controller('admin')
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * export class AdminController {
 *   @Roles('OWNER', 'ADMIN')
 *   @Get('settings')
 *   getSettings() { ... }
 *
 *   @Roles('OWNER')
 *   @Post('transfer-ownership')
 *   transferOwnership() { ... }
 * }
 * ```
 *
 * @see epic-02-admin-auth.md#Story-2.3
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  /**
   * Check if user has one of the required roles
   */
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No roles required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;

    if (!user) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Authentication required',
        requiredRoles,
      });
    }

    const userRole = user.role as Role;

    // Check if user has ANY of the required roles
    const hasRequiredRole = requiredRoles.includes(userRole);

    if (!hasRequiredRole) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Insufficient role privileges',
        requiredRoles,
        userRole,
      });
    }

    return true;
  }
}
