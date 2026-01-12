# Epic 3: Product Catalog & Inventory

Merchant peut creer, editer, et organiser son catalogue produits complet avec gestion d'inventaire.

**FRs covered:** FR10, FR11, FR12, FR20

---

## Story 3.1: Product Model and Basic CRUD

As a **Merchant**,
I want **to create and manage products with basic information**,
So that **I can build my product catalog**.

**Acceptance Criteria:**

**Given** a Merchant is authenticated
**When** they create a new product
**Then** they can specify:
- Title, description, and slug
- Status (draft, active, archived)
- Product type and vendor
**And** products have CUID IDs with `prod_` prefix
**And** products are scoped to the authenticated store
**And** CRUD operations are available via API and Dashboard

---

## Story 3.2: Product Variants Management

As a **Merchant**,
I want **to create product variants with different options**,
So that **customers can choose size, color, or other attributes**.

**Acceptance Criteria:**

**Given** a product exists
**When** the Merchant adds variants
**Then** they can define:
- Variant options (e.g., Size: S, M, L)
- SKU per variant
- Individual pricing per variant (in cents)
- Individual inventory per variant
**And** variants inherit product defaults when not specified
**And** at least one variant is required for purchasable products

---

## Story 3.3: Product Media Upload

As a **Merchant**,
I want **to upload images and media for products**,
So that **customers can see what they're buying**.

**Acceptance Criteria:**

**Given** a product exists
**When** the Merchant uploads media
**Then** they can:
- Upload multiple images per product
- Set a featured/primary image
- Reorder images via drag-and-drop
- Add alt text for accessibility (NFR-A11Y-6)
**And** images are optimized and stored in cloud storage
**And** variants can have their own specific images

---

## Story 3.4: Categories Management

As a **Merchant**,
I want **to organize products into hierarchical categories**,
So that **customers can browse products by type**.

**Acceptance Criteria:**

**Given** a Merchant is authenticated
**When** they manage categories
**Then** they can:
- Create categories with name, slug, and description
- Create nested subcategories (up to 3 levels)
- Assign products to multiple categories
- Reorder categories
**And** categories have unique slugs within the store
**And** deleting a category does not delete products

---

## Story 3.5: Collections Management

As a **Merchant**,
I want **to create curated product collections**,
So that **I can group products for marketing purposes**.

**Acceptance Criteria:**

**Given** a Merchant is authenticated
**When** they create a collection
**Then** they can:
- Define collection name, description, and image
- Add products manually to the collection
- Set collection visibility (visible/hidden)
- Define display order of products
**And** products can belong to multiple collections
**And** collections can be featured on the storefront

---

## Story 3.6: Product Pricing and Tax Rules

As a **Merchant**,
I want **to set product prices with tax configuration**,
So that **prices display correctly with applicable taxes**.

**Acceptance Criteria:**

**Given** a product variant exists
**When** the Merchant sets pricing
**Then** they can configure:
- Base price (stored in cents - ARCH-25)
- Compare-at price for sales display
- Cost price for margin calculation
- Tax inclusion setting (price includes tax or not)
**And** tax rules can be assigned per product
**And** prices support the store's default currency

---

## Story 3.7: Inventory Tracking

As a **Merchant**,
I want **to track inventory levels per variant**,
So that **I know what's in stock**.

**Acceptance Criteria:**

**Given** product variants exist
**When** inventory is configured
**Then** the Merchant can:
- Set quantity per variant
- Enable/disable inventory tracking per variant
- Set low stock threshold for alerts
- View inventory history/adjustments
**And** inventory changes are logged with reason
**And** inventory updates are atomic to prevent race conditions

---

## Story 3.8: Oversell Prevention

As a **System**,
I want **to prevent orders for out-of-stock items**,
So that **customers don't order unavailable products**.

**Acceptance Criteria:**

**Given** a product has inventory tracking enabled
**When** a customer attempts to add to cart or checkout
**Then** the system validates available quantity
**And** out-of-stock items cannot be added to cart
**And** cart quantities exceeding stock are auto-adjusted
**And** concurrent checkout attempts use optimistic locking
**And** Merchant can optionally allow overselling per product
