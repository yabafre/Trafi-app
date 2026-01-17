# Story 1.4: Create Shared Packages Structure

Status: done

## Story

As a **Developer (Thomas)**,
I want **shared packages for validators, types, and configuration**,
so that **I can reuse code across apps with type safety**.

## Acceptance Criteria

1. **AC1**: Given the monorepo structure exists, When shared packages are created, Then `packages/validators` (@trafi/validators) exists with Zod schemas for common entities

2. **AC2**: `packages/types` (@trafi/types) exists with shared TypeScript types inferred from Zod schemas

3. **AC3**: `packages/config` (@trafi/config) exists with shared ESLint, TypeScript, and Tailwind configurations

4. **AC4**: ~~`packages/db` (@trafi/db) exists with Prisma client configuration~~ **REVISED**: Prisma moved to `apps/api/prisma/` with NestJS DatabaseModule (architectural decision during code review - eliminates unnecessary package layer)

5. **AC5**: All packages are properly exported and importable by both `apps/api` and `apps/dashboard`

6. **AC6**: ESLint rules prevent importing `@prisma/client` in frontend apps (dashboard/storefront) - Prisma is API-only

## Tasks / Subtasks

- [x] **Task 1**: Complete @trafi/validators package with domain schemas (AC: 1, 2)
  - [x] 1.1: Add base entity schemas (IdSchema, TimestampSchema, TenantScopedSchema)
  - [x] 1.2: Create `src/product/` directory with product.schema.ts, create-product.schema.ts, update-product.schema.ts
  - [x] 1.3: Create `src/order/` directory with order.schema.ts
  - [x] 1.4: Create `src/customer/` directory with customer.schema.ts
  - [x] 1.5: Create `src/store/` directory with store.schema.ts
  - [x] 1.6: Update barrel exports (index.ts) for all domain schemas
  - [x] 1.7: Verify `pnpm build --filter=@trafi/validators` succeeds

- [x] **Task 2**: Complete @trafi/types package with domain types (AC: 2, 5)
  - [x] 2.1: Add `src/product.types.ts` with types inferred from validator schemas
  - [x] 2.2: Add `src/order.types.ts` with types inferred from validator schemas
  - [x] 2.3: Add `src/customer.types.ts` with types inferred from validator schemas
  - [x] 2.4: Add `src/store.types.ts` with types inferred from validator schemas
  - [x] 2.5: Update index.ts to export all domain types
  - [x] 2.6: Verify `pnpm build --filter=@trafi/types` succeeds

- [x] **Task 3**: Complete @trafi/config package (AC: 3)
  - [x] 3.1: Add Tailwind CSS base configuration at `tailwind/base.config.ts`
  - [x] 3.2: Add Trafi color tokens to Tailwind config (from architecture/UX spec)
  - [x] 3.3: Enhance ESLint config with `@prisma/client` import restriction rule for frontend apps
  - [x] 3.4: Add base TypeScript config for strict mode with path mappings
  - [x] 3.5: Update package.json exports for all configs
  - [x] 3.6: Verify configs are correctly referenced in apps/api and apps/dashboard

- [x] **Task 4**: ~~Prepare @trafi/db package for Prisma~~ **REVISED**: Setup Prisma in apps/api (AC: 4, 5, 6)
  - [x] 4.1: Create `apps/api/prisma/schema.prisma` with minimal Store model
  - [x] 4.2: Create `apps/api/src/database/prisma.service.ts` with NestJS lifecycle hooks
  - [x] 4.3: Create `apps/api/src/database/database.module.ts` as @Global() module
  - [x] 4.4: Import DatabaseModule in AppModule
  - [x] 4.5: Add prisma scripts to apps/api/package.json (db:generate, db:push, db:migrate:*)
  - [x] 4.6: Create centralized `.env` and `.env.example` at monorepo root
  - [x] 4.7: Update `turbo.json` with globalEnv for DATABASE_URL

- [x] **Task 5**: Cross-package integration verification (AC: 5, 6)
  - [x] 5.1: Test importing @trafi/validators in apps/api
  - [x] 5.2: Test importing @trafi/types in apps/api and apps/dashboard
  - [x] 5.3: Test importing @trafi/config/eslint in both apps
  - [x] 5.4: Test importing @trafi/db in apps/api ONLY
  - [x] 5.5: Verify ESLint error when trying to import @trafi/db in apps/dashboard
  - [x] 5.6: Run `pnpm build` at root to verify all packages build correctly
  - [x] 5.7: Run `pnpm typecheck` to verify type resolution across packages

## Dev Notes

