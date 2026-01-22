## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Data validation strategy (Zod)
- Authentication method (JWT + NestJS Passport)
- API error format standardization
- Dashboard data flow (Zsa + tRPC)

**Important Decisions (Shape Architecture):**
- Caching strategy (Redis direct)
- RBAC implementation (Guards + Decorators)
- Rate limiting approach
- Observability platform

**Deferred Decisions (Post-MVP):**
- Prisma Accelerate for edge caching (P1)
- TimescaleDB for analytics (P1 if volume high)
- Flagsmith UI for feature flags (P1)
- S3 for large Builder pages (P1 if >1MB JSON)

### Data Architecture

#### Validation Strategy: Zod

**Decision:** Use Zod as the primary validation library across the stack.

**Rationale:**
- Native tRPC integration with automatic type inference
- Schema-first approach generates TypeScript types
- Composable schemas for complex validation rules
- Consistent validation between API and SDK

**Implementation:**
```typescript
// packages/@trafi/validators/src/product.ts
import { z } from 'zod';

export const ProductSchema = z.object({
  name: z.string().min(1).max(255),
  price: z.number().positive(),
  currency: z.enum(['EUR', 'USD', 'GBP']),
  inventory: z.number().int().nonnegative(),
});

export type Product = z.infer<typeof ProductSchema>;
```

#### Caching Strategy: Redis Direct

**Decision:** Use Redis directly for application caching (MVP), evaluate Prisma Accelerate for P1.

**Rationale:**
- Redis already required for BullMQ
- Full control over cache invalidation per-tenant
- No additional vendor cost for MVP
- Accelerate can be added later for edge caching

**Cache Layers:**
```
L1: In-memory (per-instance, short TTL)
L2: Redis (shared, tenant-scoped keys)
L3: CDN (static assets, storefront pages)
```

**Key Pattern:**
```
trafi:{tenant_id}:{resource}:{id}
trafi:store_abc:product:123
trafi:store_abc:cart:session_xyz
```

#### Time-Series Data: PostgreSQL + Partitioning (MVP)

**Decision:** Use PostgreSQL with table partitioning for Profit Engine events (MVP), evaluate TimescaleDB for P1.

**Rationale:**
- Simpler architecture with single database technology
- Prisma compatible with partitioned tables
- Sufficient for MVP event volumes
- TimescaleDB can be added as PostgreSQL extension if needed

**Partition Strategy:**
```sql
-- Events partitioned by month
CREATE TABLE profit_engine_events (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
) PARTITION BY RANGE (created_at);

-- Monthly partitions auto-created
CREATE TABLE profit_engine_events_2026_01
    PARTITION OF profit_engine_events
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
```

#### Builder Storage: PostgreSQL JSONB (MVP)

**Decision:** Store Trafi Builder page JSON in PostgreSQL JSONB column (MVP), S3 for P1 if pages exceed 1MB.

**Rationale:**
- JSONB supports efficient querying and indexing
- Transactional consistency with other page metadata
- Simpler backup/restore (single database)
- S3 migration path clear if size becomes issue

**Schema:**
```prisma
model Page {
  id        String   @id @default(cuid())
  storeId   String
  slug      String
  content   Json     // JSONB - Builder JSON structure
  metadata  Json?    // SEO, settings
  version   Int      @default(1)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([storeId, slug])
  @@index([storeId])
}
```

### Authentication & Security

#### Authentication Method: JWT + NestJS Passport

**Decision:** Custom JWT authentication with NestJS Passport, supporting multiple auth flows.

**Rationale:**
- Full control over token claims for multi-tenant context
- Support for both user sessions and API keys
- No per-user vendor costs
- Extensible for future auth providers (OAuth)

**Token Structure:**
```typescript
interface JWTPayload {
  sub: string;           // User ID
  tenantId: string;      // Store/Organization ID
  role: UserRole;        // admin, staff, readonly
  permissions: string[]; // Granular permissions
  type: 'session' | 'api_key';
  iat: number;
  exp: number;
}
```

**Auth Flows:**
```
Dashboard Login: Email/Password → JWT (short-lived) + Refresh Token
API Key: Generated key → JWT (long-lived, scoped permissions)
Storefront: Optional customer auth via SDK
```

#### RBAC Implementation: Guards + Custom Decorators

