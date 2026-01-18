# Story M-1: V3 Architectural Retroactive Fixes

> **Type:** Maintenance Story
> **Priority:** P0 - Critical (Blocks Epic 3.2+)
> **Estimated Effort:** 4-6 hours
> **Created:** 2026-01-18
> **Epic:** Cross-Epic Maintenance

---

## User Story

As a **Developer**,
I want **existing schemas and models to comply with v3 architectural principles**,
So that **future stories don't inherit technical debt and data integrity is maintained**.

---

## Background

The v3 architectural review (2026-01-18) identified gaps between documented principles and actual implementation in done stories. These fixes are required before continuing Epic 3.

**Done Stories Affected:**
- Story 2-1: Admin User Model (User.email missing citext)
- Story 3-1: Product Model (missing deletedAt for soft delete)

**Foundation Models Missing:**
- Country (global reference table)
- Currency (global reference table)
- StoreCounter (atomic sequences)
- DomainEvent (outbox pattern)
- StoreMembership (multi-store RBAC - deferred to 2-R1)

---

## Acceptance Criteria

### AC1: User.email Case-Insensitive (Principle #8)

**Given** the User model exists
**When** I apply the citext migration
**Then**:
- [ ] Migration created: `CREATE EXTENSION IF NOT EXISTS citext;`
- [ ] User.email changed to `@db.Citext` in Prisma schema
- [ ] Existing emails remain unchanged (citext is transparent)
- [ ] Login works case-insensitively ("John@Email.COM" == "john@email.com")

```prisma
// user.prisma - BEFORE
email String @unique

// user.prisma - AFTER
email String @unique @db.Citext
```

### AC2: Product Soft Delete (Principle #9)

**Given** the Product model exists
**When** I add soft delete support
**Then**:
- [ ] `deletedAt DateTime?` field added to Product model
- [ ] `@@index([storeId, deletedAt])` added for query performance
- [ ] ProductService.findMany() filters by `deletedAt: null` by default
- [ ] ProductService.delete() sets `deletedAt: now()` instead of hard delete
- [ ] Existing products have `deletedAt: null`

```prisma
// product.prisma - ADD
model Product {
  // ... existing fields ...
  deletedAt DateTime?

  @@index([storeId, deletedAt])
}
```

### AC3: Global Reference Tables (Principle #1 Exception)

**Given** we need global reference data
**When** I create Country and Currency tables
**Then**:
- [ ] Country model created with `iso2` as primary key (NO storeId)
- [ ] Currency model created with `code` as primary key (NO storeId)
- [ ] Seed script populates ISO 3166 countries (249 records)
- [ ] Seed script populates ISO 4217 currencies (~180 records)
- [ ] Country and Currency have NO storeId field

```prisma
// country.prisma
model Country {
  iso2      String @id       // "US", "FR", "CA"
  iso3      String           // "USA", "FRA", "CAN"
  name      String           // "United States"
  phoneCode String?          // "+1", "+33"
}

// currency.prisma
model Currency {
  code          String @id   // "USD", "EUR", "CAD"
  name          String       // "US Dollar"
  symbol        String       // "$", "€"
  decimalDigits Int          // 2
}
```

### AC4: StoreCounter for Atomic Sequences (Principle #5)

**Given** we need atomic sequential identifiers
**When** I create the StoreCounter model
**Then**:
- [ ] StoreCounter model created with compound PK (storeId, key)
- [ ] Counter types documented: "order", "invoice", "return", "purchase_order"
- [ ] StoreCounterService created with atomic increment method
- [ ] Unit test verifies concurrent increments don't produce duplicates

```prisma
// store-counter.prisma
model StoreCounter {
  storeId String
  key     String   // "order", "invoice", "return", "purchase_order"
  value   BigInt   @default(0)

  @@id([storeId, key])
}
```

### AC5: DomainEvent Outbox Pattern (Principle #6)

**Given** we need async operation reliability
**When** I create the DomainEvent model
**Then**:
- [ ] DomainEvent model created with EventStatus enum
- [ ] Indexes created for worker polling: `[status, createdAt]`
- [ ] DomainEventService created with:
  - `emit(type, payload)` - inserts PENDING event
  - `claim()` - atomic claim with PROCESSING status
  - `complete(id)` - marks PROCESSED
  - `fail(id, error)` - marks FAILED with retry logic
- [ ] Dead letter handling after max attempts (default 5)

```prisma
// domain-event.prisma
model DomainEvent {
  id           String      @id           // evt_xxx
  storeId      String
  type         String                    // "order.created", "payment.succeeded"
  payload      Json
  status       EventStatus @default(PENDING)
  attempts     Int         @default(0)
  createdAt    DateTime    @default(now())
  processedAt  DateTime?
  errorMessage String?

  @@index([storeId, status, createdAt])
  @@index([status, createdAt])           // Worker polling
}

enum EventStatus {
  PENDING
  PROCESSING
  PROCESSED
  FAILED
  DEAD_LETTER
}
```

