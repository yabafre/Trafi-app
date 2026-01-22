## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**12 Critical Conflict Points Identified** where AI agents could make different choices, now standardized.

### Naming Patterns

#### Database Naming (Prisma)

| Element | Convention | Example |
|---------|------------|---------|
| Tables | PascalCase singular | `Product`, `OrderItem` |
| Columns | camelCase | `createdAt`, `userId` |
| Foreign Keys | `{relation}Id` | `storeId`, `customerId` |
| Indexes | `{table}_{columns}_idx` | `Product_storeId_idx` |
| Enums | PascalCase | `OrderStatus`, `PaymentMethod` |

```prisma
model Product {
  id          String   @id @default(cuid())
  storeId     String
  name        String
  slug        String
  price       Int      // cents
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  store       Store    @relation(fields: [storeId], references: [id])

  @@unique([storeId, slug])
  @@index([storeId], name: "Product_storeId_idx")
}
```

#### API Naming (NestJS)

| Element | Convention | Example |
|---------|------------|---------|
| REST routes | kebab-case plural | `/api/v1/products`, `/api/v1/order-items` |
| Route params | camelCase | `/products/:productId` |
| Query params | camelCase | `?pageSize=20&sortBy=createdAt` |
| tRPC procedures | camelCase verb.noun | `products.list`, `orders.create` |

#### Code Naming (TypeScript)

| Element | Convention | Example |
|---------|------------|---------|
| Files (components) | PascalCase | `ProductCard.tsx` |
| Files (hooks) | camelCase with use prefix | `useProducts.ts` |
| Files (utils) | camelCase | `formatPrice.ts` |
| Files (server actions) | kebab-case | `product-actions.ts` |
| Directories | kebab-case | `order-items/`, `profit-engine/` |
| Classes | PascalCase | `ProductService` |
| Functions | camelCase | `getProductById` |
| Constants | SCREAMING_SNAKE | `MAX_PRODUCTS_PER_PAGE` |
| Types/Interfaces | PascalCase + suffix | `ProductDto`, `CreateProductInput` |
| Zod schemas | PascalCase + Schema | `ProductSchema`, `CreateProductSchema` |

### Structure Patterns

#### Local vs Global Convention (CRITICAL)

**Underscore prefix (`_`) = Local/Route-specific**
**No prefix = Global/Shared**

| Type | Local (Route-specific) | Global (Shared) |
|------|------------------------|-----------------|
| Components | `app/products/_components/` | `src/components/` |
| Hooks | `app/products/_hooks/` | `src/lib/hooks/` |
| Actions | `app/products/_actions/` | `src/actions/` |

#### Shared Types/DTOs/Schemas (CRITICAL)

**All types, DTOs, and Zod schemas MUST be in `packages/` for sharing between API and Dashboard.**

```
packages/
├── @trafi/validators/           # Zod schemas (source of truth)
│   └── src/
│       ├── product/
│       │   ├── create-product.schema.ts
│       │   ├── update-product.schema.ts
│       │   └── index.ts
│       ├── order/
│       ├── customer/
│       └── index.ts
│
├── @trafi/types/                # Pure TypeScript types
│   └── src/
│       ├── product.types.ts     # Inferred from Zod + custom
│       ├── api.types.ts         # API response types
│       ├── events.types.ts      # Event payload types
│       └── index.ts
│
└── apps/api/                   # Prisma (generates types too)
    └── src/
        └── generated/           # Prisma generated types
```

**Type Flow:**
```
Zod Schema (@trafi/validators)
    │
    ├──► z.infer<typeof Schema> ──► TypeScript Type (@trafi/types)
    │
    ├──► tRPC Input/Output (apps/api)
    │
    └──► Server Action Input (apps/dashboard)
```

#### Project Structure (Complete)

