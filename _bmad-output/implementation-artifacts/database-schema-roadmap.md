# Database Schema Roadmap

> This document maps all Prisma models to their implementation stories across epics.
> Generated: 2026-01-18
> **Updated: 2026-01-18** - Architectural corrections v3 applied (9 principles)

## Quick Reference

| Status | Meaning |
|--------|---------|
| ✅ | Implemented in Prisma |
| 🟡 | Documented in Epic (Zod), Prisma pending |
| ⬜ | To be documented |
| 🆕 | New domain to add |

---

## Architectural Principles (CRITICAL)

### 1. Tenant Scoping (storeId Everywhere - With Exceptions)

**Rule:** Every business model MUST have `storeId` as a required field with composite unique constraints.

```prisma
model Product {
  id        String   @id
  storeId   String
  slug      String

  store     Store    @relation(fields: [storeId], references: [id])

  @@unique([storeId, slug])
  @@index([storeId, createdAt])
}
```

**Models requiring storeId:**
- Product, ProductVariant, ProductMedia, Category, Collection, TaxRule
- Cart, CartItem, CheckoutSession
- Order, OrderItem, OrderAddress
- Customer, CustomerAddress, CustomerSession
- Payment, Refund, PaymentAuditLog
- Promotion, Coupon, GiftCard
- ShippingZone, ShippingMethod
- Supplier, PurchaseOrder
- StoreMembership, StoreCounter, DomainEvent
- ALL business data

**EXCEPTION - Global Reference Tables (NO storeId):**
```prisma
// These are shared across ALL stores - no duplication
model Country {
  iso2  String @id   // "US", "FR", "CA"
  iso3  String       // "USA", "FRA", "CAN"
  name  String       // "United States"
}

model Currency {
  code          String @id   // "USD", "EUR", "CAD"
  name          String       // "US Dollar"
  symbol        String       // "$"
  decimalDigits Int          // 2
}
```

**Tenant links to global tables via join tables:**
- `StoreCurrency(storeId, currencyCode)` - NOT `Store.currencies[]`
- `RegionCountry(regionId, countryIso2)` - NOT `Region.countries[]`
- `ShippingZoneCountry(zoneId, countryIso2)` - NOT `ShippingZone.countries[]`

### 2. No Arrays for Relational Data

**Rule:** Use join tables instead of arrays for filterable/indexable relationships.

| ❌ Bad | ✅ Good |
|--------|---------|
| `ShippingZone.countries String[]` | `ShippingZoneCountry(zoneId, countryIso2)` |
| `Region.supportedCurrencies String[]` | `RegionCurrency(regionId, currencyCode)` |
| `Store.supportedCurrencies String[]` | `StoreCurrency(storeId, currencyCode)` |

**Exception:** JSON is OK for:
- UI configuration (not used for filtering)
- `ProductVariant.options Json` → `{size: "L", color: "red"}`
- `GiftCardTemplate.designConfig Json`
- `Promotion.conditions Json` → with `conditionsVersion` for versioning

### 3. Money & Totals Snapshots

**Rule:** Orders and Carts MUST store snapshot totals for historical accuracy.

```prisma
model Order {
  // Snapshot totals (REQUIRED for billing/disputes)
  currencyCode        String
  subtotalCents       Int
  discountTotalCents  Int      @default(0)
  shippingTotalCents  Int      @default(0)
  taxTotalCents       Int      @default(0)
  grandTotalCents     Int
  taxIncluded         Boolean  @default(false)
}

model OrderItem {
  // Snapshot prices (REQUIRED)
  unitPriceCents      Int
  quantity            Int
  discountCents       Int      @default(0)
  taxCents            Int      @default(0)
  totalCents          Int      // unitPriceCents * quantity - discountCents + taxCents
}
```

### 4. Payment Security

**Rule:** Never store sensitive Stripe data in plain text.

- Use KMS/Envelope encryption for `StripeConnection.accessToken`
- Prefer storing `refreshToken` + metadata, not full credentials
- Sanitize `PaymentAuditLog.metadata` - no PII allowed
- Never log full card numbers, only `last4` and `brand`

### 5. Atomic Counters (Concurrency Safety)

**Rule:** Sequential identifiers (orderNumber, invoiceNumber) MUST use atomic counters.

