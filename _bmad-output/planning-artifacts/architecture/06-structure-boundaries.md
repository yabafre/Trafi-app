## Project Structure & Boundaries

### Requirements to Module Mapping

#### Commerce Cores (MVP)

| Module | FRs | API Location | Dashboard Location |
|--------|-----|--------------|-------------------|
| **Product** | FR10-FR12 | `modules/product/` | `app/(dashboard)/products/` |
| **Customer** | FR41-FR45 | `modules/customer/` | `app/(dashboard)/customers/` |
| **Cart** | FR13-FR15 | `modules/cart/` | - (storefront only) |
| **Checkout** | FR16-FR18 | `modules/checkout/` | `app/(dashboard)/orders/` |
| **Payment** | FR19-FR20 | `modules/payment/` | `app/(dashboard)/settings/payments/` |
| **Order** | FR21-FR22 | `modules/order/` | `app/(dashboard)/orders/` |
| **Inventory** | FR46-FR50 | `modules/inventory/` | `app/(dashboard)/inventory/` |
| **Tax** | FR63-FR67 | `modules/tax/` | `app/(dashboard)/settings/tax/` |
| **Fulfillment** | FR51-FR56 | `modules/fulfillment/` | `app/(dashboard)/fulfillment/` |

#### Profit Engine (MVP)

| Component | FRs | API Location |
|-----------|-----|--------------|
| **Event Collector** | FR23-FR25 | `modules/profit-engine/collector/` |
| **Checkout Doctor** | FR26-FR28 | `modules/profit-engine/doctor/` |
| **Recovery Engine** | FR29-FR31 | `modules/profit-engine/recovery/` |
| **Guardrails** | FR32-FR34 | `modules/profit-engine/guardrails/` |

#### Platform & System (MVP)

| Component | FRs | API Location |
|-----------|-----|--------------|
| **User Access** | FR35-FR40 | `modules/auth/` |
| **Tenant Management** | FR68-FR72 | `modules/tenant/` |
| **Jobs Module** | FR79-FR85 | `modules/jobs/` |
| **Webhooks** | FR86-FR90 | `modules/webhooks/` |
| **Plugins** | FR91-FR104 | `modules/plugins/` |

#### P1 Extensions (Post-MVP)

| Module | Purpose | Trigger |
|--------|---------|---------|
| **Organization** | Multi-store management | P1 launch |
| **Store** | Store within organization | P1 launch |
| **Channel** | Multi-channel (Web, Mobile, POS) | P1 launch |
| **i18n** | Translation module (JSONB) | P1 launch |

### Complete Project Structure