```
trafi/
├── apps/
│   ├── api/                              # NestJS Backend
│   │   ├── src/
│   │   │   ├── modules/                  # Feature modules
│   │   │   │   ├── product/
│   │   │   │   │   ├── product.module.ts
│   │   │   │   │   ├── product.service.ts
│   │   │   │   │   ├── product.controller.ts    # REST
│   │   │   │   │   ├── product.router.ts        # tRPC
│   │   │   │   │   └── __tests__/
│   │   │   │   │       └── product.service.spec.ts
│   │   │   │   └── order/
│   │   │   ├── common/                   # Guards, filters, decorators
│   │   │   ├── config/
│   │   │   └── main.ts
│   │   └── test/                         # E2E tests
│   │
│   └── dashboard/                        # Next.js Dashboard
│       └── src/
│           ├── app/                      # App Router
│           │   ├── (auth)/
│           │   │   ├── login/
│           │   │   │   └── page.tsx
│           │   │   └── layout.tsx
│           │   ├── (dashboard)/
│           │   │   ├── products/
│           │   │   │   ├── page.tsx
│           │   │   │   ├── _components/          # LOCAL components
│           │   │   │   │   ├── ProductTable.tsx
│           │   │   │   │   └── ProductFilters.tsx
│           │   │   │   ├── _hooks/               # LOCAL hooks
│           │   │   │   │   └── useProductFilters.ts
│           │   │   │   ├── _actions/             # LOCAL actions
│           │   │   │   │   └── product-actions.ts
│           │   │   │   ├── [id]/
│           │   │   │   │   ├── page.tsx
│           │   │   │   │   ├── _components/
│           │   │   │   │   │   └── ProductForm.tsx
│           │   │   │   │   └── _actions/
│           │   │   │   │       └── update-product-action.ts
│           │   │   │   └── new/
│           │   │   │       └── page.tsx
│           │   │   ├── orders/
│           │   │   │   ├── page.tsx
│           │   │   │   ├── _components/
│           │   │   │   └── _actions/
│           │   │   └── layout.tsx
│           │   └── layout.tsx
│           │
│           ├── components/               # GLOBAL shared components
│           │   ├── ui/                   # Shadcn UI
│           │   │   ├── button.tsx
│           │   │   ├── card.tsx
│           │   │   └── ...
│           │   └── shared/               # Custom shared
│           │       ├── DataTable.tsx
│           │       ├── PageHeader.tsx
│           │       └── ConfirmDialog.tsx
│           │
│           ├── lib/
│           │   ├── trpc.ts               # tRPC client setup
│           │   └── hooks/                # GLOBAL hooks
│           │       ├── server-action-hooks.ts  # Zsa setup
│           │       └── useAuth.ts
│           │
│           ├── actions/                  # GLOBAL actions (rare)
│           │   └── auth-actions.ts
│           │
│           └── stores/                   # Zustand stores
│               └── ui-store.ts
│
└── packages/
    ├── @trafi/validators/                # Shared Zod schemas
    │   ├── src/
    │   │   ├── product/
    │   │   │   ├── product.schema.ts
    │   │   │   ├── create-product.schema.ts
    │   │   │   └── index.ts
    │   │   ├── order/
    │   │   ├── customer/
    │   │   ├── common/                   # Shared schemas (pagination, etc.)
    │   │   │   ├── pagination.schema.ts
    │   │   │   └── money.schema.ts
    │   │   └── index.ts
    │   ├── package.json
    │   └── tsconfig.json
    │
    ├── @trafi/types/                     # Shared TypeScript types
    │   ├── src/
    │   │   ├── product.types.ts
    │   │   ├── order.types.ts
    │   │   ├── api.types.ts              # ApiResponse, ApiError
    │   │   ├── events.types.ts           # Event payloads
    │   │   └── index.ts
    │   └── package.json
    │
    ├── apps/api/                        # Prisma
    │   ├── prisma/
    │   │   └── schema.prisma
    │   ├── src/
    │   │   ├── client.ts
    │   │   └── index.ts
    │   └── package.json
    │
    └── @trafi/config/                    # Shared configs
        ├── eslint/
        ├── typescript/
        └── tailwind/
```

#### Import Pattern for Shared Types

```typescript
// In apps/api (NestJS)
import { CreateProductSchema, type CreateProductInput } from '@trafi/validators';
import type { ApiResponse } from '@trafi/types';

// In apps/dashboard (Next.js)
import { CreateProductSchema, type CreateProductInput } from '@trafi/validators';
import type { Product } from '@trafi/types';

// NEVER import Prisma in dashboard (Prisma is API-only in apps/api)
```

### Format Patterns

#### Dates

| Context | Format | Example |
|---------|--------|---------|
| API JSON | ISO 8601 string | `"2026-01-11T12:00:00.000Z"` |
| Database | DateTime (Prisma) | `DateTime @default(now())` |
| Display FR | `dd/MM/yyyy HH:mm` | `11/01/2026 12:00` |
| Relative | Intl.RelativeTimeFormat | `il y a 2 heures` |

#### Money

| Context | Format | Example |
|---------|--------|---------|
| Database/API | Cents (integer) | `1999` (= 19.99) |
| Display | Intl.NumberFormat | `19,99 €` |

