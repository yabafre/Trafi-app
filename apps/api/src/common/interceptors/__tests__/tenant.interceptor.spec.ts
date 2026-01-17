/**
 * Unit tests for Tenant Interceptor
 *
 * @see Story 2.6 - Tenant-Scoped Authorization (AC#1, AC#6)
 */
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, lastValueFrom } from 'rxjs';
import { TenantInterceptor } from '../tenant.interceptor';
import { getTenantContext } from '../../context/tenant.context';

describe('TenantInterceptor', () => {
  let interceptor: TenantInterceptor;

  beforeEach(() => {
    interceptor = new TenantInterceptor();
  });

  const createMockExecutionContext = (user: unknown): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as ExecutionContext;
  };

  const createMockCallHandler = (returnValue: unknown = 'test-result'): CallHandler => ({
    handle: () => of(returnValue),
  });

  describe('intercept()', () => {
    it('should skip context creation for unauthenticated requests', async () => {
      const context = createMockExecutionContext(null);
      const callHandler = createMockCallHandler();

      const result$ = interceptor.intercept(context, callHandler);
      const result = await lastValueFrom(result$);

      expect(result).toBe('test-result');
    });

    it('should skip context creation when user has no tenantId', async () => {
      const user = { sub: 'user_123', role: 'ADMIN' }; // No tenantId
      const context = createMockExecutionContext(user);
      const callHandler = createMockCallHandler();

      const result$ = interceptor.intercept(context, callHandler);
      const result = await lastValueFrom(result$);

      expect(result).toBe('test-result');
    });

    it('should create tenant context for authenticated requests', async () => {
      const user = {
        sub: 'user_123',
        tenantId: 'store_456',
        role: 'ADMIN',
      };

      const context = createMockExecutionContext(user);

      let capturedContext: unknown = null;
      const callHandler: CallHandler = {
        handle: () => {
          capturedContext = getTenantContext();
          return of('result');
        },
      };

      const result$ = interceptor.intercept(context, callHandler);
      await lastValueFrom(result$);

      expect(capturedContext).toEqual({
        storeId: 'store_456',
        userId: 'user_123',
        role: 'ADMIN',
        requestId: expect.any(String),
      });
    });

    it('should generate unique requestId for each request', async () => {
      const user = {
        sub: 'user_123',
        tenantId: 'store_456',
        role: 'ADMIN',
      };

      const requestIds: string[] = [];

      for (let i = 0; i < 3; i++) {
        const context = createMockExecutionContext(user);
        const callHandler: CallHandler = {
          handle: () => {
            const ctx = getTenantContext();
            if (ctx) requestIds.push(ctx.requestId);
            return of('result');
          },
        };

        const result$ = interceptor.intercept(context, callHandler);
        await lastValueFrom(result$);
      }

      // All request IDs should be unique
      expect(new Set(requestIds).size).toBe(3);
    });

    it('should properly propagate errors from handler', async () => {
      const user = {
        sub: 'user_123',
        tenantId: 'store_456',
        role: 'ADMIN',
      };

      const context = createMockExecutionContext(user);
      const error = new Error('Test error');

      const callHandler: CallHandler = {
        handle: () => {
          throw error;
        },
      };

      await expect(async () => {
        const result$ = interceptor.intercept(context, callHandler);
        await lastValueFrom(result$);
      }).rejects.toThrow('Test error');
    });

    it('should normalize tenantId to storeId in context', async () => {
      const user = {
        sub: 'user_xyz',
        tenantId: 'tenant_abc', // JWT uses tenantId
        role: 'VIEWER',
      };

      const context = createMockExecutionContext(user);

      let capturedContext: unknown = null;
      const callHandler: CallHandler = {
        handle: () => {
          capturedContext = getTenantContext();
          return of('result');
        },
      };

      const result$ = interceptor.intercept(context, callHandler);
      await lastValueFrom(result$);

      // Should be normalized to storeId
      expect((capturedContext as { storeId: string }).storeId).toBe('tenant_abc');
    });
  });
});