### Architecture Compliance (CRITICAL)

**From Architecture Document - MUST FOLLOW:**

1. **Shared Types/DTOs/Schemas Structure (CRITICAL):**
   ```
   packages/
   ├── @trafi/validators/           # Zod schemas (source of truth)
   │   └── src/
   │       ├── product/
   │       │   ├── create-product.schema.ts
   │       │   ├── update-product.schema.ts
   │       │   └── index.ts
   │       ├── order/
   │       ├── customer/
   │       ├── common/                   # Shared schemas (pagination, etc.)
   │       │   ├── pagination.schema.ts
   │       │   └── money.schema.ts
   │       └── index.ts
   │
   ├── @trafi/types/                # Pure TypeScript types
       └── src/
           ├── product.types.ts     # Inferred from Zod + custom
           ├── api.types.ts         # API response types
           ├── events.types.ts      # Event payload types
           └── index.ts
   

           
   ```

2. **Type Flow (CRITICAL):**
   ```
   Zod Schema (@trafi/validators)
       │
       ├──► z.infer<typeof Schema> ──► TypeScript Type (@trafi/types)
       │
       ├──► tRPC Input/Output (apps/api)
       │
       └──► Server Action Input (apps/dashboard)
   ```

3. **Import Pattern for Shared Types:**
   ```typescript
   // In apps/api (NestJS)
   import { CreateProductSchema, type CreateProductInput } from '@trafi/validators';
   import type { ApiResponse } from '@trafi/types';

   // In apps/dashboard (Next.js)
   import { CreateProductSchema, type CreateProductInput } from '@trafi/validators';
   import type { Product } from '@trafi/types';

   // NEVER import from db in dashboard (enforced by ESLint)
   ```

4. **Frontend-Database Isolation (CRITICAL):**
   - NEVER import `@trafi/db` or Prisma in `apps/dashboard` or `apps/storefront`
   - Prisma only use on API app
   - ESLint rules to prevent Prisma imports in apps/dashboard
   - TypeScript project references configured to prevent cross-boundary imports

### Technical Requirements

**Stack Versions (from project-context.md):**
- Zod: Latest (^3.24.1 already installed)
- TypeScript: 5.x (strict mode REQUIRED)
- Prisma: ^7.x (latest)
- Node.js: 20 LTS

**Naming Conventions:**
| Element | Convention | Example |
|---------|------------|---------|
| Zod schemas | PascalCase + Schema | `ProductSchema`, `CreateProductSchema` |
| Types/Interfaces | PascalCase + suffix | `ProductDto`, `CreateProductInput` |
| Files (schemas) | kebab-case.schema.ts | `create-product.schema.ts` |
| Files (types) | kebab-case.types.ts | `product.types.ts` |
| Directories | kebab-case | `profit-engine/` |

**Zod Schema Patterns (CRITICAL):**
```typescript
// @trafi/validators/src/product/product.schema.ts
import { z } from 'zod';

// Base schema with common fields
export const ProductSchema = z.object({
  id: z.string().cuid(),
  storeId: z.string().cuid(),
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  price: z.number().int().nonnegative(),  // ALWAYS cents
  currency: z.enum(['EUR', 'USD', 'GBP']),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Product = z.infer<typeof ProductSchema>;

// Create schema (without auto-generated fields)
export const CreateProductSchema = ProductSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
```

### Project Structure Notes

**Current Package State (from Stories 1.1 & 1.2):**
- `@trafi/validators`: Has common/pagination.schema.ts and common/money.schema.ts
- `@trafi/types`: Has api.types.ts and events.types.ts
- `@trafi/db`: Has placeholder only, awaiting Prisma schema (Story 1.5)
- `@trafi/config`: Has eslint/index.js and typescript/base.json

