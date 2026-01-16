# Story 2.4: Admin User Management

Status: done

## Story

As an **Owner/Admin**,
I want **to create, edit, and deactivate admin user accounts**,
So that **I can manage my team's access to the store**.

## Acceptance Criteria

1. **Given** an Owner or Admin is authenticated
   **When** they access the Users management page
   **Then** they can view all users with their roles and status

2. **Given** an Owner or Admin has users:invite permission
   **When** they submit a valid invite form
   **Then** a new user is created with INVITED status
   **And** an invitation email is sent (or logged for dev)
   **And** the users list refreshes to show the new user

3. **Given** an Owner or Admin has users:manage permission
   **When** they change a user's role
   **Then** the role is updated
   **And** they cannot elevate beyond their own role (Admin cannot create Owner)
   **And** the change is reflected immediately

4. **Given** an Owner or Admin has users:manage permission
   **When** they deactivate a user
   **Then** the user status becomes INACTIVE
   **And** the user can no longer log in
   **And** at least one Owner must always exist (cannot deactivate last Owner)

5. **Given** the Users page is loaded
   **When** data is being fetched
   **Then** skeleton loading states are shown
   **And** errors display user-friendly messages

## Tasks / Subtasks

- [x] **Task 1: Backend - User Service Extension** (AC: #1, #2, #3, #4)
  - [x] 1.1 Create `apps/api/src/modules/user/user.module.ts`
  - [x] 1.2 Create `apps/api/src/modules/user/user.service.ts` with protected methods
  - [x] 1.3 Create `apps/api/src/modules/user/user.controller.ts` with REST endpoints
  - [x] 1.4 Implement `list(storeId, pagination)` - fetch users with roles/status
  - [x] 1.5 Implement `invite(storeId, inviterUserId, input)` - create INVITED user
  - [x] 1.6 Implement `updateRole(storeId, currentUserId, targetUserId, newRole)`
  - [x] 1.7 Implement `deactivate(storeId, currentUserId, targetUserId)`
  - [x] 1.8 Add role hierarchy validation (Admin cannot create/promote to Owner)
  - [x] 1.9 Add last Owner protection

- [x] **Task 2: Backend - Zod Validators** (AC: #1, #2, #3)
  - [x] 2.1 Create `packages/@trafi/validators/src/user/index.ts`
  - [x] 2.2 Add `InviteUserSchema` (email, role, message?)
  - [x] 2.3 Add `UpdateUserRoleSchema` (userId, role)
  - [x] 2.4 Add `ListUsersSchema` (page, limit, status?)
  - [x] 2.5 Export from `packages/@trafi/validators/src/index.ts`

- [x] **Task 3: Backend - API Endpoints** (AC: #1, #2, #3, #4)
  - [x] 3.1 `GET /users` - list users (requires users:read)
  - [x] 3.2 `POST /users/invite` - invite user (requires users:invite)
  - [x] 3.3 `PATCH /users/:id/role` - update role (requires users:manage)
  - [x] 3.4 `PATCH /users/:id/deactivate` - deactivate (requires users:manage)
  - [x] 3.5 Apply @RequirePermissions decorators from Story 2.3
  - [x] 3.6 Add full Swagger documentation with @ApiTags, @ApiOperation, @ApiResponse

- [x] **Task 4: Dashboard - Server Actions** (AC: #1, #2, #3, #4)
  - [x] 4.1 Create `apps/dashboard/src/app/(dashboard)/settings/users/_actions/user-actions.ts`
  - [x] 4.2 Implement `getUsersAction(input: ListUsersInput)`
  - [x] 4.3 Implement `inviteUserAction(input: InviteUserInput)`
  - [x] 4.4 Implement `updateUserRoleAction(input: UpdateUserRoleInput)`
  - [x] 4.5 Implement `deactivateUserAction(userId: string)`

- [x] **Task 5: Dashboard - Custom Hooks** (AC: #1, #2, #3, #4)
  - [x] 5.1 Create `apps/dashboard/src/app/(dashboard)/settings/users/_hooks/useUsers.ts`
  - [x] 5.2 Create `_hooks/useInviteUser.ts` with query invalidation
  - [x] 5.3 Create `_hooks/useUpdateUserRole.ts` with query invalidation
  - [x] 5.4 Create `_hooks/useDeactivateUser.ts` with query invalidation

- [x] **Task 6: Dashboard - Users Page and Components** (AC: #1, #5)
  - [x] 6.1 Create `apps/dashboard/src/app/(dashboard)/settings/users/page.tsx` (RSC)
  - [x] 6.2 Create `_components/UsersTable.tsx` (Client, DataTable)
  - [x] 6.3 Create `_components/UsersTableSkeleton.tsx`
  - [x] 6.4 Create `_components/UserStatusBadge.tsx` (ACTIVE/INACTIVE/INVITED)
  - [x] 6.5 Create `_components/UserRoleBadge.tsx`

- [x] **Task 7: Dashboard - Invite User Dialog** (AC: #2)
  - [x] 7.1 Create `_components/InviteUserDialog.tsx`
  - [x] 7.2 Add email input with validation
  - [x] 7.3 Add role select (filter based on current user's role)
  - [x] 7.4 Add optional message textarea
  - [x] 7.5 Handle success/error states with toast

- [x] **Task 8: Dashboard - Edit Role Dialog** (AC: #3)
  - [x] 8.1 Create `_components/EditUserRoleDialog.tsx`
  - [x] 8.2 Add role select (disable roles above current user's role)
  - [x] 8.3 Confirm with save button

- [x] **Task 9: Dashboard - Deactivate User Dialog** (AC: #4)
  - [x] 9.1 Create `_components/DeactivateUserDialog.tsx`
  - [x] 9.2 Add confirmation message with user name
  - [x] 9.3 Prevent deactivation of last Owner

- [x] **Task 10: Backend Unit Tests** (AC: #1, #2, #3, #4)
  - [x] 10.1 Create `apps/api/src/modules/user/__tests__/user.service.spec.ts`
  - [x] 10.2 Test list users with pagination
  - [x] 10.3 Test invite user creates INVITED status
  - [x] 10.4 Test role update hierarchy enforcement
  - [x] 10.5 Test deactivation last Owner protection

- [x] **Task 11: Dashboard Unit Tests** (AC: #1, #5)
  - [x] 11.1 Test UsersTable rendering with mock data
  - [x] 11.2 Test useUsers hook returns correct structure
  - [x] 11.3 Test mutation hooks call correct actions

- [x] **Task 12: E2E Tests** (AC: #1, #2, #3, #4)
  - [x] 12.1 Create `e2e/tests/user-management.spec.ts`
  - [x] 12.2 Test Owner can view users page
  - [x] 12.3 Test invite user flow
  - [x] 12.4 Test role change flow
  - [x] 12.5 Test deactivate user flow

## Dev Notes

### Architecture Patterns (CRITICAL)

**RETRO-2:** All services MUST use `protected` methods for @trafi/core extensibility:
```typescript
@Injectable()
export class UserService {
  protected async validateRoleHierarchy(currentRole: UserRole, targetRole: UserRole): Promise<boolean> {
    // Logic here - can be overridden by merchants
  }

  public async invite(storeId: string, inviterId: string, input: InviteUserInput) {
    // Public API using protected helpers
  }
}
```

**RETRO-3:** Export explicit public API from modules:
```typescript
// user.module.ts exports
exports: [UserService, USER_SERVICE]  // Export service + token
```

### Data Flow Pattern (Dashboard)

```
UsersTable.tsx (Client)
  └─► useUsers() hook
       └─► useServerActionQuery(getUsersAction)
            └─► getUsersAction() (Server Action)
                 └─► fetch(`${API_URL}/users`)
                      └─► UserController.list() (NestJS)
                           └─► UserService.list()
```

### Permission Checks (CRITICAL)

**Reuse from Story 2.3:**
- `@RequirePermissions('users:read')` for list endpoint
- `@RequirePermissions('users:invite')` for invite endpoint
- `@RequirePermissions('users:manage')` for role update and deactivate

**Import guards from:**
```typescript
import { RequirePermissions } from '@/modules/auth/decorators';
import { PermissionsGuard } from '@/modules/auth/guards';
```

### Role Hierarchy Enforcement

```typescript
// Role hierarchy (higher = more powerful)
const ROLE_HIERARCHY = {
  VIEWER: 0,
  EDITOR: 1,
  ADMIN: 2,
  OWNER: 3,
};

// Admin (level 2) cannot create/promote to Owner (level 3)
function canAssignRole(currentRole: UserRole, targetRole: UserRole): boolean {
  return ROLE_HIERARCHY[currentRole] >= ROLE_HIERARCHY[targetRole];
}
```

### Last Owner Protection

```typescript
async deactivate(storeId: string, userId: string, targetUserId: string) {
  const targetUser = await this.prisma.user.findUnique({ where: { id: targetUserId, storeId } });

  if (targetUser.role === 'OWNER') {
    const ownerCount = await this.prisma.user.count({
      where: { storeId, role: 'OWNER', status: 'ACTIVE' }
    });
    if (ownerCount <= 1) {
      throw new BadRequestException('Cannot deactivate the last Owner');
    }
  }

  return this.prisma.user.update({
    where: { id: targetUserId },
    data: { status: 'INACTIVE' }
  });
}
```

### File Structure

```
apps/api/src/modules/user/
├── user.module.ts
├── user.service.ts           # Protected methods
├── user.controller.ts        # REST endpoints
├── dto/
│   ├── index.ts
│   ├── invite-user.dto.ts    # Swagger DTO
│   ├── update-role.dto.ts
│   └── user-response.dto.ts
└── __tests__/
    └── user.service.spec.ts

apps/dashboard/src/app/(dashboard)/settings/users/
├── page.tsx                  # RSC
├── _components/
│   ├── UsersTable.tsx        # Client
│   ├── UsersTableSkeleton.tsx
│   ├── InviteUserDialog.tsx  # Client
│   ├── EditUserRoleDialog.tsx
│   ├── DeactivateUserDialog.tsx
│   ├── UserStatusBadge.tsx
│   └── UserRoleBadge.tsx
├── _hooks/
│   ├── useUsers.ts
│   ├── useInviteUser.ts
│   ├── useUpdateUserRole.ts
│   └── useDeactivateUser.ts
└── _actions/
    └── user-actions.ts
```

### UX Implementation (Digital Brutalism v2)

**Layout:**
- Rail (64px) + Sidebar (240px) + Main content
- Breadcrumb: Dashboard > Settings > Users
- Page title with "Invite User" action button

**Visual Design:**
- Background: #000000 (pure black)
- Borders: #333333 (1px visible grid)
- Text: #FFFFFF (pure white)
- Monospace: JetBrains Mono for emails, IDs
- Border-radius: 0px EVERYWHERE

**Status Badges:**
```tsx
// UserStatusBadge.tsx
const STATUS_STYLES = {
  ACTIVE: 'bg-[#00FF94]/20 text-[#00FF94] border-[#00FF94]',
  INACTIVE: 'bg-neutral-800 text-neutral-500 border-neutral-600',
  INVITED: 'bg-[#CCFF00]/20 text-[#CCFF00] border-[#CCFF00]',
};
```

**Role Badges:**
```tsx
// UserRoleBadge.tsx - Uppercase, monospace
<span className="font-mono text-xs uppercase tracking-wider">
  {role}
</span>
```

**DataTable:**
- Use Shadcn DataTable component
- Columns: Email, Name, Role, Status, Actions
- Actions dropdown: Edit Role, Deactivate

**Dialogs:**
- Use Shadcn Dialog
- Black background (#000), white border (#333)
- Acid lime (#CCFF00) for primary action buttons
- Red (#FF3366) for destructive actions

### Query Invalidation Pattern (TanStack Query)

```typescript
// useInviteUser.ts
export function useInviteUser() {
  const queryClient = useQueryClient();

  return useServerActionMutation(inviteUserAction, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Invitation envoyée');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
```

### Swagger Documentation (MANDATORY)

```typescript
// user.controller.ts
@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class UserController {
  @Get()
  @RequirePermissions('users:read')
  @ApiOperation({ summary: 'List store users', description: 'Returns paginated list of users for the authenticated store' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, description: 'Users list', type: UsersListResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async list(@Query() query: ListUsersDto, @CurrentUser('storeId') storeId: string) {
    return this.userService.list(storeId, query);
  }
}
```

### Previous Story Learnings (CRITICAL)

**From Story 2.1:**
- JWT payload includes: sub, tenantId, role, permissions, type
- AuthService methods are `protected` for override
- bcrypt with 10 rounds for password hashing
- Generic error messages (don't reveal if email exists)

**From Story 2.2:**
- Session management with `jose` (not jsonwebtoken)
- CSRF token in non-httpOnly cookie for double-submit pattern
- Middleware redirects unauthenticated to /login
- `getSession()` available in RSC for user data

**From Story 2.3:**
- PERMISSIONS and ROLE_PERMISSIONS in `@trafi/types/src/permissions.types.ts`
- PermissionsGuard and RolesGuard in `apps/api/src/modules/auth/guards/`
- @RequirePermissions decorator in `apps/api/src/modules/auth/decorators/`
- usePermissions hook for conditional UI rendering

### API Base URL

```typescript
// Server actions use env variable
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// In server action
const response = await fetch(`${API_URL}/users`, {
  headers: {
    Authorization: `Bearer ${session.accessToken}`,
    'Content-Type': 'application/json',
  },
});
```

### Testing Patterns

**Unit Tests (Jest):**
```typescript
// user.service.spec.ts
describe('UserService', () => {
  describe('invite', () => {
    it('should create user with INVITED status', async () => {
      // Mock PrismaService
      // Call service.invite()
      // Assert user.status === 'INVITED'
    });

    it('should prevent Admin from inviting Owner', async () => {
      // Setup Admin context
      // Attempt to invite with role=OWNER
      // Assert ForbiddenException thrown
    });
  });

  describe('deactivate', () => {
    it('should prevent deactivating last Owner', async () => {
      // Setup: only 1 Owner exists
      // Attempt to deactivate
      // Assert BadRequestException
    });
  });
});
```

**E2E Tests (Playwright):**
```typescript
// user-management.spec.ts
test.describe('User Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Owner
  });

  test('Owner can invite new Admin', async ({ page }) => {
    await page.goto('/settings/users');
    await page.click('[data-testid="invite-user-button"]');
    await page.fill('[name="email"]', 'newadmin@test.com');
    await page.selectOption('[name="role"]', 'ADMIN');
    await page.click('[data-testid="invite-submit"]');
    await expect(page.getByText('Invitation envoyée')).toBeVisible();
  });
});
```

### Environment Variables

Already set from Story 2.1/2.2:
```env
JWT_SECRET=...
JWT_REFRESH_SECRET=...
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Common Pitfalls to Avoid

1. **DON'T** allow role self-modification to higher role
2. **DON'T** forget tenant isolation - always filter by storeId
3. **DON'T** use jsonwebtoken in dashboard - use jose
4. **DON'T** store server state in Zustand - use React Query
5. **DON'T** create types locally - import from @trafi/types
6. **DON'T** skip Swagger documentation on endpoints
7. **DON'T** forget to invalidate queries after mutations

### Git Commit Pattern

```
feat(epic-2): Story 2.4 - Admin user management

- Add UserModule with list, invite, updateRole, deactivate
- Implement role hierarchy and last Owner protection
- Create dashboard users page with DataTable
- Add invite, edit role, deactivate dialogs
- Write unit and E2E tests for user management
```

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-02-admin-auth.md#Story 2.4]
- [Source: _bmad-output/planning-artifacts/architecture.md#Multi-tenancy]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Digital Brutalism]
- [Source: _bmad-output/project-context.md#NestJS Backend Rules]
- [Source: _bmad-output/implementation-artifacts/2-3-role-based-access-control-rbac-foundation.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

- All 12 tasks completed successfully
- Backend: 59 API tests passing (including 13 new user service tests)
- Dashboard: 75 tests passing (including 27 new user management tests)
- Role hierarchy validation implemented (Admin cannot assign Owner)
- Last Owner protection implemented (BadRequestException when attempting to deactivate)
- Dashboard components follow Digital Brutalism v2 design system
- All TypeScript compiles without errors
- E2E tests created with 19 test cases (API + UI flows)

### Code Review Fixes Applied

**Reviewed by:** Adversarial Code Review (Claude Opus 4.5)
**Review Date:** 2026-01-16

**Issues Found & Fixed:**
1. **HIGH-1:** Dashboard unit tests missing (Task 11) - FIXED: Created 3 test files with 27 tests
2. **HIGH-2:** `app.module.ts` UserModule import not committed - FIXED: Added to commit
3. **MEDIUM-1:** InviteUserDialog role filter too restrictive for VIEWER - FIXED: Changed `<` to `<=`
4. **MEDIUM-2:** `name` field missing from InviteUserDto - FIXED: Added field with Swagger docs

### File List

**Backend (API):**
- `apps/api/src/modules/user/user.module.ts`
- `apps/api/src/modules/user/user.service.ts`
- `apps/api/src/modules/user/user.controller.ts`
- `apps/api/src/modules/user/dto/index.ts`
- `apps/api/src/modules/user/dto/invite-user.dto.ts`
- `apps/api/src/modules/user/dto/update-role.dto.ts`
- `apps/api/src/modules/user/dto/list-users.dto.ts`
- `apps/api/src/modules/user/dto/user-response.dto.ts`
- `apps/api/src/modules/user/__tests__/user.service.spec.ts`

**Validators Package:**
- `packages/@trafi/validators/src/user/index.ts`
- `packages/@trafi/validators/src/user/user-response.schema.ts`
- `packages/@trafi/validators/src/user/list-users.schema.ts`
- `packages/@trafi/validators/src/user/update-role.schema.ts`

**Dashboard:**
- `apps/dashboard/src/app/(dashboard)/settings/users/page.tsx`
- `apps/dashboard/src/app/(dashboard)/settings/users/_components/index.ts`
- `apps/dashboard/src/app/(dashboard)/settings/users/_components/UsersTable.tsx`
- `apps/dashboard/src/app/(dashboard)/settings/users/_components/UsersTableSkeleton.tsx`
- `apps/dashboard/src/app/(dashboard)/settings/users/_components/UserStatusBadge.tsx`
- `apps/dashboard/src/app/(dashboard)/settings/users/_components/UserRoleBadge.tsx`
- `apps/dashboard/src/app/(dashboard)/settings/users/_components/InviteUserDialog.tsx`
- `apps/dashboard/src/app/(dashboard)/settings/users/_components/EditUserRoleDialog.tsx`
- `apps/dashboard/src/app/(dashboard)/settings/users/_components/DeactivateUserDialog.tsx`
- `apps/dashboard/src/app/(dashboard)/settings/users/_actions/user-actions.ts`
- `apps/dashboard/src/app/(dashboard)/settings/users/_hooks/index.ts`
- `apps/dashboard/src/app/(dashboard)/settings/users/_hooks/useUsers.ts`
- `apps/dashboard/src/app/(dashboard)/settings/users/_hooks/useInviteUser.ts`
- `apps/dashboard/src/app/(dashboard)/settings/users/_hooks/useUpdateUserRole.ts`
- `apps/dashboard/src/app/(dashboard)/settings/users/_hooks/useDeactivateUser.ts`
- `apps/dashboard/src/components/ui/dialog.tsx`
- `apps/dashboard/src/components/ui/select.tsx`

**Dashboard Unit Tests (added via code review):**
- `apps/dashboard/src/app/(dashboard)/settings/users/_components/__tests__/UsersTable.test.tsx`
- `apps/dashboard/src/app/(dashboard)/settings/users/_hooks/__tests__/useUsers.test.tsx`
- `apps/dashboard/src/app/(dashboard)/settings/users/_hooks/__tests__/useMutationHooks.test.tsx`

**E2E Tests:**
- `e2e/tests/user-management.spec.ts`

**Modified:**
- `apps/api/src/app.module.ts` (import UserModule)
- `apps/dashboard/src/lib/hooks/index.ts` (export usePermissions)
- `apps/dashboard/src/lib/hooks/usePermissions.ts` (add userRole alias)
- `packages/@trafi/validators/src/auth/register.schema.ts` (add message field)
- `packages/@trafi/validators/src/index.ts` (export user schemas)

