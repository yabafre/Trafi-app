# Epic 2: Admin Authentication & Store Setup

Admin peut se connecter au dashboard, configurer le store, et gerer les acces utilisateurs avec RBAC.

**FRs covered:** FR35, FR36, FR37, FR38, FR39, FR40

**Revision:** v2.0 (2026-01-15) - UX Brutalist v2 Alignment

---

## Epic Implementation Guidelines

### Retrospective Learnings (MANDATORY)
- **RETRO-1:** Use Context7 MCP before implementing bcrypt, @nestjs/jwt, @nestjs/passport
- **RETRO-2:** All services use `protected` methods for future @trafi/core extensibility
- **RETRO-3:** AuthModule exports explicit public API (AuthService, Guards, Decorators)
- **RETRO-4:** Dashboard components accept customization props
- **RETRO-5:** Login page uses composition pattern (wrappable by future @trafi/core consumers)
- **RETRO-6:** Code with Override Kernel patterns in mind

### UX Design Requirements (Dashboard - Digital Brutalism v2)

**Brutalist Manifesto:**
- The interface is a machine. No decoration, only data and action.
- Radius-zero everywhere — everything is a rectangle.
- Visible grid — 1px borders expose structure.
- High contrast — pure black background, pure white text.

**Layout:**
- **UX-1:** Pure Black (#000000) background — the interface is a machine
- **UX-2:** Layout: Rail (64px) + Sidebar (240px) + Main content
- **UX-3:** Topbar with breadcrumb + action buttons
- **UX-4:** Status badges: ACTIVE (#00FF94), INACTIVE (gray), PENDING (#CCFF00)
- **UX-5:** Visible grid structure with 1px borders (#333333)
- **UX-6:** Login form centered, minimal, brutal aesthetic

**Visual Design:**
- **UX-COLOR-1:** Primary Acid Lime #CCFF00 for action buttons, focus states
- **UX-COLOR-2:** Background #000000, borders #333333, text #FFFFFF
- **UX-COLOR-3:** Success #00FF94, Warning #CCFF00, Error #FF3366
- **UX-TYPE-1:** JetBrains Mono for data, credentials, IDs
- **UX-TYPE-2:** System font (Inter/SF Pro) for labels, descriptions
- **UX-RADIUS:** 0px everywhere — `border-radius: 0px !important`
- **UX-SHADOW:** None — elements sit firmly in the grid

**Animation (Minimal):**
- **UX-ANIM-1:** Hover: instant state change (no slow transitions)
- **UX-ANIM-2:** Focus: border color change to #CCFF00
- **UX-ANIM-3:** All respect `prefers-reduced-motion`

---

## Story 2.1: Admin User Model and Authentication

As an **Admin**,
I want **to log in to the dashboard with email and password**,
So that **I can securely access my store's administration**.

**Acceptance Criteria:**

**Given** the Admin user model exists in the database
**When** an admin submits valid credentials on the login form
**Then** a JWT session is created and stored securely
**And** the admin is redirected to the dashboard home
**And** invalid credentials display an appropriate error message
**And** passwords are hashed with bcrypt (min 10 rounds)

---

## Story 2.2: Dashboard Authentication Guard

As a **System**,
I want **all dashboard routes protected by authentication**,
So that **only authenticated admins can access admin features**.

**Acceptance Criteria:**

**Given** an unauthenticated user attempts to access a dashboard route
**When** the request is processed
**Then** the user is redirected to the login page
**And** authenticated users can access protected routes
**And** session expiration triggers re-authentication
**And** CSRF protection is applied to all state-changing operations (NFR-SEC-11)

---

### Technical Implementation

#### File Structure
```
apps/dashboard/src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   ├── page.tsx                    # Login page (RSC)
│   │   │   ├── _components/
│   │   │   │   ├── LoginForm.tsx           # Client component
│   │   │   │   └── LoginFormSkeleton.tsx
│   │   │   ├── _hooks/
│   │   │   │   └── useLogin.ts             # Auth mutation hook
│   │   │   └── _actions/
│   │   │       └── auth-actions.ts         # Server actions
│   │   └── layout.tsx                      # Auth layout (centered)
│   ├── (dashboard)/
│   │   └── layout.tsx                      # Protected layout
│   └── layout.tsx
├── lib/
│   ├── auth.ts                             # Session helpers
│   ├── csrf.ts                             # CSRF token management
│   └── hooks/
│       └── useAuth.ts                      # Global auth hook
├── middleware.ts                           # Next.js middleware for route protection
└── providers/
    └── AuthProvider.tsx                    # Auth context
```

#### Zod Schemas (@trafi/validators)
```typescript
// packages/@trafi/validators/src/auth/login.schema.ts
import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Minimum 8 caractères'),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const SessionSchema = z.object({
  userId: z.string(),
  tenantId: z.string(),
  role: z.enum(['owner', 'admin', 'editor', 'viewer']),
  permissions: z.array(z.string()),
  expiresAt: z.string().datetime(),
});

export type Session = z.infer<typeof SessionSchema>;
```

#### Backend (NestJS)
```typescript
// apps/api/src/modules/auth/auth.router.ts
import { router, publicProcedure } from '@/trpc';
import { LoginSchema } from '@trafi/validators';

export const authRouter = router({
  login: publicProcedure
    .input(LoginSchema)
    .mutation(({ input, ctx }) => ctx.authService.login(input)),

  logout: protectedProcedure
    .mutation(({ ctx }) => ctx.authService.logout(ctx.userId)),

  session: protectedProcedure
    .query(({ ctx }) => ctx.authService.getSession(ctx.userId)),
});
```

#### Dashboard Data Flow
```
LoginForm.tsx (Client)
  └─► useLogin() hook
       └─► useServerActionMutation(loginAction)
            └─► loginAction() (Server Action)
                 └─► trpc.auth.login.mutate()
                      └─► AuthService.login() (NestJS)
```

#### Server Actions
```typescript
// app/(auth)/login/_actions/auth-actions.ts
'use server'

import { trpc } from '@/lib/trpc';
import { cookies } from 'next/headers';
import type { LoginInput } from '@trafi/validators';

export async function loginAction(input: LoginInput) {
  const result = await trpc.auth.login.mutate(input);

  // Set HTTP-only cookie
  cookies().set('session', result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return { success: true, redirectTo: '/dashboard' };
}

export async function logoutAction() {
  await trpc.auth.logout.mutate();
  cookies().delete('session');
  return { success: true, redirectTo: '/login' };
}
```

#### Custom Hooks
```typescript
// app/(auth)/login/_hooks/useLogin.ts
import { useServerActionMutation } from '@/lib/hooks/server-action-hooks';
import { loginAction } from '../_actions/auth-actions';
import { useRouter } from 'next/navigation';

export function useLogin() {
  const router = useRouter();

  return useServerActionMutation(loginAction, {
    onSuccess: (data) => {
      router.push(data.redirectTo);
    },
    onError: (error) => {
      // Error handled in component
    },
  });
}
```

#### Middleware (Route Protection)
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPaths = ['/dashboard', '/products', '/orders', '/settings'];
const authPaths = ['/login', '/forgot-password'];

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session');
  const isProtected = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );
  const isAuthPage = authPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtected && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthPage && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

#### CSRF Protection
```typescript
// lib/csrf.ts
import { cookies, headers } from 'next/headers';
import { randomBytes } from 'crypto';

export function generateCsrfToken(): string {
  const token = randomBytes(32).toString('hex');
  cookies().set('csrf-token', token, { httpOnly: true, sameSite: 'strict' });
  return token;
}

export function validateCsrfToken(): boolean {
  const cookieToken = cookies().get('csrf-token')?.value;
  const headerToken = headers().get('x-csrf-token');
  return cookieToken === headerToken && !!cookieToken;
}
```

---

### UX Implementation

- Login page: dark mode (#0A0A0A), centered card (#1A1A1A, radius 12px)
- Typography: Clash Display "Welcome back", General Sans labels
- Primary button: #F97316 orange, 6px radius
- Error inline: #EF4444
- Loading: skeleton during auth check (200-300ms)
- Success: redirect with toast

---

## Story 2.3: Role-Based Access Control (RBAC) Foundation

As an **Admin**,
I want **users to have specific roles with defined permissions**,
So that **I can control what each team member can do**.

**Acceptance Criteria:**

**Given** the RBAC system is implemented
**When** roles are defined (Owner, Admin, Editor, Viewer)
**Then** each role has specific permission sets:
- Owner: full access including billing and ownership transfer
- Admin: user management, settings, all commerce features
- Editor: product, order, customer management
- Viewer: read-only access to all data
**And** custom decorators enforce permissions on API endpoints
**And** unauthorized actions return 403 Forbidden

---

### Technical Implementation

#### File Structure (Backend)
```
apps/api/src/
├── modules/auth/
│   ├── decorators/
│   │   ├── permissions.decorator.ts     # @RequirePermissions()
│   │   ├── roles.decorator.ts           # @Roles()
│   │   └── current-user.decorator.ts    # @CurrentUser()
│   ├── guards/
│   │   ├── jwt-auth.guard.ts            # JWT validation
│   │   ├── roles.guard.ts               # Role checking
│   │   └── permissions.guard.ts         # Permission checking
│   ├── strategies/
│   │   └── jwt.strategy.ts              # Passport JWT strategy
│   └── auth.module.ts
├── common/
│   └── types/
│       └── permissions.ts               # Permission definitions
```

#### Permission Definitions
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
  owner: Object.keys(PERMISSIONS) as Permission[],
  admin: [
    'users:read', 'users:invite', 'users:manage',
    'products:read', 'products:create', 'products:update', 'products:delete',
    'orders:read', 'orders:update', 'orders:refund',
    'customers:read', 'customers:manage',
    'settings:read', 'settings:update',
    'api-keys:read', 'api-keys:manage',
  ],
  editor: [
    'products:read', 'products:create', 'products:update',
    'orders:read', 'orders:update',
    'customers:read', 'customers:manage',
  ],
  viewer: [
    'users:read',
    'products:read',
    'orders:read',
    'customers:read',
    'settings:read',
  ],
};
```

#### Decorators
```typescript
// apps/api/src/modules/auth/decorators/permissions.decorator.ts
import { SetMetadata } from '@nestjs/common';
import type { Permission } from '@/common/types/permissions';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

// apps/api/src/modules/auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@trafi/types';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

// apps/api/src/modules/auth/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
```

#### Guards
```typescript
// apps/api/src/modules/auth/guards/permissions.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { ROLE_PERMISSIONS, type Permission } from '@/common/types/permissions';

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

#### Usage in Controllers/Routers
```typescript
// Example usage in tRPC router
export const userRouter = router({
  list: protectedProcedure
    .input(ListUsersSchema)
    .query(({ input, ctx }) => {
      // Permission check via ctx helper
      ctx.requirePermission('users:read');
      return ctx.userService.list(ctx.storeId, input);
    }),
});

// Example usage in NestJS controller
@Controller('products')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProductsController {
  @Get()
  @RequirePermissions('products:read')
  async list(@CurrentUser('storeId') storeId: string) {
    return this.productService.list(storeId);
  }

  @Delete(':id')
  @RequirePermissions('products:delete')
  async delete(@Param('id') id: string, @CurrentUser('storeId') storeId: string) {
    return this.productService.delete(storeId, id);
  }
}
```

#### Dashboard Permission Hook
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

// Usage in components
'use client'
export function DeleteProductButton({ productId }: { productId: string }) {
  const { hasPermission } = usePermissions();

  if (!hasPermission('products:delete')) {
    return null; // Don't render if no permission
  }

  return <Button variant="destructive">Delete</Button>;
}
```

---

## Story 2.4: Admin User Management

As an **Owner/Admin**,
I want **to create, edit, and deactivate admin user accounts**,
So that **I can manage my team's access to the store**.

**Acceptance Criteria:**

**Given** an Owner or Admin is authenticated
**When** they access the Users management page
**Then** they can:
- View all users with their roles and status
- Invite new users via email
- Change user roles (within their permission level)
- Deactivate user accounts
**And** users cannot elevate permissions beyond their own role
**And** at least one Owner must always exist

---

### Technical Implementation

#### File Structure
```
apps/dashboard/src/app/(dashboard)/settings/users/
├── page.tsx                          # RSC - Users list page
├── _components/
│   ├── UsersTable.tsx                # Client - DataTable
│   ├── UsersTableSkeleton.tsx
│   ├── InviteUserDialog.tsx          # Client - Modal
│   ├── EditUserRoleDialog.tsx
│   └── UserStatusBadge.tsx
├── _hooks/
│   ├── useUsers.ts                   # Query: list users
│   ├── useInviteUser.ts              # Mutation: invite
│   ├── useUpdateUserRole.ts          # Mutation: update role
│   └── useDeactivateUser.ts          # Mutation: deactivate
├── _actions/
│   └── user-actions.ts               # Server actions
└── [userId]/
    ├── page.tsx                      # User detail
    └── _components/
        └── UserDetailCard.tsx
```

#### Zod Schemas (@trafi/validators)
```typescript
// packages/@trafi/validators/src/user/index.ts
import { z } from 'zod';

export const UserRoleSchema = z.enum(['owner', 'admin', 'editor', 'viewer']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserStatusSchema = z.enum(['active', 'inactive', 'pending']);
export type UserStatus = z.infer<typeof UserStatusSchema>;

export const InviteUserSchema = z.object({
  email: z.string().email(),
  role: UserRoleSchema,
  message: z.string().optional(),
});
export type InviteUserInput = z.infer<typeof InviteUserSchema>;

export const UpdateUserRoleSchema = z.object({
  userId: z.string(),
  role: UserRoleSchema,
});
export type UpdateUserRoleInput = z.infer<typeof UpdateUserRoleSchema>;

export const ListUsersSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  status: UserStatusSchema.optional(),
});
export type ListUsersInput = z.infer<typeof ListUsersSchema>;
```

#### tRPC Router (NestJS)
```typescript
// apps/api/src/modules/user/user.router.ts
import { router, protectedProcedure } from '@/trpc';
import {
  InviteUserSchema,
  UpdateUserRoleSchema,
  ListUsersSchema,
} from '@trafi/validators';

export const userRouter = router({
  list: protectedProcedure
    .input(ListUsersSchema)
    .query(({ input, ctx }) => {
      ctx.requirePermission('users:read');
      return ctx.userService.list(ctx.storeId, input);
    }),

  invite: protectedProcedure
    .input(InviteUserSchema)
    .mutation(({ input, ctx }) => {
      ctx.requirePermission('users:invite');
      return ctx.userService.invite(ctx.storeId, ctx.userId, input);
    }),

  updateRole: protectedProcedure
    .input(UpdateUserRoleSchema)
    .mutation(({ input, ctx }) => {
      ctx.requirePermission('users:manage');
      return ctx.userService.updateRole(ctx.storeId, ctx.userId, input);
    }),

  deactivate: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(({ input, ctx }) => {
      ctx.requirePermission('users:manage');
      return ctx.userService.deactivate(ctx.storeId, ctx.userId, input.userId);
    }),
});
```

#### Dashboard Data Flow
```
UsersTable.tsx (Client)
  └─► useUsers() hook
       └─► useServerActionQuery(getUsersAction)
            └─► getUsersAction() (Server Action)
                 └─► trpc.users.list.query()
                      └─► UserService.list() (NestJS)
```

#### Server Actions
```typescript
// app/(dashboard)/settings/users/_actions/user-actions.ts
'use server'

import { trpc } from '@/lib/trpc';
import type { InviteUserInput, UpdateUserRoleInput, ListUsersInput } from '@trafi/validators';

export async function getUsersAction(input: ListUsersInput) {
  return trpc.users.list.query(input);
}

export async function inviteUserAction(input: InviteUserInput) {
  return trpc.users.invite.mutate(input);
}

export async function updateUserRoleAction(input: UpdateUserRoleInput) {
  return trpc.users.updateRole.mutate(input);
}

export async function deactivateUserAction(userId: string) {
  return trpc.users.deactivate.mutate({ userId });
}
```

#### Custom Hooks
```typescript
// app/(dashboard)/settings/users/_hooks/useUsers.ts
import { useServerActionQuery } from '@/lib/hooks/server-action-hooks';
import { getUsersAction } from '../_actions/user-actions';

export function useUsers(page: number = 1, limit: number = 20) {
  return useServerActionQuery(getUsersAction, {
    input: { page, limit },
    queryKey: ['users', page, limit],
  });
}

// app/(dashboard)/settings/users/_hooks/useInviteUser.ts
import { useServerActionMutation } from '@/lib/hooks/server-action-hooks';
import { inviteUserAction } from '../_actions/user-actions';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useInviteUser() {
  const queryClient = useQueryClient();

  return useServerActionMutation(inviteUserAction, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Invitation envoyée');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
```

#### Client Component Example
```typescript
// app/(dashboard)/settings/users/_components/UsersTable.tsx
'use client'

import { useUsers } from '../_hooks/useUsers';
import { DataTable } from '@/components/shared/DataTable';
import { UserStatusBadge } from './UserStatusBadge';
import { UsersTableSkeleton } from './UsersTableSkeleton';
import type { User } from '@trafi/types';

const columns = [
  { key: 'email', header: 'Email' },
  { key: 'name', header: 'Nom' },
  { key: 'role', header: 'Rôle' },
  {
    key: 'status',
    header: 'Statut',
    cell: (user: User) => <UserStatusBadge status={user.status} />,
  },
];

export function UsersTable() {
  const { data, isLoading, isError, error } = useUsers();

  if (isLoading) return <UsersTableSkeleton />;
  if (isError) return <div>Erreur: {error.message}</div>;

  return <DataTable columns={columns} data={data.users} />;
}
```

---

### UX Implementation

- **Layout:** Rail (64px) + Sidebar (240px) + Main content
- **Breadcrumb:** Dashboard > Settings > Users
- **DataTable:** Shadcn UI DataTable with pagination
- **Status badges:** active (#22C55E), inactive (gray), pending (#EAB308)
- **Invite modal:** Dialog with frosted glass overlay, form validation
- **Role dropdown:** Shadcn Select with disabled options based on current user role
- **Hover states:** border-color #F97316, translateY(-2px), 200ms transition
- **Loading:** skeleton placeholders matching table structure

---

## Story 2.5: API Key Management

As an **Admin**,
I want **to generate and manage API keys with scoped permissions**,
So that **I can integrate external services securely**.

**Acceptance Criteria:**

**Given** an Admin is authenticated
**When** they access API Keys settings
**Then** they can:
- Generate new API keys with selected permission scopes
- View existing keys (masked, showing only last 4 chars)
- Revoke API keys immediately
- Set expiration dates for keys
**And** API keys are stored hashed in the database
**And** generated keys are shown only once at creation

---

### Technical Implementation

#### File Structure
```
apps/dashboard/src/app/(dashboard)/settings/api-keys/
├── page.tsx                          # RSC - API Keys list page
├── _components/
│   ├── ApiKeysTable.tsx              # Client - DataTable
│   ├── ApiKeysTableSkeleton.tsx
│   ├── CreateApiKeyDialog.tsx        # Client - Modal
│   ├── ApiKeyCreatedModal.tsx        # Shows key once
│   ├── RevokeApiKeyDialog.tsx
│   └── ApiKeyScopesSelect.tsx        # Multi-select for scopes
├── _hooks/
│   ├── useApiKeys.ts                 # Query: list keys
│   ├── useCreateApiKey.ts            # Mutation: create
│   └── useRevokeApiKey.ts            # Mutation: revoke
└── _actions/
    └── api-key-actions.ts            # Server actions

apps/api/src/modules/api-keys/
├── api-keys.module.ts
├── api-keys.service.ts               # protected methods
├── api-keys.router.ts                # tRPC router
├── dto/
│   └── api-key.dto.ts
└── guards/
    └── api-key.guard.ts              # For API key auth
```

#### Zod Schemas (@trafi/validators)
```typescript
// packages/@trafi/validators/src/api-key/index.ts
import { z } from 'zod';

export const ApiKeyScopeSchema = z.enum([
  'products:read',
  'products:write',
  'orders:read',
  'orders:write',
  'customers:read',
  'inventory:read',
  'inventory:write',
]);
export type ApiKeyScope = z.infer<typeof ApiKeyScopeSchema>;

export const CreateApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(ApiKeyScopeSchema).min(1),
  expiresAt: z.string().datetime().optional(), // null = never expires
});
export type CreateApiKeyInput = z.infer<typeof CreateApiKeySchema>;

export const ListApiKeysSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  includeRevoked: z.boolean().default(false),
});
export type ListApiKeysInput = z.infer<typeof ListApiKeysSchema>;