```
trafi/
├── apps/
│   ├── api/                                    # NestJS Backend
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── product/                    # FR10-FR12
│   │   │   │   │   ├── product.module.ts
│   │   │   │   │   ├── product.service.ts
│   │   │   │   │   ├── product.controller.ts   # REST
│   │   │   │   │   ├── product.router.ts       # tRPC
│   │   │   │   │   └── __tests__/
│   │   │   │   ├── customer/                   # FR41-FR45
│   │   │   │   ├── cart/                       # FR13-FR15
│   │   │   │   ├── checkout/                   # FR16-FR18
│   │   │   │   ├── payment/                    # FR19-FR20
│   │   │   │   │   └── providers/
│   │   │   │   │       └── stripe/
│   │   │   │   ├── order/                      # FR21-FR22
│   │   │   │   ├── inventory/                  # FR46-FR50
│   │   │   │   ├── fulfillment/                # FR51-FR56
│   │   │   │   ├── tax/                        # FR63-FR67
│   │   │   │   ├── auth/                       # FR35-FR40
│   │   │   │   ├── tenant/                     # FR68-FR72
│   │   │   │   ├── profit-engine/              # FR23-FR34
│   │   │   │   │   ├── collector/
│   │   │   │   │   ├── doctor/
│   │   │   │   │   ├── recovery/
│   │   │   │   │   └── guardrails/
│   │   │   │   ├── jobs/                       # FR79-FR85
│   │   │   │   │   ├── queues/
│   │   │   │   │   ├── processors/
│   │   │   │   │   └── dashboard/
│   │   │   │   ├── webhooks/                   # FR86-FR90
│   │   │   │   ├── plugins/                    # FR91-FR104
│   │   │   │   │   ├── loader/
│   │   │   │   │   ├── registry/
│   │   │   │   │   └── sandbox/
│   │   │   │   ├── notification/
│   │   │   │   │   └── providers/
│   │   │   │   │       └── resend/
│   │   │   │   │
│   │   │   │   │   # P1 MODULES
│   │   │   │   ├── organization/               # P1: Multi-Store
│   │   │   │   │   ├── organization.module.ts
│   │   │   │   │   ├── organization.service.ts
│   │   │   │   │   └── billing/
│   │   │   │   ├── store/                      # P1: Store Management
│   │   │   │   │   ├── store.module.ts
│   │   │   │   │   └── store.service.ts
│   │   │   │   ├── channel/                    # P1: Multi-Channel
│   │   │   │   │   ├── channel.module.ts
│   │   │   │   │   └── channel.service.ts
│   │   │   │   ├── i18n/                       # P1: Translations
│   │   │   │   │   ├── i18n.module.ts
│   │   │   │   │   ├── translation.service.ts
│   │   │   │   │   └── locale.service.ts
│   │   │   │   │
│   │   │   │   └── _future/                    # P2: Not Implemented
│   │   │   │       ├── vendor/                 # Marketplace
│   │   │   │       ├── b2b/                    # B2B Features
│   │   │   │       └── integration/            # ERP
│   │   │   │
│   │   │   ├── common/
│   │   │   │   ├── guards/
│   │   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   │   ├── roles.guard.ts
│   │   │   │   │   ├── permissions.guard.ts
│   │   │   │   │   └── tenant.guard.ts
│   │   │   │   ├── decorators/
│   │   │   │   ├── filters/
│   │   │   │   ├── interceptors/
│   │   │   │   ├── pipes/
│   │   │   │   ├── redis/
│   │   │   │   └── observability/
│   │   │   ├── trpc/
│   │   │   │   ├── trpc.module.ts
│   │   │   │   ├── trpc.router.ts
│   │   │   │   └── context.ts
│   │   │   ├── rest/
│   │   │   │   └── v1/
│   │   │   └── main.ts
│   │   └── test/
│   │
│   └── dashboard/                              # Next.js Dashboard
│       └── src/
│           ├── app/
│           │   ├── (auth)/
│           │   │   ├── login/
│           │   │   │   └── page.tsx
│           │   │   └── layout.tsx
│           │   ├── (dashboard)/
│           │   │   ├── products/
│           │   │   │   ├── page.tsx
│           │   │   │   ├── _components/
│           │   │   │   ├── _hooks/
│           │   │   │   ├── _actions/
│           │   │   │   ├── [id]/
│           │   │   │   └── new/
│           │   │   ├── customers/
│           │   │   ├── orders/
│           │   │   ├── inventory/
│           │   │   ├── fulfillment/
│           │   │   ├── profit-engine/
│           │   │   │   ├── doctor/
│           │   │   │   ├── recovery/
│           │   │   │   └── analytics/
│           │   │   ├── jobs/
│           │   │   ├── webhooks/
│           │   │   ├── plugins/
│           │   │   │
│           │   │   │   # P1 ROUTES
│           │   │   ├── organization/           # P1
│           │   │   │   ├── page.tsx
│           │   │   │   ├── _components/
│           │   │   │   ├── _actions/
│           │   │   │   ├── stores/
│           │   │   │   ├── billing/
│           │   │   │   └── team/
│           │   │   ├── channels/               # P1
│           │   │   │   ├── page.tsx
│           │   │   │   └── [channelId]/
│           │   │   │
│           │   │   ├── settings/
│           │   │   │   ├── payments/
│           │   │   │   ├── tax/
│           │   │   │   ├── team/
│           │   │   │   ├── api-keys/
│           │   │   │   └── locales/            # P1
│           │   │   └── layout.tsx
│           │   └── layout.tsx
│           │
│           ├── components/
│           │   ├── ui/
│           │   └── shared/
│           ├── lib/
│           │   ├── trpc.ts
│           │   └── hooks/
│           ├── actions/
│           └── stores/
│
└── packages/
    ├── @trafi/validators/
    │   └── src/
    │       ├── product/
    │       ├── order/
    │       ├── customer/
    │       ├── i18n/                           # P1
    │       │   ├── translation.schema.ts
    │       │   └── locale.schema.ts
    │       ├── organization/                   # P1
    │       │   └── organization.schema.ts
    │       ├── common/
    │       └── index.ts
    │
    ├── @trafi/types/
    │   └── src/
    │       ├── product.types.ts
    │       ├── order.types.ts
    │       ├── api.types.ts
    │       ├── events.types.ts
    │       ├── i18n.types.ts                   # P1
    │       ├── organization.types.ts           # P1
    │       └── index.ts
    │
    ├── apps/api/
    │   ├── prisma/
    │   │   └── schema.prisma
    │   └── src/
    │
    ├── @trafi/config/
    │
    ├── @trafi/sdk/                             # External SDK
    │   └── src/
    │       ├── client.ts
    │       └── resources/
    │
    └── @trafi/plugin-sdk/                      # Plugin Developer SDK
        └── src/
```

