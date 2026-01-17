/**
 * Unit tests for Audit Interceptor
 *
 * @see Story 2.6 - Tenant-Scoped Authorization (AC#4)
 */
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, lastValueFrom, throwError } from 'rxjs';
import { AuditInterceptor } from '../audit.interceptor';
import { tenantContext, type TenantContextData } from '../../context/tenant.context';

describe('AuditInterceptor', () => {
  let interceptor: AuditInterceptor;
  let mockPrismaService: {
    auditLog: {
      create: jest.Mock;
    };
  };

  beforeEach(() => {
    mockPrismaService = {
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'audit_123' }),
      },
    };

    interceptor = new AuditInterceptor(mockPrismaService as any);
  });

  const createMockExecutionContext = (
    method: string,
    path: string,
    headers: Record<string, string> = {}
  ): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          method,
          path,
          headers,
          params: {},
          query: {},
          ip: '127.0.0.1',
          socket: { remoteAddress: '127.0.0.1' },
        }),
      }),
    } as ExecutionContext;
  };

  const createMockCallHandler = (
    returnValue: unknown = 'result',
    shouldThrow = false
  ): CallHandler => ({
    handle: () => (shouldThrow ? throwError(() => new Error('Test error')) : of(returnValue)),
  });

  const runInTenantContext = async <T>(
    contextData: TenantContextData,
    fn: () => Promise<T>
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      tenantContext.run(contextData, async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
  };

  const testTenantContext: TenantContextData = {
    storeId: 'store_123',
    userId: 'user_456',
    role: 'ADMIN',
    requestId: 'req_789',
  };

  describe('intercept() - Method filtering', () => {
    it('should skip logging for GET requests', async () => {
      const context = createMockExecutionContext('GET', '/api/products');
      const callHandler = createMockCallHandler();

      const result$ = interceptor.intercept(context, callHandler);
      await lastValueFrom(result$);

      expect(mockPrismaService.auditLog.create).not.toHaveBeenCalled();
    });

    it('should skip logging for HEAD requests', async () => {
      const context = createMockExecutionContext('HEAD', '/api/products');
      const callHandler = createMockCallHandler();

      const result$ = interceptor.intercept(context, callHandler);
      await lastValueFrom(result$);

      expect(mockPrismaService.auditLog.create).not.toHaveBeenCalled();
    });

    it('should skip logging for OPTIONS requests', async () => {
      const context = createMockExecutionContext('OPTIONS', '/api/products');
      const callHandler = createMockCallHandler();

      const result$ = interceptor.intercept(context, callHandler);
      await lastValueFrom(result$);

      expect(mockPrismaService.auditLog.create).not.toHaveBeenCalled();
    });

    it('should log POST requests', async () => {
      await runInTenantContext(testTenantContext, async () => {
        const context = createMockExecutionContext('POST', '/api/products');
        const callHandler = createMockCallHandler();

        const result$ = interceptor.intercept(context, callHandler);
        await lastValueFrom(result$);

        // Wait for async audit log
        await new Promise((r) => setTimeout(r, 10));

        expect(mockPrismaService.auditLog.create).toHaveBeenCalled();
      });
    });

    it('should log PUT requests', async () => {
      await runInTenantContext(testTenantContext, async () => {
        const context = createMockExecutionContext('PUT', '/api/products/123');
        const callHandler = createMockCallHandler();

        const result$ = interceptor.intercept(context, callHandler);
        await lastValueFrom(result$);

        await new Promise((r) => setTimeout(r, 10));

        expect(mockPrismaService.auditLog.create).toHaveBeenCalled();
      });
    });

    it('should log DELETE requests', async () => {
      await runInTenantContext(testTenantContext, async () => {
        const context = createMockExecutionContext('DELETE', '/api/products/123');
        const callHandler = createMockCallHandler();

        const result$ = interceptor.intercept(context, callHandler);
        await lastValueFrom(result$);

        await new Promise((r) => setTimeout(r, 10));

        expect(mockPrismaService.auditLog.create).toHaveBeenCalled();
      });
    });
  });

  describe('intercept() - Audit log content', () => {
    it('should log correct tenant context', async () => {
      await runInTenantContext(testTenantContext, async () => {
        const context = createMockExecutionContext('POST', '/api/products');
        const callHandler = createMockCallHandler();

        const result$ = interceptor.intercept(context, callHandler);
        await lastValueFrom(result$);

        await new Promise((r) => setTimeout(r, 10));

        expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            storeId: 'store_123',
            userId: 'user_456',
            requestId: 'req_789',
          }),
        });
      });
    });

    it('should log success status on successful request', async () => {
      await runInTenantContext(testTenantContext, async () => {
        const context = createMockExecutionContext('POST', '/api/products');
        const callHandler = createMockCallHandler();

        const result$ = interceptor.intercept(context, callHandler);
        await lastValueFrom(result$);

        await new Promise((r) => setTimeout(r, 10));

        expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            status: 'success',
          }),
        });
      });
    });

    it('should log error status and message on failed request', async () => {
      await runInTenantContext(testTenantContext, async () => {
        const context = createMockExecutionContext('POST', '/api/products');
        const callHandler = createMockCallHandler(null, true);

        try {
          const result$ = interceptor.intercept(context, callHandler);
          await lastValueFrom(result$);
        } catch {
          // Expected to throw
        }

        await new Promise((r) => setTimeout(r, 10));

        expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            status: 'error',
            errorMessage: 'Test error',
          }),
        });
      });
    });

    it('should extract resource name from REST path', async () => {
      await runInTenantContext(testTenantContext, async () => {
        const context = createMockExecutionContext('POST', '/api/products/prod_123');
        const callHandler = createMockCallHandler();

        const result$ = interceptor.intercept(context, callHandler);
        await lastValueFrom(result$);

        await new Promise((r) => setTimeout(r, 10));

        expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            resource: 'products',
          }),
        });
      });
    });

    it('should extract resource name from tRPC path', async () => {
      await runInTenantContext(testTenantContext, async () => {
        const context = createMockExecutionContext('POST', '/trpc/users.create');
        const callHandler = createMockCallHandler();

        const result$ = interceptor.intercept(context, callHandler);
        await lastValueFrom(result$);

        await new Promise((r) => setTimeout(r, 10));

        expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            resource: 'users',
          }),
        });
      });
    });

    it('should capture user-agent header', async () => {
      await runInTenantContext(testTenantContext, async () => {
        const context = createMockExecutionContext('POST', '/api/products', {
          'user-agent': 'Mozilla/5.0 Test Browser',
        });
        const callHandler = createMockCallHandler();

        const result$ = interceptor.intercept(context, callHandler);
        await lastValueFrom(result$);

        await new Promise((r) => setTimeout(r, 10));

        expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            userAgent: 'Mozilla/5.0 Test Browser',
          }),
        });
      });
    });

    it('should record duration in milliseconds', async () => {
      await runInTenantContext(testTenantContext, async () => {
        const context = createMockExecutionContext('POST', '/api/products');
        const callHandler = createMockCallHandler();

        const result$ = interceptor.intercept(context, callHandler);
        await lastValueFrom(result$);

        await new Promise((r) => setTimeout(r, 10));

        expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            durationMs: expect.any(Number),
          }),
        });
      });
    });
  });

  describe('intercept() - No tenant context', () => {
    it('should skip logging when no tenant context available', async () => {
      // Outside tenant context
      const context = createMockExecutionContext('POST', '/api/products');
      const callHandler = createMockCallHandler();

      const result$ = interceptor.intercept(context, callHandler);
      await lastValueFrom(result$);

      await new Promise((r) => setTimeout(r, 10));

      expect(mockPrismaService.auditLog.create).not.toHaveBeenCalled();
    });
  });

  describe('intercept() - Error handling', () => {
    it('should not fail the request if audit logging fails', async () => {
      mockPrismaService.auditLog.create.mockRejectedValue(new Error('DB Error'));

      await runInTenantContext(testTenantContext, async () => {
        const context = createMockExecutionContext('POST', '/api/products');
        const callHandler = createMockCallHandler('success');

        const result$ = interceptor.intercept(context, callHandler);
        const result = await lastValueFrom(result$);

        // Request should still succeed
        expect(result).toBe('success');
      });
    });
  });
});
