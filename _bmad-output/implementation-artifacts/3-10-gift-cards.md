# Story 3.10: Gift Cards

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Merchant**,
I want **to sell and manage gift cards**,
so that **customers can purchase them as gifts and use them for payment**.

## Acceptance Criteria

1. **AC1**: Can create gift card templates with pre-defined denominations (e.g., 25, 50, 100 EUR)
2. **AC2**: Can issue gift cards manually (admin) or via purchase (storefront - future)
3. **AC3**: Gift cards have secure, unique 16-character codes (formatted XXXX-XXXX-XXXX-XXXX)
4. **AC4**: Can track gift card balances with full transaction history (credit/debit/refund)
5. **AC5**: Partial balance usage is supported (remaining balance stays on card)
6. **AC6**: Gift cards can have optional expiration dates (from template validityDays)
7. **AC7**: Gift card status lifecycle: PENDING → ACTIVE → DISABLED/EXPIRED/DEPLETED
8. **AC8**: Gift cards are tenant-scoped (storeId isolation)
9. **AC9**: Gift card codes are hashed for security (only last 4 digits displayed)
10. **AC10**: Can disable/enable gift cards manually (admin action)

## Tasks / Subtasks

### Backend Tasks

- [x] Task 1: Create Prisma schema for gift cards (AC: 1-10)
  - [x] 1.1: Create `gift-card.prisma` with GiftCard, GiftCardTransaction, GiftCardTemplate models
  - [x] 1.2: Define enums: GiftCardStatus, GiftCardTransactionType
  - [x] 1.3: Add Store relations (giftCards, giftCardTransactions, giftCardTemplates)
  - [x] 1.4: Add `@db.Citext` for code fields where needed (codes are hashed, not citext)
  - [x] 1.5: Run `pnpm db:generate` and `pnpm db:push`

- [x] Task 2: Create Zod validators in @trafi/validators (AC: 1-6, 10)
  - [x] 2.1: Create `gift-card/` folder with schemas
  - [x] 2.2: Define GiftCardStatusSchema, GiftCardTransactionTypeSchema enums
  - [x] 2.3: Create IssueGiftCardSchema (amount, currency, recipient, message, expiration)
  - [x] 2.4: Create RedeemGiftCardSchema (code, orderId, amountCents)
  - [x] 2.5: Create ValidateGiftCardSchema (code only, for balance check)
  - [x] 2.6: Create CreateGiftCardTemplateSchema, UpdateGiftCardTemplateSchema
  - [x] 2.7: Create ListGiftCardsSchema with filters (status, template, date range)
  - [x] 2.8: Export from index.ts

- [x] Task 3: Create types in @trafi/types (AC: 1-10)
  - [x] 3.1: Create `gift-card.types.ts` with re-exports from validators
  - [x] 3.2: Define RedeemResult interface for redeem response
  - [x] 3.3: Export from index.ts

- [x] Task 4: Create GiftCardsService (AC: 2-10)
  - [x] 4.1: Create `apps/api/src/modules/gift-cards/gift-cards.module.ts`
  - [x] 4.2: Create `gift-cards.service.ts` with protected methods (RETRO-2)
  - [x] 4.3: Implement `issue()` - create gift card with secure code generation
  - [x] 4.4: Implement `redeem()` - validate and debit gift card balance
  - [x] 4.5: Implement `refund()` - credit back to gift card
  - [x] 4.6: Implement `adjustBalance()` - admin manual adjustment
  - [x] 4.7: Implement `findByCode()` - lookup by hashed code
  - [x] 4.8: Implement `validateCode()` - check code validity and balance
  - [x] 4.9: Implement `disable()` / `enable()` - admin status control
  - [x] 4.10: Implement `list()` - paginated list with filters
  - [x] 4.11: Implement secure code generation (crypto.randomBytes, no ambiguous chars)
  - [x] 4.12: Implement code hashing (SHA-256)
  - [x] 4.13: Emit DomainEvents for gift card actions (ARCH-Principle-6)