```prisma
model StoreCounter {
  storeId   String
  key       String   // "order", "invoice", "return", "purchase_order"
  value     BigInt   @default(0)

  @@id([storeId, key])
}
```

**Usage pattern:**
```typescript
// Atomic increment in transaction
const counter = await prisma.storeCounter.update({
  where: { storeId_key: { storeId, key: 'order' } },
  data: { value: { increment: 1 } },
});
const orderNumber = `ORD-${year}-${String(counter.value).padStart(6, '0')}`;
// Result: ORD-2026-000123
```

### 6. Outbox Pattern (Event Reliability)

**Rule:** Async operations (emails, webhooks, analytics) MUST use outbox for reliability.

```prisma
model DomainEvent {
  id          String      @id  // evt_xxx
  storeId     String
  type        String      // "order.created", "payment.succeeded"
  payload     Json
  status      EventStatus // PENDING, PROCESSED, FAILED, DEAD_LETTER
  attempts    Int         @default(0)
  createdAt   DateTime    @default(now())
  processedAt DateTime?
  errorMessage String?

  @@index([storeId, status, createdAt])
  @@index([status, createdAt])  // For worker polling
}

enum EventStatus {
  PENDING
  PROCESSING
  PROCESSED
  FAILED
  DEAD_LETTER
}
```

**Atomic Claim Pattern (prevents double-processing):**
```typescript
// Worker claims event atomically - returns null if already claimed
const event = await prisma.domainEvent.updateMany({
  where: {
    status: 'PENDING',
    // Add claim window to prevent stale locks
    OR: [
      { processedAt: null },
      { processedAt: { lt: new Date(Date.now() - CLAIM_TIMEOUT_MS) } }
    ]
  },
  data: {
    status: 'PROCESSING',
    processedAt: new Date(),
    attempts: { increment: 1 }
  },
  take: 1,  // Claim exactly one
  orderBy: { createdAt: 'asc' }
});

// Only the worker that updated the row processes it
// Other workers get updateCount = 0, skip to next
```

**Benefits:**
- No lost events on crash (transactional with business data)
- Retry with backoff for failures
- Dead letter queue for investigation
- Works with BullMQ workers
- Atomic claim prevents duplicate processing in multi-worker setups

### 7. JSON Versioning

**Rule:** JSON columns with business logic MUST have version fields.

```prisma
model Promotion {
  conditions        Json?
  conditionsVersion Int    @default(1)  // Increment when schema changes
}

model OrderItem {
  productSnapshot        Json
  productSnapshotVersion Int    @default(1)
}
```

### 8. Case-Insensitive Fields (citext Extension)

**Rule:** Use Postgres `citext` extension for case-insensitive fields to avoid `.toLowerCase()` bugs.

```sql
-- Enable extension once in migration
CREATE EXTENSION IF NOT EXISTS citext;
```

```prisma
// In Prisma, map to citext using @db.Citext (requires Prisma 4.16+)
model Customer {
  email String @unique @db.Citext  // "John@Email.COM" == "john@email.com"
}

model Coupon {
  code String @db.Citext  // "SAVE20" == "save20"
  @@unique([storeId, code])
}

model GiftCard {
  code String @db.Citext
  @@unique([storeId, code])
}
```

**Fields requiring citext:**
- `Customer.email`
- `User.email`
- `Coupon.code`
- `GiftCard.code`
- `Promotion.code`
- Any field used for case-insensitive lookups

### 9. Soft Delete Strategy

**Rule:** High-value business data uses `deletedAt` for soft deletes. Other tables use hard deletes.

```prisma
model Product {
  deletedAt DateTime?  // Soft delete - recoverable
  @@index([storeId, deletedAt])  // For filtering active records
}
```

**Tables with soft delete (deletedAt):**
- `Product` - pricing history, order references
- `ProductVariant` - inventory history
- `Customer` - order history, GDPR retention
- `Order` - legal/financial records (never truly deleted)
- `Promotion` - analytics history
- `Collection` - catalog history
- `Category` - taxonomy history

**Tables with hard delete:**
- `Cart`, `CartItem` - ephemeral session data
- `InventoryReservation` - ephemeral holds
- `CustomerSession` - ephemeral auth
- `CheckoutSession` - ephemeral checkout state
- Join tables - no independent lifecycle

