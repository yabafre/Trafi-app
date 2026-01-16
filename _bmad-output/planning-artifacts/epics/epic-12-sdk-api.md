# Epic 12: SDK & API Experience

Developer dispose d'un SDK type-safe complet avec documentation, templates, et excellent DX. Le SDK implémente le **Override Kernel factory pattern** pour l'extensibilité.

**FRs covered:** FR3, FR4, FR6, FR7, FR9, FR88, FR89, FR90

**Revision:** v2.0 (2026-01-15) - PRD v2 Alignment: Override Kernel SDK Factory Pattern, Brutalist UX

---

## Epic Implementation Guidelines

### Override Kernel: SDK Factory Pattern (PRD v2)

The SDK implements the Override Kernel pattern for customization:

```typescript
// Default usage
const trafi = createTrafiClient({
  apiKey: 'pk_...',
  storeId: 'store_...',
});

// Override-ready factory pattern
const trafi = createTrafiClient({
  apiKey: 'pk_...',
  storeId: 'store_...',

  // Override Kernel: Interceptors
  interceptors: {
    request: async (config) => {
      config.headers['X-Custom-Header'] = 'value';
      return config;
    },
    response: async (response) => {
      // Custom response processing
      return response;
    },
  },

  // Override Kernel: Event Hooks
  hooks: {
    onCartUpdate: async (cart) => {
      // Custom cart processing
      await syncWithExternalCRM(cart);
    },
    onCheckoutComplete: async (order) => {
      // Custom order processing
      await notifyFulfillment(order);
    },
  },

  // Override Kernel: Custom Services
  services: {
    pricing: CustomPricingService, // Extends core
  },
});
```

### Retrospective Learnings (MANDATORY)
- **RETRO-1:** Use Context7 MCP before implementing SDK build tools, documentation
- **RETRO-2:** SDK classes expose `protected` methods for extension
- **RETRO-3:** @trafi/sdk exports explicit public API with clear boundaries
- **RETRO-4:** SDK follows @trafi/core vision (extensible, overridable)
- **RETRO-5:** Build @trafi/config with proper build step (deferred from Epic 1)
- **RETRO-6:** SDK is the foundation for future @trafi/core NPM package
- **RETRO-7:** SDK factory pattern implements Override Kernel for customization

