import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from '../permissions.guard';
import type { Permission } from '../../../../common/types/permissions';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  const createMockContext = (user?: {
    role: string;
    permissions?: string[];
  }): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
        }),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  };

  describe('canActivate', () => {
    it('should allow access when no permissions are required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const context = createMockContext({ role: 'VIEWER' });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow access when required permissions is empty array', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);

      const context = createMockContext({ role: 'VIEWER' });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow access when OWNER requests any permission', () => {
      const requiredPermissions: Permission[] = ['ownership:transfer'];
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(requiredPermissions);

      const context = createMockContext({ role: 'OWNER' });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow access when ADMIN has required permission', () => {
      const requiredPermissions: Permission[] = ['products:read'];
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(requiredPermissions);

      const context = createMockContext({ role: 'ADMIN' });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow access when VIEWER has products:read permission', () => {
      const requiredPermissions: Permission[] = ['products:read'];
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(requiredPermissions);

      const context = createMockContext({ role: 'VIEWER' });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should throw ForbiddenException when VIEWER tries products:delete', () => {
      const requiredPermissions: Permission[] = ['products:delete'];
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(requiredPermissions);

      const context = createMockContext({ role: 'VIEWER' });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);

      try {
        guard.canActivate(context);
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect((error as ForbiddenException).getResponse()).toMatchObject({
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
          requiredPermissions: ['products:delete'],
        });
      }
    });

    it('should throw ForbiddenException when EDITOR tries users:manage', () => {
      const requiredPermissions: Permission[] = ['users:manage'];
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(requiredPermissions);

      const context = createMockContext({ role: 'EDITOR' });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when no user is authenticated', () => {
      const requiredPermissions: Permission[] = ['products:read'];
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(requiredPermissions);

      const context = createMockContext(undefined);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);

      try {
        guard.canActivate(context);
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect((error as ForbiddenException).getResponse()).toMatchObject({
          code: 'FORBIDDEN',
          message: 'Authentication required',
        });
      }
    });

    it('should require ALL permissions when multiple are specified', () => {
      const requiredPermissions: Permission[] = [
        'products:read',
        'products:delete',
      ];
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(requiredPermissions);

      // ADMIN has both permissions
      const adminContext = createMockContext({ role: 'ADMIN' });
      expect(guard.canActivate(adminContext)).toBe(true);

      // VIEWER has products:read but not products:delete
      const viewerContext = createMockContext({ role: 'VIEWER' });
      expect(() => guard.canActivate(viewerContext)).toThrow(ForbiddenException);
    });
  });
});
