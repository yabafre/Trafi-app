# Story 1.7: Seed Demo Data for Development

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Developer (Thomas)**,
I want **to populate the database with realistic demo data**,
so that **I can develop and test features without manual data entry**.

## Acceptance Criteria

1. **AC1**: Given the database schema is applied, When running `pnpm db:seed`, Then a sample Store with complete configuration is created

2. **AC2**: Given the seed script runs, When demo products are created, Then at least 10 products exist with realistic names, descriptions, prices (in cents), and slugs

3. **AC3**: Given the seed script runs, When demo users are created, Then at least 3 admin users exist with proper tenant scoping (storeId)

4. **AC4**: Given the seed script runs multiple times, When database already contains seed data, Then the script is idempotent (upsert behavior, no duplicates created)

5. **AC5**: Given the seed script completes, When checking the database, Then all data follows the architecture patterns:
   - IDs use CUID format
   - Money is stored in cents (priceInCents)
   - All queries would be tenant-scoped (storeId relationships)
   - Proper timestamps on all records

6. **AC6**: Given the monorepo structure, When seed script is created, Then it is accessible via `pnpm db:seed` from the root (Turborepo)

## Tasks / Subtasks

- [x] **Task 1**: Create Prisma seed script infrastructure (AC: 4, 6)
  - [x] 1.1: Create `apps/api/prisma/seed.ts` file
  - [x] 1.2: Add `prisma.seed` configuration in `apps/api/prisma.config.ts` (Prisma 7)
  - [x] 1.3: Add `db:seed` script in `apps/api/package.json`: `"db:seed": "prisma db seed"`
  - [x] 1.4: Add `db:seed` script in root `package.json`: `"db:seed": "dotenv -- pnpm --filter @trafi/api db:seed"`

- [x] **Task 2**: Implement idempotent Store seeding (AC: 1, 4, 5)
  - [x] 2.1: Create seed function for demo Store with upsert
  - [x] 2.2: Store data: name "Demo Store", slug "demo-store"
  - [x] 2.3: Verify idempotency by running seed twice

- [x] **Task 3**: Implement idempotent User seeding (AC: 3, 4, 5)
  - [x] 3.1: Create seed function for demo Users with upsert (unique: email)
  - [x] 3.2: Create at least 3 users:
    - Admin: "admin@trafi.dev", "Admin User"
    - Manager: "manager@trafi.dev", "Store Manager"
    - Staff: "staff@trafi.dev", "Staff Member"
  - [x] 3.3: All users must be scoped to demo Store (storeId relation)

- [x] **Task 4**: Implement idempotent Product seeding (AC: 2, 4, 5)
  - [x] 4.1: Create seed function for demo Products with upsert (unique: [storeId, slug])
  - [x] 4.2: Create minimum 10 products with realistic e-commerce data:
    - Various price points (priceInCents: 999 to 99999)
    - Proper slugs (kebab-case)
    - Realistic descriptions
    - Mix of isActive true/false
  - [x] 4.3: Example product categories for variety: clothing, electronics, home goods

- [x] **Task 5**: Create seed orchestration and logging (AC: 1, 2, 3, 4)
  - [x] 5.1: Implement main seed function with proper ordering (Store -> Users -> Products)
  - [x] 5.2: Add console logging for seed progress and results
  - [x] 5.3: Handle errors gracefully with descriptive messages
  - [x] 5.4: Disconnect Prisma client in finally block

- [x] **Task 6**: Test and validate (AC: 1, 2, 3, 4, 5, 6)
  - [x] 6.1: Run `pnpm db:push` to ensure schema is applied
  - [x] 6.2: Run `pnpm db:seed` from root - verify data created
  - [x] 6.3: Run `pnpm db:seed` again - verify idempotency (no duplicates)
  - [x] 6.4: Run `pnpm db:studio` - visually verify all data (verified via seed output)
  - [x] 6.5: Run `pnpm typecheck` - no TypeScript errors
  - [x] 6.6: Run `pnpm lint` - no ESLint errors

## Dev Notes

### Relevant Architecture Patterns and Constraints

**From Architecture Document:**

1. **Money as Cents (ARCH-25)**: All money values MUST be stored as INTEGER cents
   - `priceInCents: 1999` represents $19.99
   - NEVER use floats for money

2. **ID Patterns (ARCH-25)**: Use CUID format with domain prefixes (implemented in service layer, seed uses default CUID)

3. **Multi-Tenancy (CRITICAL)**: Every entity must be tenant-scoped
   - All Products and Users MUST have `storeId` reference
   - This enables `WHERE storeId = ?` filtering in all queries

