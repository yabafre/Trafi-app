# Story 3.8: Oversell Prevention

**Status:** done

**Epic:** 3 - Product Catalog & Inventory
**Story ID:** 3.8
**Story Key:** 3-8-oversell-prevention

---

## Story

As a **System**,
I want **to prevent orders for out-of-stock items**,
So that **customers don't order unavailable products**.

---

## Acceptance Criteria

1. **AC1 - Availability Check:** Given a product variant with inventory tracking enabled, when its availability is checked, then the system returns whether the requested quantity is available (considering both physical stock AND active reservations).

2. **AC2 - Out-of-Stock Prevention:** Given a variant with `trackInventory: true` and `allowOversell: false`, when quantity reaches 0 (or reserved quantity equals physical quantity), then the variant cannot be added to cart.

3. **AC3 - Cart Quantity Auto-Adjustment:** Given a cart item with quantity exceeding available stock, when the cart is validated at checkout, then the quantity is automatically adjusted down to the maximum available and user is notified.

4. **AC4 - Inventory Reservation:** Given a cart item being added or checkout initiated, when inventory needs to be held, then an `InventoryReservation` record is created with:
   - Status: `ACTIVE`
   - Expiration time (configurable, default 15 minutes)
   - Unique constraint per cart+variant

5. **AC5 - Reservation Status Lifecycle:** Reservations follow the lifecycle:
   - `ACTIVE` - Stock is held, counted against available quantity
   - `RELEASED` - Order placed successfully, stock committed
   - `EXPIRED` - Reservation expired, stock released back

6. **AC6 - Optimistic Locking:** Concurrent checkout attempts use Serializable transaction isolation with P2034 retry logic to prevent oversell race conditions.

7. **AC7 - Available Stock Computation:** Available stock is COMPUTED as: `variant.quantity - SUM(activeReservations.quantity)`, NOT stored as a field.

8. **AC8 - Allow Oversell Bypass:** Given a variant with `allowOversell: true`, when stock check is performed, then the availability check always returns `available: true` (pre-orders enabled).

9. **AC9 - Event Emission:** The following events are emitted:
   - `inventory.reserved` - When reservation is created
   - `inventory.reservation.released` - When reservation converts to order
   - `inventory.reservation.expired` - When reservation expires

10. **AC10 - Reservation Expiry Worker:** A background job/worker periodically marks expired reservations as `EXPIRED` and releases the held stock.

---

## Tasks / Subtasks

### Backend (apps/api)