### UX Design Requirements (Documentation Site - Brutalist)
- **UX-1:** Pure Black (#000000) background with white text
- **UX-2:** Visible grid navigation with 1px borders
- **UX-3:** Copy-to-clipboard on code examples (monospace JetBrains Mono)
- **UX-4:** Interactive API playground (OpenAPI)
- **UX-TYPE:** JetBrains Mono for code, system font for body
- **UX-RADIUS:** 0px everywhere

### UX Design Requirements (Dashboard - API Keys - Brutalist)
- **UX-1:** Pure Black (#000000) background
- **UX-2:** Rail (64px) + Sidebar (240px) + Main content layout
- **UX-3:** Breadcrumb: Dashboard > Settings > API Keys
- **UX-4:** Key visibility toggle (show/hide) with instant state change
- **UX-5:** Scope checkboxes with descriptions in monospace
- **UX-6:** API key in monospace font, truncated with copy button
- **UX-COLOR-1:** Primary Acid Lime #CCFF00, borders #333333
- **UX-RADIUS:** 0px everywhere

---

## Story 12.1: SDK Package Structure

As a **Developer (Thomas)**,
I want **a well-organized SDK package**,
So that **I can easily import what I need**.

**Acceptance Criteria:**

**Given** the SDK is published
**When** a developer installs it
**Then** the package structure includes:
- `@trafi/sdk` - main entry point
- `@trafi/sdk/storefront` - storefront client
- `@trafi/sdk/admin` - admin client
- `@trafi/sdk/types` - TypeScript types
**And** tree-shaking is supported (ESM)
**And** package size is optimized (< 50KB gzipped)
**And** TypeScript definitions are bundled

---

## Story 12.2: Storefront SDK Client

As a **Developer (Thomas)**,
I want **a type-safe client for storefront operations**,
So that **I can build custom storefronts confidently**.

**Acceptance Criteria:**

**Given** a developer uses the Storefront client
**When** they make API calls
**Then** the client provides:
- Products: list, get, search
- Cart: create, get, add, update, remove
- Checkout: create, update, complete
- Customer: register, login, profile
**And** all methods are fully typed
**And** responses include proper error types
**And** client uses public API key (no secrets)

---

## Story 12.3: Admin SDK Client

As a **Developer (Thomas)**,
I want **a type-safe client for admin operations**,
So that **I can build custom admin tools**.

**Acceptance Criteria:**

**Given** a developer uses the Admin client
**When** they make API calls
**Then** the client provides:
- Full CRUD for all entities
- Order management operations
- Analytics data access
- Store configuration
**And** client requires secret API key
**And** all methods are fully typed
**And** admin operations are scoped to API key permissions

---

## Story 12.4: SDK Safe Defaults

As a **Developer (Thomas)**,
I want **the SDK to handle common issues automatically**,
So that **my integration is robust by default**.

**Acceptance Criteria:**

**Given** the SDK is configured
**When** making API calls
**Then** safe defaults include:
- Automatic idempotency keys on mutations
- Client-side retry with exponential backoff (3 attempts)
- Timeout handling (30s default)
- Error mapping to typed exceptions
**And** defaults are overridable per-request
**And** retry logic respects 429 (rate limit) headers

---

## Story 12.5: SDK Error Handling

As a **Developer (Thomas)**,
I want **clear, typed errors from the SDK**,
So that **I can handle failures appropriately**.

**Acceptance Criteria:**

**Given** an API call fails
**When** the error is thrown
**Then** it includes:
- Error class (ValidationError, NotFoundError, etc.)
- Error code (machine-readable)
- Message (human-readable)
- Details (field-level errors if applicable)
- Request ID (for support)
**And** error types are exported for catching
**And** network errors are wrapped consistently

---

## Story 12.6: Event Instrumentation SDK

As a **Developer (Thomas)**,
I want **to easily instrument checkout funnel events**,
So that **Profit Engine receives accurate data**.

**Acceptance Criteria:**

**Given** the SDK is integrated
**When** the developer adds instrumentation
**Then** they can track:
- `trafi.track('page_view', { path, referrer })`
- `trafi.track('product_view', { productId })`
- `trafi.track('add_to_cart', { productId, quantity })`
- `trafi.track('checkout_start', { cartId })`
- `trafi.track('checkout_complete', { orderId })`
**And** events are batched and sent asynchronously
**And** session ID is automatically managed
**And** events follow schema from Epic 8

---

## Story 12.7: Next.js Storefront Template

As a **Developer (Thomas)**,
I want **a production-ready storefront template**,
So that **I can start customizing immediately**.

**Acceptance Criteria:**

**Given** a developer scaffolds a storefront
**When** the template is generated
**Then** it includes:
- Next.js 14 with App Router
- Tailwind CSS configured
- SDK pre-integrated
- Sample pages (home, product, cart, checkout)
- Event instrumentation wired up
- Mobile-first responsive design
**And** template demonstrates best practices
**And** customization points are clearly marked

---

## Story 12.8: API Documentation Generation

As a **Developer (Thomas)**,
I want **comprehensive API documentation**,
So that **I can understand all available endpoints**.

**Acceptance Criteria:**

**Given** the API is developed
**When** documentation is generated
**Then** it includes:
- OpenAPI/Swagger specification
- Endpoint reference with parameters
- Request/response examples
- Authentication guide
- Rate limiting documentation
**And** docs are auto-generated from code (NFR-MAINT-2)
**And** interactive API explorer is available
**And** docs are versioned per API version

---

## Story 12.9: SDK Code Examples

As a **Developer (Thomas)**,
I want **working code examples for common tasks**,
So that **I can learn quickly by example**.

**Acceptance Criteria:**

**Given** documentation exists
**When** a developer looks for examples
**Then** they find:
- Quick start guide (5-minute setup)
- Common recipes (cart flow, checkout, etc.)
- Framework-specific examples (Next.js, Remix)
- Error handling patterns
- Testing examples
**And** examples are tested and up-to-date
**And** examples can be copied and run

---

## Story 12.10: SDK Version Management

As a **Developer (Thomas)**,
I want **clear versioning and deprecation warnings**,
So that **I can upgrade safely**.

**Acceptance Criteria:**

**Given** the SDK follows SemVer
**When** breaking changes are introduced
**Then** the system provides:
- Major version bump for breaking changes
- Console warnings for deprecated methods
- Migration guide in changelog
- 90-day deprecation window (NFR-INT-3)
**And** API version is explicit in requests
**And** old SDK versions continue to work until sunset

---

## Story 12.11: API Key Scopes Documentation

As a **Developer (Thomas)**,
I want **to understand API key permission scopes**,
So that **I can create keys with minimal permissions**.

**Acceptance Criteria:**

**Given** API keys support scopes
**When** a developer configures keys
**Then** documentation explains:
- Available scopes (storefront, admin, orders, etc.)
- What each scope permits
- Best practices for scope selection
- How to rotate keys safely
**And** dashboard shows scope requirements per endpoint
**And** least-privilege is encouraged