- [x] Task 5: Create GiftCardTemplateService (AC: 1, 6)
  - [x] 5.1: Create `gift-card-template.service.ts` with protected methods
  - [x] 5.2: Implement CRUD: create, update, delete, findById, list
  - [x] 5.3: Implement activate/deactivate template
  - [x] 5.4: Validate denominations array (positive integers, min 1)

- [x] Task 6: Register module and add tRPC routes
  - [x] 6.1: Add GiftCardsModule to app.module.ts
  - [x] 6.2: Create tRPC router for gift cards (giftCards.*)
  - [x] 6.3: Create tRPC router for gift card templates (giftCardTemplates.*)
  - [x] 6.4: Add protectedProcedure for all routes (admin only for MVP)

### Dashboard Tasks

- [x] Task 7: Create dashboard server actions and hooks (AC: 1-10)
  - [x] 7.1: Create `_actions/gift-card-actions.ts` using Zsa
  - [x] 7.2: Create `_actions/gift-card-template-actions.ts` using Zsa
  - [x] 7.3: Create `_hooks/useGiftCardList.ts` for list query
  - [x] 7.4: Create `_hooks/useGiftCard.ts` for single item query
  - [x] 7.5: Create `_hooks/useGiftCardMutations.ts` (issue/disable/enable/adjust)
  - [x] 7.6: Create `_hooks/useGiftCardTemplateList.ts` for templates
  - [x] 7.7: Create `_hooks/useGiftCardTemplateMutations.ts` (CRUD)

- [x] Task 8: Create gift cards list page (AC: 2, 4, 7)
  - [x] 8.1: Create `marketing/gift-cards/page.tsx` (RSC)
  - [x] 8.2: Create `GiftCardsDataTable.tsx` client component
  - [x] 8.3: Create `GiftCardStatusBadge.tsx` component (brutalist colors)
  - [x] 8.4: Create `GiftCardBalanceCell.tsx` with progress bar
  - [x] 8.5: Add status filter and search by code last4
  - [x] 8.6: Add row actions (view/disable/enable)

- [x] Task 9: Create issue gift card dialog (AC: 2, 3, 6)
  - [x] 9.1: Create `IssueGiftCardDialog.tsx` dialog component
  - [x] 9.2: Add template selection dropdown
  - [x] 9.3: Add amount input (from template denominations or custom)
  - [x] 9.4: Add recipient details (email, name, message) - optional
  - [x] 9.5: Add expiration date picker (auto-filled from template)
  - [x] 9.6: Display generated code after successful issue

- [x] Task 10: Create gift card detail page (AC: 4, 5, 9, 10)
  - [x] 10.1: Create `marketing/gift-cards/[giftCardId]/page.tsx` with tabs
  - [x] 10.2: Create `GiftCardDetails.tsx` component (code masked, balance, status)
  - [x] 10.3: Create `TransactionsTable.tsx` timeline of transactions
  - [x] 10.4: Add disable/enable action buttons
  - [x] 10.5: Add manual balance adjustment dialog (admin only)

- [x] Task 11: Create gift card templates management (AC: 1, 6)
  - [x] 11.1: Create `marketing/gift-cards/templates/page.tsx` (RSC)
  - [x] 11.2: Create `TemplatesDataTable.tsx` client component
  - [x] 11.3: Create `TemplateForm.tsx` for create/edit
  - [x] 11.4: Add denominations array input (chip-style)
  - [x] 11.5: Add custom amount toggle with min/max fields
  - [x] 11.6: Add validity days input

### Testing Tasks

- [x] Task 12: Write unit tests for services
  - [x] 12.1: Test GiftCardsService.issue() - code generation, balance init
  - [x] 12.2: Test GiftCardsService.redeem() - balance deduction, validation
  - [x] 12.3: Test GiftCardsService.refund() - balance credit
  - [x] 12.4: Test code hashing and validation
  - [x] 12.5: Test status transitions and expiration
  - [x] 12.6: Test tenant isolation (storeId filtering)
  - [x] 12.7: Test GiftCardTemplateService CRUD operations