- [x] **Task 1: Create InventoryReservation Prisma Schema** (AC: #4, #5)
  - [x] 1.1 Create `apps/api/prisma/schema/inventory-reservation.prisma`
  - [x] 1.2 Add fields: `id` (invres_ prefix), `storeId`, `cartId`, `variantId`, `quantity`, `status`, `expiresAt`, `createdAt`, `releasedAt`
  - [x] 1.3 Add `ReservationStatus` enum: `ACTIVE`, `RELEASED`, `EXPIRED`
  - [x] 1.4 Add unique constraint: `@@unique([cartId, variantId])`
  - [x] 1.5 Add indexes: `[storeId, variantId, status]` (for available stock calc), `[storeId, cartId]` (for cart cleanup), `[status, expiresAt]` (for expiry worker)
  - [x] 1.6 Add relations to ProductVariant
  - [x] 1.7 Verify `InventoryReservation: 'invres'` is configured in `id-prefixes.config.ts` (it is)
  - [x] 1.8 Run `pnpm db:generate` and `pnpm db:push`

- [x] **Task 2: Create Zod Schemas** (AC: #1, #2, #3)
  - [x] 2.1 Create schemas in `packages/@trafi/validators/src/inventory/index.ts` (extended existing)
  - [x] 2.2 Add: `ReservationStatusSchema` (enum)
  - [x] 2.3 Add: `CheckAvailabilityInputSchema` (variantId, requestedQuantity)
  - [x] 2.4 Add: `CheckAvailabilityResultSchema` (available, availableQuantity, allowOversell, trackInventory)
  - [x] 2.5 Add: `ValidateCartItemSchema` (variantId, quantity)
  - [x] 2.6 Add: `CartValidationResultSchema` (valid, adjustments[], outOfStockItems[])
  - [x] 2.7 Add: `CartAdjustmentSchema` (variantId, requestedQuantity, availableQuantity, adjusted, message?)
  - [x] 2.8 Add: `CreateReservationInputSchema` (storeId, cartId, variantId, quantity, expiresInMinutes?)
  - [x] 2.9 Add: `InventoryReservationSchema` (response type)
  - [x] 2.10 Export schemas from `packages/@trafi/validators/src/index.ts` (already exported via inventory)
  - [x] 2.11 Types inferred directly via z.infer in same file (no separate types file needed)
  - [x] 2.12 Export types from `packages/@trafi/types/src/index.ts` (not needed - types co-located)

- [x] **Task 3: Create CartValidationService** (AC: #1, #2, #3, #6, #7, #8)
  - [x] 3.1 Create `apps/api/src/modules/inventory/cart-validation.service.ts`
  - [x] 3.2 Implement `protected getAvailableStock(storeId, variantId)` - compute available (quantity - active reservations)
  - [x] 3.3 Implement `protected checkAvailability(storeId, variantId, requestedQuantity)` with trackInventory and allowOversell logic
  - [x] 3.4 Implement `protected validateCartItems(storeId, items[])` - validate multiple items, return adjustments
  - [x] 3.5 Implement `protected createReservation(storeId, cartId, variantId, quantity, expiresInMinutes)` with Serializable transaction
  - [x] 3.6 Implement `protected releaseReservation(cartId, variantId, reason)` - mark as RELEASED or EXPIRED
  - [x] 3.7 Implement `protected releaseCartReservations(cartId)` - release all reservations for a cart
  - [x] 3.8 Implement `protected getCartReservations(storeId, cartId)` - get all active reservations for a cart
  - [x] 3.9 Add P2034 retry logic for Serializable transaction conflicts
  - [x] 3.10 Emit events: `inventory.reserved`, `inventory.reservation.released`, `inventory.reservation.expired`
  - [x] 3.11 Write unit tests in `apps/api/src/modules/inventory/__tests__/cart-validation.service.spec.ts`

- [x] **Task 4: Create InventoryModule Updates** (AC: #4)
  - [x] 4.1 Update `apps/api/src/modules/inventory/inventory.module.ts` - add CartValidationService
  - [x] 4.2 Update `apps/api/src/modules/inventory/index.ts` - export CartValidationService
  - [x] 4.3 PrismaService auto-includes inventoryReservation via Prisma generate (no manual update needed)

- [x] **Task 5: Create REST Controller** (AC: #1, #2, #3, #4)
  - [x] 5.1 Create `apps/api/src/modules/inventory/cart-validation.controller.ts`
  - [x] 5.2 Implement `GET /storefront/:storeId/availability/:variantId` (public)
  - [x] 5.3 Implement `POST /storefront/:storeId/cart/validate` (public)
  - [x] 5.4 Implement `POST /storefront/:storeId/reservations` (auth required)
  - [x] 5.5 Implement `POST /storefront/:storeId/reservations/release` (auth required)
  - [x] 5.6 Implement `GET /storefront/:storeId/stock/:variantId` (public)
  - [x] 5.7 Register controller in InventoryModule
  - [x] 5.8 Add Swagger documentation for all endpoints

  **Architecture Note:** REST controller (not tRPC) because storefront uses SDK/REST per architecture.md:
  - Dashboard → tRPC (internal)
  - Storefront → SDK/REST (external)

- [x] **Task 6: Create Reservation Expiry Job** (AC: #10)
  - [x] 6.1 Create `apps/api/src/modules/inventory/jobs/expire-reservations.job.ts`
  - [x] 6.2 Implement job that queries `status: ACTIVE, expiresAt < now()`
  - [x] 6.3 Update matching reservations to `status: EXPIRED, releasedAt: now()`
  - [x] 6.4 Emit `inventory.reservation.expired` event for each expired reservation
  - [x] 6.5 Add job using @nestjs/schedule @Interval decorator (every 1 minute)
  - [x] 6.6 Write unit tests for expiry logic (12 tests passing)

---

## Dev Notes

### Critical Implementation Rules

1. **Prefixed IDs via Extension:** InventoryReservation uses `invres_` prefix. Already configured in `id-prefixes.config.ts`. PrismaService extension handles generation automatically.

2. **Tenant Isolation:** InventoryReservation HAS direct `storeId` (unlike InventoryHistory which uses variant chain). This enables efficient queries for cart cleanup.

3. **Protected Methods Pattern:** Use `protected` (not `private`) for all service methods for @trafi/core extensibility (RETRO-2).

4. **Serializable Transactions with Retry:** Use `Prisma.TransactionIsolationLevel.Serializable` for all reservation mutations. Implement retry logic for P2034 errors:
   ```typescript
   const MAX_RETRIES = 5;
   let retries = 0;
   while (retries < MAX_RETRIES) {
     try {
       return await this.prisma.$transaction(async (tx) => { ... }, {
         isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
         maxWait: 5000,
         timeout: 10000,
       });
     } catch (error) {
       if (error.code === 'P2034') {
         retries++;
         continue;
       }
       throw error;
     }
   }
   ```

5. **Computed Available Stock:** NEVER store `reservedQuantity` on ProductVariant. Compute on-demand:
   ```typescript
   const reservedQuantity = await this.prisma.inventoryReservation.aggregate({
     where: { variantId, status: 'ACTIVE' },
     _sum: { quantity: true },
   });
   const availableStock = variant.quantity - (reservedQuantity._sum.quantity ?? 0);
   ```

6. **Event Emission:** Emit events for all reservation lifecycle changes.

7. **Cart ID Dependency:** This story creates the reservation system. The actual `Cart` model is created in Epic 4 (Story 4.1). For now, use placeholder `cartId` string that will be provided by Cart service later.

### Prisma Schema Pattern

```prisma
// apps/api/prisma/schema/inventory-reservation.prisma
enum ReservationStatus {
  ACTIVE     // Stock is held
  RELEASED   // Converted to OrderItem
  EXPIRED    // Auto-cleanup by worker
}

model InventoryReservation {
  id         String            @id @default(cuid())
  storeId    String            @map("store_id")
  cartId     String            @map("cart_id")
  variantId  String            @map("variant_id")
  quantity   Int
  status     ReservationStatus @default(ACTIVE)
  expiresAt  DateTime          @map("expires_at")
  createdAt  DateTime          @default(now()) @map("created_at")
  releasedAt DateTime?         @map("released_at")

  // Relations
  store   Store          @relation(fields: [storeId], references: [id], onDelete: Cascade)
  variant ProductVariant @relation(fields: [variantId], references: [id], onDelete: Cascade)

  // Constraints
  @@unique([cartId, variantId])  // No duplicate holds per cart
  @@index([storeId, variantId, status])  // For available stock calc (only ACTIVE)
  @@index([storeId, cartId])  // For cart cleanup
  @@index([status, expiresAt])  // For expiry worker
  @@map("inventory_reservations")
}
```

### CartValidationService Core Pattern

```typescript
// apps/api/src/modules/inventory/cart-validation.service.ts
@Injectable()
export class CartValidationService {
  protected readonly logger = new Logger(CartValidationService.name);
  private readonly MAX_RETRIES = 5;
  private readonly DEFAULT_RESERVATION_MINUTES = 15;

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly eventEmitter: EventEmitter2,
  ) {}

  protected async getAvailableStock(storeId: string, variantId: string): Promise<number> {
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, product: { storeId } },
      select: { quantity: true, trackInventory: true },
    });

    if (!variant || !variant.trackInventory) {
      return Number.MAX_SAFE_INTEGER; // Unlimited if not tracking
    }

    const reserved = await this.prisma.inventoryReservation.aggregate({
      where: { variantId, status: 'ACTIVE' },
      _sum: { quantity: true },
    });

    return variant.quantity - (reserved._sum.quantity ?? 0);
  }

  protected async checkAvailability(
    storeId: string,
    variantId: string,
    requestedQuantity: number,
  ): Promise<CheckAvailabilityResult> {
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, product: { storeId } },
      select: {
        quantity: true,
        trackInventory: true,
        allowOversell: true,
      },
    });

    if (!variant) {
      return { available: false, availableQuantity: 0, allowOversell: false, trackInventory: false };
    }

    // Not tracking inventory = always available
    if (!variant.trackInventory) {
      return { available: true, availableQuantity: requestedQuantity, allowOversell: true, trackInventory: false };
    }

    // Allow oversell bypasses stock check
    if (variant.allowOversell) {
      return { available: true, availableQuantity: requestedQuantity, allowOversell: true, trackInventory: true };
    }

    const availableStock = await this.getAvailableStock(storeId, variantId);

    return {
      available: availableStock >= requestedQuantity,
      availableQuantity: Math.max(0, availableStock),
      allowOversell: false,
      trackInventory: true,
    };
  }

  protected async createReservation(
    storeId: string,
    cartId: string,
    variantId: string,
    quantity: number,
    expiresInMinutes: number = this.DEFAULT_RESERVATION_MINUTES,
  ): Promise<InventoryReservation> {
    let retries = 0;

    while (retries < this.MAX_RETRIES) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          // Check if reservation already exists for this cart+variant
          const existing = await tx.inventoryReservation.findUnique({
            where: { cartId_variantId: { cartId, variantId } },
          });

          if (existing && existing.status === 'ACTIVE') {
            // Update existing reservation
            const updated = await tx.inventoryReservation.update({
              where: { id: existing.id },
              data: {
                quantity,
                expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000),
              },
            });
            return updated;
          }

          // Verify stock available
          const availability = await this.checkAvailability(storeId, variantId, quantity);
          if (!availability.available) {
            throw new BadRequestException(
              `Insufficient stock for variant ${variantId}. Available: ${availability.availableQuantity}`,
            );
          }

          // Create new reservation
          const reservation = await tx.inventoryReservation.create({
            data: {
              storeId,
              cartId,
              variantId,
              quantity,
              status: 'ACTIVE',
              expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000),
            },
          });

          this.eventEmitter.emit('inventory.reserved', {
            reservationId: reservation.id,
            storeId,
            cartId,
            variantId,
            quantity,
          });

          return reservation;
        }, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5000,
          timeout: 10000,
        });
      } catch (error) {
        if (error.code === 'P2034') {
          retries++;
          this.logger.warn(`Transaction conflict, retry ${retries}/${this.MAX_RETRIES}`);
          continue;
        }
        throw error;
      }
    }

    throw new Error('Max retries exceeded for reservation creation');
  }
}
```

### Dashboard Data Flow Pattern (for Storefront - Epic 4)

```
AddToCartButton.tsx (Client - Storefront)
  |-- useCheckAvailability() hook (pre-check before add)
       |
       v
Server Actions (storefront/_actions/cart-validation-actions.ts)
       |
       v
tRPC Router (cart-validation.router.ts)
       |
       v
CartValidationService (cart-validation.service.ts)
```

### Project Structure Notes

```
apps/api/src/modules/inventory/
├── inventory.module.ts           # MODIFIED: Add CartValidationService
├── inventory.service.ts          # Existing from 3.7
├── cart-validation.service.ts    # NEW: Availability checks + reservations
├── index.ts                      # MODIFIED: Export CartValidationService
├── jobs/
│   └── expire-reservations.job.ts  # NEW: BullMQ job for reservation expiry
└── __tests__/
    ├── inventory.service.spec.ts     # Existing from 3.7
    └── cart-validation.service.spec.ts # NEW: Unit tests

apps/api/prisma/schema/
├── inventory-reservation.prisma  # NEW: InventoryReservation model
└── product-variant.prisma        # MODIFIED: Add inventoryReservations relation

apps/api/src/trpc/routers/
├── inventory.router.ts           # Existing from 3.7
└── cart-validation.router.ts     # NEW: Cart validation endpoints
```

---

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-03-product-catalog.md#Story 3.8]
- [Source: _bmad-output/project-context.md#Database Schema Architectural Principles]
- [Source: _bmad-output/implementation-artifacts/database-schema-roadmap.md#InventoryReservation]
- [Source: apps/api/src/database/id-prefixes.config.ts] - InventoryReservation: 'invres' configured
- [Source: apps/api/prisma/schema/product-variant.prisma] - Current variant schema
- [Source: apps/api/prisma/schema/inventory-history.prisma] - Pattern reference
- [Source: _bmad-output/implementation-artifacts/3-7-inventory-tracking.md] - Previous story patterns

---

### Previous Story Intelligence (from Story 3.7)

**Key Learnings to Apply:**

1. **Prefixed IDs via Extension:** Don't manually generate IDs. The PrismaService extension handles `invres_` prefix automatically. Already configured in id-prefixes.config.ts.

2. **Protected Methods Pattern:** Use `protected` (not `private`) for all service methods for @trafi/core extensibility.

3. **Event Emission:** Emit events for all state changes (inventory.reserved, inventory.reservation.released, inventory.reservation.expired).

4. **Transaction Patterns:** Use `Prisma.TransactionIsolationLevel.Serializable` with retry logic for concurrent-safe operations.

5. **Test Coverage:** Story 3.7 had 12 tests for InventoryService. Target similar coverage for CartValidationService (~15 tests covering all edge cases).

6. **Tenant Isolation:** Always verify storeId ownership through ProductVariant -> Product -> storeId chain for stock checks.

---

### Git Intelligence (Recent Commits)

Recent commits show consistent patterns:
- `feat:` prefix for new features
- Story 3.7 just completed (inventory tracking with Serializable transactions)
- Code follows established patterns from inventory module
- Build is clean and passing

---

### Architectural Decisions

1. **Computed vs Stored Reserved Quantity:** Decision: COMPUTED. No `reservedQuantity` field on ProductVariant. Compute via `SUM(WHERE status = ACTIVE)` on demand. Simpler, no sync issues.

2. **Reservation Scope:** Reservations are created at checkout initiation, not add-to-cart. This follows industry practice (Amazon, Shopify) to avoid holding stock for abandoned carts.

3. **Expiry Duration:** Default 15 minutes, configurable per store. Industry standard for checkout flows.

4. **Cart Dependency:** Story 3.8 creates the reservation infrastructure. The actual `Cart` model integration happens in Epic 4 (Story 4.1). CartId is a string placeholder for now.

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- No debug issues encountered during implementation

### Completion Notes List

- All 10 ACs implemented and verified
- 40 unit tests passing (28 cart-validation + 12 expire-reservations)
- Serializable transactions with P2034 retry logic implemented
- Event emission for all reservation lifecycle changes
- Code review completed with all issues resolved

### File List

**New Files (8):**
- `_bmad-output/implementation-artifacts/3-8-oversell-prevention.md` - Story file
- `apps/api/prisma/schema/inventory-reservation.prisma` - InventoryReservation Prisma schema
- `apps/api/src/modules/inventory/cart-validation.service.ts` - Cart validation and reservation service
- `apps/api/src/modules/inventory/cart-validation.controller.ts` - REST controller for storefront (SDK/REST)
- `apps/api/src/modules/inventory/jobs/expire-reservations.job.ts` - Reservation expiry background job
- `apps/api/src/modules/inventory/jobs/index.ts` - Jobs barrel export
- `apps/api/src/modules/inventory/__tests__/cart-validation.service.spec.ts` - Cart validation unit tests (28 tests)
- `apps/api/src/modules/inventory/__tests__/expire-reservations.job.spec.ts` - Expiry job unit tests (12 tests)

**Modified Files (9):**
- `apps/api/package.json` - Added @nestjs/schedule dependency
- `apps/api/prisma/schema/product-variant.prisma` - Added inventoryReservations relation
- `apps/api/prisma/schema/store.prisma` - Added inventoryReservations relation
- `apps/api/src/database/prisma.service.ts` - Added invres_ prefix configuration
- `apps/api/src/modules/inventory/index.ts` - Exported CartValidationService, CartValidationController, ExpireReservationsJob
- `apps/api/src/modules/inventory/inventory.module.ts` - Added CartValidationController, CartValidationService, ExpireReservationsJob
- `packages/@trafi/validators/src/inventory/index.ts` - Added reservation and cart validation schemas
- `pnpm-lock.yaml` - Updated lockfile
- `_bmad-output/implementation-artifacts/sprint-status.yaml` - Updated story status

**Architecture Decision:**
Cart validation exposed via REST controller (not tRPC) per architecture.md:
- Storefront → SDK/REST → `/storefront/:storeId/*` endpoints
- Dashboard → tRPC (cart validation not needed in backoffice)