### Architectural Boundaries

#### API Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL BOUNDARY                         │
│  REST API (/api/v1/*) + SDK                                 │
│  - Public endpoints (storefront, SDK consumers)             │
│  - Rate limited per tenant                                  │
│  - API key authentication                                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    INTERNAL BOUNDARY                         │
│  tRPC Router                                                │
│  - Dashboard-only endpoints                                 │
│  - JWT session authentication                               │
│  - Full RBAC enforcement                                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    SERVICE BOUNDARY                          │
│  NestJS Services                                            │
│  - Business logic encapsulation                             │
│  - Cross-module communication via DI                        │
│  - Event emission for async processing                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    DATA BOUNDARY                             │
│  Prisma + PostgreSQL                                        │
│  - Tenant-scoped queries (always include storeId)          │
│  - Connection per-tenant database                           │
│  - No direct DB access from outside API                     │
└─────────────────────────────────────────────────────────────┘
```

#### Multi-Store Hierarchy (P1)

```
Organization (Account Level)
├── Billing (Stripe Customer)
├── Team Members (Org-wide roles)
│
├── Store: France B2C (tenant_fr)
│   ├── Database: postgres://tenant_fr
│   ├── Locales: [fr, en]
│   ├── Currency: EUR
│   ├── Channel: Web (default)
│   └── Channel: Mobile App
│
├── Store: Germany B2C (tenant_de)
│   ├── Database: postgres://tenant_de
│   ├── Locales: [de, en]
│   ├── Currency: EUR
│   └── Channel: Web
│
└── Store: B2B Wholesale (tenant_b2b)
    ├── Database: postgres://tenant_b2b
    ├── Locales: [fr, en]
    ├── Currency: EUR
    └── Channel: B2B Portal
```

### i18n Implementation (P1)

#### JSONB Translation Pattern

```typescript
// All translatable entities use JSONB column
// Pattern: translations: { locale: { field: value } }

// Product example
{
  "id": "prod_123",
  "sku": "TSHIRT-001",
  "translations": {
    "fr": {
      "name": "T-Shirt Premium",
      "description": "Un t-shirt de qualité supérieure",
      "shortDescription": "T-shirt premium"
    },
    "en": {
      "name": "Premium T-Shirt",
      "description": "A high-quality t-shirt",
      "shortDescription": "Premium t-shirt"
    },
    "de": {
      "name": "Premium T-Shirt",
      "description": "Ein hochwertiges T-Shirt"
    }
  }
}

// Fallback chain: requested → language base → default → first available
// Example: de-AT → de → en → fr
```

#### Translation Helper

```typescript
// @trafi/types/src/i18n.types.ts
export interface TranslationHelpers {
  /**
   * Get translation with fallback chain
   * @param translations - JSONB translations object
   * @param locale - Requested locale (e.g., "de-AT")
   * @param fallbackChain - Fallback locales (default: ["en"])
   */
  getTranslation<T>(
    translations: Record<string, T>,
    locale: string,
    fallbackChain?: string[]
  ): T | null;

  /**
   * Get all available locales for an entity
   */
  getAvailableLocales(translations: Record<string, unknown>): string[];

  /**
   * Check if translation exists for locale
   */
  hasTranslation(translations: Record<string, unknown>, locale: string): boolean;
}
```

### P2 Future Modules (Documented, Not Implemented)

```markdown
# Future Modules Reference