**Decision:** NestJS Guards with custom decorators for role and permission checks.

**Rationale:**
- Native NestJS pattern, well-documented
- Declarative permission checks on routes
- Composable for complex permission logic
- CASL can be added later if ABAC needed

**Implementation:**
```typescript
// Decorators
@Roles('admin', 'staff')
@Permissions('products:write')
@Public() // Skip auth for public routes

// Guard chain
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('products')
export class ProductsController {
  @Post()
  @Permissions('products:create')
  create(@Body() dto: CreateProductDto) { ... }
}
```

#### Feature Flags: Custom Redis-based (MVP)

**Decision:** Build simple feature flag system using Redis (MVP), migrate to Flagsmith for P1 if UI needed.

**Rationale:**
- Redis already in stack
- Profit Engine needs fast flag checks
- Simple key-value sufficient for MVP
- Flagsmith provides UI when team grows

**Implementation:**
```typescript
// Feature flag structure
interface FeatureFlag {
  key: string;
  enabled: boolean;
  tenantOverrides: Record<string, boolean>;
  rolloutPercentage?: number;
  metadata?: Record<string, unknown>;
}

// Usage
const isEnabled = await featureFlags.check('profit_engine.recovery_emails', tenantId);
```

### API & Communication Patterns

#### Error Format: Standardized JSON

**Decision:** Consistent error response format across REST and tRPC APIs.

**Format:**
```typescript
// Error Response
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;           // Machine-readable: "CHECKOUT_FAILED"
    message: string;        // Human-readable: "Payment method declined"
    type: ErrorType;        // Category: "validation" | "auth" | "payment" | "server"
    details?: {             // Structured context
      field?: string;
      provider?: string;
      [key: string]: unknown;
    };
    requestId: string;      // Tracing: "req_abc123"
    timestamp: string;      // ISO 8601: "2026-01-11T12:00:00Z"
  };
}

// Success Response
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  requestId: string;
}
```

**Error Codes by Type:**
```
validation: INVALID_INPUT, MISSING_FIELD, INVALID_FORMAT
auth: UNAUTHORIZED, FORBIDDEN, TOKEN_EXPIRED, INVALID_API_KEY
payment: PAYMENT_FAILED, CARD_DECLINED, INSUFFICIENT_FUNDS
server: INTERNAL_ERROR, SERVICE_UNAVAILABLE, RATE_LIMITED
```

#### Rate Limiting: @nestjs/throttler + Redis

**Decision:** Use NestJS Throttler with Redis store for per-tenant rate limiting.

**Rationale:**
- Native NestJS integration
- Redis store for distributed rate limiting
- Per-tenant configuration support
- Decorator-based route protection

**Configuration:**
```typescript
// Default limits (per tenant)
const rateLimits = {
  default: { ttl: 60, limit: 100 },      // 100 req/min
  checkout: { ttl: 60, limit: 20 },       // 20 req/min (sensitive)
  webhook: { ttl: 60, limit: 1000 },      // 1000 req/min (high volume)
};

// Usage
@Throttle({ default: { limit: 10, ttl: 60 } })
@Post('checkout')
async checkout() { ... }
```

### Frontend Architecture (Dashboard)

#### Data Flow: Zsa + Server Actions + tRPC

**Decision:** Use Zsa library to bridge Next.js Server Actions with React Query, calling tRPC backend.

**Rationale:**
- Server Actions provide progressive enhancement
- Zsa adds React Query benefits (caching, optimistic updates)
- tRPC maintains type-safety to NestJS
- Clean separation of concerns

**Architecture:**
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

**Implementation:**
```typescript
// lib/hooks/server-action-hooks.ts
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { createServerActionsKeyFactory, setupServerActionHooks } from "zsa-react-query";

export const QueryKeyFactory = createServerActionsKeyFactory({
  products: () => ["products"],
  product: (id: string) => ["products", id],
  orders: () => ["orders"],
  cart: () => ["cart"],
});

export const {
  useServerActionQuery,
  useServerActionMutation,
  useServerActionInfiniteQuery,
} = setupServerActionHooks({
  hooks: { useQuery, useMutation, useInfiniteQuery },
  queryKeyFactory: QueryKeyFactory,
});

// app/actions/products.ts
'use server'
import { trpc } from '@/lib/trpc';

export async function getProducts(input: { page: number; limit: number }) {
  return trpc.products.list.query(input);
}

export async function createProduct(input: CreateProductInput) {
  return trpc.products.create.mutate(input);
}

// components/ProductList.tsx
'use client'
import { useServerActionQuery } from '@/lib/hooks/server-action-hooks';
import { getProducts } from '@/app/actions/products';

export function ProductList() {
  const { data, isLoading } = useServerActionQuery(getProducts, {
    input: { page: 1, limit: 20 },
    queryKey: ['products'],
  });

  // React Query benefits: caching, background refetch, stale-while-revalidate
}
```