```typescript
// @trafi/validators/src/common/money.schema.ts
import { z } from 'zod';

export const MoneySchema = z.object({
  amount: z.number().int(),           // Always cents
  currency: z.enum(['EUR', 'USD', 'GBP']),
});

export type Money = z.infer<typeof MoneySchema>;
```

#### IDs

| Type | Format | Example |
|------|--------|---------|
| Primary keys | cuid | `clx1abc123def456` |
| Public IDs (API) | Prefixed | `prod_clx1abc`, `ord_clx2def` |
| Request IDs | Prefixed | `req_abc123xyz` |

### Communication Patterns

#### Events (Profit Engine & System)

```typescript
// @trafi/types/src/events.types.ts

// Naming: domain.entity.action (snake_case)
export type EventType =
  | 'commerce.product.viewed'
  | 'commerce.cart.item_added'
  | 'commerce.checkout.started'
  | 'commerce.order.completed'
  | 'system.user.created'
  | 'system.store.settings_updated';

export interface EventPayload<T> {
  eventType: EventType;
  eventId: string;         // Idempotency
  tenantId: string;
  timestamp: string;       // ISO 8601
  version: number;         // Schema version
  data: T;
  metadata?: {
    source: 'sdk' | 'dashboard' | 'storefront';
    sessionId?: string;
    userId?: string;
  };
}
```

#### tRPC Procedures

```typescript
// Naming: {resource}.{action}
// Actions: list, get, create, update, delete, {custom}

import { CreateProductSchema, UpdateProductSchema } from '@trafi/validators';

export const productRouter = router({
  list: publicProcedure
    .input(ListProductsSchema)
    .query(({ input }) => { ... }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => { ... }),

  create: protectedProcedure
    .input(CreateProductSchema)      // From @trafi/validators
    .mutation(({ input }) => { ... }),

  update: protectedProcedure
    .input(UpdateProductSchema)      // From @trafi/validators
    .mutation(({ input }) => { ... }),
});
```

#### Server Actions (Local)

```typescript
// app/products/_actions/product-actions.ts
'use server'

import { trpc } from '@/lib/trpc';
import type { CreateProductInput, UpdateProductInput } from '@trafi/validators';

export async function getProducts(input: { page: number; limit: number }) {
  return trpc.products.list.query(input);
}

export async function createProduct(input: CreateProductInput) {
  return trpc.products.create.mutate(input);
}
```

### Process Patterns

#### Error Handling

```typescript
// NestJS: Global HttpExceptionFilter
// All errors pass through filter and return standard format

// Pattern: Never expose internal errors
// ✅ Good
throw new BadRequestException({
  code: 'INVALID_PRODUCT_PRICE',
  message: 'Le prix doit être positif',
});

// ❌ Bad
throw new Error('Database connection failed: postgresql://...');
```

#### Loading States (Dashboard)

```typescript
// Pattern: Use React Query states via Zsa
// Naming: is{State}

const {
  data,
  isLoading,      // Initial load
  isRefetching,   // Background refresh
  isError,
  error,
} = useServerActionQuery(getProducts, { ... });

// UI Pattern: Skeleton > Spinner
{isLoading ? <ProductTableSkeleton /> : <ProductTable data={data} />}
```

#### Mutations with Optimistic Updates

```typescript
const { mutate, isPending } = useServerActionMutation(createProduct, {
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
    toast.success('Produit créé');
  },
  onError: (error) => {
    toast.error(error.message);
  },
});
```

### Enforcement Guidelines

**All AI Agents MUST:**

1. Use `_` prefix for route-local components, hooks, and actions
2. Import types/schemas from `@trafi/validators` or `@trafi/types`, never define locally
3. Never import from `apps/api` (Prisma is API-only) in frontend apps
4. Follow naming conventions exactly (PascalCase, camelCase, kebab-case as specified)
5. Use Zod schemas from shared package for all input validation
6. Query Context7 MCP before implementing with any library

**Pattern Enforcement:**

- ESLint rules configured in `@trafi/config` to prevent violations
- TypeScript project references prevent invalid imports
- PR reviews check for pattern compliance
- Automated tests verify API response formats

### Pattern Examples

**Good Examples:**

```typescript
// ✅ Local component in route folder
// app/products/_components/ProductTable.tsx
import { DataTable } from '@/components/shared/DataTable';
import type { Product } from '@trafi/types';

// ✅ Shared schema import
import { CreateProductSchema } from '@trafi/validators';

// ✅ Local hook
// app/products/_hooks/useProductFilters.ts
export function useProductFilters() { ... }

// ✅ Local action
// app/products/_actions/product-actions.ts
'use server'
export async function getProducts() { ... }
```