// Response type (key is only in creation response)
export const ApiKeyResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  prefix: z.string(), // "trafi_sk_" + first 8 chars
  lastFourChars: z.string(),
  scopes: z.array(ApiKeyScopeSchema),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime().nullable(),
  lastUsedAt: z.string().datetime().nullable(),
  revokedAt: z.string().datetime().nullable(),
});
export type ApiKeyResponse = z.infer<typeof ApiKeyResponseSchema>;
```

#### Backend Service (NestJS)
```typescript
// apps/api/src/modules/api-keys/api-keys.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { createHash, randomBytes } from 'crypto';
import type { CreateApiKeyInput, ListApiKeysInput } from '@trafi/validators';

@Injectable()
export class ApiKeysService {
  constructor(private prisma: PrismaService) {}

  // Protected for @trafi/core extensibility
  protected generateApiKey(): { key: string; hash: string; prefix: string } {
    const key = `trafi_sk_${randomBytes(32).toString('hex')}`;
    const hash = createHash('sha256').update(key).digest('hex');
    const prefix = key.substring(0, 16);
    return { key, hash, prefix };
  }

  protected async validateKey(key: string): Promise<ApiKey | null> {
    const hash = createHash('sha256').update(key).digest('hex');
    const apiKey = await this.prisma.apiKey.findFirst({
      where: {
        keyHash: hash,
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
    if (apiKey) {
      await this.prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      });
    }
    return apiKey;
  }

  async create(storeId: string, userId: string, input: CreateApiKeyInput) {
    const { key, hash, prefix } = this.generateApiKey();

    const apiKey = await this.prisma.apiKey.create({
      data: {
        storeId,
        createdById: userId,
        name: input.name,
        keyHash: hash,
        keyPrefix: prefix,
        lastFourChars: key.slice(-4),
        scopes: input.scopes,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      },
    });

    // Return key ONLY on creation (never stored in plain text)
    return { ...this.formatResponse(apiKey), key };
  }

  async list(storeId: string, input: ListApiKeysInput) {
    const { page, limit, includeRevoked } = input;
    const where = {
      storeId,
      ...(includeRevoked ? {} : { revokedAt: null }),
    };

    const [keys, total] = await Promise.all([
      this.prisma.apiKey.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.apiKey.count({ where }),
    ]);

    return {
      keys: keys.map(this.formatResponse),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async revoke(storeId: string, keyId: string) {
    return this.prisma.apiKey.update({
      where: { id: keyId, storeId },
      data: { revokedAt: new Date() },
    });
  }

  private formatResponse(key: any): ApiKeyResponse {
    return {
      id: key.id,
      name: key.name,
      prefix: key.keyPrefix,
      lastFourChars: key.lastFourChars,
      scopes: key.scopes,
      createdAt: key.createdAt.toISOString(),
      expiresAt: key.expiresAt?.toISOString() || null,
      lastUsedAt: key.lastUsedAt?.toISOString() || null,
      revokedAt: key.revokedAt?.toISOString() || null,
    };
  }
}
```

#### tRPC Router
```typescript
// apps/api/src/modules/api-keys/api-keys.router.ts
import { router, protectedProcedure } from '@/trpc';
import { CreateApiKeySchema, ListApiKeysSchema } from '@trafi/validators';
import { z } from 'zod';

export const apiKeyRouter = router({
  list: protectedProcedure
    .input(ListApiKeysSchema)
    .query(({ input, ctx }) => {
      ctx.requirePermission('api-keys:read');
      return ctx.apiKeysService.list(ctx.storeId, input);
    }),

  create: protectedProcedure
    .input(CreateApiKeySchema)
    .mutation(({ input, ctx }) => {
      ctx.requirePermission('api-keys:manage');
      return ctx.apiKeysService.create(ctx.storeId, ctx.userId, input);
    }),

  revoke: protectedProcedure
    .input(z.object({ keyId: z.string() }))
    .mutation(({ input, ctx }) => {
      ctx.requirePermission('api-keys:manage');
      return ctx.apiKeysService.revoke(ctx.storeId, input.keyId);
    }),
});
```

#### Dashboard Data Flow
```
CreateApiKeyDialog.tsx (Client)
  └─► useCreateApiKey() hook
       └─► useServerActionMutation(createApiKeyAction)
            └─► createApiKeyAction() (Server Action)
                 └─► trpc.apiKeys.create.mutate()
                      └─► ApiKeysService.create() (NestJS)
                           └─► Returns { ...key, key: "trafi_sk_..." }
                                └─► ApiKeyCreatedModal shows key ONCE
```

#### Server Actions
```typescript
// app/(dashboard)/settings/api-keys/_actions/api-key-actions.ts
'use server'

import { trpc } from '@/lib/trpc';
import type { CreateApiKeyInput, ListApiKeysInput } from '@trafi/validators';

export async function getApiKeysAction(input: ListApiKeysInput) {
  return trpc.apiKeys.list.query(input);
}

export async function createApiKeyAction(input: CreateApiKeyInput) {
  return trpc.apiKeys.create.mutate(input);
}

export async function revokeApiKeyAction(keyId: string) {
  return trpc.apiKeys.revoke.mutate({ keyId });
}
```

#### Custom Hooks
```typescript
// app/(dashboard)/settings/api-keys/_hooks/useApiKeys.ts
import { useServerActionQuery } from '@/lib/hooks/server-action-hooks';
import { getApiKeysAction } from '../_actions/api-key-actions';

export function useApiKeys(page: number = 1) {
  return useServerActionQuery(getApiKeysAction, {
    input: { page, limit: 20 },
    queryKey: ['api-keys', page],
  });
}

// _hooks/useCreateApiKey.ts
import { useServerActionMutation } from '@/lib/hooks/server-action-hooks';
import { createApiKeyAction } from '../_actions/api-key-actions';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export function useCreateApiKey() {
  const queryClient = useQueryClient();
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const mutation = useServerActionMutation(createApiKeyAction, {
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setCreatedKey(data.key); // Show key in modal
    },
  });

  return { ...mutation, createdKey, clearCreatedKey: () => setCreatedKey(null) };
}
```

#### Client Component Example
```typescript
// app/(dashboard)/settings/api-keys/_components/ApiKeyCreatedModal.tsx
'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  apiKey: string | null;
  onClose: () => void;
}

export function ApiKeyCreatedModal({ apiKey, onClose }: Props) {
  const handleCopy = async () => {
    if (apiKey) {
      await navigator.clipboard.writeText(apiKey);
      toast.success('Clé copiée dans le presse-papiers');
    }
  };

  return (
    <Dialog open={!!apiKey} onOpenChange={() => onClose()}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-clash">Clé API créée</DialogTitle>
        </DialogHeader>

        <div className="p-4 bg-warning/10 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Copiez cette clé maintenant. Elle ne sera plus jamais affichée.
          </p>
        </div>

        <div className="flex gap-2">
          <Input
            value={apiKey || ''}
            readOnly
            className="font-mono text-sm"
          />
          <Button variant="outline" size="icon" onClick={handleCopy}>
            <Copy className="w-4 h-4" />
          </Button>
        </div>

        <Button onClick={onClose} className="w-full bg-primary hover:bg-primary/90">
          J'ai copié ma clé
        </Button>
      </DialogContent>
    </Dialog>
  );
}
```

---

### UX Implementation

- **Layout:** Settings page with tab navigation
- **Breadcrumb:** Dashboard > Settings > API Keys
- **Key display:** Masked with last 4 chars visible (`trafi_sk_...abc1`)
- **Scopes multi-select:** Checkbox list with descriptions
- **Created modal:** Warning amber (#EAB308) background for "copy now" alert
- **Revoke:** Confirmation dialog with key name
- **Status indicators:** Active (green dot), Expired (red), Revoked (gray strikethrough)
- **Copy button:** Icon button with toast confirmation

---

## Story 2.6: Tenant-Scoped Authorization

As a **System**,
I want **all API requests scoped to the authenticated tenant**,
So that **stores cannot access each other's data**.

**Acceptance Criteria:**

**Given** a multi-tenant system with isolated stores
**When** any API request is made
**Then** the request is automatically scoped to the authenticated store
**And** database queries include tenant filtering
**And** attempting to access another tenant's resources returns 404
**And** audit logs capture tenant context for all operations (NFR-SEC-7)

---

### Technical Implementation

#### Architecture Overview
```
Request Flow with Tenant Isolation:

1. Request arrives → JWT extracted
2. JwtAuthGuard validates token
3. TenantInterceptor extracts storeId from token
4. TenantContext set in AsyncLocalStorage
5. PrismaService auto-filters queries by storeId
6. AuditInterceptor logs operation with tenant context
```

#### File Structure (Backend)
```
apps/api/src/
├── common/
│   ├── context/
│   │   └── tenant.context.ts          # AsyncLocalStorage for tenant
│   ├── interceptors/
│   │   ├── tenant.interceptor.ts      # Sets tenant context
│   │   └── audit.interceptor.ts       # Logs with tenant context
│   └── decorators/
│       └── tenant.decorator.ts        # @Tenant() decorator
├── prisma/
│   └── prisma.service.ts              # Extended with tenant scoping
```

#### Tenant Context (AsyncLocalStorage)
```typescript
// apps/api/src/common/context/tenant.context.ts
import { AsyncLocalStorage } from 'async_hooks';

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
    throw new Error('Tenant context not available');
  }
  return ctx;
}
```

#### Tenant Interceptor
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

    if (!user?.storeId) {
      return next.handle();
    }

    const tenantData: TenantContextData = {
      storeId: user.storeId,
      userId: user.userId,
      role: user.role,
      requestId: uuidv4(),
    };

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

#### Extended Prisma Service with Auto-Scoping
```typescript
// apps/api/src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { getTenantContext } from '@/common/context/tenant.context';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super();

    // Middleware to auto-filter by storeId
    this.$use(async (params, next) => {
      const ctx = getTenantContext();

      // Skip if no tenant context (e.g., system operations)
      if (!ctx) return next(params);

      // Models that require tenant scoping
      const tenantScopedModels = [
        'Product',
        'Order',
        'Customer',
        'Category',
        'User',
        'ApiKey',
        'Setting',
      ];

      if (!tenantScopedModels.includes(params.model || '')) {
        return next(params);
      }

      // Auto-add storeId filter for read operations
      if (['findUnique', 'findFirst', 'findMany', 'count'].includes(params.action)) {
        params.args = params.args || {};
        params.args.where = {
          ...params.args.where,
          storeId: ctx.storeId,
        };
      }

      // Auto-add storeId for create operations
      if (['create', 'createMany'].includes(params.action)) {
        params.args.data = {
          ...params.args.data,
          storeId: ctx.storeId,
        };
      }

      // Auto-add storeId filter for update/delete operations
      if (['update', 'updateMany', 'delete', 'deleteMany'].includes(params.action)) {
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

#### Audit Interceptor
```typescript
// apps/api/src/common/interceptors/audit.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { getTenantContext } from '../context/tenant.context';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.logAudit(request, 'success', startTime),
        error: (error) => this.logAudit(request, 'error', startTime, error),
      }),
    );
  }

  protected async logAudit(
    request: any,
    status: 'success' | 'error',
    startTime: number,
    error?: Error,
  ) {
    const ctx = getTenantContext();
    if (!ctx) return;

    // Only log state-changing operations
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return;

    await this.prisma.auditLog.create({
      data: {
        storeId: ctx.storeId,
        userId: ctx.userId,
        requestId: ctx.requestId,
        action: `${request.method} ${request.path}`,
        resource: this.extractResource(request.path),
        status,
        durationMs: Date.now() - startTime,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
        errorMessage: error?.message,
        metadata: {
          params: request.params,
          query: request.query,
        },
      },
    });
  }

  private extractResource(path: string): string {
    // /api/products/prod_123 -> 'products'
    const match = path.match(/\/api\/(\w+)/);
    return match ? match[1] : 'unknown';
  }
}
```

#### tRPC Context with Tenant
```typescript
// apps/api/src/trpc/context.ts
import { inferAsyncReturnType } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { getTenantContext } from '@/common/context/tenant.context';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ROLE_PERMISSIONS, Permission } from '@/common/types/permissions';

export const createContext = async ({ req, res }: CreateExpressContextOptions) => {
  const tenantCtx = getTenantContext();

  return {
    req,
    res,
    storeId: tenantCtx?.storeId,
    userId: tenantCtx?.userId,
    role: tenantCtx?.role,

    // Helper to enforce permission
    requirePermission: (permission: Permission) => {
      if (!tenantCtx) {
        throw new ForbiddenException('Authentication required');
      }
      const permissions = ROLE_PERMISSIONS[tenantCtx.role] || [];
      if (!permissions.includes(permission)) {
        throw new ForbiddenException('Insufficient permissions');
      }
    },

    // Helper to ensure resource belongs to tenant
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

#### Usage Example in Service
```typescript
// apps/api/src/modules/products/products.service.ts
@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // No need to manually filter by storeId - Prisma middleware handles it
  async list(page: number, limit: number) {
    // Automatically scoped to current tenant
    return this.prisma.product.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    // Automatically returns null if product belongs to different tenant
    return this.prisma.product.findUnique({
      where: { id },
    });
  }
}
```

---

## Story 2.7: Store Settings Configuration

As an **Owner/Admin**,
I want **to configure basic store settings**,
So that **my store reflects my brand and business requirements**.

**Acceptance Criteria:**

**Given** an Owner or Admin is authenticated
**When** they access Store Settings
**Then** they can configure:
- Store name and description
- Default currency and locale
- Contact email and support information
- Timezone settings
**And** changes are saved and reflected across the store immediately

---

### Technical Implementation

#### File Structure
```
apps/dashboard/src/app/(dashboard)/settings/store/
├── page.tsx                          # RSC - Store settings page
├── _components/
│   ├── StoreSettingsTabs.tsx         # Client - Tab container
│   ├── GeneralSettingsForm.tsx       # Client - General tab
│   ├── LocalizationSettingsForm.tsx  # Client - Locale/currency
│   ├── ContactSettingsForm.tsx       # Client - Contact info
│   ├── BrandSettingsForm.tsx         # Client - Colors/logo
│   └── SettingsFormSkeleton.tsx
├── _hooks/
│   ├── useStoreSettings.ts           # Query: get settings
│   └── useUpdateStoreSettings.ts     # Mutation: update
└── _actions/
    └── settings-actions.ts           # Server actions

apps/api/src/modules/settings/
├── settings.module.ts
├── settings.service.ts               # protected methods
├── settings.router.ts                # tRPC router
└── dto/
    └── settings.dto.ts
```

#### Zod Schemas (@trafi/validators)
```typescript
// packages/@trafi/validators/src/settings/store.schema.ts
import { z } from 'zod';

export const CurrencySchema = z.enum(['EUR', 'USD', 'GBP', 'CAD', 'CHF']);
export type Currency = z.infer<typeof CurrencySchema>;

export const LocaleSchema = z.enum(['fr-FR', 'en-US', 'en-GB', 'de-DE', 'es-ES']);
export type Locale = z.infer<typeof LocaleSchema>;

export const TimezoneSchema = z.string(); // e.g., 'Europe/Paris'

export const StoreSettingsSchema = z.object({
  // General
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).min(3).max(50),

  // Localization
  defaultCurrency: CurrencySchema,
  defaultLocale: LocaleSchema,
  timezone: TimezoneSchema,

  // Contact
  contactEmail: z.string().email(),
  supportEmail: z.string().email().optional(),
  phoneNumber: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),

  // Brand
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#F97316'),
  logoUrl: z.string().url().optional(),
  faviconUrl: z.string().url().optional(),
});