**Files to Create/Modify:**
```
packages/
├── @trafi/validators/
│   └── src/
│       ├── common/
│       │   ├── base.schema.ts          # NEW: IdSchema, timestamps, tenant
│       │   ├── pagination.schema.ts    # EXISTS
│       │   ├── money.schema.ts         # EXISTS
│       │   └── index.ts                # UPDATE
│       ├── product/
│       │   ├── product.schema.ts       # NEW
│       │   ├── create-product.schema.ts  # NEW
│       │   ├── update-product.schema.ts  # NEW
│       │   └── index.ts                # NEW
│       ├── order/
│       │   ├── order.schema.ts         # NEW
│       │   └── index.ts                # NEW
│       ├── customer/
│       │   ├── customer.schema.ts      # NEW
│       │   └── index.ts                # NEW
│       ├── store/
│       │   ├── store.schema.ts         # NEW
│       │   └── index.ts                # NEW
│       └── index.ts                    # UPDATE
│
├── @trafi/types/
│   └── src/
│       ├── product.types.ts            # NEW
│       ├── order.types.ts              # NEW
│       ├── customer.types.ts           # NEW
│       ├── store.types.ts              # NEW
│       ├── api.types.ts                # EXISTS
│       ├── events.types.ts             # EXISTS
│       └── index.ts                    # UPDATE
│
├── @trafi/config/
│   ├── eslint/
│   │   └── index.js                    # UPDATE: Add @trafi/db restriction
│   ├── typescript/
│   │   └── base.json                   # EXISTS
│   ├── tailwind/
│   │   └── base.config.ts              # NEW
│   └── package.json                    # UPDATE: exports

```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Shared-Types-DTOs-Schemas]
- [Source: _bmad-output/planning-artifacts/architecture.md#Type-Flow]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend-Database-Isolation]
- [Source: _bmad-output/planning-artifacts/architecture.md#Import-Pattern-for-Shared-Types]
- [Source: _bmad-output/project-context.md#Type-Sources-CRITICAL]
- [Source: _bmad-output/project-context.md#Critical-Don't-Miss-Rules]

### Previous Story Intelligence (Story 1-3)

**Key Learnings from Story 1.3:**
1. Next.js 16.1.1 dashboard running on port 3000 at `apps/dashboard/`
2. Shadcn UI initialized with dark mode default and next-themes
3. Local/Global component pattern established with `_` prefix convention
4. Dashboard uses route groups: `(dashboard)` and `(auth)`
5. Tailwind CSS 4.x uses CSS-first configuration (`@import "tailwindcss"`)
6. Color system uses oklch format for modern color handling
7. Barrel exports (index.ts) used throughout for organized imports

**Patterns Established:**
- `src/components/ui/` for Shadcn components (global)
- `src/components/shared/` for custom shared components (global)
- `app/(route)/_components/` for local components
- `src/lib/` for utilities and hooks
- `src/stores/` for Zustand stores (placeholder)

### Git Intelligence (Last 3 Commits)

**Recent Patterns:**
1. Commit `0b8d114`: Story 1.3 - Dashboard setup with comprehensive file creation
2. Commit `6953f61`: Stories 1.1 & 1.2 - Monorepo + NestJS API with shared packages foundation
3. Commit `8c3028a`: Initial project setup

**Key Insights:**
- Shared packages (`@trafi/*`) were created as stubs in Stories 1.1/1.2
- This story COMPLETES the package structure with domain schemas
- Barrel exports and module organization already established
- ESLint flat config format (`eslint.config.mjs`) in use

### Relationship to Other Stories

**This story depends on:**
- Story 1.1: Initialize Turborepo Monorepo Structure (COMPLETED - provides packages/ directory)
- Story 1.2: Setup NestJS API Application (COMPLETED - provides basic package stubs)
- Story 1.3: Setup Next.js Dashboard Application (COMPLETED - provides consumer for types)

**This story is required by:**
- Story 1.5: Configure Prisma with PostgreSQL (requires @trafi/db setup)
- Story 1.6: Setup Test Infrastructure (uses shared types for test fixtures)
- Story 2.x: Admin Authentication (uses validators for auth schemas)
- All domain stories (Product, Order, Customer) use these shared packages

### Anti-Patterns to AVOID

1. **DO NOT** define types locally in `apps/` - ALWAYS use `@trafi/types` or `@trafi/validators`
2. **DO NOT** import `prisma` in frontend apps - ESLint must block this
3. **DO NOT** create separate DTO classes in NestJS - use Zod schemas with `z.infer<>`
4. **DO NOT** use `class-validator` or `class-transformer` - Zod is the standard
5. **DO NOT** duplicate schemas between packages - single source of truth in validators
6. **DO NOT** forget to export from barrel files (index.ts)
7. **DO NOT** use `any` type - strict mode enforced

### Implementation Hints

**Base Schema Pattern:**
```typescript
// @trafi/validators/src/common/base.schema.ts
import { z } from 'zod';

// ID schema with CUID format
export const IdSchema = z.string().cuid();

// Timestamp fields for all entities
export const TimestampsSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Tenant-scoped base (all entities belong to a store)
export const TenantScopedSchema = z.object({
  storeId: IdSchema,
});

// Combine for standard entity base
export const BaseEntitySchema = TenantScopedSchema.extend({
  id: IdSchema,
}).merge(TimestampsSchema);

export type BaseEntity = z.infer<typeof BaseEntitySchema>;
```

**ESLint Rule for @trafi/db Restriction:**
```javascript
// @trafi/config/eslint/index.js
module.exports = {
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        {
          group: ['@trafi/db', '@trafi/db/*'],
          message: 'Cannot import @trafi/db in frontend apps. Use API via tRPC instead.',
        },
      ],
    }],
  },
};
```


**Tailwind Base Config:**
```typescript
// @trafi/config/tailwind/base.config.ts
import type { Config } from 'tailwindcss';

export const trafiColors = {
  background: {
    light: '#FAFAFA',
    dark: '#0A0A0A',
  },
  foreground: {
    light: '#171717',
    dark: '#FAFAFA',
  },
  primary: '#F97316', // Orange accent
  success: '#22C55E',
  warning: '#EAB308',
  error: '#EF4444',
};

export const trafiConfig: Partial<Config> = {
  theme: {
    extend: {
      colors: trafiColors,
      fontFamily: {
        sans: ['var(--font-general-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-clash-display)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
    },
  },
};

export default trafiConfig;
```

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Build verified: `pnpm build` - SUCCESS (5 tasks, 5 successful)
- Typecheck verified: `pnpm typecheck` - SUCCESS (5 tasks, 5 successful)
- Prisma client generated: `pnpm db:generate` - SUCCESS

### Completion Notes List

1. **@trafi/validators completed**: Created comprehensive Zod schemas for Product, Order, Customer, and Store domains with proper base schemas (IdSchema, TimestampsSchema, TenantScopedSchema, BaseEntitySchema)
2. **@trafi/types completed**: All domain types now re-export from validators using `z.infer<>` pattern
3. **@trafi/config completed**: Added Tailwind base config with Trafi color tokens, created frontend-specific ESLint config with @trafi/db restriction
4. **Cross-package integration verified**: All imports work correctly, ESLint blocks @trafi/db in dashboard
5. **Dependencies updated**: Added @trafi/validators and @trafi/db to apps/api, @trafi/validators and @trafi/types to apps/dashboard

### File List

**New Files Created:**
- `packages/@trafi/validators/src/common/base.schema.ts`
- `packages/@trafi/validators/src/product/product.schema.ts`
- `packages/@trafi/validators/src/product/create-product.schema.ts`
- `packages/@trafi/validators/src/product/update-product.schema.ts`
- `packages/@trafi/validators/src/product/index.ts`
- `packages/@trafi/validators/src/order/order.schema.ts`
- `packages/@trafi/validators/src/order/index.ts`
- `packages/@trafi/validators/src/customer/customer.schema.ts`
- `packages/@trafi/validators/src/customer/index.ts`
- `packages/@trafi/validators/src/store/store.schema.ts`
- `packages/@trafi/validators/src/store/index.ts`
- `packages/@trafi/types/src/product.types.ts`
- `packages/@trafi/types/src/order.types.ts`
- `packages/@trafi/types/src/customer.types.ts`
- `packages/@trafi/types/src/store.types.ts`
- `packages/@trafi/config/eslint/frontend.js`
- `packages/@trafi/config/tailwind/base.config.ts`

**Modified Files:**
- `packages/@trafi/validators/src/common/index.ts` - Added base.schema export
- `packages/@trafi/validators/src/index.ts` - Added domain schema exports
- `packages/@trafi/types/src/index.ts` - Added domain type re-exports
- `packages/@trafi/config/package.json` - Added tailwind and frontend eslint exports
- `apps/api/package.json` - Added @trafi/db and @trafi/validators dependencies
- `apps/dashboard/package.json` - Added @trafi/types and @trafi/validators dependencies
- `_bmad-output/implementation-artifacts/sprint-status.yaml` - Status: in-progress → review

### Change Log

- 2026-01-12: Story 1.4 implementation completed - All shared packages structure created with domain schemas, types, config, and Prisma setup
- 2026-01-12: **CODE REVIEW - Architectural Revision Applied:**
  - **@trafi/db DELETED**: Moved Prisma directly to `apps/api/` per user feedback (eliminates unnecessary package layer)
  - **Centralized .env**: Created root `.env` and `.env.example` (single source of truth)
  - **turbo.json updated**: Added globalEnv for DATABASE_URL and other env vars
  - **NestJS DatabaseModule**: Created PrismaService with lifecycle hooks + global DatabaseModule
  - **Root Prisma scripts**: Added db:generate, db:push, db:migrate:* to root package.json
  - **Cleaned build artifacts**: Removed .js/.d.ts/.map files from validators/src/
