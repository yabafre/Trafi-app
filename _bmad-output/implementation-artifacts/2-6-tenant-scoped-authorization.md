# Story 2.6: Tenant-Scoped Authorization

Status: ready-for-dev

## Story

As a **System**,
I want **all API requests scoped to the authenticated tenant**,
So that **stores cannot access each other's data**.

## Acceptance Criteria

1. **Given** a multi-tenant system with isolated stores
   **When** any authenticated API request is made
   **Then** the request is automatically scoped to the authenticated store
   **And** the `storeId` is extracted from the JWT token and injected into the request context

2. **Given** any database query is executed by a tenant-scoped model
   **When** the query uses Prisma
   **Then** the query automatically includes `storeId` filtering via Prisma middleware
   **And** no explicit `storeId` filter is required in service methods for tenant-scoped models

3. **Given** a user attempts to access a resource belonging to another tenant
   **When** the API processes the request
   **Then** a 404 Not Found is returned (not 403 Forbidden)
   **And** no information about the resource's existence is leaked

4. **Given** any state-changing operation (POST, PUT, PATCH, DELETE) is performed
   **When** the operation completes (success or error)
   **Then** the operation is logged in the AuditLog table with tenant context
   **And** the log includes: storeId, userId, requestId, action, resource, status, duration, IP, userAgent (NFR-SEC-7)

5. **Given** the tRPC context is created for an authenticated request
   **When** a procedure needs to check permissions or tenant ownership
   **Then** helper functions `requirePermission()` and `ensureTenantOwnership()` are available in the context

6. **Given** a request is processed by a tenant-scoped interceptor
   **When** the tenant context is set via AsyncLocalStorage
   **Then** the context is available anywhere in the request lifecycle without explicit parameter passing

## Tasks / Subtasks