export type StoreSettings = z.infer<typeof StoreSettingsSchema>;

export const UpdateStoreSettingsSchema = StoreSettingsSchema.partial();
export type UpdateStoreSettingsInput = z.infer<typeof UpdateStoreSettingsSchema>;
```

#### Backend Service (NestJS)
```typescript
// apps/api/src/modules/settings/settings.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { UpdateStoreSettingsInput } from '@trafi/validators';

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  // Protected for @trafi/core extensibility
  protected async getDefaultSettings(): Promise<StoreSettings> {
    return {
      name: 'My Store',
      defaultCurrency: 'EUR',
      defaultLocale: 'fr-FR',
      timezone: 'Europe/Paris',
      contactEmail: '',
      primaryColor: '#F97316',
    };
  }

  async get(storeId: string) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      include: { settings: true },
    });

    if (!store) throw new NotFoundException('Store not found');

    return store.settings || this.getDefaultSettings();
  }

  async update(storeId: string, input: UpdateStoreSettingsInput) {
    const settings = await this.prisma.storeSettings.upsert({
      where: { storeId },
      update: input,
      create: { storeId, ...input },
    });

    // Emit event for cache invalidation
    this.eventEmitter.emit('store.settings.updated', {
      storeId,
      settings,
    });

    return settings;
  }
}
```

#### tRPC Router
```typescript
// apps/api/src/modules/settings/settings.router.ts
import { router, protectedProcedure } from '@/trpc';
import { UpdateStoreSettingsSchema } from '@trafi/validators';