**Anti-Patterns:**

```typescript
// ❌ Types defined locally instead of shared
// app/products/_types/product.ts  <-- WRONG

// ❌ Component without underscore prefix in route
// app/products/components/  <-- WRONG, should be _components/

// ❌ Importing Prisma in dashboard (Prisma is API-only in apps/api)
import { prisma } from '@database';  // ❌ FORBIDDEN in frontend

// ❌ Schema defined in API instead of shared
// apps/api/src/modules/product/dto/create-product.dto.ts  <-- WRONG
```

## UX Design System Architecture

_Added in revision 2026-01-14 - From UX Design Specification v2.0 "Brutalist Overhaul"_

The UX specification defines a **brutalist design system** that has direct architectural implications for component implementation and theming.

### Brutalist Design Tokens

The design system enforces strict visual rules through CSS variables:

```css
/* globals.css - Enforced globally */
:root {
  /* The Void (Base) */
  --surface-0: #000000;
  --surface-1: #050505;
  --surface-2: #111111;
  --border: #333333;

  /* The Acid (Signals) */
  --primary: #CCFF00;           /* Action, CTA */
  --success: #00FF94;           /* Stability, profit */
  --destructive: #FF3366;       /* Risk, errors */
  --muted-foreground: #888888;  /* Labels */

  /* Brutalist Enforcement */
  --radius: 0px;                /* radius-zero everywhere */
  --shadow: none;               /* no shadows */
}
```

### Component Architecture Pattern

#### Global vs Local Components

```
apps/dashboard/
├── components/           # Global (shared across app)
│   ├── ui/              # Shadcn primitives + Brutal wrappers
│   │   ├── button.tsx   # BrutalButton wrapper
│   │   ├── card.tsx     # BrutalCard wrapper
│   │   └── ...
│   ├── layout/          # Shell, Sidebar
│   └── data-display/    # DataTable, Charts
└── app/
    └── [route]/
        └── _components/ # Local (route-specific)
```

#### Brutal Wrapper Pattern

```typescript
// components/ui/card.tsx - Brutal enforcement
import { cn } from '@/lib/utils';

interface BrutalCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ className, children, ...props }: BrutalCardProps) {
  return (
    <div
      className={cn(
        // Brutalist enforcement
        'rounded-none',        // radius-zero
        'border border-border', // visible grid
        'bg-surface-1',        // void background
        'shadow-none',         // no shadows
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
```

### Dynamic Theme System

Theme configuration flows from Dashboard to Storefront via runtime CSS variable injection:

```
Dashboard (Theme Customizer)
        │
        ▼
   Database (JSON config)
        │
        ▼
   API (GET /stores/:id/theme)
        │
        ▼
Storefront (ThemeProvider)
        │
        ▼
   CSS Variables (runtime injection)
```

#### Theme Configuration Schema

```typescript
// @trafi/types/src/theme.types.ts
interface ThemeConfig {
  storeId: string;
  colors: {
    primary: string;      // Merchant brand color
    background: string;   // #000000 (dark) or #FFFFFF (light)
    foreground: string;   // Text color
    muted: string;
    border: string;
    success: string;
    warning: string;
    error: string;
  };
  typography: {
    fontFamily: string;   // 'Space Grotesk' default
    monoFontFamily: string; // 'JetBrains Mono' for data
    headingWeight: number;
    bodyWeight: number;
  };
  spacing: {
    borderRadius: string; // '0px' for brutalist
    containerWidth: string;
  };
}
```

#### ThemeProvider Implementation

```typescript
// @storefront/theme-provider/index.tsx
export function ThemeProvider({ storeId, children }: ThemeProviderProps) {
  const { data: theme } = useQuery({
    queryKey: ['theme', storeId],
    queryFn: () => fetchTheme(storeId),
  });

  const cssVariables = useMemo(() => generateCSSVariables(theme), [theme]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: cssVariables }} />
      {children}
    </>
  );
}

function generateCSSVariables(theme: ThemeConfig): string {
  return `:root {
    --primary: ${theme.colors.primary};
    --background: ${theme.colors.background};
    --foreground: ${theme.colors.foreground};
    --border: ${theme.colors.border};
    --radius: ${theme.spacing.borderRadius};
    --font-sans: ${theme.typography.fontFamily};
    --font-mono: ${theme.typography.monoFontFamily};
  }`;
}
```

### Builder Architecture (P2)