**Query pattern:**
```typescript
// Always filter soft-deleted records by default
const activeProducts = await prisma.product.findMany({
  where: { storeId, deletedAt: null }
});
```

---

## Current Implementation Status

### Implemented Models (7 total)

| Model | Prisma File | ID Prefix | Epic | Story |
|-------|-------------|-----------|------|-------|
| Store | store.prisma | `store_` | 1 | 1.5 |
| User | user.prisma | `usr_` | 2 | 2.1 |
| StoreSettings | store-settings.prisma | `stset_` | 2 | 2.7 |
| ApiKey | api-key.prisma | `apikey_` | 2 | 2.5 |
| AuditLog | audit-log.prisma | `audit_` | 2 | 2.6 |
| OwnershipTransfer | ownership-transfer.prisma | `owntx_` | 2 | 2.8 |
| Product | product.prisma | `prod_` | 3 | 3.1 |

---

## Foundation Models (Cross-Epic)

### Global Reference Tables (NO storeId)

| Model | ID/PK | Status | Key Fields |
|-------|-------|--------|------------|
| Country | `iso2` (PK) | 🆕 | iso2, iso3, name, phoneCode |
| Currency | `code` (PK) | 🆕 | code, name, symbol, decimalDigits |

### Multi-Store RBAC (Epic 2 Enhancement)

| Model | ID Prefix | Status | Key Fields |
|-------|-----------|--------|------------|
| **StoreMembership** | `smem_` | 🆕 | storeId, userId, role, status, invitedAt, acceptedAt |

```prisma
model StoreMembership {
  id         String           @id  // smem_xxx
  storeId    String
  userId     String
  role       UserRole         // OWNER, ADMIN, EDITOR, VIEWER
  status     MembershipStatus // PENDING, ACTIVE, SUSPENDED
  invitedAt  DateTime         @default(now())
  acceptedAt DateTime?

  store      Store            @relation(...)
  user       User             @relation(...)

  @@unique([storeId, userId])
  @@index([userId])
}
```

**Note:** This replaces single `User.storeId` for true multi-store support.

### Atomic Counters & Events

| Model | ID Prefix | Status | Key Fields |
|-------|-----------|--------|------------|
| **StoreCounter** | - | 🆕 | storeId, key (compound PK), value |
| **DomainEvent** | `evt_` | 🆕 | storeId, type, payload, status, attempts |

---

## Epic 3: Product Catalog & Inventory

### Models to Create

| Model | ID Prefix | Story | Status | Key Fields |
|-------|-----------|-------|--------|------------|
| Product | `prod_` | 3.1 | ✅ | storeId, name, slug, status, priceInCents, tags |
| ProductVariant | `var_` | 3.2 | 🟡 | storeId, productId, sku, options (JSON), priceInCents, quantity |
| ProductMedia | `med_` | 3.3 | 🟡 | storeId, productId, url, thumbnailUrl, position, altText |
| Category | `cat_` | 3.4 | 🟡 | storeId, name, slug, parentId, depth, position |
| ProductCategory | - | 3.4 | 🟡 | productId, categoryId (join table) |
| Collection | `col_` | 3.5 | 🟡 | storeId, name, slug, isVisible, isFeatured |
| CollectionProduct | - | 3.5 | 🟡 | collectionId, productId, position |
| TaxRule | `tax_` | 3.6 | 🟡 | storeId, name, rate, countryIso2, **appliesToShipping**, isDefault |
| InventoryHistory | `invh_` | 3.7 | 🟡 | storeId, variantId, quantityBefore, quantityAfter, reason |
| **InventoryReservation** | `invres_` | 3.7 | 🆕 | storeId, cartId, variantId, quantity, expiresAt |

#### InventoryReservation Constraints

```prisma
model InventoryReservation {
  id         String            @id  // invres_xxx
  storeId    String
  cartId     String
  variantId  String
  quantity   Int
  status     ReservationStatus @default(ACTIVE)
  expiresAt  DateTime
  createdAt  DateTime          @default(now())
  releasedAt DateTime?         // When converted/expired

  @@unique([cartId, variantId])  // No duplicate holds per cart
  @@index([storeId, variantId, status])  // For available stock calc (only ACTIVE)
  @@index([storeId, cartId])  // For cart cleanup
  @@index([status, expiresAt])  // For expiry worker
}

enum ReservationStatus {
  ACTIVE     // Stock is held
  RELEASED   // Converted to OrderItem
  EXPIRED    // Auto-cleanup by worker
}
```