export const settingsRouter = router({
  store: router({
    get: protectedProcedure
      .query(({ ctx }) => {
        ctx.requirePermission('settings:read');
        return ctx.settingsService.get(ctx.storeId);
      }),

    update: protectedProcedure
      .input(UpdateStoreSettingsSchema)
      .mutation(({ input, ctx }) => {
        ctx.requirePermission('settings:update');
        return ctx.settingsService.update(ctx.storeId, input);
      }),
  }),
});
```

#### Dashboard Data Flow
```
GeneralSettingsForm.tsx (Client)
  └─► useUpdateStoreSettings() hook
       └─► useServerActionMutation(updateStoreSettingsAction)
            └─► updateStoreSettingsAction() (Server Action)
                 └─► trpc.settings.store.update.mutate()
                      └─► SettingsService.update() (NestJS)
                           └─► Emits 'store.settings.updated' event
```

#### Server Actions
```typescript
// app/(dashboard)/settings/store/_actions/settings-actions.ts
'use server'

import { trpc } from '@/lib/trpc';
import { revalidatePath } from 'next/cache';
import type { UpdateStoreSettingsInput } from '@trafi/validators';

export async function getStoreSettingsAction() {
  return trpc.settings.store.get.query();
}

export async function updateStoreSettingsAction(input: UpdateStoreSettingsInput) {
  const result = await trpc.settings.store.update.mutate(input);

  // Revalidate pages that use store settings
  revalidatePath('/dashboard');
  revalidatePath('/settings');

  return result;
}
```

#### Custom Hooks
```typescript
// app/(dashboard)/settings/store/_hooks/useStoreSettings.ts
import { useServerActionQuery } from '@/lib/hooks/server-action-hooks';
import { getStoreSettingsAction } from '../_actions/settings-actions';