4. **Naming Conventions (ARCH-22)**:
   - Model names: PascalCase singular (Store, Product, User)
   - Table names: snake_case plural via `@@map` (stores, products, users)
   - Column names: camelCase in Prisma, snake_case in DB via `@map`

### Current Prisma Schema (from Story 1-5)

The schema has 3 models defined:

```prisma
// Store - Multi-tenant root
model Store {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  users     User[]
  products  Product[]
  @@map("stores")
}

// User - Admin users (dashboard access)
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  storeId   String   @map("store_id")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  store     Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  @@index([storeId])
  @@map("users")
}

// Product - Catalog entity
model Product {
  id           String   @id @default(cuid())
  storeId      String   @map("store_id")
  name         String
  slug         String
  description  String?
  priceInCents Int      @map("price_in_cents")
  isActive     Boolean  @default(true) @map("is_active")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  store        Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  @@unique([storeId, slug])
  @@index([storeId])
  @@map("products")
}
```

### Seed Script Pattern (Prisma 7)

```typescript
// apps/api/prisma/seed.ts
// NOTE: Prisma 7 requires adapter pattern - direct PrismaClient() won't work!
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Validate DATABASE_URL first
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Initialize with PostgreSQL adapter (Prisma 7 requirement)
const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Seed Store first (parent)
  const store = await prisma.store.upsert({
    where: { slug: 'demo-store' },
    update: {},
    create: {
      name: 'Demo Store',
      slug: 'demo-store',
    },
  });
  console.log(`Store created/found: ${store.name} (${store.id})`);

  // 2. Seed Users (child of Store)
  // ... upsert with email as unique key

  // 3. Seed Products (child of Store)
  // ... upsert with [storeId, slug] as unique key
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
```

### Package.json Configuration

```json
// apps/api/package.json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

**Alternative for Prisma 7 with ESM:**
```json
{
  "prisma": {
    "seed": "npx tsx prisma/seed.ts"
  }
}
```

### Demo Data Examples

**Products to seed (10+ items):**

| Name | Slug | Price (cents) | Description | Active |
|------|------|---------------|-------------|--------|
| Premium T-Shirt | premium-tshirt | 2999 | High-quality cotton t-shirt | true |
| Classic Hoodie | classic-hoodie | 5999 | Cozy fleece hoodie | true |
| Wireless Earbuds | wireless-earbuds | 8999 | Bluetooth 5.0 earbuds | true |
| Smart Watch | smart-watch | 19999 | Fitness tracking watch | true |
| Laptop Stand | laptop-stand | 4999 | Adjustable aluminum stand | true |
| USB-C Hub | usb-c-hub | 3499 | 7-in-1 USB-C dock | true |
| Coffee Mug | coffee-mug | 1499 | Ceramic 12oz mug | true |
| Desk Lamp | desk-lamp | 3999 | LED desk lamp with USB | true |
| Notebook Set | notebook-set | 999 | 3-pack ruled notebooks | true |
| Discontinued Item | discontinued-item | 1999 | No longer available | false |
| Limited Edition Cap | limited-edition-cap | 2499 | Special release cap | true |

### Previous Story Learnings (1-6)

From Story 1-6 (Test Infrastructure):
1. **dotenv-cli**: Always prefix scripts with `dotenv --` when they need environment variables (DATABASE_URL)
2. **Prisma 7**: Generated client location is `src/generated/prisma`
3. **ts-node CommonJS**: May need compiler options for seed script
4. **tsx alternative**: Consider using `tsx` instead of `ts-node` for ESM compatibility

### Project Structure After Completion

```
apps/api/
├── prisma/
│   ├── seed.ts            # NEW: Seed script
│   └── schema/
│       ├── base.prisma
│       ├── store.prisma
│       ├── user.prisma
│       └── product.prisma
├── package.json           # MODIFIED: Add db:seed script + prisma.seed config
└── ...

