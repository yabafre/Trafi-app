## Story 3.R1: Foundation Reinforcement (Epic 1 & 2 Enhancements)

As a **System**,
I want **core foundation models to support new commerce features**,
So that **Promotions, Gift Cards, and Multi-currency integrate seamlessly**.

**Acceptance Criteria:**

**Given** the foundation models exist
**When** new commerce features are added
**Then** Store and StoreSettings are extended with:
- Store: `defaultRegionId`, `supportedCurrencies[]`
- StoreSettings: `giftCardsEnabled`, `promotionsEnabled`, `maxDiscountPercent`
**And** relations to new models are established
**And** existing functionality remains backward compatible

---

### Technical Implementation

#### Schema Updates (`apps/api/prisma/schema/store.prisma`)
```prisma
// Add to existing Store model
model Store {
  // ... existing fields ...

  // New fields for commerce features
  defaultRegionId       String?   @map("default_region_id")
  supportedCurrencies   String[]  @default(["EUR"]) @map("supported_currencies")

  // New relations
  promotions            Promotion[]
  coupons               Coupon[]
  promotionUsages       PromotionUsage[]
  giftCards             GiftCard[]
  giftCardTransactions  GiftCardTransaction[]
  giftCardTemplates     GiftCardTemplate[]
}
```

#### Schema Updates (`apps/api/prisma/schema/store-settings.prisma`)
```prisma
// Add to existing StoreSettings model
model StoreSettings {
  // ... existing fields ...

  // Promotions settings
  promotionsEnabled     Boolean   @default(true) @map("promotions_enabled")
  maxDiscountPercent    Int       @default(100) @map("max_discount_percent") // 0-100
  allowStackablePromos  Boolean   @default(false) @map("allow_stackable_promos")

  // Gift cards settings
  giftCardsEnabled      Boolean   @default(false) @map("gift_cards_enabled")
  giftCardMinCents      Int       @default(1000) @map("gift_card_min_cents")    // $10 min
  giftCardMaxCents      Int       @default(50000) @map("gift_card_max_cents")   // $500 max
  giftCardValidityDays  Int?      @map("gift_card_validity_days")               // null = never

  // Multi-currency settings
  multiCurrencyEnabled  Boolean   @default(false) @map("multi_currency_enabled")
  displayPriceIncTax    Boolean   @default(true) @map("display_price_inc_tax")
}
```

#### Migration Strategy
```sql
-- Migration: add_commerce_features_to_foundation
ALTER TABLE stores ADD COLUMN default_region_id TEXT;
ALTER TABLE stores ADD COLUMN supported_currencies TEXT[] DEFAULT ARRAY['EUR'];

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

#### Backward Compatibility
- All new fields have sensible defaults
- Existing stores continue to function without changes
- Feature flags (`promotionsEnabled`, `giftCardsEnabled`) control visibility
- Migration is additive only, no destructive changes

---