export function useStoreSettings() {
  return useServerActionQuery(getStoreSettingsAction, {
    queryKey: ['store-settings'],
  });
}

// _hooks/useUpdateStoreSettings.ts
import { useServerActionMutation } from '@/lib/hooks/server-action-hooks';
import { updateStoreSettingsAction } from '../_actions/settings-actions';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useUpdateStoreSettings() {
  const queryClient = useQueryClient();

  return useServerActionMutation(updateStoreSettingsAction, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-settings'] });
      toast.success('Paramètres enregistrés');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
```

#### Client Component Example
```typescript
// app/(dashboard)/settings/store/_components/GeneralSettingsForm.tsx
'use client'

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useStoreSettings } from '../_hooks/useStoreSettings';
import { useUpdateStoreSettings } from '../_hooks/useUpdateStoreSettings';
import { StoreSettingsSchema, type StoreSettings } from '@trafi/validators';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

export function GeneralSettingsForm() {
  const { data: settings, isLoading } = useStoreSettings();
  const { mutate: updateSettings, isPending } = useUpdateStoreSettings();

  const form = useForm<StoreSettings>({
    resolver: zodResolver(StoreSettingsSchema.pick({
      name: true,
      description: true,
      slug: true,
    })),
    values: settings,
  });

  const onSubmit = (data: Partial<StoreSettings>) => {
    updateSettings(data);
  };

  if (isLoading) return <SettingsFormSkeleton />;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="font-general-sans">Nom de la boutique</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input {...field} className="pr-10" />
                  {fieldState.isDirty && !fieldState.error && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-general-sans">Description</FormLabel>
              <FormControl>
                <Textarea {...field} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-general-sans">URL de la boutique</FormLabel>
              <FormControl>
                <div className="flex items-center gap-0">
                  <span className="px-3 py-2 bg-muted rounded-l-md border border-r-0 text-sm text-muted-foreground">
                    trafi.io/
                  </span>
                  <Input {...field} className="rounded-l-none" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isPending || !form.formState.isDirty}
          className="bg-primary hover:bg-primary/90"
        >
          {isPending ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </form>
    </Form>
  );
}
```

---

### UX Implementation

- **Layout:** Tab-based settings (General, Localization, Contact, Brand)
- **Breadcrumb:** Dashboard > Settings > Store
- **Tabs:** Shadcn Tabs with underline style
- **Form layout:** Single-column, 24px vertical gap
- **Save button:** Primary #F97316, in topbar actions area
- **Validation:** Inline with green checkmarks on valid dirty fields
- **Toast:** Success auto-dismiss 4s, top-right
- **Preview:** Store name updates sidebar in real-time via React Query cache
- **Color picker:** Brand color with instant preview swatch
- **Typography:** Clash Display for tab labels, General Sans for form labels

---

## Story 2.8: Ownership Transfer

As an **Owner**,
I want **to transfer store ownership to another admin**,
So that **I can hand over control when needed**.

**Acceptance Criteria:**

**Given** the current Owner initiates a transfer
**When** they select a target admin and confirm
**Then** the target admin receives Owner role
**And** the initiating user is demoted to Admin
**And** email confirmation is sent to both parties
**And** transfer is logged in the audit trail
**And** transfer requires password re-confirmation for security

---

### Technical Implementation

#### File Structure
```
apps/dashboard/src/app/(dashboard)/settings/ownership/
├── page.tsx                              # RSC - Ownership settings page
├── _components/
│   ├── OwnershipTransferCard.tsx         # Client - Transfer form
│   ├── TransferConfirmationDialog.tsx    # Client - Password confirm
│   ├── PendingTransferBanner.tsx         # Client - Shows pending transfer
│   └── TransferHistoryTable.tsx          # Client - Past transfers
├── _hooks/
│   ├── useTransferOwnership.ts           # Mutation: initiate transfer
│   ├── useConfirmTransfer.ts             # Mutation: accept transfer
│   └── usePendingTransfer.ts             # Query: check pending
└── _actions/
    └── ownership-actions.ts              # Server actions

apps/api/src/modules/ownership/
├── ownership.module.ts
├── ownership.service.ts                  # protected methods
├── ownership.router.ts                   # tRPC router
└── dto/
    └── ownership.dto.ts
```

#### Zod Schemas (@trafi/validators)
```typescript
// packages/@trafi/validators/src/ownership/index.ts
import { z } from 'zod';

export const InitiateTransferSchema = z.object({
  targetUserId: z.string(),
  password: z.string().min(8), // Re-confirm password
  reason: z.string().max(500).optional(),
});
export type InitiateTransferInput = z.infer<typeof InitiateTransferSchema>;

export const ConfirmTransferSchema = z.object({
  transferId: z.string(),
  password: z.string().min(8), // New owner confirms
});
export type ConfirmTransferInput = z.infer<typeof ConfirmTransferSchema>;

export const CancelTransferSchema = z.object({
  transferId: z.string(),
});
export type CancelTransferInput = z.infer<typeof CancelTransferSchema>;

export const TransferStatusSchema = z.enum(['pending', 'confirmed', 'cancelled', 'expired']);
export type TransferStatus = z.infer<typeof TransferStatusSchema>;

export const TransferRecordSchema = z.object({
  id: z.string(),
  storeId: z.string(),
  fromUserId: z.string(),
  toUserId: z.string(),
  status: TransferStatusSchema,
  reason: z.string().nullable(),
  expiresAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});
export type TransferRecord = z.infer<typeof TransferRecordSchema>;
```

#### Backend Service (NestJS)
```typescript
// apps/api/src/modules/ownership/ownership.service.ts
import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';
import type { InitiateTransferInput, ConfirmTransferInput } from '@trafi/validators';

@Injectable()
export class OwnershipService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  // Protected for @trafi/core extensibility
  protected async validateOwnerPassword(userId: string, password: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return false;
    return bcrypt.compare(password, user.passwordHash);
  }

  protected getTransferExpirationHours(): number {
    return 72; // 3 days to accept transfer
  }

  async initiate(storeId: string, currentOwnerId: string, input: InitiateTransferInput) {
    // Verify current owner password
    const isValidPassword = await this.validateOwnerPassword(currentOwnerId, input.password);
    if (!isValidPassword) {
      throw new ForbiddenException('Invalid password');
    }

    // Verify target user exists and belongs to store
    const targetUser = await this.prisma.user.findFirst({
      where: {
        id: input.targetUserId,
        storeId,
        role: { in: ['admin', 'editor'] }, // Must be team member
      },
    });
    if (!targetUser) {
      throw new BadRequestException('Target user not found or not eligible');
    }

    // Check no pending transfer exists
    const existingTransfer = await this.prisma.ownershipTransfer.findFirst({
      where: {
        storeId,
        status: 'pending',
      },
    });
    if (existingTransfer) {
      throw new BadRequestException('A transfer is already pending');
    }

    // Create transfer record
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.getTransferExpirationHours());

    const transfer = await this.prisma.ownershipTransfer.create({
      data: {
        storeId,
        fromUserId: currentOwnerId,
        toUserId: input.targetUserId,
        status: 'pending',
        reason: input.reason,
        expiresAt,
      },
    });

    // Send email to new owner
    this.eventEmitter.emit('ownership.transfer.initiated', {
      transfer,
      fromUser: await this.prisma.user.findUnique({ where: { id: currentOwnerId } }),
      toUser: targetUser,
    });

    return transfer;
  }

  async confirm(storeId: string, newOwnerId: string, input: ConfirmTransferInput) {
    const transfer = await this.prisma.ownershipTransfer.findFirst({
      where: {
        id: input.transferId,
        storeId,
        toUserId: newOwnerId,
        status: 'pending',
        expiresAt: { gt: new Date() },
      },
    });

    if (!transfer) {
      throw new BadRequestException('Transfer not found, expired, or not for this user');
    }

    // Verify new owner password
    const isValidPassword = await this.validateOwnerPassword(newOwnerId, input.password);
    if (!isValidPassword) {
      throw new ForbiddenException('Invalid password');
    }

    // Execute transfer in transaction
    const [updatedTransfer] = await this.prisma.$transaction([
      // Update transfer record
      this.prisma.ownershipTransfer.update({
        where: { id: transfer.id },
        data: { status: 'confirmed', completedAt: new Date() },
      }),
      // Promote new owner
      this.prisma.user.update({
        where: { id: newOwnerId },
        data: { role: 'owner' },
      }),
      // Demote old owner
      this.prisma.user.update({
        where: { id: transfer.fromUserId },
        data: { role: 'admin' },
      }),
    ]);

    // Emit event
    this.eventEmitter.emit('ownership.transfer.completed', { transfer: updatedTransfer });

    return updatedTransfer;
  }

  async cancel(storeId: string, userId: string, transferId: string) {
    const transfer = await this.prisma.ownershipTransfer.findFirst({
      where: {
        id: transferId,
        storeId,
        status: 'pending',
        OR: [
          { fromUserId: userId },
          { toUserId: userId },
        ],
      },
    });

    if (!transfer) {
      throw new BadRequestException('Transfer not found or cannot be cancelled');
    }

    return this.prisma.ownershipTransfer.update({
      where: { id: transferId },
      data: { status: 'cancelled' },
    });
  }

  async getPending(storeId: string) {
    return this.prisma.ownershipTransfer.findFirst({
      where: {
        storeId,
        status: 'pending',
        expiresAt: { gt: new Date() },
      },
      include: {
        fromUser: { select: { id: true, email: true, name: true } },
        toUser: { select: { id: true, email: true, name: true } },
      },
    });
  }

  async getHistory(storeId: string) {
    return this.prisma.ownershipTransfer.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        fromUser: { select: { id: true, email: true, name: true } },
        toUser: { select: { id: true, email: true, name: true } },
      },
    });
  }
}
```

#### tRPC Router
```typescript
// apps/api/src/modules/ownership/ownership.router.ts
import { router, protectedProcedure } from '@/trpc';
import {
  InitiateTransferSchema,
  ConfirmTransferSchema,
  CancelTransferSchema,
} from '@trafi/validators';

