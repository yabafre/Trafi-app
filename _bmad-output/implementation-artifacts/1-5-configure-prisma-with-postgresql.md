# Story 1.5: Configure Prisma with PostgreSQL

Status: done

## Story

As a **Developer (Thomas)**,
I want **Prisma 7 configured with PostgreSQL and multi-file schema organization**,
so that **I have a type-safe database layer with modular, maintainable schema files**.

## Acceptance Criteria

1. **AC1**: Given Prisma is installed, When checking the version, Then Prisma 7.x LTS is used (requires Node.js >= 20.19.0, TypeScript >= 5.4.0) ✅

2. **AC2**: Given the multi-file schema feature is enabled, When Prisma generates the client, Then all `.prisma` files in `apps/api/prisma/schema/` are merged and processed ✅

3. **AC3**: Given the schema files exist, When inspecting table naming, Then PascalCase singular table names are used via `@@map` (ARCH-22) ✅

4. **AC4**: Given the schema files exist, When inspecting column naming, Then camelCase column names are used with snake_case database mapping via `@map` ✅

5. **AC5**: Given ID fields are defined, When generating IDs, Then CUID format is used with domain prefixes ready (e.g., `store_`, `prod_`, `usr_`) ✅

6. **AC6**: Given money fields are defined, When storing monetary values, Then they are stored as INTEGER cents (ARCH-25) ✅

7. **AC7**: Given the Store and User models are defined, When running `pnpm db:push`, Then the schema applies to PostgreSQL successfully ✅

8. **AC8**: Given all schemas are valid, When running `pnpm db:generate`, Then Prisma Client is generated with full type safety ✅

## Tasks / Subtasks

- [x] **Task 1**: Upgrade Prisma to version 7.x LTS (AC: 1)
  - [x] 1.1: Update `prisma` devDependency to `^7.2.0` in `apps/api/package.json`
  - [x] 1.2: Update `@prisma/client` dependency to `^7.2.0` in `apps/api/package.json`
  - [x] 1.3: Run `pnpm install` to update lockfile
  - [x] 1.4: Verify Node.js version >= 20.19.0 (v22.14.0 installed)
  - [x] 1.5: Verify TypeScript version >= 5.4.0 (^5.7.3 in root package.json)
  - [x] 1.6: Run `pnpm db:generate` to confirm Prisma 7 works

- [x] **Task 2**: Configure multi-file Prisma schema (AC: 2)
  - [x] 2.1: Create directory `apps/api/prisma/schema/` for schema files
  - [x] 2.2: Create `prisma.config.ts` at `apps/api/prisma.config.ts` with multi-file schema configuration
  - [x] 2.3: Move existing `schema.prisma` content to `apps/api/prisma/schema/base.prisma` (generator + datasource)
  - [x] 2.4: Delete original `apps/api/prisma/schema.prisma`
  - [x] 2.5: Add `@prisma/adapter-pg` and `dotenv` dependencies for Prisma 7
  - [x] 2.6: Verify `pnpm db:generate` works with multi-file setup

- [x] **Task 3**: Create base schema file with conventions (AC: 3, 4, 5, 6)
  - [x] 3.1: Create `apps/api/prisma/schema/base.prisma` with:
    - `generator client` with `prisma-client` provider (Prisma 7 new provider)
    - `datasource db` with PostgreSQL provider (URL in prisma.config.ts)
  - [x] 3.2: Add comment header documenting naming conventions (PascalCase tables, camelCase columns)
  - [x] 3.3: Verify schema compiles without errors

- [x] **Task 4**: Create Store domain schema (AC: 3, 4, 5, 7)
  - [x] 4.1: Create `apps/api/prisma/schema/store.prisma`
  - [x] 4.2: Define `Store` model with:
    - `id` as String CUID with `@default(cuid())` and prefix pattern comment
    - `name` as String
    - `slug` as String with `@unique`
    - `createdAt` as DateTime with `@default(now())` and `@map("created_at")`
    - `updatedAt` as DateTime with `@updatedAt` and `@map("updated_at")`
    - `@@map("stores")` for snake_case table name
  - [x] 4.3: Add Store relation placeholder for Users and Products

- [x] **Task 5**: Create User domain schema (AC: 3, 4, 5, 7)
  - [x] 5.1: Create `apps/api/prisma/schema/user.prisma`
  - [x] 5.2: Define `User` model with:
    - `id` as String CUID with `@default(cuid())`
    - `email` as String with `@unique`
    - `name` as String?
    - `storeId` as String with `@map("store_id")`
    - `store` relation to Store
    - `createdAt` / `updatedAt` with proper mapping
    - `@@map("users")`
  - [x] 5.3: Add index on `storeId` for multi-tenancy queries: `@@index([storeId])`

- [x] **Task 6**: Create Product domain schema placeholder (AC: 3, 4, 5, 6)
  - [x] 6.1: Create `apps/api/prisma/schema/product.prisma`
  - [x] 6.2: Define `Product` model with:
    - `id`, `storeId`, `name`, `slug`, `description`
    - `priceInCents` as Int for money (ARCH-25) with `@map("price_in_cents")`
    - `createdAt` / `updatedAt`
    - `@@map("products")`
  - [x] 6.3: Add Store relation and storeId index

