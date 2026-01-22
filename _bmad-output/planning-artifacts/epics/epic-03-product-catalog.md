# Epic 3: Product Catalog & Inventory

Merchant peut creer, editer, et organiser son catalogue produits complet avec gestion d'inventaire.

**FRs covered:** FR10, FR11, FR12, FR20

---

## Epic Implementation Guidelines

### Retrospective Learnings (MANDATORY)
- **RETRO-1:** Use Context7 MCP before implementing file upload libraries, image optimization
- **RETRO-2:** ProductService, CategoryService, InventoryService use `protected` methods
- **RETRO-3:** ProductModule exports explicit public API for future extensibility
- **RETRO-4:** Dashboard product components accept customization props (columns, actions)
- **RETRO-5:** Product list page uses composition pattern (wrappable DataTable)
- **RETRO-6:** Code with @trafi/core override patterns (merchants may extend product fields)

### UX Design Requirements (Dashboard - Digital Brutalism v2)

**Brutalist Manifesto:**
- The interface is a machine. No decoration, only data and action.
- Radius-zero everywhere — everything is a rectangle.
- Visible grid — 1px borders expose structure.
- High contrast — pure black background, pure white text.

**Visual Design:**
- **UX-1:** Dark mode default, all product pages
- **UX-2:** Layout: Rail (64px) + Sidebar (240px) + Main content
- **UX-3:** Breadcrumb: Dashboard > Products > [action]
- **UX-4:** Status badges: draft (gray #6B7280), active (#00FF94), archived (#FF3366)
- **UX-5:** Product grid uses strict rectangular grid layout
- **UX-6:** Card hover: border-color #CCFF00, no transforms — only border highlight
- **UX-7:** Drag-and-drop for image reorder with immediate visual feedback
- **UX-8:** Shadcn UI: DataTable, Dialog, Tabs, Select, Input (all radius-0)
- **UX-COLOR-1:** Primary Acid Lime #CCFF00 for action buttons, focus states
- **UX-COLOR-2:** Background #000000, borders #333333, text #FFFFFF
- **UX-COLOR-3:** Success #00FF94, Risk #FF3366
- **UX-RADIUS:** 0px everywhere — `border-radius: 0px !important`
- **UX-SHADOW:** None — elements sit firmly in the grid
- **UX-TYPE:** JetBrains Mono for product data/prices, system font for body

### Architectural Requirements (CRITICAL - Updated 2026-01-18)

**ARCH-INV-1: Inventory Reservations (with Status Lifecycle)**
ProductVariant reserved stock is COMPUTED via SUM(), not stored. Reservations track status:
```prisma
model InventoryReservation {
  id         String            @id // invres_xxx
  storeId    String
  cartId     String
  variantId  String
  quantity   Int
  status     ReservationStatus @default(ACTIVE)
  expiresAt  DateTime
  releasedAt DateTime?         // When converted/expired

  @@unique([cartId, variantId])
  @@index([storeId, variantId, status])  // For stock calc (ACTIVE only)
  @@index([status, expiresAt])           // For expiry worker
}

enum ReservationStatus {
  ACTIVE     // Stock is held
  RELEASED   // Converted to OrderItem
  EXPIRED    // Auto-cleanup by worker
}
```
Reserved quantity computed: `SUM(quantity) WHERE status = ACTIVE`

**ARCH-PROMO-1: Simplified Promotions (MVP)**
Removed enterprise complexity (PromotionRule, PromotionAction). Use simple type-based promotions:
```prisma
model Promotion {
  type            PromotionType  // PERCENT, FIXED, FREE_SHIPPING, BUY_X_GET_Y
  discountValue   Int?           // 10 = 10% or 1000 = $10
  conditions      Json?          // { minOrderCents, productIds, customerGroupIds }
}

enum PromotionType {
  PERCENT
  FIXED
  FREE_SHIPPING
  BUY_X_GET_Y
}
```

**ARCH-PROMO-2: Promotion Conditions JSON**
```json
// Minimum order: { "minOrderCents": 5000 }
// Product restriction: { "productIds": ["prod_xxx"] }
// Category restriction: { "categoryIds": ["cat_xxx"] }
// Customer group: { "customerGroupIds": ["cgrp_xxx"] }
// First-time customer: { "firstTimeCustomerOnly": true }
// Buy X Get Y: { "buyQuantity": 2, "getQuantity": 1, "productId": "prod_xxx" }
```

**ARCH-TEXT-1: Case-Insensitive Codes (citext)**
Use Postgres `citext` extension for promotion/coupon codes:
```prisma
model Coupon {
  code String @db.Citext  // "SAVE20" == "save20"
  @@unique([storeId, code])
}

model GiftCard {
  code String @db.Citext
  @@unique([storeId, code])
}
```

**ARCH-DEL-1: Soft Delete for Catalog**
Product and Category use `deletedAt` for soft delete (order history preservation):
```prisma
model Product {
  deletedAt DateTime?
  @@index([storeId, deletedAt])
}
```

---

## Stories

| Story | Description | File |
|-------|-------------|------|
| 3.1 | Product Model and Basic CRUD | [story-3-1-product-crud.md](./epic-03/story-3-1-product-crud.md) |
| 3.2 | Product Variants Management | [story-3-2-variants.md](./epic-03/story-3-2-variants.md) |
| 3.3 | Product Media Upload | [story-3-3-media-upload.md](./epic-03/story-3-3-media-upload.md) |
| 3.4 | Categories Management | [story-3-4-categories.md](./epic-03/story-3-4-categories.md) |
| 3.5 | Collections Management | [story-3-5-collections.md](./epic-03/story-3-5-collections.md) |
| 3.6 | Product Pricing and Tax Rules | [story-3-6-pricing-tax.md](./epic-03/story-3-6-pricing-tax.md) |
| 3.7 | Inventory Tracking | [story-3-7-inventory.md](./epic-03/story-3-7-inventory.md) |
| 3.8 | Oversell Prevention | [story-3-8-oversell-prevention.md](./epic-03/story-3-8-oversell-prevention.md) |
| 3.9 | Promotions & Discounts Foundation | [story-3-9-promotions.md](./epic-03/story-3-9-promotions.md) |
| 3.10 | Gift Cards | [story-3-10-gift-cards.md](./epic-03/story-3-10-gift-cards.md) |
| 3.R1 | Foundation Reinforcement (Epic 1 & 2 Enhancements) | [story-3-r1-foundation.md](./epic-03/story-3-r1-foundation.md) |
| 3.R2 | Prefixed IDs Foundation | [story-3-r2-prefixed-ids.md](./epic-03/story-3-r2-prefixed-ids.md) |
