# Story 3.6: Product Pricing and Tax Rules

**Status:** done

**Epic:** 3 - Product Catalog & Inventory
**Story ID:** 3.6
**Story Key:** 3-6-product-pricing-and-tax-rules

---

## Story

As a **Merchant**,
I want **to set product prices with tax configuration**,
So that **prices display correctly with applicable taxes**.

---

## Acceptance Criteria

1. **AC1 - Variant Pricing Fields:** Given a product variant exists, when the Merchant sets pricing, then they can configure:
   - Base price (stored in cents - ARCH-25)
   - Compare-at price for sales display (strike-through)
   - Cost price for margin calculation
   - Tax inclusion setting (price includes tax or not)

2. **AC2 - TaxRule Entity:** The system supports TaxRule entity with:
   - ID prefix `tax_` (auto-generated)
   - Name (e.g., "TVA Standard", "TVA Réduit")
   - Rate as percentage (e.g., 20 for 20%)
   - Country code (ISO 3166-1 alpha-2)
   - `isDefault` flag per store
   - `appliesToShipping` flag (new v3 requirement)

3. **AC3 - Tax Rule Assignment:** Products/variants can have a TaxRule assigned via `taxRuleId` field. If not assigned, the store's default tax rule applies.

4. **AC4 - Tax Calculation Service:** The PricingService calculates:
   - Net price (before tax)
   - Tax amount
   - Gross price (with tax)
   - Handles both "tax included" and "tax excluded" scenarios

5. **AC5 - Margin Calculation:** The system calculates profit margin when cost price is provided:
   - Margin in cents
   - Margin percentage
   - Real-time display as cost price is entered

6. **AC6 - Currency Formatting:** Prices are formatted using `Intl.NumberFormat` with store's default currency and locale.

7. **AC7 - TaxRule CRUD:** Dashboard provides full CRUD for tax rules:
   - Create, update, delete tax rules
   - List tax rules with filtering by country
   - Set default tax rule for store

8. **AC8 - Pricing UI:** Dashboard pricing section shows:
   - Price input (user enters decimal like "29.99", stored as 2999 cents)
   - Compare-at price with strikethrough preview
   - Cost price with real-time margin badge
   - Tax toggle ("Prix TTC" / "Prix HT")

9. **AC9 - Store Settings Integration:** StoreSettings.taxIncluded determines default behavior for new products (already exists).

10. **AC10 - Tax Rule Tenant Isolation:** All TaxRule queries are scoped by storeId. Country codes reference the global Country table.

---

## Tasks / Subtasks

### Backend (apps/api)

