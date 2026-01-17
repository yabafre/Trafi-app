---
stepsCompleted: [1, 2, 3, 4]
status: complete
completedAt: '2026-01-15'
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
totalEpics: 14
totalStories: 156
shardedFiles: true
revisedAt: '2026-01-15'
revisionNotes: |
  v2.0 (2026-01-15) - PRD v2 & UX v2 Alignment:
  - Epic 8: Added 4 stories for Autopilot ChangeSet lifecycle (8.16-8.19)
  - Epic 8: Added 3 Planes Architecture structure
  - Epic 13: Expanded Story 13.5 into 4-layer Module Sandbox (13.5a-d)
  - Epic 13: Added 3 stories for Marketplace & Security (13.16-13.18)
  - Epic 12: Added Override Kernel SDK factory pattern
  - ALL Epics: Updated UX to Digital Brutalism v2 (#000/#FFF/#CCFF00, radius-zero)
  Final Validation (Step 4): All 104 FRs covered, dependencies validated, ready for implementation.
---

# trafi-app - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for trafi-app, decomposing the requirements from the PRD, UX Design, and Architecture requirements into implementable stories.

**Note:** Detailed epic stories are organized in separate files under `epics/` for better readability and LLM context management.

**Revision v2.0 (2026-01-15):** Updated for PRD v2 (3 Planes Architecture, Autopilot ChangeSet, Override Kernel, Module Sandbox) and UX v2 (Digital Brutalism).

## Epic Index

| Epic | Title | Stories | File |
|------|-------|---------|------|
| 1 | Foundation & Developer Bootstrap | 8 | [epic-01-foundation.md](epics/epic-01-foundation.md) |
| 2 | Admin Authentication & Store Setup | 9 | [epic-02-admin-auth.md](epics/epic-02-admin-auth.md) |
| 3 | Product Catalog & Inventory | 8 | [epic-03-product-catalog.md](epics/epic-03-product-catalog.md) |
| 4 | Shopping Cart & Checkout | 9 | [epic-04-cart-checkout.md](epics/epic-04-cart-checkout.md) |
| 5 | Payment Processing | 8 | [epic-05-payment.md](epics/epic-05-payment.md) |
| 6 | Order Management & Fulfillment | 9 | [epic-06-order-fulfillment.md](epics/epic-06-order-fulfillment.md) |
| 7 | Customer Accounts & Wishlist | 12 | [epic-07-customer-wishlist.md](epics/epic-07-customer-wishlist.md) |
| 8 | Profit Engine - Analytics & Recommendations | **19** | [epic-08-profit-analytics.md](epics/epic-08-profit-analytics.md) |
| 9 | Profit Engine - Cart Recovery | 8 | [epic-09-cart-recovery.md](epics/epic-09-cart-recovery.md) |
| 10 | Privacy & Compliance | 9 | [epic-10-privacy.md](epics/epic-10-privacy.md) |
| 11 | Platform Operations & Jobs | 12 | [epic-11-operations.md](epics/epic-11-operations.md) |
| 12 | SDK & API Experience | 11 | [epic-12-sdk-api.md](epics/epic-12-sdk-api.md) |
| 13 | Module System & Extensibility | **21** | [epic-13-modules.md](epics/epic-13-modules.md) |
| 14 | Cloud & Multi-tenancy | 12 | [epic-14-cloud.md](epics/epic-14-cloud.md) |

---

## Requirements Inventory

### Functional Requirements

**Developer Experience (FR1-FR9)**
- FR1: Developer can scaffold a new Trafi store project via CLI with configurable options
- FR2: Developer can seed demo data for local development and testing
- FR3: Developer can interact with all commerce modules via type-safe SDK
- FR4: Developer can customize storefront using provided templates (Next.js)
- FR5: Developer can extend platform functionality through plugin architecture
- FR6: Developer can access comprehensive API documentation and code examples
- FR7: Developer can upgrade SDK/API versions with clear deprecation warnings
- FR8: Developer can connect their store to Trafi Cloud via CLI commands
- FR9: Developer can generate and manage API keys for store access

**Commerce Core (FR10-FR22)**
- FR10: Merchant can create, edit, and manage product catalog with variants and media
- FR11: Merchant can organize products into categories and collections
- FR12: Merchant can set and manage product pricing with tax rules
- FR13: System can calculate cart totals including taxes and shipping
- FR14: Buyer can add products to persistent cart across sessions
- FR15: Buyer can complete checkout as guest or registered customer
- FR16: Buyer can select shipping method with real-time rate display
- FR17: Buyer can pay via integrated payment methods (Stripe, Apple Pay, etc.)
- FR18: Merchant can view and manage customer orders and order history
- FR19: Merchant can process refunds and manage order status transitions
- FR20: System can track inventory levels and prevent overselling
- FR21: Merchant can configure shipping zones and rates
- FR22: System can calculate applicable taxes based on buyer location

**Profit Engine (FR23-FR34)**
- FR23: System can instrument entire customer journey automatically
- FR24: System can diagnose checkout funnel drop-offs and conversion issues
- FR25: System can generate actionable optimization recommendations
- FR26: Merchant can review and approve/reject Autopilot recommendations
- FR27: System can execute approved optimizations via feature flags
- FR28: System can measure statistical impact with confidence intervals
- FR29: System can automatically rollback optimizations that degrade metrics
- FR30: Merchant can view profit attribution and ROI in dashboard
- FR31: Merchant can configure Profit Guardrails with margin thresholds
- FR32: System can block recommendations that violate margin or stock rules
- FR33: System can send abandoned cart recovery email sequences
- FR34: Buyer can restore abandoned cart via one-click email link

**User & Access Management (FR35-FR40)**
- FR35: Admin can create and manage admin user accounts
- FR36: Admin can assign roles and permissions to users (RBAC)
- FR37: Admin can manage API keys with scoped permissions
- FR38: System can enforce tenant-scoped authorization on all requests
- FR39: Owner can transfer store ownership to another user
- FR40: Owner can access billing and subscription management

**Customer Management (FR41-FR45)**
- FR41: Buyer can create customer account with email and password
- FR42: Buyer can manage saved addresses for faster checkout
- FR43: Buyer can view order history and track shipments
- FR44: Buyer can reset password via email
- FR45: System can identify returning customers across sessions

**Payments & Transactions (FR46-FR50)**
- FR46: Merchant can connect Stripe account for payment processing
- FR47: System can process payments with 3DS authentication when required
- FR48: System can handle payment webhooks for order status updates
- FR49: Merchant can issue full or partial refunds
- FR50: System can log all payment events for audit trail

**Fulfillment & Logistics (FR51-FR56)**
- FR51: Merchant can mark orders as fulfilled and add tracking numbers
- FR52: System can send shipping notification emails with tracking links
- FR53: System can expose fulfillment webhooks for 3PL integration
- FR54: 3PL Partner can receive order payloads for fulfillment
- FR55: 3PL Partner can update tracking information via API
- FR56: Merchant can configure return authorization workflow

**Privacy & Compliance (FR57-FR62)**
- FR57: Privacy Manager can search and view customer data by email
- FR58: Privacy Manager can export customer data in GDPR-compliant formats
- FR59: Privacy Manager can process erasure requests with legal retention handling
- FR60: System can track consent status per data category
- FR61: System can log all data operations with timestamp and actor
- FR62: Merchant can configure cookie consent preferences

**Analytics & Insights (FR63-FR67)**
- FR63: Merchant can view store performance dashboard with key metrics
- FR64: Merchant can view checkout funnel visualization with drop-off points
- FR65: Merchant can view Profit Engine recommendations and their status
- FR66: System can aggregate events for statistical analysis
- FR67: Ops can view per-store event flow health status

**Platform Operations (FR68-FR73)**
- FR68: Ops can monitor system health with real-time dashboards
- FR69: Ops can view error rates and latency metrics per tenant
- FR70: Ops can initiate rollback to previous deployment version
- FR71: Ops can access tenant stores in read-only support mode
- FR72: Ops can generate diagnostic reports for merchant support
- FR73: System can alert on SLO threshold violations

**Cloud & Multi-tenancy (FR74-FR78)**
- FR74: Merchant can sign up for Trafi Cloud managed hosting
- FR75: System can provision isolated database per tenant
- FR76: System can handle tenant-specific backups and restores
- FR77: System can scale resources based on tenant traffic
- FR78: Merchant can migrate store data from Shopify

**Buyer Authentication Extended (FR79-FR81)**
- FR79: Buyer can create account with email/password, login/logout, and reset password
- FR80: Buyer can authenticate via OAuth Google
- FR81: Buyer can authenticate via "Sign in with Apple" (web flow)

**Wishlist & Favorites (FR82-FR84)**
- FR82: Buyer can add/remove products to a persistent wishlist and view it
- FR83: Buyer can edit, sort, and move wishlist items to cart
- FR84: System provides one-click wishlist add and simple move-to-cart UX

**Background Jobs & Queue Management (FR85-FR87)**
- FR85: System can execute asynchronous jobs for emails, webhooks, and long-running tasks via queue
- FR86: System can automatically retry failed jobs with exponential backoff and track failures in dead-letter queue
- FR87: Ops can view queue status (waiting/active/failed) and inspect job payload and errors

**SDK Extended Capabilities (FR88-FR90)**
- FR88: Developer can consume API via SDK with distinct clients (Storefront vs Admin) and scoped API keys
- FR89: Developer can instrument checkout funnel via SDK standardized events to feed Profit Engine
- FR90: SDK provides safe defaults (idempotency keys, client-side retries, error mapping)

**Module System & Extensibility (FR91-FR104)**
- FR91: Developer can install modules via CLI from path, URL, or package registry
- FR92: Developer can enable/disable modules without full system restart
- FR93: Developer can validate module manifest and code safety before activation
- FR94: Developer can update modules with version compatibility checking
- FR95: Developer can rollback/remove modules with data cleanup
- FR96: System can discover and dynamically load modules at runtime
- FR97: System can hot-reload modules on file changes without restart
- FR98: Module can extend backend with services, controllers, and API endpoints
- FR99: Module can extend dashboard with custom views and routes
- FR100: Module can hook into business events (payment.created, order.statusChanged, etc.)
- FR101: Module can extend database schema with isolated migrations
- FR102: System validates module code for security threats (no eval, FS isolation, network ACL)
- FR103: Module can register custom metrics for observability
- FR104: Developer can list installed modules with status and version info

### Non-Functional Requirements

**Performance**
- NFR-PERF-1: Storefront API critical paths p95 < 500ms
- NFR-PERF-2: Checkout end-to-end p95 < 500ms
- NFR-PERF-3: Dashboard API p95 < 1s
- NFR-PERF-4: TTFB < 500ms baseline
- NFR-PERF-5: Core Web Vitals - LCP < 2.5s, CLS < 0.1, INP < 200ms
- NFR-PERF-6: 100 concurrent checkouts per store, 3x traffic spike handling

**Security**
- NFR-SEC-1: AES-256 encryption at rest for all PII
- NFR-SEC-2: TLS 1.3 for all connections
- NFR-SEC-3: Session-based auth (dashboard), API keys (SDK), OAuth 2.0 (buyers)
- NFR-SEC-4: Tenant-scoped RBAC on every request
- NFR-SEC-5: PCI DSS SAQ-A compliance via Stripe tokenization
- NFR-SEC-7: All sensitive operations logged
- NFR-SEC-8: DB-per-tenant, no cross-tenant data access
- NFR-SEC-11: Token-based CSRF protection

**Scalability**
- NFR-SCALE-1: System supports 500+ tenants on DB-per-tenant

**Reliability**
- NFR-REL-1: Critical Path 99.9% availability
- NFR-REL-6: Profit Engine execution gate - only when instrumentation SLO met
- NFR-REL-8: RTO 8 hours, RPO 4 hours

**Accessibility**
- NFR-A11Y-1: Storefront template meets WCAG 2.1 Level AA
- NFR-A11Y-3: All interactive elements accessible via keyboard
- NFR-A11Y-6: All images have descriptive alt text

**Integration**
- NFR-INT-3: 90-day deprecation window for breaking changes
- NFR-INT-5: Webhook at-least-once delivery with exponential backoff
- NFR-INT-6: Webhook HMAC-SHA256 signature
- NFR-INT-8: All webhook handlers idempotent
- NFR-INT-9: Idempotency keys on mutating operations

**Maintainability**
- NFR-MAINT-1: >= 70% unit test coverage
- NFR-MAINT-2: API reference auto-generated from code

**Observability**
- NFR-OBS-1: Per-tenant metrics exported (Prometheus/OTEL)
- NFR-OBS-3: Distributed tracing for request correlation

### Additional Requirements

**Architecture Requirements**
- ARCH-1: Custom Turborepo Monorepo (NestJS + Next.js + Prisma + pnpm)
- ARCH-2: Frontend-Database Isolation
- ARCH-7: Shared packages: @trafi/validators, @trafi/types, @trafi/zod, @trafi/config (Prisma in apps/api only)
- ARCH-8: Local vs Global component pattern (`_components/` for local, `components/` for global)
- ARCH-9: Zod as primary validation library
- ARCH-13: JWT + NestJS Passport for authentication
- ARCH-14: NestJS Guards + Custom Decorators for RBAC
- ARCH-15: Custom Redis-based feature flags
- ARCH-16: Standardized API error format
- ARCH-21: OpenTelemetry as observability foundation
- ARCH-25: Money always in cents, IDs as cuid with prefixes
- ARCH-26: Events naming - domain.entity.action snake_case

---

## Implementation Architecture (MANDATORY)

**All epics MUST follow these architectural patterns from architecture.md.**

### Dashboard Data Flow (CRITICAL)

Every Dashboard feature follows this exact data flow:

```
Dashboard Page (RSC)
  └─► Client Component
       └─► Custom Hook (useProducts, useOrders, etc.)
            └─► Zsa Hooks
                 ├─► useServerActionQuery (reads)
                 ├─► useServerActionMutation (writes)
                 └─► useServerActionInfiniteQuery (pagination)
                      └─► Server Action ('use server')
                           └─► tRPC Client
                                └─► NestJS API (tRPC Router)
```

**Example Implementation:**
```typescript
// 1. Server Action: app/products/_actions/product-actions.ts
'use server'
import { trpc } from '@/lib/trpc';
import type { CreateProductInput } from '@trafi/validators';

export async function getProducts(input: { page: number; limit: number }) {
  return trpc.products.list.query(input);
}

export async function createProduct(input: CreateProductInput) {
  return trpc.products.create.mutate(input);
}

// 2. Custom Hook: app/products/_hooks/useProducts.ts
import { useServerActionQuery, useServerActionMutation } from '@/lib/hooks/server-action-hooks';
import { getProducts, createProduct } from '../_actions/product-actions';

export function useProducts(page: number, limit: number) {
  return useServerActionQuery(getProducts, {
    input: { page, limit },
    queryKey: ['products', page, limit],
  });
}

export function useCreateProduct() {
  return useServerActionMutation(createProduct, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produit créé');
    },
  });
}

// 3. Client Component: app/products/_components/ProductTable.tsx
'use client'
import { useProducts } from '../_hooks/useProducts';

export function ProductTable() {
  const { data, isLoading, isError } = useProducts(1, 20);
  if (isLoading) return <ProductTableSkeleton />;
  // ...
}

// 4. Page: app/products/page.tsx (RSC)
import { ProductTable } from './_components/ProductTable';
export default function ProductsPage() {
  return <ProductTable />;
}
```

### File Structure Convention (CRITICAL)

```
apps/dashboard/src/
├── app/
│   ├── (dashboard)/
│   │   ├── products/
│   │   │   ├── page.tsx              # RSC Page
│   │   │   ├── _components/          # LOCAL components (underscore prefix)
│   │   │   │   ├── ProductTable.tsx
│   │   │   │   └── ProductFilters.tsx
│   │   │   ├── _hooks/               # LOCAL hooks
│   │   │   │   └── useProducts.ts
│   │   │   ├── _actions/             # LOCAL server actions
│   │   │   │   └── product-actions.ts
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       ├── _components/
│   │   │       └── _actions/
│   │   └── orders/
│   │       └── ...same pattern
│   └── layout.tsx
├── components/                       # GLOBAL shared (no underscore)
│   ├── ui/                           # Shadcn primitives
│   └── shared/                       # DataTable, PageHeader
├── lib/
│   ├── trpc.ts                       # tRPC client
│   └── hooks/
│       └── server-action-hooks.ts    # Zsa setup (GLOBAL)
└── stores/
    └── ui-store.ts                   # Zustand (UI state only)
```

**Underscore Rule:** `_` prefix = Local to route. No prefix = Global.

### Type Flow (Zod → tRPC → Dashboard)

```
Zod Schema (@trafi/validators)
    │
    ├──► z.infer<typeof Schema> ──► TypeScript Type (@trafi/types)
    │
    ├──► tRPC Input/Output (apps/api)
    │
    └──► Server Action Input (apps/dashboard)
```

**Example:**
```typescript
// packages/@trafi/validators/src/product/create-product.schema.ts
import { z } from 'zod';

export const CreateProductSchema = z.object({
  name: z.string().min(1).max(255),
  price: z.number().int().positive(),  // cents
  currency: z.enum(['EUR', 'USD', 'GBP']),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;

// apps/api/src/modules/product/product.router.ts
import { CreateProductSchema } from '@trafi/validators';

export const productRouter = router({
  create: protectedProcedure
    .input(CreateProductSchema)
    .mutation(({ input }) => { ... }),
});

// apps/dashboard - import same schema
import { CreateProductSchema, type CreateProductInput } from '@trafi/validators';
```

### State Management

| Type | Tool | Example |
|------|------|---------|
| Server State | React Query (via Zsa) | Products, orders, users, all API data |
| UI State | Zustand | Sidebar open/closed, modals, theme |

**Zustand Usage (minimal):**
```typescript
// stores/ui-store.ts
import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  activeModal: string | null;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  activeModal: null,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));
```

### Backend Service Pattern

```typescript
// apps/api/src/modules/product/product.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  // PUBLIC method
  async create(storeId: string, data: CreateProductInput) {
    await this.validateProduct(data);           // protected
    return this.prisma.product.create({ ... });
  }

  // PROTECTED - can be overridden by @trafi/core consumers
  protected async validateProduct(data: CreateProductInput) {
    if (data.price < 0) throw new BadRequestException('INVALID_PRICE');
  }
}
```

### tRPC Router Pattern

```typescript
// apps/api/src/modules/product/product.router.ts
import { router, publicProcedure, protectedProcedure } from '@/trpc';
import { CreateProductSchema, UpdateProductSchema } from '@trafi/validators';

export const productRouter = router({
  list: publicProcedure
    .input(ListProductsSchema)
    .query(({ input, ctx }) => ctx.productService.list(ctx.storeId, input)),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input, ctx }) => ctx.productService.get(ctx.storeId, input.id)),

  create: protectedProcedure
    .input(CreateProductSchema)
    .mutation(({ input, ctx }) => ctx.productService.create(ctx.storeId, input)),

  update: protectedProcedure
    .input(UpdateProductSchema)
    .mutation(({ input, ctx }) => ctx.productService.update(ctx.storeId, input)),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input, ctx }) => ctx.productService.delete(ctx.storeId, input.id)),
});
```

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Database tables | PascalCase singular | `Product`, `OrderItem` |
| Database columns | camelCase | `createdAt`, `storeId` |
| tRPC procedures | resource.action | `products.list`, `orders.create` |
| Server action files | kebab-case | `product-actions.ts` |
| Hook files | camelCase with use | `useProducts.ts` |
| Component files | PascalCase | `ProductTable.tsx` |
| Directories | kebab-case | `profit-engine/` |
| Public IDs | Prefixed cuid | `prod_clx1abc`, `ord_clx2def` |
| Events | domain.entity.action | `commerce.product.viewed` |

### Money & IDs

| Type | Format | Example |
|------|--------|---------|
| Money | Cents (integer) | `1999` = €19.99 |
| IDs | cuid with prefix | `prod_`, `ord_`, `cust_`, `store_` |
| Dates API | ISO 8601 | `"2026-01-11T12:00:00.000Z"` |

### Error Response Format

```typescript
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;           // "CHECKOUT_FAILED"
    message: string;        // "Payment method declined"
    type: 'validation' | 'auth' | 'payment' | 'server';
    details?: Record<string, unknown>;
    requestId: string;
  };
}
```

### Loading States Pattern

```typescript
const { data, isLoading, isRefetching, isError, error } = useServerActionQuery(...);

// Always use skeleton over spinner
{isLoading ? <ProductTableSkeleton /> : <ProductTable data={data} />}
```

---

**Epic 1 Retrospective Learnings (MANDATORY for all future epics)**
- RETRO-1: Always use Context7 MCP before implementing libraries
- RETRO-2: Backend services use `protected` methods (not `private`) for extensibility
- RETRO-3: Backend modules export explicit public API
- RETRO-4: Dashboard components designed with customization props
- RETRO-5: Dashboard pages use composition pattern for wrappable components
- RETRO-6: Code with @trafi/core override patterns in mind (future NPM package)

---

**UX Design Requirements - Dashboard (Digital Brutalism v2)**

_Revision v2.0: Complete overhaul to Digital Brutalism aesthetic_

**Brutalist Manifesto:**
- The interface is a machine. No decoration, only data and action.
- Radius-zero everywhere — everything is a rectangle.
- Visible grid — 1px borders expose structure.
- High contrast — pure black background, pure white text.
- Acid accents — signals for action, stability, risk.

**Layout:**
- UX-1: Pure Black (#000000) background — the interface is a machine
- UX-2: Rail (64px) + Sidebar (240px) + Main content layout
- UX-3: Topbar with breadcrumb navigation + action buttons
- UX-4: Status badges: ACTIVE (#00FF94), PENDING (#CCFF00), ERROR (#FF3366)
- UX-5: Visible grid structure with 1px borders (#333333)
- UX-6: Instant hover states (border inversion, no slow transitions)
- UX-7: Profit Engine "AUTOPILOT PROPOSES → MERCHANT APPROVES" workflow
- UX-8: Guest checkout as default, shipping visible from cart
- UX-9: Express checkout (Apple Pay/Google Pay) above fold
- UX-10: Cart recovery email sequence (37min, 24h, 48h delays)

**UX Design Requirements - Visual System (Brutalist v2)**
- UX-COLOR-1: Primary accent: Acid Lime #CCFF00
- UX-COLOR-2: Background: Pure Black #000000, borders: #333333
- UX-COLOR-3: Foreground: Pure White #FFFFFF
- UX-COLOR-4: Success: #00FF94, Warning: #CCFF00, Risk: #FF3366
- UX-TYPE-1: JetBrains Mono for ALL numbers, metrics, data, code
- UX-TYPE-2: System font (Inter/SF Pro) for labels, descriptions
- UX-RADIUS: 0px EVERYWHERE — `border-radius: 0px !important`
- UX-SHADOW: None — elements sit firmly in the grid, no floating

**UX Design Requirements - Animation (Minimal Brutalist)**
- UX-ANIM-1: Micro-interactions: instant (no slow transitions)
- UX-ANIM-2: Hover: instant inversion
- UX-ANIM-3: Metric counters: 200ms max
- UX-ANIM-4: Success feedback: border flash 500ms
- UX-ANIM-5: All animations respect `prefers-reduced-motion`
- UX-ANIM-6: Use `transform` and `opacity` only (no layout-triggering)

**UX Design Requirements - Storefront (Brutalist v2)**
- UX-STORE-1: Pure Black background with visible grid structure
- UX-STORE-2: Product grid with 1px borders
- UX-STORE-3: Product cards: instant hover state (no lift, border change)
- UX-STORE-4: Cart slide-over with solid black background
- UX-STORE-5: Mobile-first responsive (touch targets 48x48px minimum)
- UX-STORE-6: All text high contrast white on black

---

## Epic Summaries

### Epic 1: Foundation & Developer Bootstrap
Thomas peut creer un projet Trafi fonctionnel en 5 minutes avec CLI, monorepo configure, et seed data.
**FRs covered:** FR1, FR2, FR8 + ARCH-1 to ARCH-26
**[View Details](epics/epic-01-foundation.md)**

### Epic 2: Admin Authentication & Store Setup
Admin peut se connecter au dashboard, configurer le store, et gerer les acces utilisateurs avec RBAC.
**FRs covered:** FR35, FR36, FR37, FR38, FR39, FR40
**[View Details](epics/epic-02-admin-auth.md)**

### Epic 3: Product Catalog & Inventory
Merchant peut creer, editer, et organiser son catalogue produits complet avec gestion d'inventaire.
**FRs covered:** FR10, FR11, FR12, FR20
**[View Details](epics/epic-03-product-catalog.md)**

### Epic 4: Shopping Cart & Checkout
Buyer peut ajouter au panier, voir les frais de livraison en temps reel, et finaliser son achat en guest checkout.
**FRs covered:** FR13, FR14, FR15, FR16, FR17, FR21, FR22
**[View Details](epics/epic-04-cart-checkout.md)**

### Epic 5: Payment Processing
Systeme gere les paiements Stripe complets avec 3DS, webhooks, remboursements, et audit trail.
**FRs covered:** FR46, FR47, FR48, FR49, FR50
**[View Details](epics/epic-05-payment.md)**

### Epic 6: Order Management & Fulfillment
Merchant peut traiter, expedier, et suivre les commandes avec integration 3PL et gestion des retours.
**FRs covered:** FR18, FR19, FR51, FR52, FR53, FR54, FR55, FR56
**[View Details](epics/epic-06-order-fulfillment.md)**

### Epic 7: Customer Accounts & Wishlist
Buyer peut creer un compte (email, Google, Apple), gerer ses adresses, wishlist, et voir son historique.
**FRs covered:** FR41, FR42, FR43, FR44, FR45, FR79, FR80, FR81, FR82, FR83, FR84
**[View Details](epics/epic-07-customer-wishlist.md)**

### Epic 8: Profit Engine - Analytics & Recommendations
Merchant voit les metriques de conversion et recoit des recommandations d'optimisation avec rollback automatique.
**FRs covered:** FR23, FR24, FR25, FR26, FR27, FR28, FR29, FR30, FR31, FR32, FR63, FR64, FR65, FR66
**[View Details](epics/epic-08-profit-analytics.md)**

### Epic 9: Profit Engine - Cart Recovery
Systeme envoie des emails de recuperation de panier abandonne avec restauration one-click.
**FRs covered:** FR33, FR34
**[View Details](epics/epic-09-cart-recovery.md)**

### Epic 10: Privacy & Compliance
DPO peut gerer les demandes GDPR (recherche, export, suppression) avec audit trail complet et consent tracking.
**FRs covered:** FR57, FR58, FR59, FR60, FR61, FR62
**[View Details](epics/epic-10-privacy.md)**

### Epic 11: Platform Operations & Jobs
Ops peuvent monitorer la sante systeme, gerer les jobs asynchrones BullMQ, et diagnostiquer les problemes.
**FRs covered:** FR67, FR68, FR69, FR70, FR71, FR72, FR73, FR85, FR86, FR87
**[View Details](epics/epic-11-operations.md)**

### Epic 12: SDK & API Experience
Developer dispose d'un SDK type-safe complet avec documentation, templates, et excellent DX.
**FRs covered:** FR3, FR4, FR6, FR7, FR9, FR88, FR89, FR90
**[View Details](epics/epic-12-sdk-api.md)**

### Epic 13: Module System & Extensibility
Developer peut creer, installer, et gerer des modules custom avec hot-reload et sandboxing.
**FRs covered:** FR5, FR91, FR92, FR93, FR94, FR95, FR96, FR97, FR98, FR99, FR100, FR101, FR102, FR103, FR104
**[View Details](epics/epic-13-modules.md)**

### Epic 14: Cloud & Multi-tenancy
Merchant peut utiliser Trafi Cloud sans gerer l'infrastructure, avec migration Shopify automatisee.
**FRs covered:** FR74, FR75, FR76, FR77, FR78
**[View Details](epics/epic-14-cloud.md)**

---

## FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 1 | CLI scaffold new project |
| FR2 | Epic 1 | Seed demo data |
| FR3 | Epic 12 | Type-safe SDK |
| FR4 | Epic 12 | Storefront templates |
| FR5 | Epic 13 | Plugin architecture |
| FR6 | Epic 12 | API documentation |
| FR7 | Epic 12 | SDK version upgrades |
| FR8 | Epic 1 | CLI cloud connect |
| FR9 | Epic 12 | API key management |
| FR10 | Epic 3 | Product catalog management |
| FR11 | Epic 3 | Categories and collections |
| FR12 | Epic 3 | Pricing and tax rules |
| FR13 | Epic 4 | Cart total calculation |
| FR14 | Epic 4 | Persistent cart |
| FR15 | Epic 4 | Guest/registered checkout |
| FR16 | Epic 4 | Shipping method selection |
| FR17 | Epic 4 | Payment methods |
| FR18 | Epic 6 | Order management |
| FR19 | Epic 6 | Refunds and status transitions |
| FR20 | Epic 3 | Inventory tracking |
| FR21 | Epic 4 | Shipping zones configuration |
| FR22 | Epic 4 | Tax calculation |
| FR23 | Epic 8 | Journey instrumentation |
| FR24 | Epic 8 | Funnel diagnostics |
| FR25 | Epic 8 | Optimization recommendations |
| FR26 | Epic 8 | Recommendation approval |
| FR27 | Epic 8 | Feature flag execution |
| FR28 | Epic 8 | Statistical measurement |
| FR29 | Epic 8 | Automatic rollback |
| FR30 | Epic 8 | Profit attribution |
| FR31 | Epic 8 | Guardrails configuration |
| FR32 | Epic 8 | Margin/stock rule blocking |
| FR33 | Epic 9 | Cart recovery emails |
| FR34 | Epic 9 | One-click cart restore |
| FR35 | Epic 2 | Admin user management |
| FR36 | Epic 2 | RBAC assignment |
| FR37 | Epic 2 | API key management |
| FR38 | Epic 2 | Tenant-scoped authorization |
| FR39 | Epic 2 | Ownership transfer |
| FR40 | Epic 2 | Billing management |
| FR41 | Epic 7 | Customer account creation |
| FR42 | Epic 7 | Address management |
| FR43 | Epic 7 | Order history viewing |
| FR44 | Epic 7 | Password reset |
| FR45 | Epic 7 | Returning customer identification |
| FR46 | Epic 5 | Stripe connection |
| FR47 | Epic 5 | 3DS payment processing |
| FR48 | Epic 5 | Payment webhooks |
| FR49 | Epic 5 | Refund processing |
| FR50 | Epic 5 | Payment audit trail |
| FR51 | Epic 6 | Order fulfillment |
| FR52 | Epic 6 | Shipping notifications |
| FR53 | Epic 6 | Fulfillment webhooks |
| FR54 | Epic 6 | 3PL order payloads |
| FR55 | Epic 6 | 3PL tracking updates |
| FR56 | Epic 6 | Return authorization |
| FR57 | Epic 10 | Customer data search |
| FR58 | Epic 10 | GDPR data export |
| FR59 | Epic 10 | Erasure requests |
| FR60 | Epic 10 | Consent tracking |
| FR61 | Epic 10 | Data operation logging |
| FR62 | Epic 10 | Cookie consent |
| FR63 | Epic 8 | Performance dashboard |
| FR64 | Epic 8 | Funnel visualization |
| FR65 | Epic 8 | Recommendation status view |
| FR66 | Epic 8 | Event aggregation |
| FR67 | Epic 11 | Event flow health |
| FR68 | Epic 11 | System health monitoring |
| FR69 | Epic 11 | Error/latency metrics |
| FR70 | Epic 11 | Deployment rollback |
| FR71 | Epic 11 | Support mode access |
| FR72 | Epic 11 | Diagnostic reports |
| FR73 | Epic 11 | SLO alerting |
| FR74 | Epic 14 | Cloud signup |
| FR75 | Epic 14 | Database provisioning |
| FR76 | Epic 14 | Backup/restore |
| FR77 | Epic 14 | Resource scaling |
| FR78 | Epic 14 | Shopify migration |
| FR79 | Epic 7 | Email/password auth |
| FR80 | Epic 7 | OAuth Google |
| FR81 | Epic 7 | Sign in with Apple |
| FR82 | Epic 7 | Wishlist add/remove |
| FR83 | Epic 7 | Wishlist management |
| FR84 | Epic 7 | Wishlist UX |
| FR85 | Epic 11 | Async job execution |
| FR86 | Epic 11 | Job retry/DLQ |
| FR87 | Epic 11 | Queue status visibility |
| FR88 | Epic 12 | SDK client types |
| FR89 | Epic 12 | SDK event instrumentation |
| FR90 | Epic 12 | SDK safe defaults |
| FR91 | Epic 13 | Module CLI install |
| FR92 | Epic 13 | Module enable/disable |
| FR93 | Epic 13 | Module validation |
| FR94 | Epic 13 | Module updates |
| FR95 | Epic 13 | Module rollback |
| FR96 | Epic 13 | Module discovery |
| FR97 | Epic 13 | Module hot-reload |
| FR98 | Epic 13 | Backend extension |
| FR99 | Epic 13 | Dashboard extension |
| FR100 | Epic 13 | Event hooks |
| FR101 | Epic 13 | Schema extension |
| FR102 | Epic 13 | Security validation |
| FR103 | Epic 13 | Custom metrics |
| FR104 | Epic 13 | Module listing |
