---
project_name: 'trafi-app'
user_name: 'Alex'
date: '2026-01-11'
sections_completed: ['technology_stack', 'typescript_rules', 'framework_rules', 'testing_rules', 'code_quality', 'workflow_rules', 'critical_rules']
existing_patterns_found: 12
status: 'complete'
rule_count: 50
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

### Runtime & Build
- **Node.js:** 20 LTS
- **TypeScript:** 5.x (strict mode REQUIRED)
- **pnpm:** Latest (package manager)
- **Turborepo:** Latest (monorepo orchestration)
- **SWC:** Latest (TypeScript compilation)

### Backend (apps/api)
- **NestJS:** Latest
- **Prisma:** 7.x (ORM)
- **PostgreSQL:** 16 (DB-per-tenant)
- **tRPC:** Latest (internal API)
- **BullMQ:** Latest (job queues)
- **Redis:** 7.x (cache + queues)
- **Passport:** Latest (JWT authentication)

### Frontend (apps/dashboard)
- **Next.js:** 15 (App Router)
- **React:** 19
- **Zsa:** Latest (Server Actions + React Query bridge)
- **@tanstack/react-query:** Latest
- **Zustand:** Latest (minimal UI state)
- **Shadcn UI:** Latest (components)
- **Tailwind CSS:** 4.x

### Shared (packages/)
- **Zod:** Latest (validation schemas)
- **@trafi/validators:** Shared Zod schemas
- **@trafi/types:** Shared TypeScript types
- **@trafi/zod:** Shared Zod instance (single instance across monorepo)

### Database (apps/api only)
- **Prisma:** Configured directly in `apps/api` - NOT a shared package

### Testing
- **Vitest:** Latest (unit tests)
- **Playwright:** Latest (E2E)
- **Jest:** Latest (NestJS integration)

### Observability
- **OpenTelemetry:** Latest

## Critical Implementation Rules

### TypeScript Rules

#### Strict Mode Requirements
- `strict: true` in all tsconfig.json - NO EXCEPTIONS
- `noImplicitAny: true` - Always type parameters
- `strictNullChecks: true` - Handle null/undefined explicitly