export const ownershipRouter = router({
  initiate: protectedProcedure
    .input(InitiateTransferSchema)
    .mutation(({ input, ctx }) => {
      ctx.requirePermission('ownership:transfer');
      return ctx.ownershipService.initiate(ctx.storeId, ctx.userId, input);
    }),

  confirm: protectedProcedure
    .input(ConfirmTransferSchema)
    .mutation(({ input, ctx }) => {
      return ctx.ownershipService.confirm(ctx.storeId, ctx.userId, input);
    }),

  cancel: protectedProcedure
    .input(CancelTransferSchema)
    .mutation(({ input, ctx }) => {
      return ctx.ownershipService.cancel(ctx.storeId, ctx.userId, input.transferId);
    }),

  pending: protectedProcedure
    .query(({ ctx }) => {
      return ctx.ownershipService.getPending(ctx.storeId);
    }),

  history: protectedProcedure
    .query(({ ctx }) => {
      ctx.requirePermission('ownership:transfer');
      return ctx.ownershipService.getHistory(ctx.storeId);
    }),
});
```

#### Dashboard Data Flow
```
OwnershipTransferCard.tsx (Client)
  └─► User selects target admin + enters password
       └─► TransferConfirmationDialog opens
            └─► useTransferOwnership() hook
                 └─► useServerActionMutation(initiateTransferAction)
                      └─► trpc.ownership.initiate.mutate()
                           └─► OwnershipService.initiate()
                                └─► Emits 'ownership.transfer.initiated'
                                     └─► Email sent to new owner
