# Story 3.7: Inventory Tracking

**Status:** done

**Epic:** 3 - Product Catalog & Inventory
**Story ID:** 3.7
**Story Key:** 3-7-inventory-tracking

---

## Story

As a **Merchant**,
I want **to track inventory levels per variant**,
So that **I know what's in stock**.

---

## Acceptance Criteria

1. **AC1 - Set Quantity per Variant:** Given product variants exist, when the Merchant configures inventory, then they can set the quantity for each variant individually.

2. **AC2 - Enable/Disable Inventory Tracking:** The Merchant can toggle `trackInventory` on/off per variant. When off, the variant is always considered in stock.

3. **AC3 - Low Stock Threshold:** The Merchant can set a `lowStockThreshold` per variant (default: 5). When quantity falls at or below this threshold, a low stock event is emitted.

4. **AC4 - Inventory History:** Every inventory change is logged in `InventoryHistory` with:
   - `quantityBefore`, `quantityAfter`, `quantityChange`
   - `reason` (enum: manual_adjustment, order_placed, order_cancelled, order_refunded, received_stock, damaged, returned, correction)
   - `note` (optional free text)
   - `createdById` (user who made the change)
   - `createdAt` timestamp

5. **AC5 - View Inventory History:** The Merchant can view the history of all inventory adjustments for a variant in a paginated timeline view.

6. **AC6 - Atomic Inventory Updates:** All inventory updates use Prisma transactions with `Serializable` isolation level to prevent race conditions.

7. **AC7 - Allow Oversell Flag:** A new `allowOversell` boolean field on ProductVariant enables pre-orders or made-to-order items. When true, inventory can go negative.

8. **AC8 - Inventory UI:** Dashboard provides:
   - Quantity input (number stepper or direct input)
   - Low stock threshold configuration
   - Stock indicators: Green (> threshold), Amber (= threshold), Red (= 0)
   - Quick adjust +/- buttons for common operations
   - History panel with timeline showing adjustments

---

## Tasks / Subtasks

### Backend (apps/api)