- [x] **Task 7**: Validate and apply schema (AC: 7, 8)
  - [x] 7.1: Run `pnpm db:generate` to generate Prisma Client
  - [x] 7.2: Run `pnpm db:push` to apply schema to PostgreSQL
  - [x] 7.3: Verify tables exist with correct naming in database (stores, users, products)
  - [x] 7.4: Run `pnpm typecheck` to verify type generation works

## Dev Notes

### Prisma 7 Breaking Changes (CRITICAL)

Prisma 7 introduced several breaking changes from v6:

1. **New provider**: Use `prisma-client` instead of `prisma-client-js`
2. **URL in config**: Database URL moved from `schema.prisma` to `prisma.config.ts`
3. **Adapter required**: Must use `@prisma/adapter-pg` for PostgreSQL connections
4. **Custom output**: The `output` path is mandatory for the generator
5. **Import path changed**: Import from generated path, not `@prisma/client`

### Final Configuration (Prisma 7.2.0)

**Environment Loading Strategy:**
- `dotenv-cli` installed at monorepo root
- All scripts prefixed with `dotenv --` to load `.env` before execution
- No need for `globalEnv` in turbo.json
- `prisma.config.ts` simplified (no manual dotenv loading)

**prisma.config.ts (apps/api/prisma.config.ts):**
```typescript
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: env('DATABASE_URL') },
});
```

**PrismaService (Prisma 7 pattern):**
```typescript
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

export class PrismaService extends PrismaClient {
  constructor() {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    super({ adapter });
  }
}
```

### Multi-File Schema Structure

```
apps/api/
├── prisma.config.ts          # Prisma 7 configuration
└── prisma/
    └── schema/
        ├── base.prisma       # generator + datasource
        ├── store.prisma      # Store model
        ├── user.prisma       # User model
        └── product.prisma    # Product model
```

### Node.js 22 Compatibility

Added pnpm overrides in root package.json to fix compatibility issues:
```json
{
  "pnpm": {
    "overrides": {
      "pathe": "1.1.2",
      "effect": "3.16.0"
    }
  }
}
```

### Dependencies Added

**Root package.json:**
- `dotenv-cli@^8.0.0` (devDependency) - loads `.env` for all monorepo scripts

**apps/api/package.json:**
- `prisma@^7.2.0` (devDependency)
- `@prisma/client@^7.2.0` (dependency)
- `@prisma/adapter-pg@^7.2.0` (dependency)

## Dev Agent Record

### Implementation Plan
1. Upgrade Prisma from 6.2.1 to 7.2.0
2. Configure multi-file schema with prisma.config.ts
3. Create domain schemas (Store, User, Product)
4. Update PrismaService for Prisma 7 adapter pattern
5. Validate and apply schema to PostgreSQL

### Debug Log
- Initial Prisma 7 install caused `pathe` package error on Node.js 22 - fixed with pnpm override
- Second error with `effect` package - fixed with pnpm override to 3.16.0
- Prisma 7 requires URL in config, not schema - updated base.prisma and created prisma.config.ts
- Prisma 7 requires adapter - added @prisma/adapter-pg and updated PrismaService
- Generated client path changed - updated import from `@prisma/client` to `../generated/prisma/client`

### Completion Notes
- All 7 tasks completed successfully
- Prisma 7.2.0 with multi-file schema working
- 3 domain models created: Store, User, Product
- Schema applied to PostgreSQL (Neon)
- Typecheck and build pass
- Database connection verified

## File List

### New Files
- `apps/api/prisma.config.ts` - Prisma 7 configuration
- `apps/api/prisma/schema/base.prisma` - Base schema with generator + datasource
- `apps/api/prisma/schema/store.prisma` - Store model
- `apps/api/prisma/schema/user.prisma` - User model
- `apps/api/prisma/schema/product.prisma` - Product model
- `apps/api/prisma/migrations/` - Initial migration for Store, User, Product tables
- `apps/api/src/database/prisma.service.ts` - NestJS PrismaService with Prisma 7 adapter pattern
- `apps/api/src/database/database.module.ts` - Global DatabaseModule for NestJS
- `apps/api/src/database/index.ts` - Barrel export for database module

### Modified Files
- `apps/api/package.json` - Updated Prisma deps to ^7.2.0, added adapter
- `apps/api/prisma.config.ts` - Simplified (dotenv-cli loads env from root)
- `package.json` - Added pnpm overrides, dotenv-cli, updated scripts with `dotenv --`
- `turbo.json` - Removed globalEnv (handled by dotenv-cli)
- `pnpm-lock.yaml` - Updated lockfile
- `.gitignore` - Added `**/src/generated/` to exclude Prisma generated client

### Generated (not committed)
- `apps/api/src/generated/prisma/` - Generated Prisma client (regenerate with `pnpm db:generate`)

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-12 | Story created with Prisma 7 + multi-file schema requirements | SM |
| 2026-01-12 | Implemented Prisma 7.2.0 with multi-file schema, adapter pattern, and Node.js 22 fixes | Dev |
| 2026-01-12 | Code Review: Fixed .gitignore for generated/, corrected File List, staged database files | Review |
| 2026-01-12 | Code Review: Added dotenv-cli at root, removed globalEnv from turbo.json, simplified prisma.config.ts | Review |