```

#### Server Actions
```typescript
// app/(dashboard)/settings/ownership/_actions/ownership-actions.ts
'use server'

import { trpc } from '@/lib/trpc';
import type {
  InitiateTransferInput,
  ConfirmTransferInput,
} from '@trafi/validators';

export async function getPendingTransferAction() {
  return trpc.ownership.pending.query();
}

export async function getTransferHistoryAction() {
  return trpc.ownership.history.query();
}

export async function initiateTransferAction(input: InitiateTransferInput) {
  return trpc.ownership.initiate.mutate(input);
}

export async function confirmTransferAction(input: ConfirmTransferInput) {
  return trpc.ownership.confirm.mutate(input);
}

export async function cancelTransferAction(transferId: string) {
  return trpc.ownership.cancel.mutate({ transferId });
}
```

#### Custom Hooks
```typescript
// app/(dashboard)/settings/ownership/_hooks/useTransferOwnership.ts
import { useServerActionMutation } from '@/lib/hooks/server-action-hooks';
import { initiateTransferAction } from '../_actions/ownership-actions';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function useTransferOwnership() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useServerActionMutation(initiateTransferAction, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-transfer'] });
      toast.success('Demande de transfert envoyée');
      router.refresh();
    },
    onError: (error) => {
      if (error.message.includes('password')) {
        toast.error('Mot de passe incorrect');
      } else {
        toast.error(error.message);
      }
    },
  });
}

