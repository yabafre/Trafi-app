# Story 3.R1: Foundation Reinforcement (Epic 1 & 2 Enhancements)

Status: done

## Story

As a **System**,
I want **core foundation models to support new commerce features**,
So that **Promotions, Gift Cards, and Multi-currency integrate seamlessly**.

## Acceptance Criteria

1. **AC1**: Store model has `defaultRegionId` field for future Region linkage
2. **AC2**: StoreCurrency join table exists linking Store to Currency (NOT array - per ARCH Principle #2)
3. **AC3**: StoreSettings has promotions feature flags (`promotionsEnabled`, `maxDiscountPercent`, `allowStackablePromos`)
4. **AC4**: StoreSettings has gift cards feature flags (`giftCardsEnabled`, `giftCardMinCents`, `giftCardMaxCents`, `giftCardValidityDays`)
5. **AC5**: StoreSettings has multi-currency flags (`multiCurrencyEnabled`, `displayPriceIncTax`)
6. **AC6**: All new fields have sensible defaults for backward compatibility
7. **AC7**: Migration is additive only (no destructive changes)
8. **AC8**: Existing store functionality remains unaffected

## Tasks / Subtasks

### Backend Tasks

- [x] Task 1: Create StoreCurrency join table schema (AC: 2, 6, 7)
  - [x] 1.1: Create `apps/api/prisma/schema/store-currency.prisma`
  - [x] 1.2: Define composite primary key `@@id([storeId, currencyCode])`
  - [x] 1.3: Add relations to Store and Currency models
  - [x] 1.4: Add `isDefault` Boolean field for default currency designation
  - [x] 1.5: Add createdAt timestamp

- [x] Task 2: Update Store model (AC: 1, 7)
  - [x] 2.1: Add `defaultRegionId String? @map("default_region_id")` to store.prisma
  - [x] 2.2: Add `currencies StoreCurrency[]` relation
  - [x] 2.3: Verify no breaking changes to existing queries

- [x] Task 3: Update StoreSettings model (AC: 3, 4, 5, 6, 7)
  - [x] 3.1: Add promotions section fields to store-settings.prisma
  - [x] 3.2: Add gift cards section fields
  - [x] 3.3: Add multi-currency section fields
  - [x] 3.4: Ensure all fields have `@default()` values

- [x] Task 4: Run Prisma migrations (AC: 7, 8)
  - [x] 4.1: Run `pnpm db:generate` to update Prisma client
  - [x] 4.2: Run `pnpm db:push` to apply schema changes
  - [x] 4.3: Verify no data loss warnings

- [x] Task 5: Update StoreSettingsService (AC: 3, 4, 5)
  - [x] 5.1: Add new fields to `UpdateStoreSettingsSchema` in validators
  - [x] 5.2: Update service to handle new fields
  - [x] 5.3: Add validation for `maxDiscountPercent` (0-100 range)
  - [x] 5.4: Add validation for gift card amount constraints

- [x] Task 6: Seed default currency data (AC: 6, 8)
  - [x] 6.1: Update seed script to create StoreCurrency entry for existing stores
  - [x] 6.2: Set EUR as default currency for all existing stores

### Testing Tasks

- [x] Task 7: Write unit tests
  - [x] 7.1: Test StoreSettings update with new fields
  - [x] 7.2: Test StoreCurrency CRUD operations
  - [x] 7.3: Test default values are applied correctly
  - [x] 7.4: Test backward compatibility (existing queries work)

## Dev Notes

### Critical Architecture Decision: NO Arrays for Relational Data

**Source:** [project-context.md#Principle 2: No Arrays for Relational Data]

The original story specification suggests `supportedCurrencies String[]` on Store. This is **INCORRECT**.

Per Architecture Principle #2, use join tables instead of arrays:
```typescript
// BAD: Array for currencies
model Store {
  supportedCurrencies String[]  // Can't index, can't query efficiently
}

// GOOD: Join table
model StoreCurrency {
  storeId      String
  currencyCode String
  @@id([storeId, currencyCode])
}
```

### Prisma Schema: StoreCurrency Join Table

**File:** `apps/api/prisma/schema/store-currency.prisma`

```prisma
// =============================================================================
// StoreCurrency Join Table Schema
// =============================================================================
// Many-to-many relationship between Store and Currency (global reference).
// Per Architecture Principle #2: Use join tables, NOT arrays.
// No ID prefix needed (composite primary key).
// @see Story 3.R1 - Foundation Reinforcement
// =============================================================================

model StoreCurrency {
  storeId       String   @map("store_id")
  currencyCode  String   @map("currency_code")
  isDefault     Boolean  @default(false) @map("is_default")
  createdAt     DateTime @default(now()) @map("created_at")

  store    Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  currency Currency @relation(fields: [currencyCode], references: [code], onDelete: Restrict)

  @@id([storeId, currencyCode])
  @@index([storeId])
  @@map("store_currencies")
}
```

### Prisma Schema: Store Updates

**File:** `apps/api/prisma/schema/store.prisma`

Add these fields and relations:
```prisma
model Store {
  // ... existing fields ...

  // New: Multi-currency support (Story 3.R1)
  defaultRegionId String? @map("default_region_id")

  // New: Currency relations (Story 3.R1)
  currencies StoreCurrency[]

  // ... existing relations ...
}
```

### Prisma Schema: StoreSettings Updates

**File:** `apps/api/prisma/schema/store-settings.prisma`

Add these fields after existing Business section:
```prisma
model StoreSettings {
  // ... existing fields ...

  // =============================================
  // Commerce Feature Flags (Story 3.R1)
  // =============================================

  // Promotions settings
  promotionsEnabled     Boolean @default(true) @map("promotions_enabled")
  maxDiscountPercent    Int     @default(100) @map("max_discount_percent") // 0-100
  allowStackablePromos  Boolean @default(false) @map("allow_stackable_promos")

  // Gift cards settings
  giftCardsEnabled      Boolean @default(false) @map("gift_cards_enabled")
  giftCardMinCents      Int     @default(1000) @map("gift_card_min_cents")    // $10 min
  giftCardMaxCents      Int     @default(50000) @map("gift_card_max_cents")   // $500 max
  giftCardValidityDays  Int?    @map("gift_card_validity_days")               // null = never expires

  // Multi-currency settings
  multiCurrencyEnabled  Boolean @default(false) @map("multi_currency_enabled")
  displayPriceIncTax    Boolean @default(true) @map("display_price_inc_tax")

  // ... existing relations ...
}
```

### Currency Model Update

**File:** `apps/api/prisma/schema/currency.prisma`

Add the reverse relation:
```prisma
model Currency {
  // ... existing fields ...

  // Relations (Story 3.R1)
  stores StoreCurrency[]
}
```

### Zod Validator Updates

**File:** `packages/@trafi/validators/src/store/store-settings.schema.ts`

Add new fields to update schema:
```typescript
// Add to UpdateStoreSettingsSchema
promotionsEnabled: z.boolean().optional(),
maxDiscountPercent: z.number().int().min(0).max(100).optional(),
allowStackablePromos: z.boolean().optional(),
giftCardsEnabled: z.boolean().optional(),
giftCardMinCents: z.number().int().positive().optional(),
giftCardMaxCents: z.number().int().positive().optional(),
giftCardValidityDays: z.number().int().positive().nullable().optional(),
multiCurrencyEnabled: z.boolean().optional(),
displayPriceIncTax: z.boolean().optional(),
```

Add validation refinement:
```typescript
.refine(data => {
  if (data.giftCardMinCents && data.giftCardMaxCents) {
    return data.giftCardMinCents <= data.giftCardMaxCents;
  }
  return true;
}, { message: 'Min gift card amount must be <= max amount' })
```

### Migration SQL (Reference Only)

```sql
-- Story 3.R1: Foundation Reinforcement Migration

-- StoreCurrency join table
CREATE TABLE store_currencies (
  store_id TEXT NOT NULL,
  currency_code TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (store_id, currency_code),
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  FOREIGN KEY (currency_code) REFERENCES currencies(code) ON DELETE RESTRICT
);
CREATE INDEX idx_store_currencies_store_id ON store_currencies(store_id);

-- Store updates
ALTER TABLE stores ADD COLUMN default_region_id TEXT;

-- StoreSettings updates
ALTER TABLE store_settings ADD COLUMN promotions_enabled BOOLEAN DEFAULT true;
ALTER TABLE store_settings ADD COLUMN max_discount_percent INTEGER DEFAULT 100;
ALTER TABLE store_settings ADD COLUMN allow_stackable_promos BOOLEAN DEFAULT false;
ALTER TABLE store_settings ADD COLUMN gift_cards_enabled BOOLEAN DEFAULT false;
ALTER TABLE store_settings ADD COLUMN gift_card_min_cents INTEGER DEFAULT 1000;
ALTER TABLE store_settings ADD COLUMN gift_card_max_cents INTEGER DEFAULT 50000;
ALTER TABLE store_settings ADD COLUMN gift_card_validity_days INTEGER;
ALTER TABLE store_settings ADD COLUMN multi_currency_enabled BOOLEAN DEFAULT false;
ALTER TABLE store_settings ADD COLUMN display_price_inc_tax BOOLEAN DEFAULT true;
```

### Seed Script Update

**File:** `apps/api/prisma/seed.ts`

Add StoreCurrency seeding for existing stores:
```typescript
// After creating store, add default currency
await prisma.storeCurrency.create({
  data: {
    storeId: store.id,
    currencyCode: 'EUR',
    isDefault: true,
  },
});
```

### Backward Compatibility Notes

1. **All new fields have defaults** - Existing stores continue working without changes
2. **Feature flags control visibility** - `promotionsEnabled`, `giftCardsEnabled` control UI/API access
3. **No destructive changes** - Migration is purely additive
4. **Existing queries unaffected** - No breaking changes to current data access patterns

### Project Structure Notes

Files to create:
```
apps/api/prisma/schema/store-currency.prisma    # New join table
```

Files to modify:
```
apps/api/prisma/schema/store.prisma             # Add defaultRegionId, currencies relation
apps/api/prisma/schema/store-settings.prisma    # Add commerce feature flags
apps/api/prisma/schema/currency.prisma          # Add stores relation
packages/@trafi/validators/src/store/store-settings.schema.ts  # Add new fields
apps/api/prisma/seed.ts                         # Add StoreCurrency seeding
```

### Previous Story Patterns (from 3.9, 3.10)

**Source:** [3-9-promotions-and-discounts-foundation.md, 3-10-gift-cards.md]

1. **Protected Methods (RETRO-2)**: Service methods use `protected` for extensibility
2. **Tenant Isolation**: All queries include `storeId` filter
3. **Money in Cents (ARCH-25)**: Amounts stored as integer cents
4. **Join Table Pattern**: Use `@@id([fk1, fk2])` composite primary key (see CollectionProduct)

### Testing Standards

- Unit tests in `__tests__/` directories
- Mock PrismaService for service tests
- Test default value application
- Test validation constraints (maxDiscountPercent range, gift card amount ordering)
- Verify backward compatibility (existing queries still work)

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-03/story-3-r1-foundation.md]
- [Source: _bmad-output/project-context.md#Principle 2: No Arrays for Relational Data]
- [Source: _bmad-output/project-context.md#Database Schema Architectural Principles]
- [Source: apps/api/prisma/schema/collection-product.prisma - Join table pattern]
- [Source: apps/api/prisma/schema/currency.prisma - Global reference table]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

1. **Task 1 Complete (2026-01-22):** Created StoreCurrency join table with composite PK, following CollectionProduct pattern
2. **Task 2 Complete (2026-01-22):** Added defaultRegionId to Store, added currencies relation
3. **Task 3 Complete (2026-01-22):** Added 9 commerce feature flags to StoreSettings with sensible defaults
4. **Task 4 Complete (2026-01-22):** Prisma generate and push successful, no data loss warnings
5. **Task 5 Complete (2026-01-22):** Updated validators, DTOs, and SettingsService to handle all new fields
6. **Task 6 Complete (2026-01-22):** Seed script creates StoreCurrency(EUR, isDefault=true) for demo store
7. **Task 7 Complete (2026-01-22):** Added 5 commerce feature flags tests + 12 StoreCurrency tests (code review fix)

### File List

**Created:**
- `apps/api/prisma/schema/store-currency.prisma`
- `apps/api/src/database/__tests__/store-currency.spec.ts` - StoreCurrency join table tests (Task 7.2)

**Modified:**
- `apps/api/prisma/schema/store.prisma` - Added defaultRegionId, currencies relation
- `apps/api/prisma/schema/store-settings.prisma` - Added 9 commerce feature flags
- `apps/api/prisma/schema/currency.prisma` - Added stores relation
- `packages/@trafi/validators/src/store/store-settings.schema.ts` - Added new fields with validation refinement
- `apps/api/src/modules/settings/settings.service.ts` - Updated defaults, buildUpdateData, getCreateDataFromDefaults, toSettingsResponse
- `apps/api/src/modules/settings/dto/store-settings-response.dto.ts` - Added commerce feature flag properties
- `apps/api/src/modules/settings/dto/update-store-settings.dto.ts` - Added commerce feature flag properties with validation
- `apps/api/src/modules/settings/__tests__/settings.service.spec.ts` - Added 5 commerce feature flags tests
- `apps/api/prisma/seed.ts` - Added StoreCurrency seeding

### Change Log

- **2026-01-22:** Story implemented - All 7 tasks complete, 651 tests passing, builds successful
- **2026-01-22:** Code review - 1 HIGH issue fixed (added 12 StoreCurrency tests for Task 7.2), File List updated
