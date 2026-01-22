---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - '_bmad-output/planning-artifacts/product-brief-trafi-app-2026-01-09.md'
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
  - '_bmad-output/project-context.md'
workflowType: 'architecture'
project_name: 'trafi-app'
user_name: 'Alex'
date: '2026-01-11'
lastStep: 8
status: 'complete'
completedAt: '2026-01-11'
revisedAt: '2026-01-14'
revisionNotes: |
  Update v1 (2026-01-14) - PRD v2 Alignment:
  - Added 3 Planes Architecture (Data/Decision/Execution)
  - Added Autopilot ChangeSet executable artifact specification
  - Enhanced Override Kernel with runtime resolution details
  - Added Module Sandbox security architecture
  - Added Development Rules from Epic 1 retrospective
  - Added Non-Negotiables enforcement patterns
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
104 functional requirements spanning 9 distinct capability domains. The core commerce modules (Product, Customer, Cart, Checkout, Payment, Order, Inventory, Tax, User Access) form the foundation. The Profit Engine (Checkout Doctor, Recovery Engine, Guardrails, Rollback) represents the key differentiator requiring careful instrumentation and statistical processing architecture. The Module System requirements (FR91-FR104) demand a sophisticated plugin architecture with runtime loading, hot-reload, and sandboxed execution.

**Non-Functional Requirements:**
- **Performance:** Checkout critical path p95 < 500ms, TTFB < 500ms baseline
- **Availability:** Tiered SLOs (99.95% critical path, 99.9% core commerce, 99.5% dashboard)
- **Scalability:** DB-per-tenant for 500+ tenants, horizontal API scaling
- **Security:** AES-256 encryption, TLS 1.3, tenant-scoped RBAC, PCI SAQ-A via Stripe
- **Compliance:** GDPR (access, portability, erasure, consent tracking), audit log retention 2 years
- **Accessibility:** WCAG 2.1 AA for storefront template and dashboard

**Scale & Complexity:**
- Primary domain: Full-stack SaaS B2B Platform
- Complexity level: High
- Estimated architectural components: 15-20 major services/modules

### Technical Constraints & Dependencies

| Constraint | Source | Architectural Impact |
|------------|--------|---------------------|
| Monorepo architecture | PRD | NestJS API + Next.js Dashboard in single repo |
| DB-per-tenant | PRD | PostgreSQL per store, connection pooling required |
| Stripe-first payments | PRD | Plugin architecture with Stripe as reference implementation |
| Next.js App Router | UX Spec | Server Components, streaming, specific routing patterns |
| BullMQ for jobs | PRD | Redis dependency, queue management UI |
| Type-safe SDK | PRD | tRPC internal, REST external, strong typing required |
| Semantic versioning | PRD | 90-day deprecation window, migration guides |

### Cross-Cutting Concerns Identified

1. **Multi-tenancy:** Every request must be tenant-scoped, data isolation enforced at DB level
2. **Event instrumentation:** Standardized events for Profit Engine, consistent across SDK and storefront
3. **Feature flags:** Required for Profit Engine experiments and gradual rollouts
4. **Audit logging:** All sensitive operations logged for compliance
5. **Error handling:** Graceful degradation, meaningful errors, recovery paths
6. **Caching:** Per-tenant caching strategy, invalidation on data changes
7. **Rate limiting:** Per-tenant API limits, abuse prevention

## Starter Template Evaluation

### Primary Technology Domain

Full-stack SaaS B2B Platform based on project requirements analysis. Architecture requires:
- Modular NestJS backend with plugin system
- Next.js dashboard with tRPC integration
- Forkable Next.js storefront templates
- Type-safe SDK for external consumption

### Starter Options Considered

| Option | Fit | Reason |
|--------|-----|--------|
| nestjs-turbo | Partial | Good base but missing Prisma, Shadcn, GSAP |
| Turborepo-Starter | Poor | Uses Drizzle instead of Prisma |
| Vercel Turborepo | Partial | No NestJS backend included |
| **Custom Monorepo** | **Best** | Full control, exact tech stack match |

### Selected Approach: Custom Turborepo Monorepo

**Rationale for Selection:**
- PRD specifies exact stack (NestJS + Next.js + Prisma + BullMQ)
- No existing starter matches all requirements
- Trafi's plugin/module architecture requires custom structure
- Storefront separation (forkable repos) is unique requirement
- Prisma 7 integration with latest TypeScript improvements

**Initialization Commands:**

```bash
# Create Turborepo structure
npx create-turbo@latest trafi --package-manager pnpm

# Add NestJS API app
cd apps && npx @nestjs/cli@latest new api --strict --skip-git

# Add Next.js Dashboard with Shadcn
npx create-next-app@latest dashboard --typescript --tailwind --app --src-dir
cd dashboard && npx shadcn@latest init

# Initialize Prisma package (API-side only)
mkdir -p packages/db && cd packages/db
npm init -y && npx prisma@latest init
```

### Architectural Decisions Provided by Stack

**Language & Runtime:**
- TypeScript 5.x strict mode across all packages
- Node.js 20 LTS runtime
- pnpm for package management (faster, disk-efficient)

**Styling Solution:**
- Tailwind CSS 4.x with CSS variables for theming
- Shadcn UI components (copy-paste, customizable)
- GSAP for animations with `prefers-reduced-motion` support

**Build Tooling:**
- Turborepo for task orchestration and caching
- SWC for TypeScript compilation (faster than tsc)
- Next.js build optimization (static + streaming)

**Testing Framework:**
- Vitest for unit tests (Vite-native, fast)
- Playwright for E2E tests (cross-browser)
- Jest for NestJS integration tests