#### State Management: React Query (Zsa) + Zustand

**Decision:** React Query via Zsa for server state, Zustand for minimal client state.

**Rationale:**
- 95%+ of state is server state (handled by React Query)
- Zustand for UI state only (modals, sidebar, theme)
- No Redux complexity needed
- Clear separation of concerns

**Zustand Scope (minimal):**
```typescript
// stores/ui.ts
import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  activeModal: string | null;
  toggleSidebar: () => void;
  openModal: (id: string) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  activeModal: null,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  openModal: (id) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),
}));
```

### Infrastructure & Deployment

#### Hosting Strategy: Cloud-Agnostic (Docker)

**Decision:** Containerized deployment with Docker, cloud-agnostic configuration.

**Rationale:**
- PRD requires "Self-Host Free" tier
- Docker enables consistent dev/prod environments
- Flexibility for Vercel (Dashboard), Railway, or self-host
- Kubernetes-ready for scale

**Container Strategy:**
```yaml
# docker-compose.yml (development)
services:
  api:
    build: ./apps/api
    ports: ["3001:3001"]
    depends_on: [postgres, redis]

  dashboard:
    build: ./apps/dashboard
    ports: ["3000:3000"]
    environment:
      - API_URL=http://api:3001

  postgres:
    image: postgres:16
    volumes: [postgres_data:/var/lib/postgresql/data]

  redis:
    image: redis:7-alpine
    volumes: [redis_data:/data]
```

#### Observability: OpenTelemetry

**Decision:** OpenTelemetry as the observability foundation, exportable to any backend.

**Rationale:**
- Vendor-agnostic instrumentation
- Standard for distributed tracing
- Self-hosted option (Jaeger) or SaaS (Datadog, Honeycomb)
- NestJS and Next.js both support OTEL

**Implementation:**
```typescript
// Instrumentation exports to:
// - Jaeger (self-hosted, free)
// - Honeycomb (SaaS, generous free tier)
// - Datadog (SaaS, enterprise)

// Key metrics per-tenant:
// - Request latency (p50, p95, p99)
// - Error rate by endpoint
// - Checkout funnel completion
// - Profit Engine recommendation accuracy
```

### Distribution Model: Trafi Core Package

#### Vision: Extensible Commerce Framework

**Decision:** Trafi will be distributed as an NPM package (`@trafi/core`) that developers install and extend, similar to Medusa.

**Rationale:**
- Enables customization without forking the entire codebase
- Clean separation between core functionality and merchant customizations
- Familiar pattern for developers (Medusa, Strapi, Payload)
- Supports both self-hosted and Trafi Cloud deployment models

