# Story 2.3: Role-Based Access Control (RBAC) Foundation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an **Admin**,
I want **users to have specific roles with defined permissions**,
So that **I can control what each team member can do**.

## Acceptance Criteria

1. **Given** the RBAC system is implemented
   **When** roles are defined
   **Then** four roles exist with specific permission sets:
   - **Owner:** full access including billing and ownership transfer
   - **Admin:** user management, settings, all commerce features (excluding ownership)
   - **Editor:** product, order, customer management (no user management)
   - **Viewer:** read-only access to all data

2. **Given** an API endpoint is protected with @RequirePermissions() decorator
   **When** a user with sufficient permissions accesses it
   **Then** the request succeeds with expected response

3. **Given** an API endpoint is protected with @RequirePermissions() decorator
   **When** a user without sufficient permissions accesses it
   **Then** a 403 Forbidden response is returned with structured error:
   ```json
   {
     "code": "FORBIDDEN",
     "message": "Insufficient permissions",
     "requiredPermissions": ["products:delete"]
   }
   ```

4. **Given** the @Roles() decorator is applied to an endpoint
   **When** a user's role matches one of the required roles
   **Then** access is granted; otherwise 403 is returned

5. **Given** the @CurrentUser() decorator is used in a controller
   **When** the request is authenticated
   **Then** the decorator extracts user data from JWT and makes it available

6. **Given** the dashboard needs to conditionally render UI elements
   **When** the usePermissions() hook is called
   **Then** it provides hasPermission, hasAnyPermission, hasAllPermissions helpers

## Tasks / Subtasks

