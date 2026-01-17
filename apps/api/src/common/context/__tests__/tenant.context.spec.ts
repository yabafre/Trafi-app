/**
 * Unit tests for Tenant Context (AsyncLocalStorage)
 *
 * @see Story 2.6 - Tenant-Scoped Authorization (AC#1, AC#6)
 */
import {
  tenantContext,
  getTenantContext,
  requireTenantContext,
  generateRequestId,
  type TenantContextData,
} from '../tenant.context';

describe('TenantContext', () => {
  describe('tenantContext.run()', () => {
    it('should store and retrieve context via AsyncLocalStorage', async () => {
      const testData: TenantContextData = {
        storeId: 'store_123',
        userId: 'user_456',
        role: 'ADMIN',
        requestId: 'req_789',
      };

      await new Promise<void>((resolve) => {
        tenantContext.run(testData, () => {
          const ctx = getTenantContext();
          expect(ctx).toEqual(testData);
          resolve();
        });
      });
    });

    it('should isolate context between concurrent runs', async () => {
      const data1: TenantContextData = {
        storeId: 'store_A',
        userId: 'user_A',
        role: 'OWNER',
        requestId: 'req_A',
      };

      const data2: TenantContextData = {
        storeId: 'store_B',
        userId: 'user_B',
        role: 'VIEWER',
        requestId: 'req_B',
      };

      const results = await Promise.all([
        new Promise<TenantContextData | undefined>((resolve) => {
          tenantContext.run(data1, async () => {
            // Simulate some async work
            await new Promise((r) => setTimeout(r, 10));
            resolve(getTenantContext());
          });
        }),
        new Promise<TenantContextData | undefined>((resolve) => {
          tenantContext.run(data2, async () => {
            // Simulate some async work
            await new Promise((r) => setTimeout(r, 5));
            resolve(getTenantContext());
          });
        }),
      ]);

      expect(results[0]).toEqual(data1);
      expect(results[1]).toEqual(data2);
    });

    it('should propagate context through nested async calls', async () => {
      const testData: TenantContextData = {
        storeId: 'store_nested',
        userId: 'user_nested',
        role: 'EDITOR',
        requestId: 'req_nested',
      };

      await new Promise<void>((resolve) => {
        tenantContext.run(testData, async () => {
          // First level async
          await Promise.resolve();

          // Second level async
          const innerContext = await new Promise<TenantContextData | undefined>(
            (innerResolve) => {
              setTimeout(() => {
                innerResolve(getTenantContext());
              }, 10);
            }
          );

          expect(innerContext).toEqual(testData);
          resolve();
        });
      });
    });
  });

  describe('getTenantContext()', () => {
    it('should return undefined outside of context', () => {
      const ctx = getTenantContext();
      expect(ctx).toBeUndefined();
    });

    it('should return the context data inside a run', () => {
      const testData: TenantContextData = {
        storeId: 'store_get',
        userId: 'user_get',
        role: 'ADMIN',
        requestId: 'req_get',
      };

      tenantContext.run(testData, () => {
        expect(getTenantContext()).toEqual(testData);
      });
    });
  });

  describe('requireTenantContext()', () => {
    it('should throw when called outside of context', () => {
      expect(() => requireTenantContext()).toThrow(
        'Tenant context not available - ensure request is authenticated'
      );
    });

    it('should return context when available', () => {
      const testData: TenantContextData = {
        storeId: 'store_require',
        userId: 'user_require',
        role: 'OWNER',
        requestId: 'req_require',
      };

      tenantContext.run(testData, () => {
        const ctx = requireTenantContext();
        expect(ctx).toEqual(testData);
      });
    });
  });

  describe('generateRequestId()', () => {
    it('should generate a valid UUID v4', () => {
      const requestId = generateRequestId();

      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidV4Regex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      expect(requestId).toMatch(uuidV4Regex);
    });

    it('should generate unique IDs', () => {
      const ids = Array.from({ length: 100 }, () => generateRequestId());
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(100);
    });
  });
});
