# Epic 4: Shopping Cart & Checkout

Buyer peut ajouter au panier, voir les frais de livraison en temps reel, et finaliser son achat en guest checkout.

**FRs covered:** FR13, FR14, FR15, FR16, FR17, FR21, FR22

---

## Epic Implementation Guidelines

### Retrospective Learnings (MANDATORY)
- **RETRO-1:** Use Context7 MCP before implementing Stripe Elements, address autocomplete
- **RETRO-2:** CartService, CheckoutService, ShippingService use `protected` methods
- **RETRO-3:** CheckoutModule exports explicit public API for custom checkout flows
- **RETRO-4:** Storefront checkout components accept customization props
- **RETRO-5:** Checkout page uses composition pattern (wrappable steps)
- **RETRO-6:** Code with @trafi/core override patterns (custom checkout steps possible)

### UX Design Requirements (Storefront - Digital Brutalism v2)

**Brutalist Manifesto:**
- The interface is a machine. No decoration, only data and action.
- Radius-zero everywhere — everything is a rectangle.
- Visible grid — 1px borders expose structure.
- High contrast — pure black background, pure white text.

**Storefront Visual Design:**
- **UX-STORE-1:** Fixed header with solid black background, 1px border bottom
- **UX-STORE-2:** Cart slide-over from right (400px width, solid black background)
- **UX-STORE-3:** Product cards with border highlight on hover (no transforms)
- **UX-STORE-4:** Mobile-first responsive (touch targets 48x48px minimum)
- **UX-STORE-5:** Express checkout (Apple Pay/Google Pay) above fold
- **UX-10:** Guest checkout as default, shipping visible from cart
- **UX-11:** Checkout flow < 90 seconds target
- **UX-COLOR-1:** Primary Acid Lime #CCFF00 for CTAs, focus states
- **UX-COLOR-2:** Background #000000, borders #333333, text #FFFFFF
- **UX-COLOR-3:** Success #00FF94, Risk #FF3366
- **UX-RADIUS:** 0px everywhere — `border-radius: 0px !important`
- **UX-SHADOW:** None — elements sit firmly in the grid
- **UX-TYPE:** JetBrains Mono for prices/quantities, system font for body

### Dashboard UX (Merchant Shipping Configuration - Digital Brutalism v2)

**Visual Design:**
- **UX-2:** Rail (64px) + Sidebar (240px) + Main content layout
- **UX-3:** Breadcrumb: Dashboard > Settings > Shipping
- **UX-8:** Shadcn UI: DataTable for zones, Dialog for rate editing (all radius-0)
- **UX-COLOR-1:** Primary Acid Lime #CCFF00 for action buttons, focus states
- **UX-COLOR-2:** Background #000000, borders #333333, text #FFFFFF
- **UX-RADIUS:** 0px everywhere

### Architectural Requirements (CRITICAL - Updated 2026-01-18)

**ARCH-CART-1: Money Snapshots + Session Uniqueness**
Cart and CartItem MUST store snapshot totals for historical accuracy:
```prisma
model Cart {
  sessionId           String?  // Browser/device session
  currencyCode        String
  subtotalCents       Int
  discountTotalCents  Int      @default(0)
  taxTotalCents       Int      @default(0)
  grandTotalCents     Int

  @@unique([storeId, sessionId])  // One cart per session per store
}

model CartItem {
  unitPriceCents      Int      // Snapshot at time of add
  discountCents       Int      @default(0)
  taxCents            Int      @default(0)
  totalCents          Int      // unitPriceCents * quantity - discountCents + taxCents
}
```

**ARCH-SHIP-1: Join Tables for Countries**
Use join tables instead of arrays for ShippingZone countries:
```prisma
// WRONG: ShippingZone.countries String[]
// RIGHT:
model ShippingZoneCountry {
  zoneId      String
  countryIso2 String
  zone        ShippingZone @relation(...)
  @@id([zoneId, countryIso2])
}
```

**ARCH-REG-1: Join Tables for Regions**
Use join tables for Region-Country and Store-Currency:
```prisma
model RegionCountry {
  regionId    String
  countryIso2 String
  taxRate     Decimal?
  @@id([regionId, countryIso2])
}

model StoreCurrency {
  storeId      String
  currencyCode String
  isDefault    Boolean @default(false)
  @@id([storeId, currencyCode])
}
```

---

## Stories

| Story | Description | File |
|-------|-------------|------|
| 4.1 | Cart Model and Session Management | [story-4-1-cart-session.md](./epic-04/story-4-1-cart-session.md) |
| 4.2 | Add to Cart Functionality | [story-4-2-add-to-cart.md](./epic-04/story-4-2-add-to-cart.md) |
| 4.3 | Cart Management and Updates | [story-4-3-cart-management.md](./epic-04/story-4-3-cart-management.md) |
| 4.4 | Shipping Zones and Rates Configuration | [story-4-4-shipping-zones.md](./epic-04/story-4-4-shipping-zones.md) |
| 4.5 | Shipping Rate Calculation | [story-4-5-shipping-rates.md](./epic-04/story-4-5-shipping-rates.md) |
| 4.6 | Tax Calculation Engine | [story-4-6-tax-calculation.md](./epic-04/story-4-6-tax-calculation.md) |
| 4.7 | Checkout Flow - Guest Checkout | [story-4-7-guest-checkout.md](./epic-04/story-4-7-guest-checkout.md) |
| 4.8 | Checkout Flow - Address and Shipping Selection | [story-4-8-address-shipping.md](./epic-04/story-4-8-address-shipping.md) |
| 4.9 | Order Creation and Confirmation | [story-4-9-order-creation.md](./epic-04/story-4-9-order-creation.md) |
| 4.10 | Regions & Multi-Currency Foundation | [story-4-10-regions-currency.md](./epic-04/story-4-10-regions-currency.md) |