#### Import/Export Patterns
- Use named exports for utilities: `export function formatPrice()`
- Use default exports only for React components and pages
- Import order: 1) External packages, 2) @trafi/* packages, 3) Relative imports
- ALWAYS use `type` keyword for type-only imports: `import type { Product } from '@trafi/types'`

#### Type Sources (CRITICAL)
- **Zod schemas** → Single source of truth in `@trafi/validators`
- **Inferred types** → Use `z.infer<typeof Schema>` in `@trafi/types`
- **Prisma types** → Auto-generated, API-only usage
- **NEVER** define types locally in apps/ - import from packages/

#### Async Patterns
- Prefer `async/await` over `.then()` chains
- Always handle errors with try/catch in Server Actions
- Use `Promise.all()` for parallel async operations
- Never use `Promise.allSettled()` unless handling partial failures

#### Null Handling
- Use optional chaining: `user?.profile?.name`
- Use nullish coalescing: `value ?? defaultValue`
- NEVER use `|| defaultValue` for boolean/number defaults

### NestJS Backend Rules

#### Module Structure
- One module per domain: `product.module.ts`, `order.module.ts`
- Services handle business logic, Controllers/Routers handle HTTP/tRPC
- Use dependency injection - NEVER instantiate services manually

#### Guards & Decorators
- Apply `@UseGuards(JwtAuthGuard, RolesGuard)` at controller level
- Use `@Permissions('products:write')` for granular access
- Use `@Public()` decorator for public endpoints only

#### Swagger/OpenAPI Documentation (MANDATORY)
Every API endpoint MUST have Swagger decorators. This is not optional.

**Controller-level:**
```typescript
@ApiTags('products')  // Group endpoints by domain
@Controller('products')
```

**Endpoint-level:**
```typescript
@ApiOperation({ summary: 'Create product', description: 'Full description...' })
@ApiBody({ type: CreateProductDto })
@ApiResponse({ status: 201, description: 'Product created', type: ProductDto })
@ApiResponse({ status: 400, description: 'Validation error', type: ErrorResponseDto })
@ApiResponse({ status: 401, description: 'Unauthorized', type: ErrorResponseDto })
@ApiBearerAuth('JWT-auth')  // For protected endpoints
@Post()
create(@Body() dto: CreateProductDto) { ... }
```

**DTO Classes (for Swagger schemas):**
```typescript
// Create in: src/modules/{domain}/dto/{name}.dto.ts
export class CreateProductDto {
  @ApiProperty({ description: 'Product name', example: 'Premium T-Shirt' })
  name: string;

  @ApiProperty({ description: 'Price in cents', example: 2999, minimum: 0 })
  priceInCents: number;
}
```

**Rules:**
- Every controller needs `@ApiTags()`
- Every endpoint needs `@ApiOperation()` + `@ApiResponse()` for all status codes
- Every protected endpoint needs `@ApiBearerAuth('JWT-auth')`
- Create DTO classes with `@ApiProperty()` for request/response bodies
- Swagger UI available at `/docs`

#### tRPC Routers
- Naming: `{resource}.{action}` → `products.list`, `orders.create`
- Input validation via Zod schemas from `@trafi/validators`
- Always return typed responses

#### Tenant Isolation (CRITICAL)
- EVERY query MUST include `storeId` or `tenantId` filter
- Use `@TenantContext()` decorator to inject tenant
- NEVER query without tenant scope - this is a security requirement

### Next.js Dashboard Rules

#### App Router Patterns
- Use Server Components by default
- Add `'use client'` only when needed (hooks, interactivity)
- Pages are Server Components, interactive parts are Client Components

#### Local vs Global Convention (CRITICAL)
```
_components/  → Route-local components (underscore prefix)
_hooks/       → Route-local hooks
_actions/     → Route-local Server Actions
components/   → Global shared components (no prefix)
lib/hooks/    → Global shared hooks
```

#### Data Flow Pattern (CRITICAL)
```
Page (RSC) → Client Component → Custom Hook → Zsa Hook → Server Action → tRPC → NestJS
```

#### Zsa + React Query Usage
- Use `useServerActionQuery` for reads
- Use `useServerActionMutation` for writes
- Use `useServerActionInfiniteQuery` for pagination
- ALWAYS invalidate queries after mutations

#### Server Actions
- Mark with `'use server'` at top of file
- Place in `_actions/` folder within route
- Import tRPC client, call API methods
- Handle errors with try/catch, return typed responses

### State Management Rules

#### React Query (via Zsa)
- Server state = React Query (95%+ of state)
- Use QueryKeyFactory for consistent keys

#### Zustand (Minimal)
- UI state ONLY: sidebar, modals, theme
- NEVER store server data in Zustand
- Keep stores in `src/stores/`

### Testing Rules

#### Test Framework Usage
- **Vitest** → Unit tests (utilities, hooks, components)
- **Jest** → NestJS service/controller integration tests
- **Playwright** → E2E tests (critical user flows)

#### Test File Organization
```
apps/api/src/modules/product/
├── product.service.ts
├── product.controller.ts
└── __tests__/
    ├── product.service.spec.ts      # Unit tests
    └── product.controller.spec.ts   # Integration tests

apps/dashboard/src/app/products/
├── page.tsx
├── _components/
│   └── ProductTable.tsx
└── _components/__tests__/
    └── ProductTable.test.tsx
```

#### Test Naming Conventions
- Files: `{component}.test.tsx` or `{service}.spec.ts`
- Describe blocks: `describe('ProductService', () => {})`
- Test names: `it('should create product with valid input', () => {})`

#### Unit Test Rules
- Test ONE thing per test case
- Use descriptive names explaining expected behavior
- Mock external dependencies (API calls, database)
- NEVER mock the thing you're testing

#### Integration Test Rules (NestJS)
- Use `Test.createTestingModule()` for module setup
- Mock database with in-memory or test containers
- Test actual HTTP/tRPC endpoints
- Verify tenant isolation in every test

#### E2E Test Rules (Playwright)
- Test critical user flows: login, checkout, CRUD operations
- Use Page Object Model for maintainability
- Run against real API (staging environment)
- Include visual regression for key pages

#### Mocking Patterns
- Use `vi.mock()` for Vitest mocks
- Use `jest.mock()` for Jest mocks
- Create mock factories in `__mocks__/` directories
- NEVER mock Zod schemas - use real validation

#### Coverage Requirements
- Minimum 80% coverage for services
- Critical paths (checkout, payment) require 90%+
- Skip coverage for generated files and configs

### Code Quality & Style Rules

#### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Files (components) | PascalCase | `ProductCard.tsx` |
| Files (hooks) | camelCase + use | `useProducts.ts` |
| Files (utils) | camelCase | `formatPrice.ts` |
| Files (actions) | kebab-case | `product-actions.ts` |
| Directories | kebab-case | `profit-engine/` |
| Classes | PascalCase | `ProductService` |
| Functions | camelCase | `getProductById` |
| Constants | SCREAMING_SNAKE | `MAX_PRODUCTS_PER_PAGE` |
| Types/Interfaces | PascalCase + suffix | `ProductDto`, `CreateProductInput` |
| Zod schemas | PascalCase + Schema | `ProductSchema` |
| Database tables | PascalCase singular | `Product`, `OrderItem` |
| Database columns | camelCase | `createdAt`, `storeId` |
| REST routes | kebab-case plural | `/api/v1/order-items` |
| tRPC procedures | camelCase | `products.list` |

#### File Organization
```
// Good: Co-located with route
app/products/_components/ProductTable.tsx

// Bad: Global when should be local
components/products/ProductTable.tsx
```

#### Component Structure
```typescript
// Order in component files:
1. 'use client' (if needed)
2. Imports (external → @trafi/* → relative)
3. Types/Interfaces
4. Component function
5. Export (default for components)
```

#### ESLint Rules (Enforced)
- No unused variables (`@typescript-eslint/no-unused-vars`)
- No explicit `any` (`@typescript-eslint/no-explicit-any`)
- No console.log in production (`no-console` except warn/error)
- Consistent return types on functions

#### Prettier Config
- Single quotes
- No semicolons (or with semicolons - be consistent)
- 2 space indentation
- 100 character line width
- Trailing commas: ES5

#### Comments Rules
- NO obvious comments: `// increment counter` ❌
- YES for complex logic: `// Calculate tax using EU VAT rules`
- Use JSDoc for public API functions
- TODO format: `// TODO(alex): description - ticket/issue`

### Development Workflow Rules

#### Git Branch Naming
```
feature/TRAFI-123-add-product-search
bugfix/TRAFI-456-fix-checkout-total
hotfix/TRAFI-789-payment-timeout
chore/update-dependencies
```

#### Commit Message Format
```
type(scope): description

feat(products): add bulk import functionality
fix(checkout): correct tax calculation for EU
refactor(api): extract payment service
test(orders): add integration tests for cancellation
docs(readme): update setup instructions
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`

#### PR Requirements
- Link to issue/story in description
- All tests passing
- No linting errors
- At least 1 approval required
- Squash merge to main

#### Turborepo Commands
```bash
pnpm dev          # Start all apps in dev mode
pnpm build        # Build all packages and apps
pnpm test         # Run all tests
pnpm lint         # Lint all packages
pnpm db:push      # Push Prisma schema changes
pnpm db:generate  # Generate Prisma client
```

#### Environment Variables
- `.env.local` for local development (gitignored)
- `.env.example` committed with placeholder values
- NEVER commit real secrets
- Use `NEXT_PUBLIC_` prefix for client-side env vars in Next.js

#### Database Migrations
- Use `pnpm db:migrate dev` for development
- Use `pnpm db:migrate deploy` for production
- ALWAYS review generated SQL before applying
- Include migration in PR for schema changes

### Critical Don't-Miss Rules

#### ABSOLUTE PROHIBITIONS ❌

1. **Frontend-Database Isolation**
   - NEVER import Prisma in `apps/dashboard` or `apps/storefront` (Prisma is API-only in `apps/api`)
   - NEVER put database connection strings in frontend env vars
   - ALL data access goes through API (tRPC or REST)

2. **Type Definition Location**
   - NEVER define types in `apps/` folders
   - ALL types come from `@trafi/validators` or `@trafi/types`
   - Exception: Component prop types can be co-located

3. **Tenant Data Leakage**
   - NEVER write a query without `storeId` or `tenantId` filter
   - NEVER trust client-provided tenant IDs without validation
   - ALWAYS use `@TenantContext()` decorator

#### MANDATORY PATTERNS ✅

1. **Context7 MCP Usage**
   - ALWAYS query Context7 before implementing with any library
   - Use `resolve-library-id` then `query-docs`
   - Get current documentation, not outdated patterns

2. **Money Handling**
   - ALWAYS store money as INTEGER (cents)
   - NEVER use floats for currency calculations
   - Use `Intl.NumberFormat` for display

3. **Date Handling**
   - ALWAYS use ISO 8601 strings in API responses
   - ALWAYS store as UTC in database
   - Convert to user timezone only in UI

4. **Error Responses**
   - ALWAYS use standardized error format
   - ALWAYS include `requestId` for tracing
   - NEVER expose internal error details to clients

#### SECURITY REQUIREMENTS 🔒

- Validate ALL user input with Zod schemas
- Sanitize HTML content to prevent XSS
- Use parameterized queries (Prisma handles this)
- Rate limit sensitive endpoints (checkout, auth)
- Log security events to audit trail
- NEVER log sensitive data (passwords, tokens, card numbers)

#### PERFORMANCE GOTCHAS ⚡

- Avoid N+1 queries - use Prisma `include` or separate batch queries
- Cache expensive computations in Redis
- Use `React.memo()` only when measured performance issue
- Lazy load heavy components with `dynamic()`
- Use `loading.tsx` for route-level loading states

#### COMMON MISTAKES TO AVOID

```typescript
// ❌ BAD: Type defined locally
interface Product { ... }

// ✅ GOOD: Type imported from shared package
import type { Product } from '@trafi/types';

// ❌ BAD: Component in wrong location
src/components/products/ProductTable.tsx

// ✅ GOOD: Local component with underscore prefix
app/products/_components/ProductTable.tsx

// ❌ BAD: Direct database query in dashboard
const products = await prisma.product.findMany();

// ✅ GOOD: Through Server Action → tRPC
const products = await getProducts({ page: 1 });

// ❌ BAD: Money as float
const price = 19.99;

// ✅ GOOD: Money as cents
const price = 1999; // Display: formatPrice(1999) → "19,99 €"

// ❌ BAD: Missing tenant filter
await prisma.product.findMany();

// ✅ GOOD: Always include tenant
await prisma.product.findMany({ where: { storeId } });
```

---

## Usage Guidelines

**For AI Agents:**
- Read this file before implementing any code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option
- Query Context7 MCP for up-to-date library documentation

**For Humans:**
- Keep this file lean and focused on agent needs
- Update when technology stack changes
- Review quarterly for outdated rules
- Remove rules that become obvious over time

---

**Last Updated:** 2026-01-11
**Rule Count:** 50+
**Optimized for LLM:** Yes
