# Epic 4: Shopping Cart & Checkout

Buyer peut ajouter au panier, voir les frais de livraison en temps reel, et finaliser son achat en guest checkout.

**FRs covered:** FR13, FR14, FR15, FR16, FR17, FR21, FR22

---

## Story 4.1: Cart Model and Session Management

As a **Buyer (Emma)**,
I want **my cart to persist across browser sessions**,
So that **I don't lose my selections when I return**.

**Acceptance Criteria:**

**Given** a buyer visits the storefront
**When** they add items to cart
**Then** the cart is persisted via:
- Cookie-based cart ID for anonymous users
- Account-linked cart for authenticated users
**And** cart survives browser close and return
**And** cart has a configurable expiration (default 30 days)
**And** cart merges on login if items exist in both

---

## Story 4.2: Add to Cart Functionality

As a **Buyer (Emma)**,
I want **to add products to my cart quickly**,
So that **I can continue shopping without friction**.

**Acceptance Criteria:**

**Given** a buyer is viewing a product
**When** they click "Add to Cart"
**Then** the selected variant and quantity are added
**And** a cart slide-over opens showing the added item
**And** shipping estimate is visible immediately (UX-10)
**And** the operation completes in < 500ms (NFR-PERF-1)
**And** out-of-stock items show appropriate messaging

---

## Story 4.3: Cart Management and Updates

As a **Buyer (Emma)**,
I want **to view and modify my cart contents**,
So that **I can adjust my order before checkout**.

**Acceptance Criteria:**

**Given** a buyer has items in cart
**When** they view the cart
**Then** they can:
- See all items with images, titles, variants, prices
- Update quantities (with inventory validation)
- Remove items from cart
- See subtotal, estimated shipping, and estimated tax
**And** cart updates happen in real-time without page reload
**And** quantity changes validate against available inventory

---

## Story 4.4: Shipping Zones and Rates Configuration

As a **Merchant**,
I want **to configure shipping zones and rates**,
So that **customers see accurate shipping costs**.

**Acceptance Criteria:**

**Given** a Merchant is in Settings
**When** they configure shipping
**Then** they can:
- Create shipping zones by country/region
- Define shipping methods per zone (standard, express, etc.)
- Set flat rates or weight-based rates
- Configure free shipping thresholds
**And** zones can have multiple methods with different prices
**And** a default/fallback zone handles unconfigured regions

---

## Story 4.5: Shipping Rate Calculation

As a **System**,
I want **to calculate shipping rates based on cart and destination**,
So that **buyers see accurate shipping costs early**.

**Acceptance Criteria:**

**Given** a cart with items and a destination address
**When** shipping rates are requested
**Then** the system returns:
- All available shipping methods for the zone
- Calculated price per method
- Estimated delivery timeframe per method
**And** rates are calculated based on cart weight/value
**And** free shipping is applied when threshold is met
**And** calculation completes in < 200ms

---

## Story 4.6: Tax Calculation Engine

As a **System**,
I want **to calculate applicable taxes based on buyer location**,
So that **prices are legally compliant and transparent**.

**Acceptance Criteria:**

**Given** a cart and buyer location
**When** taxes are calculated
**Then** the system applies:
- Tax rules based on destination country/region
- Product-specific tax categories
- Tax-inclusive or tax-exclusive display per store config
**And** tax breakdown is visible in cart and checkout
**And** calculation handles EU VAT requirements
**And** tax amounts are stored in cents

---

## Story 4.7: Checkout Flow - Guest Checkout

As a **Buyer (Emma)**,
I want **to complete checkout without creating an account**,
So that **I can buy quickly without friction**.

**Acceptance Criteria:**

**Given** a buyer proceeds to checkout
**When** checkout loads
**Then** guest checkout is the default option (UX-10)
**And** the form requires only:
- Email address (for receipt)
- Shipping address
- Shipping method selection
- Payment information
**And** express checkout (Apple Pay/Google Pay) is above fold (UX-11)
**And** optional "create account" checkbox is available
**And** checkout can complete in < 90 seconds

---

## Story 4.8: Checkout Flow - Address and Shipping Selection

As a **Buyer (Emma)**,
I want **to enter my shipping address and select delivery method**,
So that **I know when and how my order will arrive**.

**Acceptance Criteria:**

**Given** a buyer is in checkout
**When** they enter shipping address
**Then** address autocomplete helps speed entry
**And** available shipping methods update based on address
**And** shipping costs and delivery estimates are shown
**And** selected method is highlighted with price and timeframe
**And** address validation prevents invalid submissions

---

## Story 4.9: Order Creation and Confirmation

As a **System**,
I want **to create an order from a completed checkout**,
So that **the purchase is recorded and fulfillment can begin**.

**Acceptance Criteria:**

**Given** payment is successfully processed
**When** the order is created
**Then** the system:
- Creates order record with all line items
- Reserves/decrements inventory
- Associates with customer (guest or registered)
- Generates order number with `ord_` prefix
- Sends confirmation email with order details
**And** buyer sees confirmation page with order summary
**And** order status is set to "confirmed"