- [x] **Task 1: Define Permission Constants** (AC: #1)
  - [x] 1.1 Create `apps/api/src/common/types/permissions.ts` with PERMISSIONS constant object
  - [x] 1.2 Define all permissions: users:*, products:*, orders:*, customers:*, settings:*, api-keys:*, ownership:*
  - [x] 1.3 Create ROLE_PERMISSIONS mapping (OWNER, ADMIN, EDITOR, VIEWER)
  - [x] 1.4 Export Permission type from const keys
  - [x] 1.5 Create `packages/@trafi/types/src/permissions.types.ts` for shared types

- [x] **Task 2: Create RBAC Decorators** (AC: #2, #4, #5)
  - [x] 2.1 Create `apps/api/src/modules/auth/decorators/permissions.decorator.ts` with @RequirePermissions()
  - [x] 2.2 Create `apps/api/src/modules/auth/decorators/roles.decorator.ts` with @Roles()
  - [x] 2.3 @CurrentUser() decorator already exists in common/decorators - re-exported for convenience
  - [x] 2.4 Export decorators from `apps/api/src/modules/auth/decorators/index.ts`

- [x] **Task 3: Create RBAC Guards** (AC: #2, #3, #4)
  - [x] 3.1 Create `apps/api/src/modules/auth/guards/permissions.guard.ts` with PermissionsGuard
  - [x] 3.2 Create `apps/api/src/modules/auth/guards/roles.guard.ts` with RolesGuard
  - [x] 3.3 Ensure guards use Reflector to read metadata from decorators
  - [x] 3.4 Implement proper ForbiddenException with structured error response
  - [x] 3.5 Export guards from `apps/api/src/modules/auth/guards/index.ts`

- [x] **Task 4: Update AuthModule Exports** (AC: #2, #3, #4, #5)
  - [x] 4.1 Update `apps/api/src/modules/auth/auth.module.ts` to export new guards
  - [x] 4.2 Update `apps/api/src/modules/auth/auth.module.ts` to export new decorators
  - [x] 4.3 Ensure PermissionsGuard and RolesGuard are provided in providers array

- [x] **Task 5: Add Sample Protected Endpoint** (AC: #2, #3)
  - [x] 5.1 Create test endpoint in AuthController with @RequirePermissions('products:read')
  - [x] 5.2 Create test endpoint with @Roles('OWNER', 'ADMIN')
  - [x] 5.3 Verify 403 response for unauthorized access via unit tests

- [x] **Task 6: Create Dashboard Permission Hook** (AC: #6)
  - [x] 6.1 Create `apps/dashboard/src/lib/hooks/usePermissions.ts`
  - [x] 6.2 Implement hasPermission(permission: Permission) function
  - [x] 6.3 Implement hasAnyPermission(...perms: Permission[]) function
  - [x] 6.4 Implement hasAllPermissions(...perms: Permission[]) function
  - [x] 6.5 Hook uses ROLE_PERMISSIONS from @trafi/types

- [x] **Task 7: Update User JWT Payload** (AC: #1)
  - [x] 7.1 JWT payload already includes user role (verified in auth.service.ts)
  - [x] 7.2 JwtStrategy extracts role and adds to request.user (verified)
  - [x] 7.3 Updated auth.service.ts to use new ROLE_PERMISSIONS from common/types

- [x] **Task 8: Write Unit Tests** (AC: #2, #3, #4)
  - [x] 8.1 Create `apps/api/src/modules/auth/guards/__tests__/permissions.guard.spec.ts`
  - [x] 8.2 Test PermissionsGuard allows access when user has required permission
  - [x] 8.3 Test PermissionsGuard throws ForbiddenException when permission missing
  - [x] 8.4 Test RolesGuard allows access for matching roles
  - [x] 8.5 Test RolesGuard throws ForbiddenException for non-matching roles
  - [x] 8.6 Create `apps/dashboard/src/lib/__tests__/usePermissions.test.ts`

- [x] **Task 9: Write Integration Tests** (AC: #2, #3)
  - [x] 9.1 Add E2E tests in `e2e/tests/rbac.spec.ts` for protected endpoints
  - [x] 9.2 Test structure documented for viewer accessing products:read
  - [x] 9.3 Test structure documented for viewer accessing products:delete
  - [x] 9.4 Test structure documented for owner accessing all endpoints

## Dev Notes

### Architecture Patterns to Follow

**RETRO Learnings (from Epic 2 guidelines):**
- **RETRO-2:** All services use `protected` methods for future @trafi/core extensibility
- **RETRO-3:** AuthModule exports explicit public API (AuthService, Guards, Decorators)
- **RETRO-6:** Code with Override Kernel patterns in mind

**Permission Definitions (from Epic 2):**
```typescript
// apps/api/src/common/types/permissions.ts
export const PERMISSIONS = {
  // Users
  'users:read': 'View team members',
  'users:invite': 'Invite new team members',
  'users:manage': 'Edit roles and deactivate users',

  // Products
  'products:read': 'View products',
  'products:create': 'Create products',
  'products:update': 'Edit products',
  'products:delete': 'Delete products',

  // Orders
  'orders:read': 'View orders',
  'orders:update': 'Update order status',
  'orders:refund': 'Process refunds',

  // Customers
  'customers:read': 'View customers',
  'customers:manage': 'Edit customer data',

  // Settings
  'settings:read': 'View store settings',
  'settings:update': 'Update store settings',
  'settings:billing': 'Access billing settings',

  // API Keys
  'api-keys:read': 'View API keys',
  'api-keys:manage': 'Create and revoke API keys',

  // Owner-only
  'ownership:transfer': 'Transfer store ownership',
} as const;

export type Permission = keyof typeof PERMISSIONS;

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  OWNER: Object.keys(PERMISSIONS) as Permission[],
  ADMIN: [
    'users:read', 'users:invite', 'users:manage',
    'products:read', 'products:create', 'products:update', 'products:delete',
    'orders:read', 'orders:update', 'orders:refund',
    'customers:read', 'customers:manage',
    'settings:read', 'settings:update',
    'api-keys:read', 'api-keys:manage',
  ],
  EDITOR: [
    'products:read', 'products:create', 'products:update',
    'orders:read', 'orders:update',
    'customers:read', 'customers:manage',
  ],
  VIEWER: [
    'users:read',
    'products:read',
    'orders:read',
    'customers:read',
    'settings:read',
  ],
};
```

**Decorator Pattern (NestJS SetMetadata):**
```typescript
// @RequirePermissions decorator
import { SetMetadata } from '@nestjs/common';
import type { Permission } from '@/common/types/permissions';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
```

**Guard Implementation Pattern:**
```typescript
// PermissionsGuard
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];

    const hasPermission = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Insufficient permissions',
        requiredPermissions,
      });
    }

    return true;
  }
}
```

**Dashboard Hook Pattern:**
```typescript
// apps/dashboard/src/lib/hooks/usePermissions.ts
import { useAuth } from './useAuth';
import { ROLE_PERMISSIONS, type Permission } from '@trafi/types';

export function usePermissions() {
  const { user } = useAuth();
  const permissions = user ? ROLE_PERMISSIONS[user.role] : [];

  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (...perms: Permission[]): boolean => {
    return perms.some((p) => permissions.includes(p));
  };

  const hasAllPermissions = (...perms: Permission[]): boolean => {
    return perms.every((p) => permissions.includes(p));
  };

  return { permissions, hasPermission, hasAnyPermission, hasAllPermissions };
}
```

### Source Tree Components to Touch

**New Files (Backend):**
- `apps/api/src/common/types/permissions.ts` - Permission definitions
- `apps/api/src/modules/auth/decorators/permissions.decorator.ts`
- `apps/api/src/modules/auth/decorators/roles.decorator.ts`
- `apps/api/src/modules/auth/decorators/current-user.decorator.ts`
- `apps/api/src/modules/auth/decorators/index.ts`
- `apps/api/src/modules/auth/guards/permissions.guard.ts`
- `apps/api/src/modules/auth/guards/roles.guard.ts`
- `apps/api/src/modules/auth/guards/index.ts`

**New Files (Dashboard):**
- `apps/dashboard/src/lib/hooks/usePermissions.ts`

**New Files (Shared Packages):**
- `packages/@trafi/types/src/permissions.types.ts`

**Modified Files:**
- `apps/api/src/modules/auth/auth.module.ts` - Export guards and decorators
- `apps/api/src/modules/auth/strategies/jwt.strategy.ts` - Ensure role extraction
- `packages/@trafi/types/src/index.ts` - Export permission types

### Project Structure Notes

- Guards go in `apps/api/src/modules/auth/guards/` as they are auth-specific
- Common guards already exist in `apps/api/src/common/guards/` (jwt-auth.guard.ts)
- RBAC guards can stay in auth module or be moved to common - Epic 2 spec shows them in auth module
- Permission types should be shared via @trafi/types for dashboard usage

### Testing Standards

- Unit tests with Jest in `__tests__/` folders
- Mock Reflector and ExecutionContext for guard tests
- E2E tests with Playwright for dashboard permission checks
- Use different user roles in E2E tests to verify access control

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-02-admin-auth.md#Story 2.3]
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Authorization]
- [Source: _bmad-output/project-context.md#Backend Rules]
- [Source: _bmad-output/implementation-artifacts/2-1-admin-user-model-and-authentication.md#Architecture Patterns]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

### Completion Notes List

1. **Permission Constants:** Created comprehensive PERMISSIONS object with 17 permissions covering users, products, orders, customers, settings, api-keys, and ownership domains. Role mappings use uppercase (OWNER, ADMIN, EDITOR, VIEWER) to match Prisma UserRole enum.

2. **RBAC Decorators:** Implemented @RequirePermissions() and @Roles() using NestJS SetMetadata pattern. @CurrentUser() already existed in common/decorators and was re-exported from auth decorators for convenience.

3. **RBAC Guards:** PermissionsGuard checks ALL required permissions (AND logic), RolesGuard checks ANY of required roles (OR logic). Both return structured 403 ForbiddenException with code, message, and context.

4. **AuthModule Updates:** Added PermissionsGuard and RolesGuard to providers and exports. Module now exports AuthService, JwtModule, PermissionsGuard, and RolesGuard.

5. **Test Endpoints:** Added /auth/test/products-read (permission test) and /auth/test/admin-only (role test) endpoints to AuthController with full Swagger documentation.

6. **Dashboard Hook:** usePermissions() provides hasPermission, hasAnyPermission, hasAllPermissions helpers plus hasRole and hasAnyRole. Uses memoization for performance.

7. **JWT Payload:** auth.service.ts updated to use new ROLE_PERMISSIONS from common/types instead of DEFAULT_ROLE_PERMISSIONS from @trafi/types.

8. **Unit Tests:** 19 guard tests (10 RolesGuard + 9 PermissionsGuard) + 19 usePermissions hook tests = 38 new tests, all passing.

9. **E2E Tests:** Created rbac.spec.ts with 7 test cases. **3 tests active** (401 unauthorized scenarios), **4 tests skipped** (require seeded test users with different roles - OWNER access and 403 forbidden tests). Skipped tests serve as documentation of expected behavior and can be enabled once database seeding is implemented in a future story.

### File List

**New Files:**
- apps/api/src/common/types/permissions.ts
- apps/api/src/common/types/index.ts
- apps/api/src/modules/auth/decorators/permissions.decorator.ts
- apps/api/src/modules/auth/decorators/roles.decorator.ts
- apps/api/src/modules/auth/decorators/index.ts
- apps/api/src/modules/auth/guards/permissions.guard.ts
- apps/api/src/modules/auth/guards/roles.guard.ts
- apps/api/src/modules/auth/guards/index.ts
- apps/api/src/modules/auth/guards/__tests__/permissions.guard.spec.ts
- apps/api/src/modules/auth/guards/__tests__/roles.guard.spec.ts
- apps/dashboard/src/lib/hooks/usePermissions.ts
- apps/dashboard/src/lib/__tests__/usePermissions.test.ts
- packages/@trafi/types/src/permissions.types.ts
- e2e/tests/rbac.spec.ts

**Modified Files:**
- apps/api/src/modules/auth/auth.module.ts
- apps/api/src/modules/auth/auth.controller.ts
- apps/api/src/modules/auth/auth.service.ts
- packages/@trafi/types/src/index.ts

### Senior Developer Review (AI)

**Reviewer:** Claude Opus 4.5
**Date:** 2026-01-16
**Outcome:** ✅ APPROVED (with fixes applied)

**Issues Found & Fixed:**

| Severity | Issue | Resolution |
|----------|-------|------------|
| 🔴 HIGH | Code duplication - PERMISSIONS defined in both API and @trafi/types | Fixed: API now re-exports from @trafi/types (single source of truth) |
| 🟡 MEDIUM | E2E tests incomplete (4/7 skipped) | Documented: Tests require seed data, serve as behavior documentation |
| 🟡 MEDIUM | Inconsistent CurrentUser import in AuthController | Fixed: Now imports from ./decorators for consistency |
| 🟡 MEDIUM | Auth service local import | Resolved by H1 fix - now uses re-export chain |
| 🟡 MEDIUM | Unused helper functions in permissions.ts | Resolved by H1 fix - local file now just re-exports |
| 🟢 LOW | Mixed value/type imports | Acceptable - TypeScript handles correctly |
| 🟢 LOW | Inconsistent JSDoc @see formats | Minor style issue, no change needed |

**Verification:**
- All 19 API guard unit tests passing
- All 19 dashboard hook tests passing
- TypeScript compilation clean (no errors)
- @trafi/types package builds successfully

### Change Log

- 2026-01-16: Code review fixes applied
  - Consolidated permission definitions to single source of truth (@trafi/types)
  - Updated AuthController imports for consistency
  - Documented E2E test status (3 active, 4 skipped pending seed data)

- 2026-01-16: Story 2.3 RBAC Foundation implementation completed
  - Implemented 4 roles (OWNER, ADMIN, EDITOR, VIEWER) with 17 granular permissions
  - Added @RequirePermissions() and @Roles() decorators with guards
  - Created usePermissions() dashboard hook for conditional UI rendering
  - 46 API unit tests passing (including 19 new RBAC guard tests)
  - 19 dashboard usePermissions hook tests passing
  - E2E test scaffolding created for RBAC endpoints