**Lifecycle:**
1. `ACTIVE` - Created when item added to cart, stock held
2. `RELEASED` - Order placed, reservation converted to OrderItem
3. `EXPIRED` - Cart abandoned, worker marks expired + releases stock

**Decision:** `reservedQuantity` is COMPUTED via `SUM(WHERE status = ACTIVE)`, not stored field. Simpler, no sync issues.

### Story 3.9 - Promotions & Discounts (MVP Simplified)

**SIMPLIFIED FOR MVP** - Removed PromotionRule/PromotionAction enterprise complexity.

| Model | ID Prefix | Status | Key Fields |
|-------|-----------|--------|------------|
| Promotion | `promo_` | 🆕 | storeId, name, code, type, discountValue, conditions (JSON), **conditionsVersion**, maxUses, startsAt, endsAt |
| Coupon | `coup_` | 🆕 | storeId, promotionId, code, usageLimit, usageCount |
| PromotionRedemption | `prdm_` | 🆕 | storeId, promotionId, couponId?, orderId, customerId?, amountCents |

**Promotion.type enum:**
- `PERCENT` - percentage off (discountValue = 10 for 10%)
- `FIXED` - fixed amount off (discountValue = 1000 for $10)
- `FREE_SHIPPING` - free shipping
- `BUY_X_GET_Y` - buy X get Y free (conditions JSON)

**Promotion.conditions JSON structure (versioned):**
```json
// Version 1 schema
{
  "minOrderCents": 5000,
  "productIds": ["prod_xxx"],
  "categoryIds": ["cat_xxx"],
  "customerGroupIds": ["cgrp_xxx"],
  "firstTimeCustomerOnly": true,
  "buyQuantity": 2,
  "getQuantity": 1
}
```

### Story 3.10 - Gift Cards

| Model | ID Prefix | Status | Key Fields |
|-------|-----------|--------|------------|
| GiftCard | `gc_` | 🆕 | storeId, code, initialBalanceCents, currentBalanceCents, status, expiresAt |
| GiftCardTransaction | `gctx_` | 🆕 | storeId, giftCardId, type (credit/debit), amountCents, orderId?, balanceAfter |
| GiftCardTemplate | `gctpl_` | 🆕 | storeId, name, designConfig (JSON), isActive |

---

## Epic 4: Shopping Cart & Checkout

### Models to Create

| Model | ID Prefix | Story | Status | Key Fields |
|-------|-----------|-------|--------|------------|
| Cart | `cart_` | 4.1 | 🟡 | storeId, customerId?, sessionId (unique per store), expiresAt, status, **currencyCode**, **subtotalCents**, **discountTotalCents**, **taxTotalCents**, **grandTotalCents** |
| CartItem | `citem_` | 4.2 | 🟡 | storeId, cartId, variantId, quantity, **unitPriceCents** (snapshot), **discountCents**, **taxCents**, **totalCents** |
| CheckoutSession | `chk_` | 4.7 | 🟡 | storeId, cartId, status, **guestEmail**, **selectedShippingMethodId**, **selectedPaymentMethod**, **shippingSnapshot (JSON)**, **billingSnapshot (JSON)**, paymentIntentId, currencyCode |

#### CheckoutSession Enhanced

```prisma
model CheckoutSession {
  id                       String   @id  // chk_xxx
  storeId                  String
  cartId                   String
  status                   CheckoutStatus

  // Guest checkout
  guestEmail               String?

  // Selections
  selectedShippingMethodId String?
  selectedPaymentMethod    String?  // "card", "apple_pay", "google_pay"

  // Address snapshots (not FK - historical)
  shippingSnapshot         Json?
  billingSnapshot          Json?
  shippingSnapshotVersion  Int      @default(1)

  // Payment
  paymentIntentId          String?  // Stripe PI ID reference only
  currencyCode             String

  createdAt                DateTime @default(now())
  updatedAt                DateTime @updatedAt
  expiresAt                DateTime
}
```

#### Cart Constraints