## Dev Notes

### Architecture Patterns from Previous Stories

**Source:** [Story 3.9 - Promotions & Discounts Foundation]

1. **Protected Methods (RETRO-2)**: All service methods use `protected` for @trafi/core extensibility
2. **Event Emitters (ARCH-Principle-6)**: Emit DomainEvents for all state changes
3. **Tenant Isolation**: All queries include `storeId` in WHERE clause
4. **Money in Cents (ARCH-25)**: All amounts stored as integer cents
5. **ID Prefixes (already configured)**:
   - GiftCard: `gc_`
   - GiftCardTransaction: `gctx_`
   - GiftCardTemplate: `gctpl_`

### Prisma Schema

**Source:** [epic-03/story-3-10-gift-cards.md#Technical Implementation]

```prisma
// apps/api/prisma/schema/gift-card.prisma
// =============================================================================
// Gift Cards Domain Schema
// =============================================================================
// Digital gift cards with balance tracking.
// ID prefix: gc_, gctx_, gctpl_ (already in id-prefixes.config.ts)
// Money fields: INTEGER cents (ARCH-25)
// Security: Code stored as SHA-256 hash, only last4 displayed
// @see Story 3.10 - Gift Cards
// =============================================================================

enum GiftCardStatus {
  PENDING   // Purchased/issued but not yet activated
  ACTIVE    // Ready to use
  DISABLED  // Manually disabled by admin
  EXPIRED   // Past expiration date
  DEPLETED  // Zero balance remaining
}

enum GiftCardTransactionType {
  CREDIT      // Initial load or top-up
  DEBIT       // Used for purchase
  REFUND      // Returned to balance
  ADJUSTMENT  // Admin manual change
  EXPIRATION  // Balance expired (system)
}

model GiftCard {
  id                  String          @id @default(cuid())
  storeId             String          @map("store_id")
  codeHash            String          @map("code_hash")   // SHA-256 hash
  codeLast4           String          @map("code_last4")  // Display only
  initialBalanceCents Int             @map("initial_balance_cents")
  currentBalanceCents Int             @map("current_balance_cents")
  currencyCode        String          @default("EUR") @map("currency_code")
  status              GiftCardStatus  @default(PENDING)
  purchasedById       String?         @map("purchased_by_id")
  recipientEmail      String?         @map("recipient_email")
  recipientName       String?         @map("recipient_name")
  senderName          String?         @map("sender_name")
  giftMessage         String?         @map("gift_message") @db.VarChar(500)
  expiresAt           DateTime?       @map("expires_at")
  activatedAt         DateTime?       @map("activated_at")
  lastUsedAt          DateTime?       @map("last_used_at")
  issuedFromOrderId   String?         @map("issued_from_order_id")
  templateId          String?         @map("template_id")
  metadata            Json?
  createdAt           DateTime        @default(now()) @map("created_at")
  updatedAt           DateTime        @updatedAt @map("updated_at")

  // Relations
  store        Store                 @relation(fields: [storeId], references: [id], onDelete: Cascade)
  template     GiftCardTemplate?     @relation(fields: [templateId], references: [id])
  transactions GiftCardTransaction[]

  // Constraints
  @@unique([storeId, codeHash])
  @@index([storeId])
  @@index([storeId, status])
  @@index([storeId, templateId])
  @@index([recipientEmail])
  @@map("gift_cards")
}

model GiftCardTransaction {
  id                String                    @id @default(cuid())
  storeId           String                    @map("store_id")
  giftCardId        String                    @map("gift_card_id")
  type              GiftCardTransactionType
  amountCents       Int                       @map("amount_cents")  // Positive=credit, Negative=debit
  balanceAfterCents Int                       @map("balance_after_cents")
  orderId           String?                   @map("order_id")
  reason            String?                   @db.VarChar(255)
  performedById     String?                   @map("performed_by_id")
  createdAt         DateTime                  @default(now()) @map("created_at")

  // Relations
  store       Store     @relation(fields: [storeId], references: [id], onDelete: Cascade)
  giftCard    GiftCard  @relation(fields: [giftCardId], references: [id], onDelete: Cascade)
  performedBy User?     @relation(fields: [performedById], references: [id])

  // Constraints
  @@index([storeId])
  @@index([giftCardId])
  @@index([orderId])
  @@map("gift_card_transactions")
}

model GiftCardTemplate {
  id                String    @id @default(cuid())
  storeId           String    @map("store_id")
  name              String    @db.VarChar(100)
  description       String?   @db.VarChar(500)
  designImageUrl    String?   @map("design_image_url")
  denominations     Int[]     // Available amounts in cents [2500, 5000, 10000]
  allowCustomAmount Boolean   @default(false) @map("allow_custom_amount")
  minAmountCents    Int?      @map("min_amount_cents")
  maxAmountCents    Int?      @map("max_amount_cents")
  validityDays      Int?      @map("validity_days")  // null = never expires
  isActive          Boolean   @default(true) @map("is_active")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  // Relations
  store     Store      @relation(fields: [storeId], references: [id], onDelete: Cascade)
  giftCards GiftCard[]

  // Constraints
  @@index([storeId])
  @@index([storeId, isActive])
  @@map("gift_card_templates")
}
```

### Store Relation Updates

Add to `apps/api/prisma/schema/store.prisma`:
```prisma
model Store {
  // ... existing fields
  giftCards             GiftCard[]             // Story 3.10
  giftCardTransactions  GiftCardTransaction[]  // Story 3.10
  giftCardTemplates     GiftCardTemplate[]     // Story 3.10
}
```

### Secure Code Generation Pattern

**CRITICAL**: Gift card codes must be cryptographically secure and human-readable.

```typescript
// apps/api/src/modules/gift-cards/gift-cards.service.ts

private readonly CODE_LENGTH = 16;
private readonly CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No 0OI1

protected generateSecureCode(): string {
  // Use crypto.randomBytes for cryptographic security
  const randomBytes = crypto.randomBytes(this.CODE_LENGTH);
  let code = '';
  for (let i = 0; i < this.CODE_LENGTH; i++) {
    code += this.CODE_CHARS[randomBytes[i] % this.CODE_CHARS.length];
  }
  // Format: XXXX-XXXX-XXXX-XXXX for readability
  return code.match(/.{4}/g)!.join('-');
}

protected hashCode(code: string): string {
  // Normalize: remove dashes, uppercase
  const normalized = code.replace(/-/g, '').toUpperCase();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}
```

### Dashboard Data Flow

Following established pattern from Story 3.9:
```
Page (RSC) → Client Component → Hook → Zsa Action → tRPC → NestJS Service
```

### Project Structure Notes

**Dashboard paths follow marketing section pattern:**
```
apps/dashboard/src/app/(dashboard)/marketing/gift-cards/
├── page.tsx                          # RSC - Gift cards list
├── _actions/
│   ├── gift-card-actions.ts
│   └── gift-card-template-actions.ts
├── _hooks/
│   ├── index.ts
│   ├── useGiftCardList.ts
│   ├── useGiftCard.ts
│   ├── useGiftCardMutations.ts
│   ├── useGiftCardTemplateList.ts
│   └── useGiftCardTemplateMutations.ts
├── _components/
│   ├── GiftCardsDataTable.tsx
│   ├── GiftCardStatusBadge.tsx
│   ├── GiftCardBalanceCell.tsx
│   └── IssueGiftCardDialog.tsx
├── templates/
│   ├── page.tsx
│   └── _components/
│       ├── TemplatesDataTable.tsx
│       └── TemplateForm.tsx
└── [giftCardId]/
    ├── page.tsx
    └── _components/
        ├── GiftCardDetails.tsx
        ├── TransactionsTable.tsx
        └── AdjustBalanceDialog.tsx
```

**API module structure:**
```
apps/api/src/modules/gift-cards/
├── gift-cards.module.ts
├── gift-cards.service.ts           # Core gift card operations
├── gift-card-template.service.ts   # Template management
├── index.ts                        # Public exports (RETRO-3)
```

### UX Design Requirements (Brutalist v2)

**Source:** [epic-03-product-catalog.md#UX Design Requirements]

- **Background:** Pure Black #000000
- **Borders:** #333333, 1px
- **Status badges:**
  - ACTIVE: #00FF94 (success green)
  - PENDING: #CCFF00 (acid lime)
  - DISABLED: #6B7280 (gray)
  - EXPIRED: #FF3366 (risk red)
  - DEPLETED: #6B7280 (gray)
- **Balance display:** Progress bar showing currentBalance/initialBalance
- **Fonts:** JetBrains Mono for amounts, code display
- **Radius:** 0px everywhere

### Testing Standards

- Unit tests in `__tests__/` directories
- Mock PrismaService for service tests
- Test tenant isolation (storeId filtering)
- Test validation errors (invalid codes, insufficient balance)
- Test status transitions (PENDING → ACTIVE → DEPLETED)
- Test code security (hashing, lookup by hash)
- Mock crypto.randomBytes for deterministic tests

### Security Considerations

1. **Code Storage**: Never store plain codes - only SHA-256 hash
2. **Code Display**: Only show last 4 digits (`codeLast4`)
3. **Code Generation**: Use `crypto.randomBytes()` - NOT Math.random()
4. **Code Validation**: Timing-safe comparison for hash lookup
5. **Email Delivery**: Plain code sent ONLY in delivery email (not stored after)

### Previous Story Learnings (Story 3.9)

From code review and implementation:
- Cast metadata to `Prisma.InputJsonValue` for JSON fields
- Badge components should accept string props with type guards
- Server actions don't need explicit return types (tRPC inference)
- Add navigation links to sidebar config
- Use superjson mock for Jest tests with Date serialization

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-03-product-catalog.md#Story 3.10]
- [Source: _bmad-output/planning-artifacts/epics/epic-03/story-3-10-gift-cards.md]
- [Source: _bmad-output/project-context.md#Database Architectural Principles]
- [Source: apps/api/prisma/schema/promotion.prisma - Schema patterns]
- [Source: apps/api/src/database/id-prefixes.config.ts - gc_, gctx_, gctpl_]
- [Source: 3-9-promotions-and-discounts-foundation.md - Implementation patterns]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

1. All 10 acceptance criteria implemented and verified
2. 85 unit tests passing for GiftCardsService and GiftCardTemplateService
3. Both API and Dashboard builds pass successfully
4. Refactored form dialogs to use useState instead of react-hook-form to avoid missing UI component dependencies
5. Created local interface types in services to handle optional pagination fields from validators

### File List

**Prisma Schema:**
- `apps/api/prisma/schema/gift-card.prisma` - Gift card, transaction, and template models

**Validators (@trafi/validators):**
- `packages/@trafi/validators/src/gift-card/index.ts` - Barrel export
- `packages/@trafi/validators/src/gift-card/gift-card.schema.ts` - Status and transaction type enums
- `packages/@trafi/validators/src/gift-card/gift-card-template.schema.ts` - Template schemas
- `packages/@trafi/validators/src/gift-card/issue-gift-card.schema.ts` - Issue gift card schema
- `packages/@trafi/validators/src/gift-card/redeem-gift-card.schema.ts` - Redeem schema
- `packages/@trafi/validators/src/gift-card/adjust-gift-card-balance.schema.ts` - Balance adjustment schema
- `packages/@trafi/validators/src/gift-card/list-gift-cards.schema.ts` - List with filters schema

**Types (@trafi/types):**
- `packages/@trafi/types/src/gift-card.types.ts` - Type re-exports

**API Services:**
- `apps/api/src/modules/gift-cards/gift-cards.module.ts` - NestJS module
- `apps/api/src/modules/gift-cards/gift-cards.service.ts` - Core gift card service
- `apps/api/src/modules/gift-cards/gift-card-template.service.ts` - Template service
- `apps/api/src/modules/gift-cards/index.ts` - Public exports

**tRPC Routers:**
- `apps/api/src/trpc/routers/gift-cards.router.ts` - Gift cards router
- `apps/api/src/trpc/routers/gift-card-templates.router.ts` - Templates router

**Dashboard Server Actions:**
- `apps/dashboard/src/app/(dashboard)/marketing/gift-cards/_actions/gift-card-actions.ts`
- `apps/dashboard/src/app/(dashboard)/marketing/gift-cards/_actions/gift-card-template-actions.ts`

**Dashboard Hooks:**
- `apps/dashboard/src/app/(dashboard)/marketing/gift-cards/_hooks/index.ts`
- `apps/dashboard/src/app/(dashboard)/marketing/gift-cards/_hooks/useGiftCardList.ts`
- `apps/dashboard/src/app/(dashboard)/marketing/gift-cards/_hooks/useGiftCard.ts`
- `apps/dashboard/src/app/(dashboard)/marketing/gift-cards/_hooks/useGiftCardMutations.ts`
- `apps/dashboard/src/app/(dashboard)/marketing/gift-cards/_hooks/useGiftCardTemplateList.ts`
- `apps/dashboard/src/app/(dashboard)/marketing/gift-cards/_hooks/useGiftCardTemplateMutations.ts`

**Dashboard Components:**
- `apps/dashboard/src/app/(dashboard)/marketing/gift-cards/_components/index.ts`
- `apps/dashboard/src/app/(dashboard)/marketing/gift-cards/_components/GiftCardsDataTable.tsx`
- `apps/dashboard/src/app/(dashboard)/marketing/gift-cards/_components/GiftCardStatusBadge.tsx`
- `apps/dashboard/src/app/(dashboard)/marketing/gift-cards/_components/IssueGiftCardDialog.tsx`

**Dashboard Pages:**
- `apps/dashboard/src/app/(dashboard)/marketing/gift-cards/page.tsx` - List page
- `apps/dashboard/src/app/(dashboard)/marketing/gift-cards/[giftCardId]/page.tsx` - Detail page
- `apps/dashboard/src/app/(dashboard)/marketing/gift-cards/[giftCardId]/_components/index.ts`
- `apps/dashboard/src/app/(dashboard)/marketing/gift-cards/[giftCardId]/_components/GiftCardDetailView.tsx`
- `apps/dashboard/src/app/(dashboard)/marketing/gift-cards/[giftCardId]/_components/TransactionsTable.tsx`
- `apps/dashboard/src/app/(dashboard)/marketing/gift-cards/[giftCardId]/_components/AdjustBalanceDialog.tsx`
- `apps/dashboard/src/app/(dashboard)/marketing/gift-cards/templates/page.tsx` - Templates page
- `apps/dashboard/src/app/(dashboard)/marketing/gift-cards/templates/_components/index.ts`
- `apps/dashboard/src/app/(dashboard)/marketing/gift-cards/templates/_components/GiftCardTemplatesDataTable.tsx`
- `apps/dashboard/src/app/(dashboard)/marketing/gift-cards/templates/_components/CreateTemplateDialog.tsx`
- `apps/dashboard/src/app/(dashboard)/marketing/gift-cards/templates/_components/EditTemplateDialog.tsx`

**Unit Tests:**
- `apps/api/src/modules/gift-cards/__tests__/gift-cards.service.spec.ts` (47 tests)
- `apps/api/src/modules/gift-cards/__tests__/gift-card-template.service.spec.ts` (38 tests)

**Modified Files:**
- `apps/api/src/database/prisma.service.ts` - Added giftCard, giftCardTransaction, giftCardTemplate getters
- `apps/api/src/trpc/context.ts` - Added gift card services to TRPCServices interface
- `apps/api/src/trpc/trpc.module.ts` - Imported GiftCardsModule and injected services
- `apps/api/src/trpc/routers/_app.ts` - Added giftCards and giftCardTemplates routers
- `apps/dashboard/src/lib/utils.ts` - Added formatCurrency utility function