- [ ] **Task 1: Backend - AsyncLocalStorage Tenant Context** (AC: #1, #6)
  - [ ] 1.1 Create `apps/api/src/common/context/tenant.context.ts`
  - [ ] 1.2 Define `TenantContextData` interface (storeId, userId, role, requestId)
  - [ ] 1.3 Create AsyncLocalStorage instance for tenant context
  - [ ] 1.4 Export `getTenantContext()` and `requireTenantContext()` helper functions
  - [ ] 1.5 Add UUID generation for requestId using `uuid` package

- [ ] **Task 2: Backend - Tenant Interceptor** (AC: #1, #6)
  - [ ] 2.1 Create `apps/api/src/common/interceptors/tenant.interceptor.ts`
  - [ ] 2.2 Extract user from request (already set by JwtAuthGuard)
  - [ ] 2.3 Create TenantContextData from user payload (storeId, userId, role)
  - [ ] 2.4 Generate unique requestId using uuid
  - [ ] 2.5 Run the request handler within `tenantContext.run()` AsyncLocalStorage
  - [ ] 2.6 Handle cases where user is not authenticated (skip tenant context)

- [ ] **Task 3: Backend - Prisma Auto-Scoping Middleware** (AC: #2, #3)
  - [ ] 3.1 Update `apps/api/src/prisma/prisma.service.ts`
  - [ ] 3.2 Add `$use()` middleware for automatic tenant filtering
  - [ ] 3.3 Define list of tenant-scoped models: Product, Order, Customer, Category, User, ApiKey, Setting, AuditLog
  - [ ] 3.4 Auto-add `storeId` filter for read operations (findUnique, findFirst, findMany, count)
  - [ ] 3.5 Auto-add `storeId` for create operations (create, createMany)
  - [ ] 3.6 Auto-add `storeId` filter for update/delete operations
  - [ ] 3.7 Skip filtering if no tenant context (system operations)

- [ ] **Task 4: Backend - Audit Interceptor** (AC: #4)
  - [ ] 4.1 Create `apps/api/src/common/interceptors/audit.interceptor.ts`
  - [ ] 4.2 Capture request start time for duration calculation
  - [ ] 4.3 Log only state-changing operations (exclude GET, HEAD, OPTIONS)
  - [ ] 4.4 Extract tenant context from AsyncLocalStorage
  - [ ] 4.5 Create AuditLog entry with all required fields on request completion
  - [ ] 4.6 Extract resource name from request path (e.g., /api/products/prod_123 -> 'products')
  - [ ] 4.7 Handle both success and error cases with appropriate status
  - [ ] 4.8 Use protected method for `logAudit` for @trafi/core extensibility

- [ ] **Task 5: Backend - AuditLog Prisma Model** (AC: #4)
  - [ ] 5.1 Create `apps/api/prisma/schema/audit-log.prisma`
  - [ ] 5.2 Fields: id, storeId, userId, requestId, action, resource, status, durationMs, ipAddress, userAgent, errorMessage, metadata (JSON)
  - [ ] 5.3 Add indexes on storeId, requestId, createdAt
  - [ ] 5.4 Run `pnpm db:push` to update schema
  - [ ] 5.5 Run `pnpm db:generate` to regenerate Prisma client

- [ ] **Task 6: Backend - tRPC Context Enhancement** (AC: #3, #5)
  - [ ] 6.1 Update `apps/api/src/trpc/context.ts`
  - [ ] 6.2 Import and use `getTenantContext()` from AsyncLocalStorage
  - [ ] 6.3 Add `requirePermission(permission: Permission)` helper
  - [ ] 6.4 Add `ensureTenantOwnership<T>(resource: T | null): T` helper
  - [ ] 6.5 Return 404 (not 403) when resource not found or belongs to different tenant
  - [ ] 6.6 Export `Context` type for use in routers

- [ ] **Task 7: Backend - Register Global Interceptors** (AC: #1, #4, #6)
  - [ ] 7.1 Update `apps/api/src/app.module.ts`
  - [ ] 7.2 Add TenantInterceptor as global interceptor (APP_INTERCEPTOR)
  - [ ] 7.3 Add AuditInterceptor as global interceptor (APP_INTERCEPTOR)
  - [ ] 7.4 Ensure correct interceptor order (Tenant before Audit)

- [ ] **Task 8: Backend - Tenant Decorator** (AC: #6)
  - [ ] 8.1 Create `apps/api/src/common/decorators/tenant.decorator.ts`
  - [ ] 8.2 Implement `@Tenant()` param decorator to get current tenant context
  - [ ] 8.3 Support optional data field selection (`@Tenant('storeId')`)

- [ ] **Task 9: Backend - Update Existing Services** (AC: #2, #3)
  - [ ] 9.1 Review and update `ApiKeysService` - remove explicit storeId parameters from internal queries (Prisma middleware handles it)
  - [ ] 9.2 Review and update `UserService` - remove explicit storeId parameters from internal queries
  - [ ] 9.3 Keep storeId in public method signatures for explicit contract
  - [ ] 9.4 Document that internal queries auto-scope via middleware

- [ ] **Task 10: Backend Unit Tests** (AC: #1, #2, #3, #4, #6)
  - [ ] 10.1 Create `apps/api/src/common/context/__tests__/tenant.context.spec.ts`
  - [ ] 10.2 Test AsyncLocalStorage context management
  - [ ] 10.3 Create `apps/api/src/common/interceptors/__tests__/tenant.interceptor.spec.ts`
  - [ ] 10.4 Test TenantInterceptor extracts and sets context correctly
  - [ ] 10.5 Create `apps/api/src/common/interceptors/__tests__/audit.interceptor.spec.ts`
  - [ ] 10.6 Test AuditInterceptor logs state-changing operations only
  - [ ] 10.7 Create `apps/api/src/prisma/__tests__/prisma.service.spec.ts`
  - [ ] 10.8 Test Prisma middleware auto-filters by storeId
  - [ ] 10.9 Test cross-tenant access returns 404

- [ ] **Task 11: E2E Tests** (AC: #2, #3, #4)
  - [ ] 11.1 Create `apps/api/test/tenant-isolation.e2e-spec.ts`
  - [ ] 11.2 Test Store A cannot access Store B's products
  - [ ] 11.3 Test cross-tenant resource access returns 404 (not 403)
  - [ ] 11.4 Test audit log captures operations with correct tenant context
  - [ ] 11.5 Test API key from Store A cannot access Store B's resources
  - [ ] 11.6 Test user session from Store A cannot access Store B

## Dev Notes

### Architecture Patterns (CRITICAL)

**RETRO-2:** All services MUST use `protected` methods for @trafi/core extensibility:
```typescript
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  // Protected for override by merchants
  protected async logAudit(
    request: any,
    status: 'success' | 'error',
    startTime: number,
    error?: Error,
  ): Promise<void> {
    // Implementation
  }
}
```

**RETRO-3:** Export explicit public API from common modules:
```typescript
// common/context/index.ts
export { tenantContext, getTenantContext, requireTenantContext } from './tenant.context';
export type { TenantContextData } from './tenant.context';
```

### AsyncLocalStorage Pattern

```typescript
// apps/api/src/common/context/tenant.context.ts
import { AsyncLocalStorage } from 'async_hooks';
import { v4 as uuidv4 } from 'uuid';

export interface TenantContextData {
  storeId: string;
  userId: string;
  role: string;
  requestId: string;
}

export const tenantContext = new AsyncLocalStorage<TenantContextData>();

export function getTenantContext(): TenantContextData | undefined {
  return tenantContext.getStore();
}

export function requireTenantContext(): TenantContextData {
  const ctx = tenantContext.getStore();
  if (!ctx) {
    throw new Error('Tenant context not available - ensure request is authenticated');
  }
  return ctx;
}
```

### Tenant Interceptor Pattern

```typescript
// apps/api/src/common/interceptors/tenant.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tenantContext, TenantContextData } from '../context/tenant.context';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Skip if not authenticated (public endpoints)
    if (!user?.tenantId) {
      return next.handle();
    }

    const tenantData: TenantContextData = {
      storeId: user.tenantId, // JWT uses tenantId, we normalize to storeId
      userId: user.sub,
      role: user.role,
      requestId: uuidv4(),
    };

    // Run request within AsyncLocalStorage context
    return new Observable((subscriber) => {
      tenantContext.run(tenantData, () => {
        next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}
```

### Prisma Auto-Scoping Middleware

```typescript
// apps/api/src/prisma/prisma.service.ts (UPDATED)
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { getTenantContext } from '@/common/context/tenant.context';

const TENANT_SCOPED_MODELS = [
  'Product',
  'Order',
  'Customer',
  'Category',
  'User',
  'ApiKey',
  'Setting',
  'AuditLog',
];

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super();
    this.setupTenantMiddleware();
  }

  private setupTenantMiddleware() {
    this.$use(async (params, next) => {
      const ctx = getTenantContext();

      // Skip if no tenant context (system operations, public endpoints)
      if (!ctx) return next(params);

      // Skip if model doesn't require tenant scoping
      if (!params.model || !TENANT_SCOPED_MODELS.includes(params.model)) {
        return next(params);
      }

      // Auto-add storeId filter for read operations
      if (['findUnique', 'findFirst', 'findMany', 'count', 'aggregate'].includes(params.action)) {
        params.args = params.args || {};
        params.args.where = {
          ...params.args.where,
          storeId: ctx.storeId,
        };
      }

      // Auto-add storeId for create operations
      if (params.action === 'create') {
        params.args.data = {
          ...params.args.data,
          storeId: ctx.storeId,
        };
      }

      if (params.action === 'createMany') {
        params.args.data = params.args.data.map((item: any) => ({
          ...item,
          storeId: ctx.storeId,
        }));
      }

      // Auto-add storeId filter for update/delete operations
      if (['update', 'updateMany', 'delete', 'deleteMany', 'upsert'].includes(params.action)) {
        params.args.where = {
          ...params.args.where,
          storeId: ctx.storeId,
        };
      }

      return next(params);
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

### AuditLog Prisma Schema

```prisma
// apps/api/prisma/schema/audit-log.prisma

model AuditLog {
  id           String   @id @default(cuid())
  storeId      String
  userId       String
  requestId    String   @unique
  action       String   // "POST /api/products", "DELETE /api/users/usr_123"
  resource     String   // "products", "users", "orders"
  status       String   // "success" | "error"
  durationMs   Int
  ipAddress    String?
  userAgent    String?
  errorMessage String?
  metadata     Json?    // Additional context (params, query, etc.)
  createdAt    DateTime @default(now())

  store        Store    @relation(fields: [storeId], references: [id])

  @@index([storeId])
  @@index([requestId])
  @@index([createdAt])
  @@index([storeId, createdAt])
}
```

### Audit Interceptor Pattern

```typescript
// apps/api/src/common/interceptors/audit.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap, catchError } from 'rxjs';
import { getTenantContext } from '../context/tenant.context';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();

    // Only log state-changing operations
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => this.logAudit(request, 'success', startTime)),
      catchError((error) => {
        this.logAudit(request, 'error', startTime, error);
        throw error;
      }),
    );
  }

  // Protected for @trafi/core extensibility
  protected async logAudit(
    request: any,
    status: 'success' | 'error',
    startTime: number,
    error?: Error,
  ): Promise<void> {
    const ctx = getTenantContext();
    if (!ctx) return; // Skip if no tenant context

    try {
      await this.prisma.auditLog.create({
        data: {
          storeId: ctx.storeId,
          userId: ctx.userId,
          requestId: ctx.requestId,
          action: `${request.method} ${request.path}`,
          resource: this.extractResource(request.path),
          status,
          durationMs: Date.now() - startTime,
          ipAddress: this.extractIp(request),
          userAgent: request.headers['user-agent']?.substring(0, 255),
          errorMessage: error?.message?.substring(0, 500),
          metadata: {
            params: request.params,
            query: request.query,
          },
        },
      });
    } catch (auditError) {
      // Log but don't fail the request if audit fails
      console.error('Audit log failed:', auditError);
    }
  }

  private extractResource(path: string): string {
    // /api/products/prod_123 -> 'products'
    // /api/v1/orders -> 'orders'
    const match = path.match(/\/api(?:\/v\d+)?\/(\w+)/);
    return match ? match[1] : 'unknown';
  }

  private extractIp(request: any): string | undefined {
    return (
      request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      request.ip ||
      request.connection?.remoteAddress
    );
  }
}
```

### tRPC Context Enhancement

```typescript
// apps/api/src/trpc/context.ts
import { inferAsyncReturnType } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { getTenantContext } from '@/common/context/tenant.context';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ROLE_PERMISSIONS, type Permission } from '@trafi/types';

export const createContext = async ({ req, res }: CreateExpressContextOptions) => {
  const tenantCtx = getTenantContext();

  return {
    req,
    res,
    storeId: tenantCtx?.storeId,
    userId: tenantCtx?.userId,
    role: tenantCtx?.role,
    requestId: tenantCtx?.requestId,

    // Helper to enforce permission
    requirePermission: (permission: Permission): void => {
      if (!tenantCtx) {
        throw new ForbiddenException('Authentication required');
      }
      const permissions = ROLE_PERMISSIONS[tenantCtx.role] || [];
      if (!permissions.includes(permission)) {
        throw new ForbiddenException('Insufficient permissions');
      }
    },

    // Helper to ensure resource belongs to tenant
    // Returns 404 (not 403) to avoid leaking resource existence
    ensureTenantOwnership: async <T extends { storeId: string }>(
      resource: T | null,
    ): Promise<T> => {
      if (!resource) {
        throw new NotFoundException('Resource not found');
      }
      if (resource.storeId !== tenantCtx?.storeId) {
        // Return 404 instead of 403 to avoid revealing resource exists
        throw new NotFoundException('Resource not found');
      }
      return resource;
    },
  };
};

export type Context = inferAsyncReturnType<typeof createContext>;
```

### Global Interceptor Registration

```typescript
// apps/api/src/app.module.ts (additions)
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TenantInterceptor } from '@/common/interceptors/tenant.interceptor';
import { AuditInterceptor } from '@/common/interceptors/audit.interceptor';

@Module({
  // ... existing imports and providers ...
  providers: [
    // ... existing providers ...

    // Global interceptors - order matters!
    // TenantInterceptor must run first to set context
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
```

### Tenant Decorator

```typescript
// apps/api/src/common/decorators/tenant.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { getTenantContext, TenantContextData } from '../context/tenant.context';

export const Tenant = createParamDecorator(
  (data: keyof TenantContextData | undefined, ctx: ExecutionContext) => {
    const tenantCtx = getTenantContext();
    if (!tenantCtx) {
      return undefined;
    }
    return data ? tenantCtx[data] : tenantCtx;
  },
);

// Usage examples:
// @Tenant() ctx: TenantContextData - full context
// @Tenant('storeId') storeId: string - just storeId
// @Tenant('requestId') requestId: string - just requestId
```

### File Structure

```
apps/api/src/
├── common/
│   ├── context/
│   │   ├── index.ts
│   │   ├── tenant.context.ts
│   │   └── __tests__/
│   │       └── tenant.context.spec.ts
│   ├── decorators/
│   │   ├── index.ts
│   │   └── tenant.decorator.ts
│   └── interceptors/
│       ├── index.ts
│       ├── tenant.interceptor.ts
│       ├── audit.interceptor.ts
│       └── __tests__/
│           ├── tenant.interceptor.spec.ts
│           └── audit.interceptor.spec.ts
├── prisma/
│   ├── prisma.service.ts              # Extended with tenant middleware
│   └── __tests__/
│       └── prisma.service.spec.ts
├── trpc/
│   └── context.ts                     # Enhanced with tenant helpers

apps/api/prisma/schema/
├── audit-log.prisma                   # New AuditLog model
└── store.prisma                       # Add auditLogs relation

apps/api/test/
└── tenant-isolation.e2e-spec.ts       # Cross-tenant isolation tests
```

### UX Implementation

**No dashboard changes required for this story.**

This is a backend-only infrastructure story. The tenant scoping happens automatically and transparently. However, the audit logs can be viewed in a future "Activity Log" dashboard feature.

### Previous Story Learnings (CRITICAL)

**From Story 2.1:**
- JWT payload includes: `sub` (userId), `tenantId` (storeId), `role`, `permissions`, `type`
- All auth-related services use `protected` methods for override

**From Story 2.3:**
- PERMISSIONS and ROLE_PERMISSIONS exported from `@trafi/types/src/permissions.types.ts`
- Use these in tRPC context for permission checking

**From Story 2.4:**
- UserModule pattern established: module.ts, service.ts (protected), controller.ts
- Query invalidation patterns established

**From Story 2.5:**
- ApiKeysService already uses `storeId` filtering
- API Key Guard injects `storeId` into request context
- All services ready to consume tenant context from AsyncLocalStorage

### Security Considerations (NFR-SEC-7, NFR-SEC-8)

1. **404 vs 403:** Always return 404 for cross-tenant access attempts to avoid leaking resource existence
2. **Audit Everything:** Log all state-changing operations with full tenant context
3. **No Manual Filtering:** Prisma middleware ensures tenant filtering can't be accidentally omitted
4. **IP Tracking:** Capture client IP for security audit trail
5. **Request Correlation:** Use unique requestId for distributed tracing

### Testing Patterns

**Unit Tests (Jest):**
```typescript
// tenant.context.spec.ts
describe('TenantContext', () => {
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

  it('should return undefined outside of context', () => {
    const ctx = getTenantContext();
    expect(ctx).toBeUndefined();
  });

  it('requireTenantContext should throw when no context', () => {
    expect(() => requireTenantContext()).toThrow('Tenant context not available');
  });
});
```

**E2E Tests (Supertest):**
```typescript
// tenant-isolation.e2e-spec.ts
describe('Tenant Isolation', () => {
  let storeAToken: string;
  let storeBToken: string;
  let storeAProductId: string;

  beforeAll(async () => {
    // Create two stores with different users
    storeAToken = await loginAsStoreA();
    storeBToken = await loginAsStoreB();

    // Create product in Store A
    const response = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${storeAToken}`)
      .send({ name: 'Store A Product', priceInCents: 1999 });
    storeAProductId = response.body.id;
  });

  it('should return 404 when Store B tries to access Store A product', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/products/${storeAProductId}`)
      .set('Authorization', `Bearer ${storeBToken}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Resource not found');
  });

  it('should auto-filter list queries by tenant', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/products')
      .set('Authorization', `Bearer ${storeBToken}`);

    expect(response.status).toBe(200);
    // Should NOT include Store A's product
    expect(response.body.items.map((p: any) => p.id)).not.toContain(storeAProductId);
  });

  it('should log operations in audit log with correct tenant', async () => {
    // Make a state-changing request
    await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${storeAToken}`)
      .send({ name: 'Audit Test Product', priceInCents: 999 });

    // Query audit logs (internal/test endpoint)
    const logs = await prisma.auditLog.findMany({
      where: { resource: 'products', action: { contains: 'POST' } },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    expect(logs[0].storeId).toBe(storeAId);
    expect(logs[0].status).toBe('success');
  });
});
```

### Common Pitfalls to Avoid

1. **DON'T** forget to handle unauthenticated requests (skip tenant context)
2. **DON'T** use `$executeRaw` or `$queryRaw` without manual tenant filtering
3. **DON'T** return 403 for cross-tenant access - always use 404
4. **DON'T** log sensitive data in audit metadata (passwords, tokens)
5. **DON'T** make audit logging synchronous - use fire-and-forget pattern
6. **DON'T** forget to add new tenant-scoped models to TENANT_SCOPED_MODELS list
7. **DON'T** trust client-provided storeId - always extract from JWT

### Package Dependencies

```json
// apps/api/package.json additions
{
  "dependencies": {
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/uuid": "^9.0.0"
  }
}
```

### Environment Variables

No new environment variables required. Uses existing:
- `JWT_SECRET` - for token validation
- `DATABASE_URL` - for Prisma

### Git Commit Pattern

```
feat(epic-2): Story 2.6 - Tenant-scoped authorization

- Add AsyncLocalStorage-based tenant context
- Implement TenantInterceptor for context injection
- Add Prisma middleware for automatic tenant filtering
- Create AuditInterceptor for operation logging
- Add AuditLog Prisma model
- Enhance tRPC context with tenant helpers
- Write unit and E2E tests for tenant isolation
```

### Project Structure Notes

- Aligns with monorepo structure: shared context utilities in common/
- Uses established interceptor patterns from NestJS
- Integrates with existing JWT authentication from Story 2.1-2.2
- Prepares foundation for all future multi-tenant features

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-02-admin-auth.md#Story 2.6]
- [Source: _bmad-output/planning-artifacts/architecture.md#Multi-tenancy]
- [Source: _bmad-output/project-context.md#NestJS Backend Rules]
- [Source: _bmad-output/project-context.md#Tenant Isolation (CRITICAL)]
- [Source: _bmad-output/implementation-artifacts/2-5-api-key-management.md]
- [Source: _bmad-output/implementation-artifacts/2-4-admin-user-management.md]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