```prisma
model Cart {
  id                   String     @id  // cart_xxx
  storeId              String
  customerId           String?    // null for guest carts
  sessionId            String?    // browser/device session ID

  // Money snapshots
  currencyCode         String
  subtotalCents        Int        @default(0)
  discountTotalCents   Int        @default(0)
  taxTotalCents        Int        @default(0)
  grandTotalCents      Int        @default(0)

  status               CartStatus @default(ACTIVE)
  expiresAt            DateTime
  createdAt            DateTime   @default(now())
  updatedAt            DateTime   @updatedAt

  @@unique([storeId, sessionId])  // One cart per session per store
  @@index([storeId, customerId])
  @@index([storeId, expiresAt])   // For cart cleanup worker
}

enum CartStatus {
  ACTIVE       // Shopping in progress
  MERGED       // Merged into customer cart on login
  CONVERTED    // Became an order
  EXPIRED      // Abandoned, cleaned up
}
```

### Shipping (Join Tables for Countries)

| Model | ID Prefix | Story | Status | Key Fields |
|-------|-----------|-------|--------|------------|
| ShippingZone | `szone_` | 4.4 | ⬜ | storeId, name, isDefault |
| **ShippingZoneCountry** | - | 4.4 | 🆕 | zoneId, countryIso2 (join table) |
| ShippingMethod | `smeth_` | 4.4 | ⬜ | storeId, zoneId, name, priceInCents, minOrderCents, estimatedDays |
| ShippingRate | `srate_` | 4.5 | ⬜ | storeId, methodId, weightMin, weightMax, priceInCents |

### Story 4.10 - Regions & Multi-Currency (Join Tables)

| Model | ID Prefix | Status | Key Fields |
|-------|-----------|--------|------------|
| Region | `reg_` | 🆕 | storeId, name, slug, defaultCurrencyCode, taxIncluded, isDefault |
| **RegionCountry** | - | 🆕 | regionId, countryIso2, taxRate (join table) |
| **StoreCurrency** | - | 🆕 | storeId, currencyCode, isDefault (join table) |
| ExchangeRate | `exr_` | 🆕 | storeId, fromCurrencyCode, toCurrencyCode, rate, validFrom |
| PriceList | `plist_` | 🆕 | storeId, name, type, currencyCode, regionId?, startsAt, endsAt |
| PriceListPrice | `plp_` | 🆕 | storeId, priceListId, productId?, variantId?, priceInCents |

---

## Epic 5: Payment Processing

### Models to Create

| Model | ID Prefix | Story | Status | Key Fields | Security Notes |
|-------|-----------|-------|--------|------------|----------------|
| StripeConnection | `sconn_` | 5.1 | 🟡 | storeId, mode, stripeAccountId, **encryptedRefreshToken** (KMS), tokenExpiresAt | **Use KMS/Envelope encryption** |
| StripeConnectState | - | 5.1 | 🟡 | state, storeId, mode, expiresAt | Ephemeral, delete after use |
| PaymentIntent | `pi_` | 5.4 | ⬜ | storeId, orderId, stripePaymentIntentId, amountCents, currencyCode, status | |
| Payment | `pay_` | 5.4 | ⬜ | storeId, orderId, method, amountCents, currencyCode, status, **last4**, **brand** | Never store full card |
| Refund | `ref_` | 5.7 | ⬜ | storeId, paymentId, amountCents, reason, status, stripeRefundId | |
| PaymentAuditLog | `palog_` | 5.8 | ⬜ | storeId, paymentId?, event, **metadata (sanitized JSON)** | **No PII in metadata** |

---

## Epic 6: Order Management & Fulfillment

### Models to Create (With Money Snapshots)