---

## Technical Implementation

### File Structure

```
apps/api/prisma/
├── migrations/
│   └── 20260118_v3_retroactive_fixes/
│       └── migration.sql
├── schema/
│   ├── user.prisma          # UPDATE: Add @db.Citext
│   ├── product.prisma       # UPDATE: Add deletedAt
│   ├── country.prisma       # NEW
│   ├── currency.prisma      # NEW
│   ├── store-counter.prisma # NEW
│   └── domain-event.prisma  # NEW
├── seed/
│   ├── countries.seed.ts    # NEW: ISO 3166 data
│   └── currencies.seed.ts   # NEW: ISO 4217 data

apps/api/src/
├── database/
│   ├── id-prefixes.config.ts  # UPDATE: Add evt_ prefix
│   └── services/
│       ├── store-counter.service.ts   # NEW
│       └── domain-event.service.ts    # NEW
├── modules/products/
│   └── products.service.ts  # UPDATE: Soft delete logic
```

### Migration SQL Preview

```sql
-- Enable citext extension
CREATE EXTENSION IF NOT EXISTS citext;

-- Update User.email to citext
ALTER TABLE "User" ALTER COLUMN "email" TYPE citext;

-- Add Product soft delete
ALTER TABLE "Product" ADD COLUMN "deleted_at" TIMESTAMP;
CREATE INDEX "Product_storeId_deletedAt_idx" ON "Product"("store_id", "deleted_at");

-- Create Country table (global, no storeId)
CREATE TABLE "Country" (
  "iso2" TEXT PRIMARY KEY,
  "iso3" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone_code" TEXT
);

-- Create Currency table (global, no storeId)
CREATE TABLE "Currency" (
  "code" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "symbol" TEXT NOT NULL,
  "decimal_digits" INTEGER NOT NULL DEFAULT 2
);

-- Create StoreCounter table
CREATE TABLE "StoreCounter" (
  "store_id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "value" BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY ("store_id", "key")
);

-- Create DomainEvent table
CREATE TYPE "EventStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED', 'DEAD_LETTER');
CREATE TABLE "DomainEvent" (
  "id" TEXT PRIMARY KEY,
  "store_id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" "EventStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "processed_at" TIMESTAMP,
  "error_message" TEXT
);
CREATE INDEX "DomainEvent_status_createdAt_idx" ON "DomainEvent"("status", "created_at");
CREATE INDEX "DomainEvent_storeId_status_createdAt_idx" ON "DomainEvent"("store_id", "status", "created_at");
```

---

## Testing Requirements

### Unit Tests

```typescript
// store-counter.service.spec.ts
describe('StoreCounterService', () => {
  it('should increment counter atomically', async () => {
    const result1 = await service.increment(storeId, 'order');
    const result2 = await service.increment(storeId, 'order');
    expect(result2).toBe(result1 + 1);
  });

  it('should handle concurrent increments without duplicates', async () => {
    const results = await Promise.all([
      service.increment(storeId, 'order'),
      service.increment(storeId, 'order'),
      service.increment(storeId, 'order'),
    ]);
    const unique = new Set(results);
    expect(unique.size).toBe(3); // All different
  });
});

// domain-event.service.spec.ts
describe('DomainEventService', () => {
  it('should emit event with PENDING status', async () => {
    const event = await service.emit(storeId, 'order.created', { orderId: 'ord_123' });
    expect(event.status).toBe('PENDING');
  });

  it('should claim event atomically', async () => {
    await service.emit(storeId, 'order.created', {});
    const claimed = await service.claim();
    expect(claimed?.status).toBe('PROCESSING');
  });
});
```

### Integration Tests

- [ ] Login with different email cases succeeds
- [ ] Deleted products don't appear in listings
- [ ] Country/Currency seed data loads correctly
- [ ] StoreCounter handles concurrent requests

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Migration runs successfully on local and staging
- [ ] Existing data unaffected (no breaking changes)
- [ ] Unit tests pass with 90%+ coverage
- [ ] Integration tests pass
- [ ] `pnpm db:push` and `pnpm db:generate` succeed
- [ ] project-context.md already updated with v3 principles
- [ ] sprint-status.yaml updated with M-1 status

---

## Out of Scope (Deferred)

- **StoreMembership** (multi-store RBAC) - Deferred to Story 2-R1
- **InventoryReservation** - Part of Story 3-7
- **Existing data migration** - Only schema changes, no data transformation needed

---

## Dependencies

- None (standalone maintenance story)

## Blocks

- Story 3-2: Product Variants (needs soft delete pattern)
- Story 3-7: Inventory Tracking (needs StoreCounter, DomainEvent)
- Story 4-1: Cart Model (needs Country/Currency reference tables)

---

## Notes

This story consolidates v3 retroactive fixes identified in the architectural audit (2026-01-18).
All changes are backward-compatible and non-breaking.