(root)
├── package.json           # MODIFIED: Add db:seed script
└── ...
```

### Testing Idempotency

The seed script MUST be idempotent. This means:

1. **First run**: Creates all demo data
2. **Second run**: Does nothing (data already exists)
3. **No errors**: Either run should complete successfully

This is achieved through Prisma `upsert`:
- `where`: Unique constraint to find existing record
- `update`: What to do if record exists (can be empty `{}`)
- `create`: What to create if record doesn't exist

### Context7 MCP Reminder

Before implementing, query Context7 for latest documentation:
- `prisma` - Seeding best practices for Prisma 7
- `@prisma/client` - Upsert syntax and batch operations

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story-1.7]
- [Source: _bmad-output/planning-artifacts/architecture.md#ARCH-25] Money as cents
- [Source: _bmad-output/planning-artifacts/architecture.md#ARCH-22] Naming conventions
- [Source: _bmad-output/implementation-artifacts/1-6-setup-test-infrastructure.md#Previous-Story-Learnings]
- [Source: apps/api/prisma/schema/product.prisma] Product model definition
- [Source: apps/api/prisma/schema/store.prisma] Store model definition
- [Source: apps/api/prisma/schema/user.prisma] User model definition

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

1. **Prisma 7 Adapter Pattern**: The seed script uses `@prisma/adapter-pg` with `PrismaPg` for PostgreSQL connection, matching the pattern used in `PrismaService`. This is required in Prisma 7 - direct `PrismaClient()` instantiation without adapter throws an error.

2. **Seed Configuration**: In Prisma 7, the seed command is configured in `prisma.config.ts` under `migrations.seed` instead of `package.json prisma.seed`. Uses `npx tsx prisma/seed.ts` for TypeScript execution.

3. **Idempotency Verified**: Running `pnpm db:seed` twice produces identical output with same Store ID (cmkaqb4sq0000f757gbk557k8), confirming upsert behavior works correctly.

4. **Demo Data Created**:
   - 1 Store: "Demo Store" (demo-store)
   - 3 Users: admin@trafi.dev, manager@trafi.dev, staff@trafi.dev
   - 11 Products: Mix of active/inactive, prices from $9.99 to $199.99 (stored as cents)

5. **Architecture Compliance**:
   - Money stored as INTEGER cents (ARCH-25)
   - All entities properly scoped with storeId (multi-tenancy)
   - CUIDs used for all IDs

### File List

**New Files:**
- `apps/api/prisma/seed.ts` - Database seed script with Store, User, Product seeding

**Modified Files:**
- `apps/api/prisma.config.ts` - Added `seed: 'npx tsx prisma/seed.ts'` to migrations config
- `apps/api/package.json` - Added `db:seed` script and `tsx` dev dependency
- `package.json` - Added `db:seed` script at monorepo root
- `pnpm-lock.yaml` - Updated with tsx dependency

## Senior Developer Review (AI)

**Reviewer:** Claude Opus 4.5 (Adversarial Review)
**Date:** 2026-01-12

### Review Summary

| Severity | Count | Fixed |
|----------|-------|-------|
| CRITICAL | 0 | N/A |
| HIGH | 0 | N/A |
| MEDIUM | 3 | 2 (1 deferred) |
| LOW | 4 | 2 |

### Issues Found & Resolutions

**M1: Missing DATABASE_URL validation** (FIXED)
- Seed script used `process.env.DATABASE_URL as string` without checking if undefined
- Resolution: Added explicit validation with helpful error message at seed.ts:20-26

**M2: Missing unit tests for seed script** (DEFERRED)
- No automated tests verify idempotency behavior
- Root cause: Seed scripts typically run against real DB, hard to unit test without test DB fixture
- Resolution: Deferred to future story when test database fixtures are established

**M3: pnpm-lock.yaml not documented** (FIXED)
- Added to File List

**L1: Console logging structure** (NOT FIXED - intentional)
- Human-readable console output is appropriate for CLI dev tool
- JSON structured logging would reduce usability

**L2: Dev Notes outdated code example** (FIXED)
- Updated seed script pattern in Dev Notes to show Prisma 7 adapter requirement

**L3: Magic number 60** (FIXED)
- Extracted to `LOG_SEPARATOR_WIDTH` constant

**L4: AC1 "complete configuration" wording** (DOCUMENTED)
- Store model only has name/slug, which is appropriate for MVP
- Future stories will add store settings/configuration

### Verification

- `pnpm db:seed` runs successfully
- `pnpm typecheck` passes
- `pnpm lint` passes

### Verdict: APPROVED

All acceptance criteria implemented. Issues addressed. Story ready for done status.

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-12 | Story created with comprehensive seed data context | SM Agent |
| 2026-01-12 | Implemented complete seed infrastructure with Prisma 7 adapter pattern. All 6 tasks completed. Seed creates 1 Store, 3 Users, 11 Products with idempotent upsert behavior. | Dev Agent |
| 2026-01-12 | Code review: Fixed M1 (DATABASE_URL validation), M3 (File List), L2 (Dev Notes example), L3 (magic number). M2 deferred (seed tests need DB fixtures) | Reviewer |