| Model | ID Prefix | Story | Status | Key Fields |
|-------|-----------|-------|--------|------------|
| Order | `ord_` | 6.1 | 🟡 | storeId, **orderNumber** (via StoreCounter), customerId?, status, paymentStatus, **currencyCode**, **subtotalCents**, **discountTotalCents**, **shippingTotalCents**, **taxTotalCents**, **grandTotalCents**, **taxIncluded** |
| OrderItem | `oli_` | 6.2 | 🟡 | storeId, orderId, variantId, productSnapshot (JSON), **productSnapshotVersion**, **quantity**, **unitPriceCents**, **discountCents**, **taxCents**, **totalCents** |
| OrderAddress | `oadr_` | 6.2 | 🟡 | storeId, orderId, type (shipping/billing), firstName, lastName, address1, address2, city, state, postalCode, countryCode, phone |
| OrderTimelineEvent | `ote_` | 6.2 | 🟡 | storeId, orderId, type, description, metadata (JSON), userId?, createdAt |
| Fulfillment | `ful_` | 6.4 | ⬜ | storeId, orderId, status, trackingNumber, carrier, shippedAt |
| FulfillmentItem | `fuli_` | 6.4 | ⬜ | storeId, fulfillmentId, orderItemId, quantity |
| FulfillmentTrackingEvent | `fulte_` | 6.10 | 🆕 | storeId, fulfillmentId, status, location, occurredAt, rawPayload (JSON) |
| Return | `ret_` | 6.8 | ⬜ | storeId, orderId, status, reason, requestedAt, **refundAmountCents** |
| ReturnItem | `reti_` | 6.8 | ⬜ | storeId, returnId, orderItemId, quantity, condition, reason |
| ReturnPolicy | `rpol_` | 6.9 | ⬜ | storeId, name, daysToReturn, conditions (JSON), isDefault |

### OrderItem.productSnapshot JSON Structure (Versioned)

Captures product state at time of order (for historical accuracy):
```json
{
  "version": 1,
  "productId": "prod_xxx",
  "variantId": "var_xxx",
  "name": "Premium T-Shirt",
  "sku": "TSHIRT-L-BLK",
  "options": { "size": "L", "color": "Black" },
  "imageUrl": "https://..."
}
```

---

## Epic 7: Customer Accounts & Wishlist

### Models to Create

| Model | ID Prefix | Story | Status | Key Fields |
|-------|-----------|-------|--------|------------|
| Customer | `cst_` | 7.1 | 🟡 | storeId, email, passwordHash, firstName, lastName, status, marketingConsent |
| CustomerSession | `csess_` | 7.2 | 🟡 | storeId, customerId, token, expiresAt, rememberMe, userAgent, ipAddress |
| CustomerAddress | `cadr_` | 7.6 | 🟡 | storeId, customerId, type, isDefault, firstName, lastName, address1, address2, city, state, postalCode, countryCode, phone |
| CustomerGroup | `cgrp_` | 7.13 | 🆕 | storeId, name, description, discountPercent |
| CustomerGroupMembership | `cgm_` | 7.13 | 🆕 | storeId, customerId, groupId, addedAt (join table with metadata) |
| Wishlist | `wl_` | 7.10 | ⬜ | storeId, customerId, name, isPublic |
| WishlistItem | `wli_` | 7.10 | ⬜ | storeId, wishlistId, productId, variantId?, addedAt, notifyOnSale |

---

## Epic 15: Suppliers & Purchase Orders

### Models to Create

| Model | ID Prefix | Story | Status | Key Fields |
|-------|-----------|-------|--------|------------|
| Supplier | `supp_` | 15.1 | 🆕 | storeId, name, code, email, status, paymentTermsDays, currencyCode |
| SupplierContact | `scon_` | 15.1 | 🆕 | storeId, supplierId, name, email, phone, isPrimary |
| SupplierProduct | `spprod_` | 15.2 | 🆕 | storeId, supplierId, productId, variantId?, costPriceCents, supplierSku, leadTimeDays |
| PurchaseOrder | `po_` | 15.3 | 🆕 | storeId, supplierId, **poNumber** (via StoreCounter), status, currencyCode, subtotalCents, taxCents, totalCents, expectedDeliveryDate |
| PurchaseOrderItem | `poitem_` | 15.3 | 🆕 | storeId, purchaseOrderId, productId, variantId?, quantity, unitCostCents, receivedQuantity |
| PurchaseOrderReceipt | `porec_` | 15.4 | 🆕 | storeId, purchaseOrderId, receiptNumber, receivedAt, receivedBy |
| PurchaseOrderReceiptItem | `porecitem_` | 15.4 | 🆕 | storeId, receiptId, poItemId, quantityReceived, condition |

---

## Reinforcement Stories

### Epic 2 - Story 2.R1: Multi-Store RBAC

| Model | Status | Notes |
|-------|--------|-------|
| StoreMembership | 🆕 | Replaces single User.storeId |
| User.storeId | DEPRECATE | Move to StoreMembership join |

### Epic 3 - Story 3.R1: Foundation Reinforcement