**Code Organization:**
- Monorepo with apps/ and packages/ separation
- Shared configs in packages/@trafi/config
- Database layer isolated in apps/api (Prisma) (API-only access)
- API versioning via URL path (/v1/, /v2/)

**Development Experience:**
- Hot reload across all apps (Turborepo dev)
- Type checking in watch mode
- Prisma Studio for database inspection (dev only)
- tRPC panel for API exploration

**Note:** Project initialization using these commands should be the first implementation story. Storefront template will be initialized as separate repository for forkability.

## Fundamental Architectural Rules

### Rule #1: Frontend-Database Isolation (CRITICAL)

**Frontends NEVER connect directly to the database.**

All data access flows through the API layer:

```
Dashboard (Next.js) ──tRPC──► API (NestJS) ──Prisma──► PostgreSQL
Storefront (Next.js) ──SDK/REST──► API (NestJS) ──Prisma──► PostgreSQL
External Clients ──SDK/REST──► API (NestJS) ──Prisma──► PostgreSQL
```

**Prohibited patterns:**
- No Prisma client imports in Dashboard or Storefront
- No direct database queries from Next.js Server Components
- No database connection strings in frontend environment variables

**Enforced via:**
- Prisma package (`apps/api` (Prisma is API-only)) only imported by API app
- ESLint rules to prevent Prisma imports in apps/dashboard and apps/storefront
- TypeScript project references configured to prevent cross-boundary imports

### Rule #2: Context7 MCP for Library Documentation

**Always use Context7 MCP to retrieve up-to-date documentation for libraries.**

When implementing features that use external libraries (NestJS, Prisma, Next.js, tRPC, BullMQ, Stripe, etc.):
1. Query Context7 to resolve the library ID
2. Fetch current documentation and code examples
3. Implement following the latest patterns and best practices

This ensures implementations stay current with library updates and avoid deprecated patterns.

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                  │
├─────────────────────────────────────────────────────────────────┤
│  Dashboard        │  Storefront       │  External (SDK)         │
│  (Next.js)        │  (Next.js)        │  (TypeScript/REST)      │
└────────┬──────────┴────────┬──────────┴────────┬────────────────┘
         │ tRPC              │ REST/SDK          │ REST/SDK
         ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API LAYER (NestJS)                         │
├─────────────────────────────────────────────────────────────────┤
│  tRPC Router      │  REST Controllers │  WebSocket Gateway      │
│  (internal)       │  (external/SDK)   │  (Jobs, real-time)      │
└────────┬──────────┴────────┬──────────┴────────┬────────────────┘
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER (NestJS)                       │
├─────────────────────────────────────────────────────────────────┤
│  Commerce Cores   │  Profit Engine    │  Module System          │
│  (9 modules)      │  (Autopilot)      │  (plugins)              │
└────────┬──────────┴────────┬──────────┴────────┬────────────────┘
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATA LAYER (Prisma)                          │
├─────────────────────────────────────────────────────────────────┤
│   database        │  Connection Pool  │  Per-tenant DB          │
│  (Prisma Client)  │  (PgBouncer)      │  isolation              │
└────────┬──────────┴────────┬──────────┴────────┬────────────────┘
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE                               │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL       │  Redis            │  Object Storage         │
│  (per-tenant)     │  (BullMQ/cache)   │  (media)                │
└─────────────────────────────────────────────────────────────────┘
```

## Profit Engine: 3 Planes Architecture

_Added in revision 2026-01-14 - Aligns with PRD v2 "Trafi Autopilot OS" concept_

The Profit Engine (Autopilot) operates through three distinct planes that form a complete autonomous execution system:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA PLANE                                  │
│  Instrumentation & Profiling Layer                                  │
│  ─────────────────────────────────────────────────────────────────  │
│  • Standardized event instrumentation across storefront             │
│  • Customer journey tracking (page views, cart actions, checkout)   │
│  • Performance metrics and funnel completion rates                  │
│  • SKU-level margin and inventory data                              │
│  Location: modules/profit-engine/collector/                         │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       DECISION PLANE                                │
│  AI + Statistical Proof Layer                                       │
│  ─────────────────────────────────────────────────────────────────  │
│  • Diagnosis engine: Identifies conversion bottlenecks              │
│  • Recommendation engine: Proposes evidence-based actions           │
│  • Statistical validation: CUPED, holdout groups, confidence        │
│  • Profit simulation: Predicts margin impact before execution       │
│  Location: modules/profit-engine/doctor/                            │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       EXECUTION PLANE                               │
│  Feature Flags + Background Jobs Layer                              │
│  ─────────────────────────────────────────────────────────────────  │
│  • Feature flags for A/B testing and gradual rollout                │
│  • BullMQ jobs for async execution (emails, webhooks, recovery)     │
│  • Automatic rollback when metrics decline                          │
│  • Audit logging of all executed actions                            │
│  Location: modules/profit-engine/guardrails/ + modules/jobs/        │
└─────────────────────────────────────────────────────────────────────┘
```

### Plane Interactions

| Flow | Description | Implementation |
|------|-------------|----------------|
| **Data → Decision** | Events flow for analysis | EventEmitter + BullMQ queues |
| **Decision → Execution** | Approved recommendations become actions | ChangeSet → Feature Flags |
| **Execution → Data** | Actions generate new events | Event instrumentation loop |
| **Closed Loop** | Statistical proof determines permanent vs rollback | CUPED analysis + auto-rollback |

### Why 3 Planes Matter Architecturally

- **Separation of concerns:** Each plane can evolve independently
- **Clear boundaries:** Easier to test, debug, and extend
- **Progressive enhancement:** Stores can use Data Plane only (analytics) or full stack (Autopilot)
- **Module isolation:** Each plane maps to specific NestJS modules