#### Distribution Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    @trafi/core (NPM Package)                     │
│                  Code source accessible via node_modules         │
│                                                                  │
│  ┌────────────────────────┐    ┌────────────────────────────┐  │
│  │   server/ (NestJS)     │    │   app/ (Next.js Dashboard) │  │
│  │                        │    │                            │  │
│  │  • Product Module      │    │  • Products UI             │  │
│  │  • Order Module        │    │  • Orders UI               │  │
│  │  • Profit Engine       │    │  • Profit Engine UI        │  │
│  │  • Auth Module         │    │  • Auth UI                 │  │
│  └────────────────────────┘    └────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ npx create-trafi my-store
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│          Developer's Project (Scaffolded, Customizable)         │
│                                                                  │
│  app/           → Dashboard overrides (pages, components)       │
│  server/        → Backend overrides (services, controllers)     │
│  trafi.config.ts → Central configuration                        │
│  prisma/        → Editable database schema                      │
└─────────────────────────────────────────────────────────────────┘
```

#### Developer Project Structure (Generated)

```
my-store/
├── app/                              # Dashboard (Next.js App Router)
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (dashboard)/
│   │   ├── products/
│   │   │   ├── page.tsx              # Override core products page
│   │   │   └── _components/
│   │   └── custom-analytics/         # Custom page
│   │       └── page.tsx
│   └── layout.tsx
│
├── server/                           # Backend (NestJS)
│   ├── modules/
│   │   ├── product/                  # Override Product module
│   │   │   └── product.service.ts
│   │   └── loyalty/                  # Custom module
│   │       └── loyalty.module.ts
│   ├── listeners/
│   └── main.ts
│
├── components/                       # Shared components
├── lib/                              # Utilities
├── hooks/                            # Custom React hooks
├── prisma/schema.prisma              # Editable schema
├── trafi.config.ts                   # Central configuration
├── package.json
└── docker-compose.yml
```

#### Override Patterns

**Backend (NestJS) - Service Override:**
```typescript
// server/modules/product/product.service.ts
import { Injectable } from '@nestjs/common';
import { ProductService as CoreService } from '@trafi/core/server';

@Injectable()
export class ProductService extends CoreService {
  async create(storeId: string, data: CreateProductDto) {
    await this.syncWithERP(data);                    // Custom BEFORE
    const product = await super.create(storeId, data); // Core logic
    await this.notifyAnalytics(product);             // Custom AFTER
    return product;
  }

  // Protected methods can be overridden
  protected async validatePrice(price: number) {
    await super.validatePrice(price);
    if (price > 100000) throw new Error('Requires approval');
  }
}
```

**Dashboard (Next.js) - Page Override:**
```typescript
// app/(dashboard)/products/page.tsx
import { ProductsPage as CorePage } from '@trafi/core/dashboard';
import { CustomAnalytics } from '@/components/analytics-widget';

export default function ProductsPage() {
  return (
    <div>
      <CustomAnalytics />     {/* Custom widget BEFORE */}
      <CorePage />            {/* Core page */}
      <CustomFooter />        {/* Custom widget AFTER */}
    </div>
  );
}
```

#### CLI Commands

```bash
npx create-trafi my-store    # Scaffold new project
cd my-store

trafi dev                    # Start server (3001) + dashboard (3000)
trafi build                  # Build for production
trafi start                  # Start production

trafi db:generate            # Generate Prisma client
trafi db:push                # Push schema to database
trafi db:migrate             # Create migration
trafi db:seed                # Seed database
```

#### Configuration (trafi.config.ts)

```typescript
import { defineConfig } from '@trafi/core';

export default defineConfig({
  store: {
    name: 'My Fashion Store',
    currency: 'EUR',
  },

  modules: {
    profitEngine: { enabled: true },
    builder: { enabled: true },
    multiCurrency: { enabled: true, currencies: ['EUR', 'USD'] },
  },

  server: {
    port: 3001,
    overrides: {
      modules: { product: './server/modules/product' },
    },
  },

  dashboard: {
    port: 3000,
    overrides: {
      pages: { '/products': './app/(dashboard)/products/page.tsx' },
    },
  },
});
```

#### Implementation Guidelines

To support this distribution model, all code must be written with extensibility in mind:

**Backend (NestJS):**
- Use `protected` methods for overridable logic (NOT `private`)
- Export explicit public API from each module
- Use composition over hard dependencies
- Emit events for extension points

**Dashboard (Next.js):**
- Design components with customization props
- Use composition pattern for wrappable pages
- Export components for reuse
- Avoid inline styles that can't be overridden

### Decision Impact Analysis

**Implementation Sequence:**
1. **Foundation:** Monorepo setup, Prisma schema, basic NestJS structure
2. **Auth:** JWT + Guards + API keys
3. **Core APIs:** tRPC routers, REST controllers, Zod schemas
4. **Dashboard:** Next.js + Zsa + tRPC client setup
5. **Commerce:** Product, Cart, Checkout modules
6. **Profit Engine:** Event tracking, feature flags, analytics
7. **Infrastructure:** Docker, CI/CD, monitoring

**Cross-Component Dependencies:**
```
Zod Schemas ──► tRPC Routers ──► NestJS Services
                    │
                    ▼
              Zsa Server Actions ──► Dashboard Components
```

