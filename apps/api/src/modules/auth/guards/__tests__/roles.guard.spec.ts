import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../roles.guard';
import type { Role } from '../../../../common/types/permissions';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockContext = (user?: { role: string }): ExecutionContext => {
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
    it('should allow access when no roles are required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const context = createMockContext({ role: 'VIEWER' });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow access when required roles is empty array', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);

      const context = createMockContext({ role: 'VIEWER' });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow access when user has OWNER role for OWNER-only endpoint', () => {
      const requiredRoles: Role[] = ['OWNER'];
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(requiredRoles);

      const context = createMockContext({ role: 'OWNER' });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow access when user has ADMIN role for ADMIN-only endpoint', () => {
      const requiredRoles: Role[] = ['ADMIN'];
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(requiredRoles);

      const context = createMockContext({ role: 'ADMIN' });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow access when OWNER accesses OWNER or ADMIN endpoint', () => {
      const requiredRoles: Role[] = ['OWNER', 'ADMIN'];
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(requiredRoles);

      const context = createMockContext({ role: 'OWNER' });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow access when ADMIN accesses OWNER or ADMIN endpoint', () => {
      const requiredRoles: Role[] = ['OWNER', 'ADMIN'];
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(requiredRoles);

      const context = createMockContext({ role: 'ADMIN' });
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should throw ForbiddenException when EDITOR tries OWNER/ADMIN endpoint', () => {
      const requiredRoles: Role[] = ['OWNER', 'ADMIN'];
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(requiredRoles);

      const context = createMockContext({ role: 'EDITOR' });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);

      try {
        guard.canActivate(context);
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect((error as ForbiddenException).getResponse()).toMatchObject({
          code: 'FORBIDDEN',
          message: 'Insufficient role privileges',
          requiredRoles: ['OWNER', 'ADMIN'],
          userRole: 'EDITOR',
        });
      }
    });

    it('should throw ForbiddenException when VIEWER tries OWNER-only endpoint', () => {
      const requiredRoles: Role[] = ['OWNER'];
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(requiredRoles);

      const context = createMockContext({ role: 'VIEWER' });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when no user is authenticated', () => {
      const requiredRoles: Role[] = ['ADMIN'];
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(requiredRoles);

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

    it('should only require ANY of the specified roles (OR logic)', () => {
      const requiredRoles: Role[] = ['OWNER', 'ADMIN', 'EDITOR', 'VIEWER'];
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(requiredRoles);

      // All roles should pass when listed
      const ownerContext = createMockContext({ role: 'OWNER' });
      expect(guard.canActivate(ownerContext)).toBe(true);

      const adminContext = createMockContext({ role: 'ADMIN' });
      expect(guard.canActivate(adminContext)).toBe(true);

      const editorContext = createMockContext({ role: 'EDITOR' });
      expect(guard.canActivate(editorContext)).toBe(true);

      const viewerContext = createMockContext({ role: 'VIEWER' });
      expect(guard.canActivate(viewerContext)).toBe(true);
    });
  });
});