| Current Model | Enhancement | Notes |
|---------------|-------------|-------|
| Store | Add `defaultRegionId` | FK to Region |
| StoreSettings | Add `giftCardsEnabled`, `promotionsEnabled` | Feature flags |

### Epic 3 - Story 3.R2: Prefixed IDs Foundation ✅

Implemented custom Prisma 7 extension for automatic prefixed ID generation.
- Config: `apps/api/src/database/id-prefixes.config.ts`
- Extension: `apps/api/src/database/prefixed-ids.extension.ts`

### Maintenance - Story M-1: V3 Retroactive Fixes

> **Note:** Replaces former X.1 (Global Reference Data) - consolidated 2026-01-18

| Model | Status | Notes |
|-------|--------|-------|
| Country | 🆕 | Seeded with ISO 3166 data |
| Currency | 🆕 | Seeded with ISO 4217 data |
| StoreCounter | 🆕 | For atomic order/invoice numbers |
| DomainEvent | 🆕 | Outbox pattern for async jobs |
| User.email | 🔧 | Add @db.Citext (Principle #8) |
| Product.deletedAt | 🔧 | Add soft delete (Principle #9) |

**Story file:** `_bmad-output/implementation-artifacts/stories/M-1-v3-retroactive-fixes.md`

---

## Model Relationships Diagram (Updated v2)

```
GLOBAL TABLES (no storeId)
├── Country (iso2 PK)
└── Currency (code PK)

Store (root tenant)
├── StoreMembership → User (multi-store RBAC)
├── StoreSettings (config)
├── StoreCurrency → Currency (join table)
├── StoreCounter (atomic sequences)
├── DomainEvent (outbox)
├── ApiKey (SDK auth)
├── AuditLog (compliance)
│
├── Product
│   ├── ProductVariant
│   │   ├── InventoryHistory
│   │   └── InventoryReservation ← Cart (stock holds)
│   ├── ProductMedia
│   ├── ProductCategory (join) → Category
│   ├── CollectionProduct (join) → Collection
│   └── SupplierProduct (join) → Supplier
│
├── Customer
│   ├── CustomerSession
│   ├── CustomerAddress
│   ├── CustomerGroupMembership → CustomerGroup
│   ├── Wishlist → WishlistItem
│   └── Order
│       ├── OrderItem (with price + product snapshots)
│       ├── OrderAddress
│       ├── OrderTimelineEvent
│       ├── Payment → Refund
│       │   └── PaymentAuditLog
│       ├── Fulfillment → FulfillmentItem
│       │   └── FulfillmentTrackingEvent
│       ├── Return → ReturnItem
│       └── PromotionRedemption → Promotion
│
├── Cart
│   ├── CartItem (with price snapshots)
│   ├── InventoryReservation (stock holds)
│   └── CheckoutSession (with address snapshots)
│
├── Promotion (MVP simplified, versioned conditions)
│   ├── Coupon
│   └── PromotionRedemption
│
├── GiftCard
│   └── GiftCardTransaction
│
├── Region
│   └── RegionCountry (join) → Country
│
├── TaxRule (with appliesToShipping)
│
├── PriceList
│   └── PriceListPrice
│
├── ShippingZone
│   ├── ShippingZoneCountry (join) → Country
│   └── ShippingMethod
│       └── ShippingRate
│
└── Supplier
    ├── SupplierContact
    └── PurchaseOrder (poNumber via StoreCounter)
        ├── PurchaseOrderItem
        └── PurchaseOrderReceipt
            └── PurchaseOrderReceiptItem
```

---

## ID Prefix Reference (70+ models)

| Prefix | Model | Domain |
|--------|-------|--------|
| `store_` | Store | Foundation |
| `usr_` | User | Auth |
| `smem_` | StoreMembership | Auth |
| `stset_` | StoreSettings | Config |
| `apikey_` | ApiKey | Auth |
| `audit_` | AuditLog | Compliance |
| `owntx_` | OwnershipTransfer | Auth |
| `evt_` | DomainEvent | Events |
| `prod_` | Product | Catalog |
| `var_` | ProductVariant | Catalog |
| `med_` | ProductMedia | Catalog |
| `cat_` | Category | Catalog |
| `col_` | Collection | Catalog |
| `tax_` | TaxRule | Pricing |
| `invh_` | InventoryHistory | Inventory |
| `invres_` | InventoryReservation | Inventory |
| `promo_` | Promotion | Marketing |
| `coup_` | Coupon | Marketing |
| `prdm_` | PromotionRedemption | Marketing |
| `gc_` | GiftCard | Marketing |
| `gctx_` | GiftCardTransaction | Marketing |
| `gctpl_` | GiftCardTemplate | Marketing |
| `cart_` | Cart | Commerce |
| `citem_` | CartItem | Commerce |
| `chk_` | CheckoutSession | Commerce |
| `szone_` | ShippingZone | Shipping |
| `smeth_` | ShippingMethod | Shipping |
| `srate_` | ShippingRate | Shipping |
| `reg_` | Region | Localization |
| `exr_` | ExchangeRate | Localization |
| `plist_` | PriceList | Pricing |
| `plp_` | PriceListPrice | Pricing |
| `sconn_` | StripeConnection | Payment |
| `pi_` | PaymentIntent | Payment |
| `pay_` | Payment | Payment |
| `ref_` | Refund | Payment |
| `palog_` | PaymentAuditLog | Payment |
| `ord_` | Order | Orders |
| `oli_` | OrderItem | Orders |
| `oadr_` | OrderAddress | Orders |
| `ote_` | OrderTimelineEvent | Orders |
| `ful_` | Fulfillment | Fulfillment |
| `fuli_` | FulfillmentItem | Fulfillment |
| `fulte_` | FulfillmentTrackingEvent | Fulfillment |
| `ret_` | Return | Returns |
| `reti_` | ReturnItem | Returns |
| `rpol_` | ReturnPolicy | Returns |
| `cst_` | Customer | Customers |
| `csess_` | CustomerSession | Customers |
| `cadr_` | CustomerAddress | Customers |
| `cgrp_` | CustomerGroup | Customers |
| `cgm_` | CustomerGroupMembership | Customers |
| `wl_` | Wishlist | Customers |
| `wli_` | WishlistItem | Customers |
| `supp_` | Supplier | Suppliers |
| `scon_` | SupplierContact | Suppliers |
| `spprod_` | SupplierProduct | Suppliers |
| `po_` | PurchaseOrder | Suppliers |
| `poitem_` | PurchaseOrderItem | Suppliers |
| `porec_` | PurchaseOrderReceipt | Suppliers |
| `porecitem_` | PurchaseOrderReceiptItem | Suppliers |

**No prefix (global or join tables):**
- Country (iso2 PK)
- Currency (code PK)
- StoreCounter (compound PK)
- StoreCurrency, RegionCountry, ShippingZoneCountry (join tables)
- ProductCategory, CollectionProduct, CustomerGroupMembership (join tables)

---

## Total Model Count

| Category | Count |
|----------|-------|
| Implemented | 7 |
| Global Reference | 2 |
| Foundation New | 3 |
| Documented (Zod) | 22 |
| Join Tables | 6 |
| New Models | 28 |
| **Total** | **~73** |

---

## Implementation Priority

1. **P0 - Foundation**: Country, Currency (seed data), StoreCounter, DomainEvent, StoreMembership
2. **P1 - Epic 3 Completion**: ProductVariant, ProductMedia, Category, Collection, TaxRule (with appliesToShipping), InventoryHistory, InventoryReservation
3. **P2 - Epic 3 MVP Marketing**: Simplified Promotion (with conditionsVersion), Coupon, PromotionRedemption, GiftCard
4. **P3 - Epic 4**: Cart (with totals), CartItem (with snapshots), CheckoutSession (enhanced), ShippingZone, ShippingZoneCountry, ShippingMethod
5. **P4 - Epic 4 Regions**: Region, RegionCountry, StoreCurrency, ExchangeRate, PriceList
6. **P5 - Epic 5**: StripeConnection (KMS encrypted), PaymentIntent, Payment, Refund, PaymentAuditLog (sanitized)
7. **P6 - Epic 6**: Order (with snapshots + orderNumber), OrderItem (with snapshots + version), Fulfillment, Return
8. **P7 - Epic 7**: Customer, CustomerAddress, CustomerGroup, Wishlist
9. **P8 - Epic 15**: Supplier, PurchaseOrder (can be deferred post-MVP)