// _hooks/usePendingTransfer.ts
import { useServerActionQuery } from '@/lib/hooks/server-action-hooks';
import { getPendingTransferAction } from '../_actions/ownership-actions';

export function usePendingTransfer() {
  return useServerActionQuery(getPendingTransferAction, {
    queryKey: ['pending-transfer'],
    refetchInterval: 60000, // Check every minute
  });
}

// _hooks/useConfirmTransfer.ts
import { useServerActionMutation } from '@/lib/hooks/server-action-hooks';
import { confirmTransferAction } from '../_actions/ownership-actions';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function useConfirmTransfer() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useServerActionMutation(confirmTransferAction, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-transfer'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      toast.success('Transfert confirmé. Vous êtes maintenant propriétaire.');
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
```

#### Client Component Example
```typescript
// app/(dashboard)/settings/ownership/_components/TransferConfirmationDialog.tsx
'use client'

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTransferOwnership } from '../_hooks/useTransferOwnership';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  targetUser: { id: string; name: string; email: string };
}

const PasswordSchema = z.object({
  password: z.string().min(8, 'Mot de passe requis'),
  reason: z.string().max(500).optional(),
});

export function TransferConfirmationDialog({ open, onClose, targetUser }: Props) {
  const { mutate: initiateTransfer, isPending } = useTransferOwnership();

  const form = useForm({
    resolver: zodResolver(PasswordSchema),
    defaultValues: { password: '', reason: '' },
  });

  const onSubmit = (data: z.infer<typeof PasswordSchema>) => {
    initiateTransfer(
      {
        targetUserId: targetUser.id,
        password: data.password,
        reason: data.reason,
      },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-full">
              <ShieldAlert className="w-5 h-5 text-destructive" />
            </div>
            <DialogTitle className="font-clash">Transférer la propriété</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Vous êtes sur le point de transférer la propriété de cette boutique à{' '}
            <strong className="text-foreground">{targetUser.name}</strong> ({targetUser.email}).
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 bg-warning/10 rounded-lg flex items-start gap-3 my-4">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-warning">Cette action est irréversible</p>
            <p className="text-muted-foreground mt-1">
              Vous serez rétrogradé au rôle Admin et ne pourrez plus transférer la propriété.
            </p>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="font-general-sans">
              Confirmez votre mot de passe
            </Label>
            <Input
              id="password"
              type="password"
              {...form.register('password')}
              placeholder="Entrez votre mot de passe"
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason" className="font-general-sans">
              Raison (optionnel)
            </Label>
            <Input
              id="reason"
              {...form.register('reason')}
              placeholder="Pourquoi transférez-vous la propriété ?"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isPending}
            >
              {isPending ? 'Transfert en cours...' : 'Confirmer le transfert'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

---

### UX Implementation

- **Layout:** Settings page, "Ownership" tab only visible to Owner
- **Breadcrumb:** Dashboard > Settings > Ownership
- **Warning banner:** Amber (#EAB308) background for pending transfer
- **User selector:** Dropdown of eligible admins with avatar + name + email
- **Confirmation dialog:** Destructive style, requires password
- **History table:** Shows past transfers with status badges
- **Status badges:** Pending (amber), Completed (green), Cancelled (gray), Expired (red)
- **Security:** Password re-confirmation required for both initiate and confirm
- **Expiration:** 72h countdown displayed for pending transfers
- **Email notifications:** Sent to both parties on initiate and complete