The Builder system enables no-code page customization:

#### Component Registry

```typescript
// @storefront/builder-renderer/registry.ts
export const componentRegistry: Record<string, ComponentType> = {
  // Core blocks (free)
  HeroSection: dynamic(() => import('@storefront/builder-blocks/core/hero-section')),
  ProductGrid: dynamic(() => import('@storefront/builder-blocks/core/product-grid')),
  CTABanner: dynamic(() => import('@storefront/builder-blocks/core/cta-banner')),
  Testimonials: dynamic(() => import('@storefront/builder-blocks/core/testimonials')),
  // Premium blocks registered dynamically based on store's purchases
};
```

#### Block Schema (for Builder UI)

```typescript
// Each block defines its props schema for the visual editor
export const heroSectionSchema: BlockSchema = {
  type: 'HeroSection',
  name: 'Hero Section',
  category: 'Headers',
  props: {
    title: { type: 'string', label: 'Title', required: true },
    subtitle: { type: 'string', label: 'Subtitle' },
    ctaText: { type: 'string', label: 'Button Text', default: 'Shop Now' },
    ctaLink: { type: 'string', label: 'Button Link' },
    backgroundImage: { type: 'image', label: 'Background Image' },
    alignment: { type: 'enum', options: ['left', 'center', 'right'], default: 'center' },
  },
};
```

### CLI Architecture

The Trafi CLI is the primary developer interface:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TRAFI CLI COMMANDS                           │
├─────────────────────────────────────────────────────────────────────┤
│  trafi init / create-trafi-app                                      │
│  └── Interactive wizard: stack, database, modules, cloud            │
│                                                                     │
│  trafi module                                                       │
│  └── list | add <name> | remove <name> | create <name>             │
│                                                                     │
│  trafi upgrade                                                      │
│  └── Breaking change detection, guided migration                    │
│                                                                     │
│  trafi cloud                                                        │
│  └── login | deploy | status | logs                                │
└─────────────────────────────────────────────────────────────────────┘
```

**CLI Package Location:** `packages/cli/` (P1 deliverable)

### Dashboard Information Architecture

The Dashboard follows a **Console** mental model aligned with the Autopilot OS concept:

```
┌─────────────────────────────────────────────────────────────────────┐
│  DASHBOARD NAVIGATION (Sidebar)                                     │
├─────────────────────────────────────────────────────────────────────┤
│  CONSOLE                                                            │
│  ├── Overview (Key metrics, alerts)                                 │
│  ├── Autopilot (ChangeSets, recommendations)                        │
│  └── Audit Trail (All actions logged)                               │
│                                                                     │
│  COMMERCE                                                           │
│  ├── Orders                                                         │
│  ├── Products                                                       │
│  ├── Customers                                                      │
│  └── Inventory                                                      │
│                                                                     │
│  SYSTEM                                                             │
│  ├── Modules (Installed, available)                                 │
│  ├── Overrides (trafi.config.ts visualization)                      │
│  ├── Jobs (BullMQ dashboard)                                        │
│  └── Settings (Store, team, integrations)                           │
│                                                                     │
│  DATA                                                               │
│  └── Analytics (Funnel, cohorts, exports)                          │
└─────────────────────────────────────────────────────────────────────┘
```

### Storefront Architecture

```
storefront/
├── packages/
│   ├── @storefront/ui/                 # Global UI components
│   ├── @storefront/builder-renderer/   # JSON → React transformation
│   ├── @storefront/builder-blocks/     # Block library (core + premium)
│   └── @storefront/theme-provider/     # Dynamic CSS variable injection
└── apps/web/
    └── app/
        ├── (shop)/                     # Public pages
        │   ├── page.tsx               # Homepage (Builder-rendered)
        │   ├── products/              # Product listing, detail
        │   └── cart/                  # Cart page
        ├── (checkout)/                # Checkout flow
        │   └── checkout/             # Multi-step checkout
        └── (account)/                 # Buyer account (optional)
```

### Animation Budget (GSAP)

| Context | Animation Type | Timing | Performance Gate |
|---------|---------------|--------|------------------|
| **Dashboard** | Micro-interactions | 150-200ms | N/A (desktop) |
| **Dashboard** | Transitions | 200-300ms | N/A |
| **Storefront** | Scroll animations | 400-600ms | INP < 200ms |
| **Storefront** | Product interactions | 200-300ms | CLS < 0.1 |

**Rule:** All storefront animations must respect Core Web Vitals. Budget is managed via `will-change` and GPU acceleration.