- [x] **Task 1: Create TaxRule Prisma Schema** (AC: #2, #10)
  - [x] 1.1 Create `apps/api/prisma/schema/tax-rule.prisma` with all fields
  - [x] 1.2 Add fields: `id`, `storeId`, `name`, `rate`, `countryIso2`, `isDefault`, `appliesToShipping`
  - [x] 1.3 Add `@@unique([storeId, name])` for tenant-scoped uniqueness
  - [x] 1.4 Add `@@unique([storeId, countryIso2, isDefault])` for one default per country
  - [x] 1.5 Add relation to Store and Country (global table)
  - [x] 1.6 Verify `TaxRule: 'tax'` already exists in `id-prefixes.config.ts` (it does)
  - [x] 1.7 Run `pnpm db:generate` and `pnpm db:push`

- [x] **Task 2: Update ProductVariant Schema** (AC: #1, #3)
  - [x] 2.1 Add `taxRuleId` optional field to ProductVariant
  - [x] 2.2 Add relation to TaxRule
  - [x] 2.3 Run `pnpm db:generate` and `pnpm db:push`

- [x] **Task 3: Create Zod Schemas** (AC: #1, #2, #3)
  - [x] 3.1 Create `packages/@trafi/validators/src/pricing/index.ts`
  - [x] 3.2 Add: `PricingSchema`, `TaxRuleSchema`, `CreateTaxRuleSchema`, `UpdateTaxRuleSchema`, `ListTaxRulesSchema`
  - [x] 3.3 Add: `UpdateVariantPricingSchema` for variant pricing updates
  - [x] 3.4 Export schemas from `packages/@trafi/validators/src/index.ts`
  - [x] 3.5 Create inferred types in `packages/@trafi/types/src/pricing.types.ts`
  - [x] 3.6 Export types from `packages/@trafi/types/src/index.ts`

- [x] **Task 4: Create PricingService** (AC: #4, #5, #6)
  - [x] 4.1 Create `apps/api/src/modules/pricing/pricing.service.ts`
  - [x] 4.2 Implement `protected calculateTax(priceInCents, taxRate, taxIncluded)` method
  - [x] 4.3 Implement `protected calculateMargin(priceInCents, costPriceInCents)` method
  - [x] 4.4 Implement `formatPrice(cents, currency, locale)` utility method
  - [x] 4.5 Write unit tests in `apps/api/src/modules/pricing/__tests__/pricing.service.spec.ts` (min 15 tests)

- [x] **Task 5: Create TaxRulesService** (AC: #2, #7, #10)
  - [x] 5.1 Create `apps/api/src/modules/pricing/tax-rules.service.ts`
  - [x] 5.2 Implement CRUD methods (create, update, delete, findById, list)
  - [x] 5.3 Implement `setDefaultTaxRule(storeId, taxRuleId)` method
  - [x] 5.4 Implement `getDefaultTaxRule(storeId, countryCode?)` method
  - [x] 5.5 Add EventEmitter events: `taxRule.created`, `taxRule.updated`, `taxRule.deleted`
  - [x] 5.6 Write unit tests in `apps/api/src/modules/pricing/__tests__/tax-rules.service.spec.ts` (min 15 tests)

- [x] **Task 6: Create PricingModule** (AC: #4, #7)
  - [x] 6.1 Create `apps/api/src/modules/pricing/pricing.module.ts`
  - [x] 6.2 Create `apps/api/src/modules/pricing/index.ts` with explicit exports
  - [x] 6.3 Import PricingModule in AppModule

- [x] **Task 7: Create tRPC Routers** (AC: #7)
  - [x] 7.1 Create `apps/api/src/trpc/routers/tax-rules.router.ts`
  - [x] 7.2 Create `apps/api/src/trpc/routers/pricing.router.ts` (for calculations)
  - [x] 7.3 Implement all procedures (list, get, create, update, delete, setDefault, getDefault)
  - [x] 7.4 Register in `apps/api/src/trpc/routers/_app.ts`
  - [x] 7.5 Add services to TRPCServices in `apps/api/src/trpc/context.ts`

- [x] **Task 8: Update VariantsService** (AC: #1, #3)
  - [x] 8.1 Add `updatePricing` method to VariantsService
  - [x] 8.2 Include taxRuleId in variant CRUD operations
  - [x] 8.3 Add tests for pricing update operations

### Frontend (apps/dashboard)

- [x] **Task 9: Create Server Actions** (AC: #7, #8)
  - [x] 9.1 Create `apps/dashboard/src/app/(dashboard)/settings/tax-rules/_actions/tax-rule-actions.ts`
  - [x] 9.2 Create `apps/dashboard/src/app/(dashboard)/products/_actions/pricing-actions.ts` for variant pricing
  - [x] 9.3 Export from `_actions/index.ts` in both locations

- [x] **Task 10: Create Custom Hooks** (AC: #7, #8)
  - [x] 10.1 Create `settings/tax-rules/_hooks/useTaxRuleList.ts`
  - [x] 10.2 Create `settings/tax-rules/_hooks/useTaxRule.ts` (single)
  - [x] 10.3 Create `settings/tax-rules/_hooks/useTaxRuleMutations.ts` (create/update/delete)
  - [x] 10.4 Create `products/_hooks/useVariantPricing.ts` for pricing updates
  - [x] 10.5 Export from `_hooks/index.ts`

- [x] **Task 11: Create Tax Rules UI Components** (AC: #7)
  - [x] 11.1 Create `settings/tax-rules/_components/TaxRulesList.tsx` - table of all tax rules
  - [x] 11.2 Create `settings/tax-rules/_components/TaxRuleFormDialog.tsx` - create/edit dialog
  - [x] 11.3 Create `settings/tax-rules/_components/DeleteTaxRuleDialog.tsx` - confirmation
  - [x] 11.4 Create `settings/tax-rules/_components/index.ts` - barrel export

- [x] **Task 12: Create Tax Rules Pages** (AC: #7)
  - [x] 12.1 Create `apps/dashboard/src/app/(dashboard)/settings/tax-rules/page.tsx`
  - [x] 12.2 Add tax-rules link to settings navigation in `navigation.ts`

- [x] **Task 13: Create Pricing Section Component** (AC: #8)
  - [x] 13.1 Create `products/_components/PricingSection.tsx` for product edit page
  - [x] 13.2 Implement price input with euro → cents conversion
  - [x] 13.3 Implement compare-at price with strikethrough preview
  - [x] 13.4 Implement cost price with real-time margin calculation
  - [x] 13.5 Implement tax rule selector dropdown
  - [x] 13.6 Integrate into product/variant edit forms

---

## Dev Notes

### Critical Implementation Rules

1. **Prefixed IDs via Extension:** TaxRule uses `tax_` prefix. Already configured in `id-prefixes.config.ts`. PrismaService extension handles generation automatically.

2. **Tenant Isolation:** TaxRule has direct `storeId` - ALWAYS filter by storeId in all queries:
   ```typescript
   const taxRule = await this.prisma.taxRule.findFirst({
     where: { id: taxRuleId, storeId }
   });
   if (!taxRule) throw new NotFoundException('Tax rule not found');
   ```

3. **Protected Methods Pattern:** Use `protected` (not `private`) for all service methods for @trafi/core extensibility.

4. **Event Emission:** Emit events for all mutations: `taxRule.created`, `taxRule.updated`, `taxRule.deleted`.

5. **Money in Cents (ARCH-25):** All prices stored as INTEGER cents. Display conversion: `2999` → "29,99 €"

6. **Country Reference:** TaxRule.countryIso2 references global Country table (no storeId). Use optional relation:
   ```prisma
   country Country? @relation(fields: [countryIso2], references: [iso2])
   ```

### Prisma Schema Pattern

```prisma
// apps/api/prisma/schema/tax-rule.prisma
model TaxRule {
  id                String   @id @default(cuid())
  storeId           String   @map("store_id")
  name              String   @db.VarChar(100)  // "TVA Standard", "TVA Réduit"
  rate              Decimal  @db.Decimal(5, 2) // 20.00 for 20%
  countryIso2       String   @map("country_iso2") @db.Char(2)
  isDefault         Boolean  @default(false) @map("is_default")
  appliesToShipping Boolean  @default(false) @map("applies_to_shipping")
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  // Relations
  store    Store    @relation(fields: [storeId], references: [id], onDelete: Cascade)
  country  Country? @relation(fields: [countryIso2], references: [iso2])
  variants ProductVariant[]

  @@unique([storeId, name])
  @@index([storeId])
  @@index([storeId, countryIso2])
  @@index([storeId, isDefault])
  @@map("tax_rules")
}
```

```prisma
// Update in apps/api/prisma/schema/product-variant.prisma
model ProductVariant {
  // ... existing fields ...
  taxRuleId String? @map("tax_rule_id")

  // Relations
  taxRule TaxRule? @relation(fields: [taxRuleId], references: [id])
  // ... existing relations ...
}
```

### Tax Calculation Service Pattern

```typescript
// apps/api/src/modules/pricing/pricing.service.ts
@Injectable()
export class PricingService {
  /**
   * Calculate tax from price
   * @param priceInCents - Price in cents (e.g., 2999 for €29.99)
   * @param taxRate - Tax rate as percentage (e.g., 20 for 20%)
   * @param taxIncluded - Whether price already includes tax
   */
  protected calculateTax(
    priceInCents: number,
    taxRate: number,
    taxIncluded: boolean
  ): {
    netPriceInCents: number;
    taxAmountInCents: number;
    grossPriceInCents: number;
  } {
    if (taxIncluded) {
      // Price already includes tax, extract it
      // netPrice = grossPrice / (1 + taxRate/100)
      const netPriceInCents = Math.round(priceInCents / (1 + taxRate / 100));
      const taxAmountInCents = priceInCents - netPriceInCents;
      return { netPriceInCents, taxAmountInCents, grossPriceInCents: priceInCents };
    } else {
      // Price is net, add tax
      const taxAmountInCents = Math.round(priceInCents * (taxRate / 100));
      return {
        netPriceInCents: priceInCents,
        taxAmountInCents,
        grossPriceInCents: priceInCents + taxAmountInCents,
      };
    }
  }

  protected calculateMargin(
    priceInCents: number,
    costPriceInCents: number | null
  ): { marginInCents: number; marginPercent: number } | null {
    if (!costPriceInCents || costPriceInCents === 0) return null;
    const marginInCents = priceInCents - costPriceInCents;
    const marginPercent = Math.round((marginInCents / priceInCents) * 100);
    return { marginInCents, marginPercent };
  }

  formatPrice(cents: number, currency: string = 'EUR', locale: string = 'fr-FR'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(cents / 100);
  }
}
```

### Dashboard Data Flow Pattern

```
PricingSection.tsx (Client)
  └─► Price input in euros, converted to cents on save
       └─► useVariantPricing() hook
            └─► updateVariantPricingAction() (Server Action)
                 └─► trpc.variants.updatePricing.mutate()
                      └─► VariantsService.updatePricing() (NestJS)

TaxRulesList.tsx (Client)
  └─► useTaxRuleList() hook
       └─► getTaxRulesAction() (Server Action)
            └─► trpc.taxRules.list.query()
                 └─► TaxRulesService.list() (NestJS)
```

### UX/UI Pattern (Digital Brutalism v2)

- **Price Input:** Shows € symbol, user enters decimal (e.g., "29.99"), converted to 2999 cents on blur
- **Compare-at Price:** Shows strikethrough preview next to regular price
- **Margin Display:** Real-time percentage badge next to cost price field (green if > 20%, amber if 10-20%, red if < 10%)
- **Tax Toggle:** Switch labeled "Prix TTC" (tax included) / "Prix HT" (tax excluded)
- **Tax Rules Table:**
  - Columns: Name, Rate (%), Country, Default badge, Shipping badge
  - Default badge: Star icon on default tax rules
  - Actions: Edit, Delete, Set Default
- **Validation:** Red border if price is 0 or negative

### Project Structure Notes

```
apps/api/src/modules/pricing/
├── pricing.module.ts
├── pricing.service.ts           # Tax calculations, formatting
├── tax-rules.service.ts         # TaxRule CRUD
├── index.ts                     # Barrel export
└── __tests__/
    ├── pricing.service.spec.ts
    └── tax-rules.service.spec.ts

apps/dashboard/src/app/(dashboard)/
├── settings/
│   └── tax-rules/
│       ├── page.tsx
│       ├── _components/
│       │   ├── TaxRulesList.tsx
│       │   ├── TaxRuleFormDialog.tsx
│       │   ├── DeleteTaxRuleDialog.tsx
│       │   └── index.ts
│       ├── _hooks/
│       │   ├── useTaxRuleList.ts
│       │   ├── useTaxRule.ts
│       │   ├── useTaxRuleMutations.ts
│       │   └── index.ts
│       └── _actions/
│           ├── tax-rule-actions.ts
│           └── index.ts
└── products/
    ├── _components/
    │   └── PricingSection.tsx   # Reused in product edit pages
    └── _hooks/
        └── useVariantPricing.ts
```

---

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-03-product-catalog.md#Story 3.6]
- [Source: _bmad-output/planning-artifacts/architecture.md#Pricing patterns]
- [Source: _bmad-output/project-context.md#Money Handling (ARCH-25)]
- [Source: _bmad-output/implementation-artifacts/database-schema-roadmap.md#TaxRule]
- [Source: apps/api/src/database/id-prefixes.config.ts] - TaxRule: 'tax' already configured
- [Source: apps/api/prisma/schema/product-variant.prisma] - Current variant schema
- [Source: apps/api/prisma/schema/store-settings.prisma] - taxIncluded default

---

### Previous Story Intelligence (from Story 3.5)

**Key Learnings to Apply:**

1. **Prefixed IDs via Extension:** Don't manually generate IDs. The PrismaService extension handles `tax_` prefix automatically. Already configured in id-prefixes.config.ts.

2. **Protected Methods Pattern:** Use `protected` (not `private`) for all service methods for @trafi/core extensibility.

3. **Event Emission:** Emit events for all mutations (taxRule.created, taxRule.updated, taxRule.deleted).

4. **Settings Pages Pattern:** Follow existing settings pages structure (`settings/api-keys`, `settings/store`, `settings/users`).

5. **Decimal for Percentages:** Use `Decimal` type for tax rates to avoid floating point issues.

---

### Git Intelligence (Recent Commits)

Recent commits show consistent patterns:
- `feat:` prefix for new features
- Story 3.5 just completed (collections management)
- Build fixes applied (global-error.tsx, not-found.tsx added)
- API imports cleaned up to use `@modules/*` aliases

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Code review identified 7 issues (2 High, 3 Medium, 2 Low)
- All issues fixed in follow-up implementation

### Completion Notes List

1. **Unit tests added**: 32+ tests for PricingService (pricing.service.spec.ts) and 26+ tests for TaxRulesService (tax-rules.service.spec.ts)
2. **Tax toggle implemented**: Added "Prix TTC / Prix HT" switch in PricingSection
3. **Strikethrough preview added**: Compare-at price now shows with line-through styling next to current price
4. **Type duplication fixed**: Shared types (TaxRuleResponse, TaxRulesListResult, TaxRuleSelectItem) moved to @trafi/types
5. **Permission comment fixed**: tax-rules.router.ts delete endpoint comment corrected to match actual permission

### File List

**New Files Created:**
- `apps/api/prisma/schema/tax-rule.prisma` - TaxRule Prisma schema
- `apps/api/src/modules/pricing/pricing.module.ts` - NestJS module
- `apps/api/src/modules/pricing/pricing.service.ts` - Tax/margin calculations
- `apps/api/src/modules/pricing/tax-rules.service.ts` - TaxRule CRUD service
- `apps/api/src/modules/pricing/index.ts` - Barrel export
- `apps/api/src/modules/pricing/__tests__/pricing.service.spec.ts` - PricingService tests
- `apps/api/src/modules/pricing/__tests__/tax-rules.service.spec.ts` - TaxRulesService tests
- `apps/api/src/trpc/routers/pricing.router.ts` - Pricing calculations tRPC router
- `apps/api/src/trpc/routers/tax-rules.router.ts` - TaxRules CRUD tRPC router
- `apps/dashboard/src/app/(dashboard)/settings/tax-rules/page.tsx` - Tax rules page
- `apps/dashboard/src/app/(dashboard)/settings/tax-rules/_components/TaxRulesList.tsx`
- `apps/dashboard/src/app/(dashboard)/settings/tax-rules/_components/TaxRuleFormDialog.tsx`
- `apps/dashboard/src/app/(dashboard)/settings/tax-rules/_components/DeleteTaxRuleDialog.tsx`
- `apps/dashboard/src/app/(dashboard)/settings/tax-rules/_components/index.ts`
- `apps/dashboard/src/app/(dashboard)/settings/tax-rules/_hooks/useTaxRuleList.ts`
- `apps/dashboard/src/app/(dashboard)/settings/tax-rules/_hooks/useTaxRule.ts`
- `apps/dashboard/src/app/(dashboard)/settings/tax-rules/_hooks/useTaxRuleMutations.ts`
- `apps/dashboard/src/app/(dashboard)/settings/tax-rules/_hooks/index.ts`
- `apps/dashboard/src/app/(dashboard)/settings/tax-rules/_actions/tax-rule-actions.ts`
- `apps/dashboard/src/app/(dashboard)/settings/tax-rules/_actions/index.ts`
- `apps/dashboard/src/app/(dashboard)/products/_actions/pricing-actions.ts`
- `apps/dashboard/src/app/(dashboard)/products/_hooks/useVariantPricing.ts`
- `apps/dashboard/src/app/(dashboard)/products/[id]/_components/PricingSection.tsx`
- `apps/dashboard/src/app/(dashboard)/products/[id]/_components/EditVariantPricingDialog.tsx`
- `apps/dashboard/src/components/ui/table.tsx` - shadcn/ui table with Digital Brutalism styling
- `packages/@trafi/validators/src/pricing/index.ts` - Pricing Zod schemas
- `packages/@trafi/types/src/pricing.types.ts` - Pricing TypeScript types

**Modified Files:**
- `apps/api/prisma/schema/product-variant.prisma` - Added taxRuleId field
- `apps/api/prisma/schema/country.prisma` - Added TaxRule relation
- `apps/api/prisma/schema/store.prisma` - Added TaxRule relation
- `apps/api/src/app.module.ts` - Import PricingModule
- `apps/api/src/database/prisma.service.ts` - TaxRule ID prefix registration
- `apps/api/src/modules/variants/variants.service.ts` - Added updatePricing method
- `apps/api/src/trpc/context.ts` - Added pricing services to TRPCServices
- `apps/api/src/trpc/routers/_app.ts` - Registered pricing and taxRules routers
- `apps/api/src/trpc/trpc.module.ts` - Import PricingModule
- `apps/dashboard/src/app/(dashboard)/products/[id]/_components/VariantRow.tsx` - Added pricing button
- `apps/dashboard/src/app/(dashboard)/products/[id]/_components/VariantsSection.tsx` - Integrated pricing dialog
- `apps/dashboard/src/app/(dashboard)/products/[id]/_components/index.ts` - Export PricingSection
- `apps/dashboard/src/app/(dashboard)/products/_actions/index.ts` - Export pricing actions
- `apps/dashboard/src/app/(dashboard)/products/_hooks/index.ts` - Export pricing hooks
- `apps/dashboard/src/config/navigation.ts` - Added Tax Rules navigation item
- `packages/@trafi/validators/src/index.ts` - Export pricing schemas
- `packages/@trafi/validators/src/variant/index.ts` - Added UpdateVariantPricingSchema
- `packages/@trafi/types/src/index.ts` - Export pricing types