- [x] **Task 1: Create InventoryHistory Prisma Schema** (AC: #4)
  - [x] 1.1 Create `apps/api/prisma/schema/inventory-history.prisma`
  - [x] 1.2 Add fields: `id` (invh_ prefix), `variantId`, `quantityBefore`, `quantityAfter`, `quantityChange`, `reason`, `note`, `createdById`, `createdAt`
  - [x] 1.3 Add `InventoryAdjustmentReason` enum with all reason values
  - [x] 1.4 Add relations to ProductVariant and User
  - [x] 1.5 Add indexes: `[variantId, createdAt]` for efficient history queries
  - [x] 1.6 Verify `InventoryHistory: 'invh'` is already configured in `id-prefixes.config.ts` (it is)
  - [x] 1.7 Run `pnpm db:generate` and `pnpm db:push`

- [x] **Task 2: Update ProductVariant Schema** (AC: #3, #7)
  - [x] 2.1 Add `lowStockThreshold Int @default(5)` field
  - [x] 2.2 Add `allowOversell Boolean @default(false)` field
  - [x] 2.3 Add `InventoryHistory[]` relation
  - [x] 2.4 Run `pnpm db:generate` and `pnpm db:push`

- [x] **Task 3: Create Zod Schemas** (AC: #1, #4, #5)
  - [x] 3.1 Create `packages/@trafi/validators/src/inventory/index.ts`
  - [x] 3.2 Add: `InventoryAdjustmentReasonSchema` (enum)
  - [x] 3.3 Add: `AdjustInventorySchema` (variantId, quantityChange, reason, note?)
  - [x] 3.4 Add: `SetInventorySchema` (variantId, quantity, reason?)
  - [x] 3.5 Add: `UpdateInventorySettingsSchema` (variantId, lowStockThreshold?, trackInventory?, allowOversell?)
  - [x] 3.6 Add: `InventoryHistorySchema` (response type)
  - [x] 3.7 Add: `ListInventoryHistorySchema` (variantId, page, limit)
  - [x] 3.8 Export schemas from `packages/@trafi/validators/src/index.ts`
  - [x] 3.9 Create inferred types in `packages/@trafi/types/src/inventory.types.ts`
  - [x] 3.10 Export types from `packages/@trafi/types/src/index.ts`

- [x] **Task 4: Create InventoryService** (AC: #1, #3, #4, #5, #6, #7)
  - [x] 4.1 Create `apps/api/src/modules/inventory/inventory.service.ts`
  - [x] 4.2 Implement `protected adjustInventory(variantId, quantityChange, reason, note?, userId?)` with Serializable transaction
  - [x] 4.3 Implement `protected setInventory(variantId, quantity, reason?, userId?)` that calculates delta and calls adjustInventory
  - [x] 4.4 Implement `protected updateSettings(variantId, settings)` for lowStockThreshold, trackInventory, allowOversell
  - [x] 4.5 Implement `getHistory(storeId, variantId, page, limit)` with tenant verification
  - [x] 4.6 Implement `getVariantInventory(storeId, variantId)` returning current stock info
  - [x] 4.7 Emit events: `inventory.adjusted`, `inventory.low_stock`, `inventory.settings_updated`
  - [x] 4.8 Add retry logic for P2034 errors (transaction conflicts)
  - [x] 4.9 Write unit tests in `apps/api/src/modules/inventory/__tests__/inventory.service.spec.ts` (12 tests for stock status calculations)

- [x] **Task 5: Create InventoryModule** (AC: #4)
  - [x] 5.1 Create `apps/api/src/modules/inventory/inventory.module.ts`
  - [x] 5.2 Create `apps/api/src/modules/inventory/index.ts` with explicit exports
  - [x] 5.3 Import InventoryModule in AppModule

- [x] **Task 6: Create tRPC Router** (AC: #1, #3, #4, #5, #7)
  - [x] 6.1 Create `apps/api/src/trpc/routers/inventory.router.ts`
  - [x] 6.2 Implement `adjust` mutation (products:update permission)
  - [x] 6.3 Implement `set` mutation (products:update permission)
  - [x] 6.4 Implement `updateSettings` mutation (products:update permission)
  - [x] 6.5 Implement `history` query (products:read permission)
  - [x] 6.6 Implement `get` query for single variant inventory (products:read permission)
  - [x] 6.7 Register in `apps/api/src/trpc/routers/_app.ts`
  - [x] 6.8 Add InventoryService to TRPCServices in `apps/api/src/trpc/context.ts`

### Frontend (apps/dashboard)

- [x] **Task 7: Create Server Actions** (AC: #8)
  - [x] 7.1 Create `apps/dashboard/src/app/(dashboard)/products/_actions/inventory-actions.ts`
  - [x] 7.2 Implement: `adjustInventoryAction`, `setInventoryAction`, `updateInventorySettingsAction`
  - [x] 7.3 Implement: `getInventoryHistoryAction`, `getVariantInventoryAction`
  - [x] 7.4 Export from `_actions/index.ts`

- [x] **Task 8: Create Custom Hooks** (AC: #8)
  - [x] 8.1 Create `products/_hooks/useInventory.ts` with all hooks combined
  - [x] 8.2 Implement useVariantInventory, useInventoryHistory (paginated history)
  - [x] 8.3 Implement useAdjustInventory, useSetInventory, useUpdateInventorySettings mutations
  - [x] 8.4 Export from `_hooks/index.ts`

- [x] **Task 9: Create Inventory UI Components** (AC: #8)
  - [x] 9.1 Create `products/[id]/_components/InventorySection.tsx` - combined main inventory panel with stock indicator, adjustment form, settings, and history
  - [x] 9.2 Stock indicator integrated into InventorySection with Green/Amber/Red color coding
  - [x] 9.3 Inventory history timeline integrated into InventorySection
  - [x] 9.4 Adjustment form integrated into InventorySection (supports +/- adjust and set modes)
  - [x] 9.5 Settings panel integrated into InventorySection (trackInventory, lowStockThreshold, allowOversell)
  - [x] 9.6 Export from `_components/index.ts`

- [x] **Task 10: Integrate Inventory into Product Edit** (AC: #8)
  - [x] 10.1 Create EditVariantInventoryDialog wrapper component
  - [x] 10.2 Add Package icon button to VariantRow for inventory editing
  - [x] 10.3 Integrate EditVariantInventoryDialog into VariantsSection

---

## Dev Notes

### Critical Implementation Rules

1. **Prefixed IDs via Extension:** InventoryHistory uses `invh_` prefix. Already configured in `id-prefixes.config.ts`. PrismaService extension handles generation automatically.

2. **Tenant Isolation via Product:** InventoryHistory doesn't have direct `storeId` - tenant verification goes through ProductVariant → Product → storeId chain.

3. **Protected Methods Pattern:** Use `protected` (not `private`) for all service methods for @trafi/core extensibility (RETRO-2).

4. **Serializable Transactions with Retry:** Use `Prisma.TransactionIsolationLevel.Serializable` for all inventory mutations. Implement retry logic for P2034 errors (transaction conflicts):
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

5. **Event Emission:** Emit events for all mutations: `inventory.adjusted`, `inventory.low_stock`, `inventory.settings_updated`.

6. **Allow Oversell Logic:** When `allowOversell` is true, skip the negative quantity check. This enables pre-orders.

### Prisma Schema Pattern

```prisma
// apps/api/prisma/schema/inventory-history.prisma
enum InventoryAdjustmentReason {
  MANUAL_ADJUSTMENT
  ORDER_PLACED
  ORDER_CANCELLED
  ORDER_REFUNDED
  RECEIVED_STOCK
  DAMAGED
  RETURNED
  CORRECTION
}

model InventoryHistory {
  id             String                    @id @default(cuid())
  variantId      String                    @map("variant_id")
  quantityBefore Int                       @map("quantity_before")
  quantityAfter  Int                       @map("quantity_after")
  quantityChange Int                       @map("quantity_change")
  reason         InventoryAdjustmentReason
  note           String?                   @db.VarChar(500)
  createdById    String?                   @map("created_by_id")
  createdAt      DateTime                  @default(now()) @map("created_at")

  // Relations
  variant   ProductVariant @relation(fields: [variantId], references: [id], onDelete: Cascade)
  createdBy User?          @relation(fields: [createdById], references: [id])

  @@index([variantId, createdAt(sort: Desc)])
  @@map("inventory_history")
}
```

```prisma
// Update apps/api/prisma/schema/product-variant.prisma - Add these fields
model ProductVariant {
  // ... existing fields ...
  lowStockThreshold Int     @default(5) @map("low_stock_threshold")
  allowOversell     Boolean @default(false) @map("allow_oversell")

  // Add relation
  inventoryHistory InventoryHistory[]
}
```

### InventoryService Core Pattern

```typescript
// apps/api/src/modules/inventory/inventory.service.ts
@Injectable()
export class InventoryService {
  protected readonly logger = new Logger(InventoryService.name);
  private readonly MAX_RETRIES = 5;

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly eventEmitter: EventEmitter2,
  ) {}

  protected async adjustInventory(
    variantId: string,
    quantityChange: number,
    reason: InventoryAdjustmentReason,
    note?: string,
    userId?: string,
  ) {
    let retries = 0;

    while (retries < this.MAX_RETRIES) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          const variant = await tx.productVariant.findUnique({
            where: { id: variantId },
            select: {
              id: true,
              quantity: true,
              trackInventory: true,
              allowOversell: true,
              lowStockThreshold: true,
              product: { select: { storeId: true } }
            },
          });

          if (!variant) throw new NotFoundException('Variant not found');
          if (!variant.trackInventory) return variant; // No-op if not tracking

          const newQuantity = variant.quantity + quantityChange;

          // Prevent negative inventory (unless overselling is allowed)
          if (newQuantity < 0 && !variant.allowOversell) {
            throw new BadRequestException('Insufficient inventory');
          }

          // Update variant
          const updated = await tx.productVariant.update({
            where: { id: variantId },
            data: { quantity: newQuantity },
          });

          // Log the adjustment
          await tx.inventoryHistory.create({
            data: {
              variantId,
              quantityBefore: variant.quantity,
              quantityAfter: newQuantity,
              quantityChange,
              reason,
              note,
              createdById: userId,
            },
          });

          // Emit low stock event if applicable
          if (newQuantity <= variant.lowStockThreshold && quantityChange < 0) {
            this.eventEmitter.emit('inventory.low_stock', {
              variantId,
              storeId: variant.product.storeId,
              quantity: newQuantity,
              threshold: variant.lowStockThreshold,
            });
          }

          return updated;
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

    throw new Error('Max retries exceeded for inventory adjustment');
  }
}
```

### Dashboard Data Flow Pattern

```
InventorySection.tsx (Client)
  |-- useInventory() hook (get current stock)
  |-- useInventoryHistory() hook (paginated history)
  |-- useInventoryMutations() hooks (adjust, set, updateSettings)
       |
       v
Server Actions (_actions/inventory-actions.ts)
       |
       v
tRPC Router (inventory.router.ts)
       |
       v
InventoryService (inventory.service.ts)
```

### UX/UI Pattern (Digital Brutalism v2)

- **Stock Indicator Badge:**
  - Green (#00FF94): quantity > lowStockThreshold
  - Amber (#CCFF00): quantity <= lowStockThreshold && quantity > 0
  - Red (#FF3366): quantity === 0
- **History Timeline:** Vertical timeline with reason icons, user avatar, timestamp
- **Quick Adjust:** +1/-1 buttons, +10/-10 buttons, custom input
- **Settings Dialog:** Numeric inputs for threshold, toggles for tracking/oversell

### Project Structure Notes

```
apps/api/src/modules/inventory/
├── inventory.module.ts
├── inventory.service.ts        # Atomic inventory operations
├── index.ts                    # Barrel export
└── __tests__/
    └── inventory.service.spec.ts

apps/api/prisma/schema/
├── inventory-history.prisma    # NEW: InventoryHistory model
└── product-variant.prisma      # MODIFIED: Add lowStockThreshold, allowOversell

apps/dashboard/src/app/(dashboard)/products/[id]/
├── _components/
│   ├── InventorySection.tsx       # Main inventory panel
│   ├── StockIndicator.tsx         # Color-coded badge
│   ├── InventoryHistoryPanel.tsx  # Timeline
│   ├── AdjustInventoryDialog.tsx  # Quick adjust modal
│   └── InventorySettingsDialog.tsx # Settings modal
├── _hooks/
│   ├── useInventory.ts
│   ├── useInventoryHistory.ts
│   └── useInventoryMutations.ts
└── _actions/
    └── inventory-actions.ts
```

---

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-03-product-catalog.md#Story 3.7]
- [Source: _bmad-output/project-context.md#Database Schema Architectural Principles]
- [Source: apps/api/src/database/id-prefixes.config.ts] - InventoryHistory: 'invh' already configured
- [Source: apps/api/prisma/schema/product-variant.prisma] - Current variant schema
- [Source: Prisma docs: Transaction isolation levels] - Serializable for atomic updates

---

### Previous Story Intelligence (from Story 3.6)

**Key Learnings to Apply:**

1. **Prefixed IDs via Extension:** Don't manually generate IDs. The PrismaService extension handles `invh_` prefix automatically. Already configured in id-prefixes.config.ts.

2. **Protected Methods Pattern:** Use `protected` (not `private`) for all service methods for @trafi/core extensibility.

3. **Event Emission:** Emit events for all mutations (inventory.adjusted, inventory.low_stock, inventory.settings_updated).

4. **Transaction Patterns:** Use `Prisma.TransactionIsolationLevel.Serializable` with retry logic for concurrent-safe operations.

5. **Test Coverage:** Story 3.6 had 32+ tests for PricingService. Target similar coverage for InventoryService.

---

### Git Intelligence (Recent Commits)

Recent commits show consistent patterns:
- `feat:` prefix for new features
- Story 3.6 just completed (product pricing and tax rules)
- Code follows established patterns from variants, pricing, and collections modules
- Build is clean and passing

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

1. **Implementation Complete**: All 10 tasks successfully implemented covering backend (Tasks 1-6) and frontend (Tasks 7-10).

2. **Acceptance Criteria Met**:
   - AC1: Quantity per variant via InventorySection UI
   - AC2: trackInventory toggle in settings panel
   - AC3: lowStockThreshold configurable per variant (default: 5)
   - AC4: InventoryHistory model with all required fields
   - AC5: Paginated history timeline in InventorySection
   - AC6: Serializable transactions with P2034 retry logic
   - AC7: allowOversell boolean field on ProductVariant
   - AC8: Full UI with stock indicators, adjustment forms, settings, and history

3. **Test Coverage**: 12 unit tests for InventoryService stock status calculations (all passing).

4. **Build Status**: API compiles cleanly. Dashboard has pre-existing unrelated test file errors.

5. **Key Patterns Followed**:
   - Protected methods for @trafi/core extensibility
   - Prefixed IDs via PrismaService extension (invh_ prefix)
   - Tenant isolation via ProductVariant → Product → storeId chain
   - Event emission for inventory.adjusted, inventory.low_stock, inventory.settings_updated
   - Digital Brutalism v2 UI with Green/Amber/Red stock indicators

### File List

**Created:**
- `apps/api/prisma/schema/inventory-history.prisma`
- `apps/api/src/modules/inventory/inventory.service.ts`
- `apps/api/src/modules/inventory/inventory.module.ts`
- `apps/api/src/modules/inventory/index.ts`
- `apps/api/src/modules/inventory/__tests__/inventory.service.spec.ts`
- `apps/api/src/trpc/routers/inventory.router.ts`
- `packages/@trafi/validators/src/inventory/index.ts`
- `packages/@trafi/types/src/inventory.types.ts`
- `apps/dashboard/src/app/(dashboard)/products/_actions/inventory-actions.ts`
- `apps/dashboard/src/app/(dashboard)/products/_hooks/useInventory.ts`
- `apps/dashboard/src/app/(dashboard)/products/[id]/_components/InventorySection.tsx`
- `apps/dashboard/src/app/(dashboard)/products/[id]/_components/EditVariantInventoryDialog.tsx`

**Modified:**
- `apps/api/prisma/schema/product-variant.prisma` - Added lowStockThreshold, allowOversell, inventoryHistory relation
- `apps/api/prisma/schema/user.prisma` - Added inventoryAdjustments relation
- `apps/api/src/database/prisma.service.ts` - Added inventoryHistory getter
- `apps/api/src/app.module.ts` - Imported InventoryModule
- `apps/api/src/trpc/routers/_app.ts` - Registered inventory router
- `apps/api/src/trpc/context.ts` - Added InventoryService to TRPCServices
- `apps/api/src/trpc/trpc.module.ts` - Imported InventoryModule and InventoryService
- `apps/api/src/modules/variants/variants.service.ts` - Added lowStockThreshold/allowOversell to toVariantResponse
- `packages/@trafi/validators/src/index.ts` - Exported inventory schemas
- `packages/@trafi/validators/src/variant/index.ts` - Added lowStockThreshold/allowOversell to VariantResponseSchema
- `packages/@trafi/types/src/index.ts` - Exported inventory types
- `apps/dashboard/src/app/(dashboard)/products/_actions/index.ts` - Exported inventory actions
- `apps/dashboard/src/app/(dashboard)/products/_hooks/index.ts` - Exported inventory hooks
- `apps/dashboard/src/app/(dashboard)/products/[id]/_components/index.ts` - Exported inventory components
- `apps/dashboard/src/app/(dashboard)/products/[id]/_components/VariantsSection.tsx` - Added inventory dialog and button
- `apps/dashboard/src/app/(dashboard)/products/[id]/_components/VariantRow.tsx` - Added Package icon button for inventory
- `apps/dashboard/src/app/(dashboard)/products/[id]/_components/__tests__/VariantsSection.test.tsx` - Added lowStockThreshold/allowOversell to mock data
