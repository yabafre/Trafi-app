# Story 2.1: Admin User Model and Authentication

Status: done

## Story

As an **Admin**,
I want **to log in to the dashboard with email and password**,
So that **I can securely access my store's administration**.

## Acceptance Criteria

1. **Given** the Admin user model exists in the database
   **When** an admin submits valid credentials on the login form
   **Then** a JWT session is created and stored securely
   **And** the admin is redirected to the dashboard home

2. **Given** invalid credentials are submitted
   **When** the login request is processed
   **Then** an appropriate error message is displayed (not revealing if email exists)

3. **Given** passwords are stored in the database
   **When** a new admin is created or password is changed
   **Then** passwords are hashed with bcrypt (minimum 10 rounds)

4. **Given** a JWT token is issued
   **When** the token is created
   **Then** it includes: sub (user ID), tenantId (store ID), role, permissions, type, iat, exp

## Tasks / Subtasks

- [x] **Task 1: Extend User Prisma Schema** (AC: #1, #3)
  - [x] 1.1 Add `passwordHash` field to User model (String, not null)
  - [x] 1.2 Add `role` field with UserRole enum (OWNER, ADMIN, EDITOR, VIEWER)
  - [x] 1.3 Add `status` field with UserStatus enum (ACTIVE, INACTIVE, INVITED)
  - [x] 1.4 Add `lastLoginAt` DateTime field (nullable)
  - [x] 1.5 Add `refreshTokenHash` field (nullable, for refresh token rotation)
  - [x] 1.6 Run `pnpm db:generate` and `pnpm db:push`

- [x] **Task 2: Create Auth Validators in @trafi/validators** (AC: #1, #2)
  - [x] 2.1 Create `packages/@trafi/validators/src/auth/login.schema.ts` with LoginSchema (email, password)
  - [x] 2.2 Create `packages/@trafi/validators/src/auth/register.schema.ts` with RegisterSchema
  - [x] 2.3 Create `packages/@trafi/validators/src/auth/jwt-payload.schema.ts` with JwtPayloadSchema
  - [x] 2.4 Export from `packages/@trafi/validators/src/auth/index.ts`
  - [x] 2.5 Re-export from main `packages/@trafi/validators/src/index.ts`

- [x] **Task 3: Create Auth Types in @trafi/types** (AC: #4)
  - [x] 3.1 Create `packages/@trafi/types/src/auth.types.ts` with JWTPayload, UserRole, AuthResponse types
  - [x] 3.2 Export from `packages/@trafi/types/src/index.ts`

- [x] **Task 4: Create Auth Module in API** (AC: #1, #2, #3, #4)
  - [x] 4.1 Create `apps/api/src/modules/auth/auth.module.ts`
  - [x] 4.2 Create `apps/api/src/modules/auth/auth.service.ts` with login, validateUser, hashPassword, comparePassword
  - [x] 4.3 Create `apps/api/src/modules/auth/auth.controller.ts` with POST /auth/login endpoint
  - [x] 4.4 Install `@nestjs/passport`, `passport`, `passport-jwt`, `passport-local`, `@nestjs/jwt`, `bcrypt`
  - [x] 4.5 Install types: `@types/passport-jwt`, `@types/passport-local`, `@types/bcrypt`

- [x] **Task 5: Implement JWT Strategy** (AC: #1, #4)
  - [x] 5.1 Create `apps/api/src/modules/auth/strategies/jwt.strategy.ts` extending PassportStrategy
  - [x] 5.2 Create `apps/api/src/modules/auth/strategies/local.strategy.ts` for login
  - [x] 5.3 Configure JwtModule with secret from env (JWT_SECRET) and expiration (15m for access token)

- [x] **Task 6: Create Guards and Decorators** (AC: #1)
  - [x] 6.1 Create `apps/api/src/common/guards/jwt-auth.guard.ts`
  - [x] 6.2 Create `apps/api/src/common/guards/local-auth.guard.ts`
  - [x] 6.3 Create `apps/api/src/common/decorators/public.decorator.ts` with @Public()
  - [x] 6.4 Create `apps/api/src/common/decorators/current-user.decorator.ts` with @CurrentUser()
  - [x] 6.5 Export from `apps/api/src/common/guards/index.ts` and `apps/api/src/common/decorators/index.ts`

- [x] **Task 7: Implement Refresh Token Logic** (AC: #1)
  - [x] 7.1 Add refresh token generation in auth.service.ts (longer expiry: 7d)
  - [x] 7.2 Create POST /auth/refresh endpoint
  - [x] 7.3 Store hashed refresh token in User model
  - [x] 7.4 Implement refresh token rotation (invalidate old on use)

- [x] **Task 8: Update Seed Script** (AC: #1, #3)
  - [x] 8.1 Update seed to create admin user with hashed password
  - [x] 8.2 Use bcrypt.hashSync with 10 rounds for demo password

- [x] **Task 9: Write Unit Tests** (AC: #1, #2, #3)
  - [x] 9.1 Create `apps/api/src/modules/auth/__tests__/auth.service.spec.ts`
  - [x] 9.2 Test password hashing and comparison
  - [x] 9.3 Test JWT token generation and validation
  - [x] 9.4 Test login with valid/invalid credentials

- [x] **Task 10: Write Integration Tests** (AC: #1, #2)
  - [x] 10.1 Create `apps/api/test/auth.e2e-spec.ts`
  - [x] 10.2 Test POST /auth/login endpoint
  - [x] 10.3 Test POST /auth/refresh endpoint
  - [x] 10.4 Test protected route access

## Dev Notes

### Architecture Patterns to Follow

**Module Structure:**
```
apps/api/src/modules/auth/
├── auth.module.ts
├── auth.service.ts
├── auth.controller.ts
├── strategies/
│   ├── jwt.strategy.ts
│   └── local.strategy.ts
├── guards/                    # Can also go in common/guards if shared
│   ├── jwt-auth.guard.ts
│   └── local-auth.guard.ts
└── __tests__/
    └── auth.service.spec.ts
```

**JWT Payload Structure (from architecture.md):**
```typescript
interface JWTPayload {
  sub: string;           // User ID
  tenantId: string;      // Store/Organization ID
  role: UserRole;        // admin, staff, readonly
  permissions: string[]; // Granular permissions
  type: 'session' | 'api_key';
  iat: number;
  exp: number;
}
```

**Password Security:**
- Use bcrypt with minimum 10 rounds (ARCH recommendation)
- NEVER store plaintext passwords
- Use timing-safe comparison for password validation

**Token Expiration:**
- Access token: 15 minutes (short-lived)
- Refresh token: 7 days (stored hashed in DB)

### Source Tree Components to Touch

**New Files:**
- `apps/api/src/modules/auth/` - entire auth module
- `apps/api/src/common/guards/jwt-auth.guard.ts`
- `apps/api/src/common/guards/local-auth.guard.ts`
- `apps/api/src/common/decorators/public.decorator.ts`
- `apps/api/src/common/decorators/current-user.decorator.ts`
- `packages/@trafi/validators/src/auth/` - auth schemas
- `packages/@trafi/types/src/auth.types.ts`

**Modified Files:**
- `apps/api/prisma/schema/user.prisma` - add auth fields
- `apps/api/src/app.module.ts` - import AuthModule
- `apps/api/prisma/seed.ts` - update seed with hashed password
- `packages/@trafi/validators/src/index.ts` - export auth
- `packages/@trafi/types/src/index.ts` - export auth types
- `.env` / `.env.example` - add JWT_SECRET, JWT_REFRESH_SECRET

### Testing Standards

**Unit Tests (Vitest/Jest):**
- Test `hashPassword()` produces valid bcrypt hash
- Test `comparePassword()` returns true for valid, false for invalid
- Test `generateToken()` includes all required claims
- Mock PrismaService for database operations

**Integration Tests:**
- Test full login flow with real HTTP requests
- Verify JWT token is returned on success
- Verify 401 on invalid credentials
- Verify 401 on missing/expired token

### Project Structure Notes

**Alignment with Architecture:**
- Auth module follows `modules/{domain}/` pattern
- Guards go in `common/guards/` for reuse across modules
- Decorators go in `common/decorators/`
- Schemas in `@trafi/validators/src/auth/`
- Types in `@trafi/types/src/auth.types.ts`

**Naming Conventions:**
- Files: `jwt.strategy.ts`, `auth.service.ts` (kebab-case)
- Classes: `JwtStrategy`, `AuthService` (PascalCase)
- Guards: `JwtAuthGuard`, `LocalAuthGuard`
- Decorators: `@Public()`, `@CurrentUser()`

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-02-admin-auth.md#Story-2.1]
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication-&-Security]
- [Source: _bmad-output/planning-artifacts/architecture.md#JWT-Token-Structure]
- [Source: _bmad-output/planning-artifacts/architecture.md#RBAC-Implementation]
- [Source: _bmad-output/project-context.md#NestJS-Backend-Rules]
- [Source: _bmad-output/project-context.md#Guards-&-Decorators]
- [Source: _bmad-output/implementation-artifacts/epic-1-retrospective.md#Action-Items]
- [Source: _bmad-output/implementation-artifacts/epic-1-retrospective.md#Trafi-Core-Distribution-Model]

### External Library Versions (Context7 Verified)

**Required Dependencies:**
```json
{
  "@nestjs/passport": "^10.x",
  "@nestjs/jwt": "^10.x",
  "passport": "^0.7.x",
  "passport-jwt": "^4.x",
  "passport-local": "^1.x",
  "bcrypt": "^5.x"
}
```

**Dev Dependencies:**
```json
{
  "@types/passport-jwt": "^4.x",
  "@types/passport-local": "^1.x",
  "@types/bcrypt": "^5.x"
}
```

### Environment Variables Required

```env
# Add to .env and .env.example
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-token-secret-min-32-chars
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
```

### Security Considerations

1. **Password Hashing:** bcrypt with 10+ rounds
2. **JWT Secret:** Minimum 32 characters, stored in env
3. **Token Rotation:** Refresh tokens invalidated on use
4. **Error Messages:** Generic "Invalid credentials" (don't reveal if email exists)
5. **Rate Limiting:** Will be added in Story 2.2 (dashboard guard)

### Common Pitfalls to Avoid

1. **DON'T** store refresh tokens as plaintext - hash them
2. **DON'T** use short JWT secrets - minimum 32 characters
3. **DON'T** expose whether an email exists in error messages
4. **DON'T** forget to add `@Public()` decorator to login endpoint
5. **DON'T** import Prisma types directly - use generated types from service

### Previous Story Intelligence (Epic 1 Patterns)

From Epic 1 implementation commits:
- Module structure follows `apps/api/src/modules/{domain}/` pattern
- Services use `PrismaService` injection
- All modules imported in `app.module.ts`
- Tests in `__tests__/` subdirectory
- Shared packages built before apps (`pnpm build` from root)

### Epic 1 Retrospective Action Items (CRITICAL)

**HIGH PRIORITY for Epic 2 - Must follow these patterns:**

| Action | Implementation Impact |
|--------|----------------------|
| Always use Context7 MCP before implementing libraries | Query NestJS/Passport/JWT docs before coding |
| Backend: Code services with `protected` methods (not `private`) | AuthService methods MUST be `protected` for override |
| Backend: Export explicit public API from modules | auth.module.ts MUST export AuthService clearly |
| Dashboard: Design components with customization props | Login form MUST accept custom styling/branding |
| Dashboard: Use composition pattern for wrappable pages | Login page MUST be wrappable by merchants |

### Trafi Core Override Pattern (CRITICAL)

**Auth Module MUST be designed for extensibility:**

```typescript
// apps/api/src/modules/auth/auth.service.ts
@Injectable()
export class AuthService {
  // Use PROTECTED not PRIVATE for override support
  protected async validateUser(email: string, password: string): Promise<User | null> {
    // Core validation logic
  }

  protected async generateTokens(user: User): Promise<TokenPair> {
    // Core token generation
  }

  // Public API
  async login(credentials: LoginDto): Promise<AuthResponse> {
    const user = await this.validateUser(credentials.email, credentials.password);
    if (!user) throw new UnauthorizedException();
    return this.generateTokens(user);
  }
}
```

**Future merchant override example:**
```typescript
// In merchant's project: server/modules/auth/auth.service.ts
import { AuthService as CoreService } from '@trafi/core/server';

@Injectable()
export class AuthService extends CoreService {
  // Add custom 2FA check
  protected async validateUser(email: string, password: string) {
    const user = await super.validateUser(email, password);
    if (user) await this.validate2FA(user);
    return user;
  }
}
```

### Git Commit Pattern

```
feat(epic-2): Story 2.1 - Admin user authentication

- Add passwordHash, role, status fields to User model
- Implement auth module with JWT + Passport
- Add login, refresh token endpoints
- Create JwtAuthGuard, @Public(), @CurrentUser() decorators
- Add auth validators and types to shared packages
```

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None

### Completion Notes List

1. **Path Aliases Configuration**: Added `@/`, `@common/`, `@modules/`, `@database/`, `@config/`, `@generated/` path aliases to `tsconfig.json` for cleaner imports. Jest configs updated with moduleNameMapper for test compatibility.

2. **Unit Tests**: Created `apps/api/src/modules/auth/__tests__/auth.service.spec.ts` with 22 comprehensive tests covering:
   - Password hashing (bcrypt 10 rounds)
   - Login with valid/invalid credentials
   - Refresh token generation and rotation
   - JWT payload structure validation
   - User validation for different statuses (ACTIVE, INACTIVE, INVITED)

3. **Integration Tests**: Created `apps/api/test/auth.e2e-spec.ts` with 20 e2e tests covering:
   - POST /auth/login (valid/invalid credentials)
   - POST /auth/refresh (token rotation)
   - POST /auth/logout (token invalidation)
   - POST /auth/me (protected endpoint)
   - Authorization header validation

4. **E2E Test Setup**: Created `apps/api/test/setup-e2e.ts` to load environment variables from monorepo root `.env` before tests run.

5. **All Acceptance Criteria Met**:
   - AC1: JWT sessions created and stored securely
   - AC2: Generic error messages (don't reveal email existence)
   - AC3: Passwords hashed with bcrypt (10 rounds)
   - AC4: JWT includes sub, tenantId, role, permissions, type, iat, exp

### File List

**New Files (Auth Module):**
- `apps/api/src/modules/auth/auth.module.ts` - Auth module configuration
- `apps/api/src/modules/auth/auth.service.ts` - Auth business logic (login, refresh, logout)
- `apps/api/src/modules/auth/auth.controller.ts` - Auth REST endpoints
- `apps/api/src/modules/auth/strategies/jwt.strategy.ts` - JWT Passport strategy
- `apps/api/src/modules/auth/strategies/local.strategy.ts` - Local Passport strategy
- `apps/api/src/modules/auth/guards/local-auth.guard.ts` - Local auth guard
- `apps/api/src/modules/auth/dto/index.ts` - DTOs barrel export
- `apps/api/src/modules/auth/dto/login.dto.ts` - Login DTO for Swagger
- `apps/api/src/modules/auth/dto/refresh-token.dto.ts` - Refresh token DTO for Swagger
- `apps/api/src/modules/auth/dto/auth-response.dto.ts` - Auth response DTO for Swagger

**New Files (Common):**
- `apps/api/src/common/guards/jwt-auth.guard.ts` - JWT auth guard with @Public() support
- `apps/api/src/common/guards/index.ts` - Guards barrel export
- `apps/api/src/common/decorators/public.decorator.ts` - @Public() decorator
- `apps/api/src/common/decorators/current-user.decorator.ts` - @CurrentUser() decorator
- `apps/api/src/common/decorators/index.ts` - Decorators barrel export

**New Files (Shared Packages):**
- `packages/@trafi/validators/src/auth/login.schema.ts` - Login & RefreshTokenRequest schemas
- `packages/@trafi/validators/src/auth/register.schema.ts` - Register & password schemas
- `packages/@trafi/validators/src/auth/jwt-payload.schema.ts` - JWT payload schemas
- `packages/@trafi/validators/src/auth/index.ts` - Auth validators barrel export
- `packages/@trafi/types/src/auth.types.ts` - Auth types & DEFAULT_ROLE_PERMISSIONS

**New Files (Tests):**
- `apps/api/src/modules/auth/__tests__/auth.service.spec.ts` - Unit tests (22 tests)
- `apps/api/test/auth.e2e-spec.ts` - Integration tests (20 tests)
- `apps/api/test/setup-e2e.ts` - E2E test environment setup

**Modified Files:**
- `apps/api/prisma/schema/user.prisma` - Added passwordHash, role, status, lastLoginAt, refreshTokenHash
- `apps/api/prisma/seed.ts` - Updated seed with bcrypt hashed passwords
- `apps/api/src/app.module.ts` - Import AuthModule
- `apps/api/src/common/index.ts` - Export guards and decorators
- `apps/api/src/config/env.validation.ts` - Added JWT_SECRET, JWT_REFRESH_SECRET validation
- `apps/api/src/database/prisma.service.ts` - Minor updates
- `apps/api/tsconfig.json` - Added path aliases
- `apps/api/package.json` - Added auth dependencies, jest moduleNameMapper
- `apps/api/test/jest-e2e.json` - Added path aliases and setup file
- `apps/api/test/app.e2e-spec.ts` - Fixed supertest import
- `apps/api/test/app.module.spec.ts` - Updated for auth module
- `packages/@trafi/validators/src/index.ts` - Export auth validators
- `packages/@trafi/types/src/index.ts` - Export auth types
- `.env.example` - Added JWT secrets
- `pnpm-lock.yaml` - Updated dependencies

### Code Review Fixes Applied

**Date:** 2026-01-12 (Review #1)

1. **HIGH-1 Fixed:** Removed `@UseGuards(LocalAuthGuard)` from login endpoint to prevent double login execution
2. **MEDIUM-2 Fixed:** Changed `/auth/me` from POST to GET (REST convention)
3. **MEDIUM-3 Fixed:** Updated E2E tests to use GET for `/auth/me`
4. **MEDIUM-4 Fixed:** Added `RefreshTokenRequestSchema` Zod validation for refresh endpoint
5. **LOW-1 Fixed:** Updated misleading comment in LocalStrategy

**Date:** 2026-01-12 (Review #2 - Adversarial)

1. **HIGH-1 Fixed:** `apps/api/tsconfig.json` - Removed `test/**/*` from include to fix rootDir conflict causing typecheck failure
2. **MEDIUM-1 Fixed:** Added missing DTO files to File List (dto/index.ts, login.dto.ts, refresh-token.dto.ts, auth-response.dto.ts)
3. **MEDIUM-3 Fixed:** Story Status corrected from "completed" to "review" to match sprint-status.yaml
4. **MEDIUM-4 Fixed:** `apps/api/test/auth.e2e-spec.ts:269` - Changed describe label from "POST" to "GET" for /auth/me
