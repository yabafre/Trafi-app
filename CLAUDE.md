# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Trafi** is an open-source multi-tenant SaaS e-commerce platform for developers that combines headless commerce flexibility with built-in profit automation. The core innovation is the **Trafi Profit Engine** - an integrated system that instruments the customer journey, diagnoses conversion issues, proposes optimizations, measures statistical impact, and automatically rolls back if metrics decline.

**Positioning:** "The open-source Shopify alternative for developers—with built-in profit automation."

**Key Principle:** "Autopilot PROPOSES, merchant APPROVES" - inverted CRO workflow that reduces friction while maintaining human control.

## Development Commands

```bash
# Install dependencies
pnpm install

# Start all apps in development mode
pnpm dev

# Build all packages and apps
pnpm build

# Run linting
pnpm lint

# Run all tests
pnpm test

# Type checking
pnpm typecheck

# Format code
pnpm format

# Database commands (run from monorepo root)
pnpm db:generate    # Generate Prisma client
pnpm db:push        # Push schema to database (dev only)
pnpm db:migrate:dev # Create and apply migrations
pnpm db:studio      # Open Prisma Studio
```

### Running Individual Apps

```bash
# API only (NestJS - port 3001)
pnpm --filter @trafi/api dev

# Dashboard only (Next.js - port 3000)
pnpm --filter @trafi/dashboard dev
```

### Running Tests

```bash
# All tests
pnpm test

# API tests
pnpm --filter @trafi/api test
pnpm --filter @trafi/api test:e2e

# Single test file
pnpm --filter @trafi/api test -- path/to/test.spec.ts
```

### Docker Development

```bash
# Start all services (PostgreSQL, Redis, API, Dashboard)
pnpm docker:up

# Start with rebuild
pnpm docker:up:build

# Start in background (detached)
pnpm docker:up:detach

# Stop all services
pnpm docker:down

# Stop and remove volumes (fresh database)
pnpm docker:down:volumes

# View logs
pnpm docker:logs

# Check service status
pnpm docker:ps
```

**Environment Variables:**
Copy `.env.docker.example` to `.env.docker` and customize.

**Ports:**
- Dashboard: http://localhost:3000
- API: http://localhost:3001
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Architecture

### Monorepo Structure

```
apps/
  api/              # NestJS 11 backend (port 3001)
  dashboard/        # Next.js 16 admin dashboard (port 3000)
packages/
  @trafi/types/     # Shared TypeScript types (inferred from validators)
  @trafi/validators/# Zod schemas (source of truth for types)
  @trafi/config/    # Shared configuration (ESLint, TypeScript, Tailwind)
```

### Data Flow Pattern

```
Dashboard (RSC) -> Server Action (Zsa) -> tRPC -> NestJS API -> Prisma -> PostgreSQL
Storefront       -> REST/SDK           -> NestJS API -> Prisma -> PostgreSQL
```

**CRITICAL: Frontend-Database Isolation**
- Frontends NEVER connect directly to the database
- All data access flows through the API layer
- No Prisma client imports in Dashboard or Storefront
- Enforced via ESLint rules and TypeScript project references

### Key Technologies

| Layer | Technology | Notes |
|-------|------------|-------|
| Runtime | Node.js 20, TypeScript 5.x (strict) | |
| Package Manager | pnpm with workspaces | |
| Monorepo | Turborepo | Task orchestration and caching |
| Backend | NestJS 11, Prisma 7, PostgreSQL | DB-per-tenant isolation |
| Frontend | Next.js 16 (App Router), React 19 | Server Components, streaming |
| UI | Tailwind CSS 4, Shadcn UI | Dark mode default, GSAP animations |
| Validation | Zod | Source of truth for types |
| Jobs | BullMQ + Redis | Async tasks, queue management |
| API | tRPC (internal), REST (external/SDK) | |
| Auth | JWT + NestJS Passport | Session-based dashboard, API keys for SDK |

### Distribution Model (Trafi Core)

Trafi is designed as an extensible commerce framework, distributed as `@trafi/core` NPM package:

```
@trafi/core (NPM Package)
├── server/        # Backend NestJS modules
└── app/           # Dashboard Next.js pages/components

Developer's Project (via npx create-trafi)
├── app/           # Dashboard overrides
├── server/        # Backend overrides
├── trafi.config.ts # Central configuration
└── prisma/        # Editable schema
```

**Override Patterns:**
- **Backend:** Extend services with `protected` methods, call `super.method()`
- **Dashboard:** Wrap core pages/components with custom additions

**Implementation Guidelines:**
- Use `protected` methods (not `private`) for overridable logic
- Export explicit public API from modules
- Design components with customization props
- Use composition pattern for wrappable pages

See `_bmad-output/planning-artifacts/architecture.md` section "Distribution Model" for full details.

## Critical Patterns

### Type Management (Source of Truth)

Zod schemas in `@trafi/validators` are the single source of truth:

```typescript
// packages/@trafi/validators/src/product.ts
export const ProductSchema = z.object({
  name: z.string().min(1).max(255),
  price: z.number().positive(),
  currency: z.enum(['EUR', 'USD', 'GBP']),
});

// packages/@trafi/types/src/product.ts
import type { z } from 'zod';
import type { ProductSchema } from '@trafi/validators';
export type Product = z.infer<typeof ProductSchema>;
```

**Rules:**
- NEVER define domain types locally in apps - import from packages
- Use `import type { X }` for type-only imports
- Validators are the source, types are derived

### Multi-Tenant Isolation (CRITICAL)

Every database query MUST include tenant filtering:

```typescript
// REQUIRED: Always filter by storeId
await prisma.product.findMany({ where: { storeId } });

// FORBIDDEN: Never query without tenant scope
await prisma.product.findMany();
```

All data isolation is enforced at DB level with database-per-tenant architecture.

### Dashboard Component Organization

```
app/(dashboard)/products/
  _components/    # Route-local components (underscore prefix)
  _hooks/         # Route-local hooks
  _actions/       # Route-local Server Actions
  page.tsx

components/       # Global shared components (no underscore)
lib/hooks/        # Global shared hooks
```

**Rules:**
- `_underscore` prefix = route-local, not shared
- No underscore = globally shared across routes

### Money Handling

Store money as INTEGER cents, never floats:

```typescript
const price = 1999;  // $19.99
// Display: formatPrice(1999) -> "$19.99"
```

### ID Format

Use CUID with domain prefixes:

```typescript
const orderId = 'ord_' + cuid();    // ord_clm1234...
const productId = 'prod_' + cuid(); // prod_clm5678...
```

### Event Naming Convention

Domain events use snake_case: `domain.entity.action`

```typescript
'checkout.cart.abandoned'
'payment.transaction.completed'
'order.status.updated'
```

### Prisma Multi-File Schema

Schema files are in `apps/api/prisma/schema/`:
- `base.prisma` - Generator and datasource config
- `user.prisma`, `store.prisma`, `product.prisma` - Domain models

Configuration is in `apps/api/prisma.config.ts`.

### API Error Format

Standardized error response across REST and tRPC:

```typescript
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;           // Machine-readable: "CHECKOUT_FAILED"
    message: string;        // Human-readable
    type: 'validation' | 'auth' | 'payment' | 'server';
    details?: { field?: string; provider?: string };
    requestId: string;      // For tracing
    timestamp: string;      // ISO 8601
  };
}
```

## Authentication & Authorization

### Auth Flows

| Context | Method | Token Type |
|---------|--------|------------|
| Dashboard Login | Email/Password | JWT (short-lived) + Refresh Token |
| API Key | Generated key | JWT (long-lived, scoped) |
| Storefront | Optional customer auth | Session via SDK |

### RBAC Implementation

NestJS Guards with custom decorators:

```typescript
@Roles('admin', 'staff')
@Permissions('products:write')
@Controller('products')
export class ProductsController {
  @Post()
  @Permissions('products:create')
  create(@Body() dto: CreateProductDto) { ... }
}
```

Role templates: Owner, Admin, Operator, Viewer, Risk Manager, Privacy Manager

## Feature Flags

Custom Redis-based feature flag system:

```typescript
const isEnabled = await featureFlags.check('profit_engine.recovery_emails', tenantId);
```

Used for Profit Engine experiments and gradual rollouts.

## Commerce Modules (9 Core)

| Module | Scope |
|--------|-------|
| Product | Catalog, variants, categories, media |
| Customer | Accounts, addresses, B2C auth |
| Cart | Persistent cart, totals, rules |
| Checkout | Multi-step flow, guest checkout |
| Payment | Stripe integration, webhooks, refunds |
| Order | Creation, statuses, history, events |
| Inventory + Fulfillment | Stock, shipping zones, rates |
| Tax | VAT Europe, zone rules |
| User Access | Admin users, RBAC, API keys |

## Profit Engine (Key Differentiator)

The Profit Engine implements closed-loop profit automation:

1. **Checkout Doctor** - Funnel instrumentation, drop-off diagnosis
2. **Recovery Engine** - Abandoned cart email sequences (37min, 24h, 48h)
3. **Profit Guardrails** - Margin/stock rules to prevent destructive optimizations
4. **Rollback** - Automatic rollback for actions that degrade metrics

**North Star Metric:** Profit per visitor (not conversion alone)

## UX Design Principles

1. **Action Over Information** - System proposes specific actions, not just data
2. **Trust Through Transparency** - Every recommendation explains reasoning
3. **Mobile-First, Desktop-Rich** - Storefront for thumbs, Dashboard for productivity
4. **Five-Minute Magic** - First value in minutes
5. **Zero Friction by Default** - Guest checkout default, complexity opt-in

### Design System

- **Dashboard:** Vercel-inspired dark mode (default identity), Shadcn UI
- **Storefront:** Bold, creative, mobile-first
- **Colors:** Black & White base with Orange accent, themable per merchant

## Development Progress

Current epic: **Epic 1 - Foundation & Developer Bootstrap** (in-progress)

Completed stories:
- 1.1: Initialize Turborepo monorepo structure
- 1.2: Setup NestJS API application
- 1.3: Setup Next.js Dashboard application
- 1.4: Create shared packages structure
- 1.5: Configure Prisma with PostgreSQL
- 1.6: Setup test infrastructure
- 1.7: Seed demo data for development
- 1.8: Docker containerization setup

Epic 1 complete! Total: 14 epics, 144 stories planned

## Environment Setup

Create `.env` at the monorepo root with:

```
DATABASE_URL=postgresql://user:password@localhost:5432/trafi_dev
```

Commands use `dotenv-cli` to load environment variables automatically.

## Library Documentation

**Always use Context7 MCP** to retrieve up-to-date documentation for libraries (NestJS, Prisma, Next.js, tRPC, BullMQ, Stripe, etc.) to ensure implementations follow latest patterns.

## Planning Artifacts

Detailed project documentation is in `_bmad-output/planning-artifacts/`:
- `prd.md` - Product Requirements Document (104 FRs)
- `architecture.md` - Architecture Decision Document
- `epics.md` - Epic breakdown (14 epics)
- `ux-design-specification.md` - UX design spec

Implementation tracking in `_bmad-output/implementation-artifacts/sprint-status.yaml`
