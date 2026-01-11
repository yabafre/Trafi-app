---
stepsCompleted: [1, 2, 3]
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
totalEpics: 14
totalStories: 144
---

# trafi-app - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for trafi-app, decomposing the requirements from the PRD, UX Design, and Architecture requirements into implementable stories.

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
- ARCH-7: Shared packages: @trafi/validators, @trafi/types, @trafi/db, @trafi/config
- ARCH-8: Local vs Global component pattern
- ARCH-9: Zod as primary validation library
- ARCH-13: JWT + NestJS Passport for authentication
- ARCH-14: NestJS Guards + Custom Decorators for RBAC
- ARCH-15: Custom Redis-based feature flags
- ARCH-16: Standardized API error format
- ARCH-21: OpenTelemetry as observability foundation
- ARCH-25: Money always in cents, IDs as cuid with prefixes
- ARCH-26: Events naming - domain.entity.action snake_case

**UX Design Requirements**
- UX-1: Dark mode as default identity for Dashboard
- UX-7: Bento grid layouts for dashboard metrics
- UX-9: Profit Engine "Propose -> Approve" workflow
- UX-10: Guest checkout as default, shipping visible from cart
- UX-11: Express checkout (Apple Pay/Google Pay) above fold
- UX-12: Cart recovery email sequence (37min, 24h, 48h delays)

### FR Coverage Map

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

## Epic List

### Epic 1: Foundation & Developer Bootstrap
Thomas peut creer un projet Trafi fonctionnel en 5 minutes avec CLI, monorepo configure, et seed data.
**FRs covered:** FR1, FR2, FR8 + ARCH-1 to ARCH-26

### Epic 2: Admin Authentication & Store Setup
Admin peut se connecter au dashboard, configurer le store, et gerer les acces utilisateurs avec RBAC.
**FRs covered:** FR35, FR36, FR37, FR38, FR39, FR40

### Epic 3: Product Catalog & Inventory
Merchant peut creer, editer, et organiser son catalogue produits complet avec gestion d'inventaire.
**FRs covered:** FR10, FR11, FR12, FR20

### Epic 4: Shopping Cart & Checkout
Buyer peut ajouter au panier, voir les frais de livraison en temps reel, et finaliser son achat en guest checkout.
**FRs covered:** FR13, FR14, FR15, FR16, FR17, FR21, FR22

### Epic 5: Payment Processing
Systeme gere les paiements Stripe complets avec 3DS, webhooks, remboursements, et audit trail.
**FRs covered:** FR46, FR47, FR48, FR49, FR50

### Epic 6: Order Management & Fulfillment
Merchant peut traiter, expedier, et suivre les commandes avec integration 3PL et gestion des retours.
**FRs covered:** FR18, FR19, FR51, FR52, FR53, FR54, FR55, FR56

### Epic 7: Customer Accounts & Wishlist
Buyer peut creer un compte (email, Google, Apple), gerer ses adresses, wishlist, et voir son historique.
**FRs covered:** FR41, FR42, FR43, FR44, FR45, FR79, FR80, FR81, FR82, FR83, FR84

### Epic 8: Profit Engine - Analytics & Recommendations
Merchant voit les metriques de conversion et recoit des recommandations d'optimisation avec rollback automatique.
**FRs covered:** FR23, FR24, FR25, FR26, FR27, FR28, FR29, FR30, FR31, FR32, FR63, FR64, FR65, FR66

### Epic 9: Profit Engine - Cart Recovery
Systeme envoie des emails de recuperation de panier abandonne avec restauration one-click.
**FRs covered:** FR33, FR34

### Epic 10: Privacy & Compliance
DPO peut gerer les demandes GDPR (recherche, export, suppression) avec audit trail complet et consent tracking.
**FRs covered:** FR57, FR58, FR59, FR60, FR61, FR62

### Epic 11: Platform Operations & Jobs
Ops peuvent monitorer la sante systeme, gerer les jobs asynchrones BullMQ, et diagnostiquer les problemes.
**FRs covered:** FR67, FR68, FR69, FR70, FR71, FR72, FR73, FR85, FR86, FR87

### Epic 12: SDK & API Experience
Developer dispose d'un SDK type-safe complet avec documentation, templates, et excellent DX.
**FRs covered:** FR3, FR4, FR6, FR7, FR9, FR88, FR89, FR90

### Epic 13: Module System & Extensibility
Developer peut creer, installer, et gerer des modules custom avec hot-reload et sandboxing.
**FRs covered:** FR5, FR91, FR92, FR93, FR94, FR95, FR96, FR97, FR98, FR99, FR100, FR101, FR102, FR103, FR104

### Epic 14: Cloud & Multi-tenancy
Merchant peut utiliser Trafi Cloud sans gerer l'infrastructure, avec migration Shopify automatisee.
**FRs covered:** FR74, FR75, FR76, FR77, FR78

---

## Epic 1: Foundation & Developer Bootstrap

Thomas peut creer un projet Trafi fonctionnel en 5 minutes avec CLI, monorepo configure, et seed data.

### Story 1.1: Initialize Turborepo Monorepo Structure

As a **Developer (Thomas)**,
I want **to scaffold a new Trafi project with a single CLI command**,
So that **I can start developing immediately with a properly structured monorepo**.

**Acceptance Criteria:**

**Given** a developer runs `npx create-trafi-app my-store`
**When** the CLI wizard prompts for project options
**Then** a Turborepo monorepo is created with:
- Root `package.json` with pnpm workspaces
- `turbo.json` with build, dev, lint, test pipelines
- `.nvmrc` specifying Node.js 20 LTS
- TypeScript 5.x strict mode configuration
- ESLint + Prettier configuration
**And** the structure includes `apps/` and `packages/` directories

### Story 1.2: Setup NestJS API Application

As a **Developer (Thomas)**,
I want **the API application to be configured with NestJS and essential middleware**,
So that **I have a production-ready backend foundation**.

**Acceptance Criteria:**

**Given** the monorepo is initialized
**When** the API app is scaffolded in `apps/api/`
**Then** it includes:
- NestJS 10.x with TypeScript
- Health check endpoint at `/health`
- OpenTelemetry instrumentation base (ARCH-21)
- Standardized error format (ARCH-16)
- Environment configuration via `@nestjs/config`
**And** running `pnpm dev --filter=api` starts the API on port 3001

### Story 1.3: Setup Next.js Dashboard Application

As a **Developer (Thomas)**,
I want **the Dashboard application to be configured with Next.js App Router**,
So that **I can build the admin interface with modern React patterns**.

**Acceptance Criteria:**

**Given** the monorepo is initialized
**When** the Dashboard app is scaffolded in `apps/dashboard/`
**Then** it includes:
- Next.js 14.x with App Router
- Tailwind CSS 4.x configuration
- Shadcn UI initialized with dark mode as default (UX-1)
- General Sans + Clash Display fonts (UX-2)
- Local/Global component pattern setup (ARCH-8)
**And** running `pnpm dev --filter=dashboard` starts on port 3000

### Story 1.4: Create Shared Packages Structure

As a **Developer (Thomas)**,
I want **shared packages for validators, types, and configuration**,
So that **I can reuse code across apps with type safety**.

**Acceptance Criteria:**

**Given** the monorepo structure exists
**When** shared packages are created
**Then** the following packages exist:
- `packages/validators` (@trafi/validators) with Zod schemas
- `packages/types` (@trafi/types) with shared TypeScript types
- `packages/config` (@trafi/config) with shared configuration
- `packages/db` (@trafi/db) with Prisma client
**And** packages are properly exported and importable by apps

### Story 1.5: Configure Prisma with PostgreSQL

As a **Developer (Thomas)**,
I want **Prisma configured with PostgreSQL and initial schema**,
So that **I have a type-safe database layer ready for development**.

**Acceptance Criteria:**

**Given** the `packages/db` package exists
**When** Prisma is configured
**Then** it includes:
- Prisma schema with PascalCase singular table naming (ARCH-22)
- camelCase column naming convention
- CUID IDs with prefixes configuration ready
- Money stored as integer cents (ARCH-25)
- Initial User and Store models for multi-tenancy foundation
**And** `pnpm db:push` applies schema to local PostgreSQL

### Story 1.6: Setup Test Infrastructure

As a **Developer (Thomas)**,
I want **test frameworks configured across the monorepo**,
So that **I can write and run tests from day one**.

**Acceptance Criteria:**

**Given** the monorepo structure exists
**When** test configuration is added
**Then**:
- Vitest is configured for unit tests in packages and frontend
- Jest is configured for NestJS integration tests
- Playwright is configured for E2E tests
- Coverage thresholds set to 70% (NFR-MAINT-1)
**And** `pnpm test` runs all tests across the monorepo

### Story 1.7: Seed Demo Data for Development

As a **Developer (Thomas)**,
I want **to populate the database with realistic demo data**,
So that **I can develop and test features without manual data entry**.

**Acceptance Criteria:**

**Given** the database schema is applied
**When** running `pnpm db:seed`
**Then** the database is populated with:
- Sample store with configuration
- Demo products with variants and pricing
- Sample categories and collections
- Test customer accounts
- Sample orders for testing order flows
**And** seed data is idempotent (can be run multiple times safely)

### Story 1.8: Docker Containerization Setup

As a **Developer (Thomas)**,
I want **Docker configuration for local development**,
So that **I can run all services consistently across environments**.

**Acceptance Criteria:**

**Given** the monorepo is complete
**When** Docker configuration is added
**Then** it includes:
- `docker-compose.yml` for local development
- PostgreSQL container with volume persistence
- Redis container for caching
- API and Dashboard container definitions
- Health check configurations
**And** `docker-compose up` starts all services

---

## Epic 2: Admin Authentication & Store Setup

Admin peut se connecter au dashboard, configurer le store, et gerer les acces utilisateurs avec RBAC.

### Story 2.1: Admin User Model and Authentication

As an **Admin**,
I want **to log in to the dashboard with email and password**,
So that **I can securely access my store's administration**.

**Acceptance Criteria:**

**Given** the Admin user model exists in the database
**When** an admin submits valid credentials on the login form
**Then** a JWT session is created and stored securely
**And** the admin is redirected to the dashboard home
**And** invalid credentials display an appropriate error message
**And** passwords are hashed with bcrypt (min 10 rounds)

### Story 2.2: Dashboard Authentication Guard

As a **System**,
I want **all dashboard routes protected by authentication**,
So that **only authenticated admins can access admin features**.

**Acceptance Criteria:**

**Given** an unauthenticated user attempts to access a dashboard route
**When** the request is processed
**Then** the user is redirected to the login page
**And** authenticated users can access protected routes
**And** session expiration triggers re-authentication
**And** CSRF protection is applied to all state-changing operations (NFR-SEC-11)

### Story 2.3: Role-Based Access Control (RBAC) Foundation

As an **Admin**,
I want **users to have specific roles with defined permissions**,
So that **I can control what each team member can do**.

**Acceptance Criteria:**

**Given** the RBAC system is implemented
**When** roles are defined (Owner, Admin, Editor, Viewer)
**Then** each role has specific permission sets:
- Owner: full access including billing and ownership transfer
- Admin: user management, settings, all commerce features
- Editor: product, order, customer management
- Viewer: read-only access to all data
**And** custom decorators enforce permissions on API endpoints
**And** unauthorized actions return 403 Forbidden

### Story 2.4: Admin User Management

As an **Owner/Admin**,
I want **to create, edit, and deactivate admin user accounts**,
So that **I can manage my team's access to the store**.

**Acceptance Criteria:**

**Given** an Owner or Admin is authenticated
**When** they access the Users management page
**Then** they can:
- View all users with their roles and status
- Invite new users via email
- Change user roles (within their permission level)
- Deactivate user accounts
**And** users cannot elevate permissions beyond their own role
**And** at least one Owner must always exist

### Story 2.5: API Key Management

As an **Admin**,
I want **to generate and manage API keys with scoped permissions**,
So that **I can integrate external services securely**.

**Acceptance Criteria:**

**Given** an Admin is authenticated
**When** they access API Keys settings
**Then** they can:
- Generate new API keys with selected permission scopes
- View existing keys (masked, showing only last 4 chars)
- Revoke API keys immediately
- Set expiration dates for keys
**And** API keys are stored hashed in the database
**And** generated keys are shown only once at creation

### Story 2.6: Tenant-Scoped Authorization

As a **System**,
I want **all API requests scoped to the authenticated tenant**,
So that **stores cannot access each other's data**.

**Acceptance Criteria:**

**Given** a multi-tenant system with isolated stores
**When** any API request is made
**Then** the request is automatically scoped to the authenticated store
**And** database queries include tenant filtering
**And** attempting to access another tenant's resources returns 404
**And** audit logs capture tenant context for all operations (NFR-SEC-7)

### Story 2.7: Store Settings Configuration

As an **Owner/Admin**,
I want **to configure basic store settings**,
So that **my store reflects my brand and business requirements**.

**Acceptance Criteria:**

**Given** an Owner or Admin is authenticated
**When** they access Store Settings
**Then** they can configure:
- Store name and description
- Default currency and locale
- Contact email and support information
- Timezone settings
**And** changes are saved and reflected across the store immediately

### Story 2.8: Ownership Transfer

As an **Owner**,
I want **to transfer store ownership to another admin**,
So that **I can hand over control when needed**.

**Acceptance Criteria:**

**Given** the current Owner initiates a transfer
**When** they select a target admin and confirm
**Then** the target admin receives Owner role
**And** the initiating user is demoted to Admin
**And** email confirmation is sent to both parties
**And** transfer is logged in the audit trail
**And** transfer requires password re-confirmation for security

---

## Epic 3: Product Catalog & Inventory

Merchant peut creer, editer, et organiser son catalogue produits complet avec gestion d'inventaire.

### Story 3.1: Product Model and Basic CRUD

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

### Story 3.2: Product Variants Management

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

### Story 3.3: Product Media Upload

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

### Story 3.4: Categories Management

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

### Story 3.5: Collections Management

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

### Story 3.6: Product Pricing and Tax Rules

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

### Story 3.7: Inventory Tracking

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

### Story 3.8: Oversell Prevention

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

---

## Epic 4: Shopping Cart & Checkout

Buyer peut ajouter au panier, voir les frais de livraison en temps reel, et finaliser son achat en guest checkout.

### Story 4.1: Cart Model and Session Management

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

### Story 4.2: Add to Cart Functionality

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

### Story 4.3: Cart Management and Updates

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

### Story 4.4: Shipping Zones and Rates Configuration

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

### Story 4.5: Shipping Rate Calculation

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

### Story 4.6: Tax Calculation Engine

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

### Story 4.7: Checkout Flow - Guest Checkout

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

### Story 4.8: Checkout Flow - Address and Shipping Selection

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

### Story 4.9: Order Creation and Confirmation

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

---

## Epic 5: Payment Processing

Systeme gere les paiements Stripe complets avec 3DS, webhooks, remboursements, et audit trail.

### Story 5.1: Stripe Account Connection

As a **Merchant**,
I want **to connect my Stripe account to the store**,
So that **I can accept payments from customers**.

**Acceptance Criteria:**

**Given** a Merchant is in Payment Settings
**When** they initiate Stripe connection
**Then** they are redirected to Stripe OAuth flow
**And** upon authorization, Stripe credentials are securely stored
**And** credentials are encrypted at rest (NFR-SEC-1)
**And** connection status is visible in dashboard
**And** test mode vs live mode is clearly indicated

### Story 5.2: Stripe Elements Integration

As a **Buyer (Emma)**,
I want **to enter payment details securely**,
So that **my card information is protected**.

**Acceptance Criteria:**

**Given** a buyer is at the payment step
**When** the payment form loads
**Then** Stripe Elements is rendered for card input
**And** card data never touches our servers (PCI SAQ-A)
**And** real-time validation shows card errors
**And** supported card brands are displayed
**And** the form is accessible via keyboard (NFR-A11Y-3)

### Story 5.3: Express Checkout (Apple Pay / Google Pay)

As a **Buyer (Emma)**,
I want **to pay with Apple Pay or Google Pay**,
So that **I can complete purchase in seconds**.

**Acceptance Criteria:**

**Given** a buyer is on a supported device/browser
**When** checkout loads
**Then** Apple Pay / Google Pay buttons appear above fold (UX-11)
**And** clicking triggers native payment sheet
**And** successful authorization creates the payment
**And** unsupported devices gracefully hide these options
**And** express checkout includes shipping address collection

### Story 5.4: Payment Processing with 3DS

As a **System**,
I want **to process payments with 3DS when required**,
So that **transactions are secure and compliant**.

**Acceptance Criteria:**

**Given** a buyer submits payment
**When** 3DS authentication is required
**Then** the buyer is redirected to 3DS challenge
**And** upon successful authentication, payment completes
**And** failed 3DS shows appropriate error message
**And** payment intent uses idempotency keys (NFR-INT-9)
**And** the entire flow handles redirects gracefully

### Story 5.5: Payment Webhook Handler

As a **System**,
I want **to receive and process Stripe webhooks**,
So that **order status stays synchronized with payment status**.

**Acceptance Criteria:**

**Given** Stripe sends a webhook event
**When** the webhook endpoint receives it
**Then** signature is verified via HMAC-SHA256 (NFR-INT-6)
**And** events are processed idempotently by event_id (NFR-INT-8)
**And** handled events include:
- `payment_intent.succeeded` -> order confirmed
- `payment_intent.payment_failed` -> order marked failed
- `charge.refunded` -> order updated with refund
**And** unhandled events are logged but don't error

### Story 5.6: Payment Failure Handling

As a **Buyer (Emma)**,
I want **clear feedback when payment fails**,
So that **I can fix the issue and try again**.

**Acceptance Criteria:**

**Given** a payment attempt fails
**When** the error is returned
**Then** user-friendly error message is displayed
**And** specific guidance is given (e.g., "Card declined - try another card")
**And** the buyer can retry without re-entering all details
**And** failed attempts are logged for merchant visibility
**And** repeated failures trigger rate limiting

### Story 5.7: Refund Processing

As a **Merchant**,
I want **to issue full or partial refunds**,
So that **I can handle returns and disputes**.

**Acceptance Criteria:**

**Given** a Merchant views a paid order
**When** they initiate a refund
**Then** they can specify:
- Full refund or partial amount
- Reason for refund
- Whether to restock inventory
**And** refund is processed via Stripe API
**And** order status updates to reflect refund
**And** customer receives refund confirmation email
**And** refund amount cannot exceed original payment

### Story 5.8: Payment Audit Trail

As a **System**,
I want **to log all payment events**,
So that **there's a complete audit trail for compliance**.

**Acceptance Criteria:**

**Given** any payment-related action occurs
**When** the action completes
**Then** an audit log entry is created with:
- Timestamp
- Actor (system, admin, or customer reference)
- Action type (payment, refund, failure, etc.)
- Amount and currency
- Stripe event/transaction ID
- Order reference
**And** logs are immutable and retained per policy
**And** logs are queryable for merchant support

---

## Epic 6: Order Management & Fulfillment

Merchant peut traiter, expedier, et suivre les commandes avec integration 3PL et gestion des retours.

### Story 6.1: Order List and Search

As a **Merchant**,
I want **to view and search all orders**,
So that **I can manage my business efficiently**.

**Acceptance Criteria:**

**Given** a Merchant accesses the Orders section
**When** the order list loads
**Then** they see orders with:
- Order number, date, customer name
- Order status, payment status, fulfillment status
- Total amount
**And** orders can be filtered by status, date range, customer
**And** orders can be searched by order number or customer email
**And** pagination handles large order volumes

### Story 6.2: Order Detail View

As a **Merchant**,
I want **to view complete order details**,
So that **I can process and fulfill orders correctly**.

**Acceptance Criteria:**

**Given** a Merchant clicks on an order
**When** the order detail loads
**Then** they see:
- Customer information (shipping/billing address, email)
- Line items with variants, quantities, prices
- Payment details and transaction history
- Fulfillment status per item
- Order timeline with all events
**And** actions are available based on order status

### Story 6.3: Order Status Transitions

As a **Merchant**,
I want **to update order status through its lifecycle**,
So that **orders progress from confirmed to completed**.

**Acceptance Criteria:**

**Given** an order exists
**When** the Merchant changes status
**Then** valid transitions are enforced:
- Confirmed -> Processing -> Shipped -> Delivered
- Any status -> Cancelled (with restrictions)
**And** status changes are logged in order timeline
**And** invalid transitions are prevented with clear messaging
**And** status changes trigger appropriate notifications

### Story 6.4: Order Fulfillment - Manual

As a **Merchant**,
I want **to mark orders as fulfilled with tracking info**,
So that **customers know their order is on the way**.

**Acceptance Criteria:**

**Given** a confirmed/processing order
**When** the Merchant fulfills the order
**Then** they can:
- Select items to fulfill (partial or full)
- Enter carrier and tracking number
- Add internal fulfillment notes
**And** fulfillment creates a shipment record
**And** order status updates to "Shipped" when fully fulfilled
**And** partial fulfillment is tracked separately

### Story 6.5: Shipping Notification Emails

As a **System**,
I want **to send shipping notifications with tracking**,
So that **customers can track their orders**.

**Acceptance Criteria:**

**Given** an order is marked as shipped
**When** fulfillment is completed
**Then** an email is sent to the customer with:
- Order summary
- Shipping carrier and tracking number
- Tracking link (carrier-specific)
- Estimated delivery date if available
**And** email uses store branding
**And** email sending is queued via job system

### Story 6.6: Fulfillment Webhooks for 3PL

As a **3PL Partner**,
I want **to receive order data via webhooks**,
So that **I can fulfill orders automatically**.

**Acceptance Criteria:**

**Given** a Merchant has configured 3PL webhook
**When** an order is ready for fulfillment
**Then** a webhook is sent with:
- Order details and line items
- Shipping address
- Requested shipping method
**And** webhooks are signed with HMAC-SHA256 (NFR-INT-6)
**And** failed deliveries retry with exponential backoff (NFR-INT-5)
**And** webhook events include `order.created`, `order.updated`

### Story 6.7: 3PL Tracking Update API

As a **3PL Partner**,
I want **to update tracking information via API**,
So that **the store has real-time shipping data**.

**Acceptance Criteria:**

**Given** a 3PL has an API key with fulfillment scope
**When** they POST tracking updates
**Then** the API accepts:
- Order ID or external reference
- Carrier code and tracking number
- Shipment status updates
**And** updates trigger customer notifications
**And** API validates the 3PL has access to the order
**And** duplicate updates are handled idempotently

### Story 6.8: Return Authorization (RMA)

As a **Merchant**,
I want **to manage return requests**,
So that **I can handle returns systematically**.

**Acceptance Criteria:**

**Given** a delivered order
**When** the Merchant creates a return authorization
**Then** they can:
- Select items to be returned
- Specify return reason
- Generate RMA number
- Set return instructions
**And** RMA status tracks: Requested -> Approved -> Received -> Processed
**And** return can trigger refund when received
**And** inventory is optionally restocked on return

### Story 6.9: Return Policy Configuration

As a **Merchant**,
I want **to configure return policies**,
So that **customers know the return rules**.

**Acceptance Criteria:**

**Given** a Merchant accesses Return Settings
**When** they configure policies
**Then** they can set:
- Return window (days after delivery)
- Eligible product categories
- Return shipping responsibility (customer/merchant)
- Restocking fees if applicable
**And** policies are displayed during checkout
**And** RMA creation validates against active policy

---

## Epic 7: Customer Accounts & Wishlist

Buyer peut creer un compte (email, Google, Apple), gerer ses adresses, wishlist, et voir son historique.

### Story 7.1: Customer Registration with Email

As a **Buyer (Emma)**,
I want **to create an account with my email and password**,
So that **I can have a personalized shopping experience**.

**Acceptance Criteria:**

**Given** a buyer is on the registration page
**When** they submit email and password
**Then** account is created with:
- Email validation (format and uniqueness)
- Password strength requirements (min 8 chars, mixed case)
- Password hashed with bcrypt
**And** welcome email is sent
**And** buyer is automatically logged in
**And** any guest cart is merged with the new account

### Story 7.2: Customer Login and Session

As a **Buyer (Emma)**,
I want **to log in to my account**,
So that **I can access my saved information**.

**Acceptance Criteria:**

**Given** a registered buyer
**When** they submit valid credentials
**Then** a secure session is created
**And** session persists across browser closes (remember me)
**And** invalid credentials show appropriate error
**And** account lockout after 5 failed attempts (temporary)
**And** logout clears session completely

### Story 7.3: Password Reset Flow

As a **Buyer (Emma)**,
I want **to reset my password if I forget it**,
So that **I can regain access to my account**.

**Acceptance Criteria:**

**Given** a buyer requests password reset
**When** they enter their email
**Then** a reset link is sent (valid for 1 hour)
**And** link leads to password reset form
**And** submitting new password updates the account
**And** all existing sessions are invalidated
**And** confirmation email is sent after reset
**And** invalid/expired links show clear messaging

### Story 7.4: Google OAuth Authentication

As a **Buyer (Emma)**,
I want **to sign in with my Google account**,
So that **I can log in quickly without a new password**.

**Acceptance Criteria:**

**Given** a buyer clicks "Sign in with Google"
**When** they authorize on Google
**Then** account is created or linked automatically
**And** email from Google is used as identifier
**And** profile name is pre-filled from Google
**And** buyer is logged in upon return
**And** existing email account can be linked to Google

### Story 7.5: Sign in with Apple

As a **Buyer (Emma)**,
I want **to sign in with my Apple ID**,
So that **I can use Apple's privacy-focused authentication**.

**Acceptance Criteria:**

**Given** a buyer clicks "Sign in with Apple"
**When** they authorize on Apple
**Then** account is created or linked
**And** Apple's private relay email is supported
**And** configurable Services ID and redirect URLs (FR81)
**And** buyer is logged in upon return
**And** works on web flow (not just native apps)

### Story 7.6: Address Book Management

As a **Buyer (Emma)**,
I want **to save multiple shipping addresses**,
So that **I can checkout faster for different locations**.

**Acceptance Criteria:**

**Given** a logged-in buyer
**When** they access their address book
**Then** they can:
- Add new addresses with all required fields
- Edit existing addresses
- Delete addresses
- Set a default shipping address
- Set a default billing address
**And** addresses are available at checkout for quick selection
**And** maximum 10 addresses per account

### Story 7.7: Order History View

As a **Buyer (Emma)**,
I want **to view my past orders**,
So that **I can track purchases and reorder items**.

**Acceptance Criteria:**

**Given** a logged-in buyer
**When** they access order history
**Then** they see all their orders with:
- Order number and date
- Order status and total
- Items purchased (thumbnails)
**And** clicking an order shows full details
**And** orders are paginated for performance
**And** guest orders can be claimed by email match

### Story 7.8: Order Tracking

As a **Buyer (Emma)**,
I want **to track my order shipments**,
So that **I know when my order will arrive**.

**Acceptance Criteria:**

**Given** a buyer views an order with shipment
**When** tracking info is available
**Then** they see:
- Carrier name and tracking number
- Link to carrier tracking page
- Shipment status (if available via API)
- Estimated delivery date
**And** multiple shipments per order are shown separately

### Story 7.9: Returning Customer Identification

As a **System**,
I want **to identify returning customers across sessions**,
So that **their experience is personalized**.

**Acceptance Criteria:**

**Given** a customer has previously purchased
**When** they visit the store (logged in or via email match)
**Then** the system recognizes them
**And** logged-in customers see their saved preferences
**And** guest checkout with known email can show order history
**And** recognition enables personalized recommendations (future)
**And** privacy is respected (no tracking without consent)

### Story 7.10: Wishlist - Add and View

As a **Buyer (Emma)**,
I want **to save products to a wishlist**,
So that **I can remember items I want to buy later**.

**Acceptance Criteria:**

**Given** a buyer is viewing products
**When** they click the wishlist icon
**Then** the product is added to their wishlist
**And** visual feedback confirms the action (heart fills)
**And** wishlist persists across sessions (account-linked)
**And** anonymous users are prompted to log in
**And** one-click add without page reload (UX-84)

### Story 7.11: Wishlist Management

As a **Buyer (Emma)**,
I want **to manage my wishlist items**,
So that **I can organize products I'm interested in**.

**Acceptance Criteria:**

**Given** a buyer views their wishlist
**When** they manage items
**Then** they can:
- View all wishlist items with images and prices
- Remove items from wishlist
- Sort items by date added or price
- See if items are in stock or out of stock
**And** out-of-stock items are visually indicated
**And** price changes since adding are shown

### Story 7.12: Wishlist to Cart

As a **Buyer (Emma)**,
I want **to move wishlist items to my cart**,
So that **I can easily purchase saved items**.

**Acceptance Criteria:**

**Given** a buyer has items in wishlist
**When** they click "Add to Cart"
**Then** the item is added to cart with default variant
**And** item remains in wishlist (unless setting to remove)
**And** variant selection is available if multiple exist
**And** out-of-stock items show "Notify Me" instead
**And** bulk "Add All to Cart" is available

---

## Epic 8: Profit Engine - Analytics & Recommendations

Merchant voit les metriques de conversion et recoit des recommandations d'optimisation avec rollback automatique.

### Story 8.1: Event Instrumentation Schema

As a **System**,
I want **a standardized event schema for customer journey tracking**,
So that **all interactions are captured consistently**.

**Acceptance Criteria:**

**Given** the event system is designed
**When** events are defined
**Then** the schema includes:
- Event naming: `domain.entity.action` (ARCH-26)
- Common fields: timestamp, sessionId, userId, storeId
- Commerce events: page_view, product_view, add_to_cart, checkout_start, checkout_complete
- PostgreSQL table with partitioning for scale (ARCH-11)
**And** events are typed with Zod schemas
**And** schema supports custom properties per event type

### Story 8.2: Storefront Event Capture

As a **System**,
I want **to automatically capture customer journey events**,
So that **the Profit Engine has data to analyze**.

**Acceptance Criteria:**

**Given** a buyer interacts with the storefront
**When** key actions occur
**Then** events are captured for:
- Page views (with referrer, UTM params)
- Product views (with product ID, variant)
- Add to cart (with quantity, price)
- Checkout steps (shipping, payment)
- Order completion (with order value)
**And** events are sent asynchronously (no UX impact)
**And** events include session continuity tracking

### Story 8.3: Event Aggregation Pipeline

As a **System**,
I want **to aggregate raw events into analyzable metrics**,
So that **the Profit Engine can generate insights**.

**Acceptance Criteria:**

**Given** raw events are captured
**When** aggregation runs (scheduled job)
**Then** metrics are computed:
- Daily/weekly/monthly aggregates
- Funnel step conversion rates
- Average order value, cart abandonment rate
- Per-product and per-category metrics
**And** aggregation is incremental (not full recompute)
**And** aggregates are stored in optimized tables

### Story 8.4: Store Performance Dashboard

As a **Merchant (Sophie)**,
I want **to view key store metrics at a glance**,
So that **I understand my store's performance**.

**Acceptance Criteria:**

**Given** a Merchant accesses the Dashboard
**When** the home page loads
**Then** they see a Bento grid (UX-7) with:
- Total revenue (today, this week, this month)
- Order count and average order value
- Conversion rate trend
- Top selling products
- New vs returning customers
**And** metrics compare to previous period
**And** loading states use skeleton placeholders

### Story 8.5: Checkout Funnel Visualization

As a **Merchant (Sophie)**,
I want **to see my checkout funnel with drop-off points**,
So that **I know where customers are abandoning**.

**Acceptance Criteria:**

**Given** a Merchant views Analytics
**When** they access the Funnel view
**Then** they see visualization of:
- Cart -> Checkout -> Shipping -> Payment -> Confirmation
- Visitor count at each step
- Drop-off percentage between steps
- Highlighted problem areas (high drop-off)
**And** funnel is filterable by date range
**And** clicking a step shows detailed breakdown

### Story 8.6: Funnel Diagnostics Engine

As a **System**,
I want **to automatically diagnose conversion issues**,
So that **recommendations are data-driven**.

**Acceptance Criteria:**

**Given** funnel data is available
**When** diagnostics run
**Then** the system identifies:
- Unusual drop-off rates vs benchmarks
- Specific step problems (e.g., shipping step 40% drop)
- Correlation with factors (device, location, time)
- Potential causes ranked by likelihood
**And** diagnostics run automatically daily
**And** findings are stored for recommendation generation

### Story 8.7: Recommendation Generation

As a **System**,
I want **to generate actionable optimization recommendations**,
So that **merchants can improve conversion with guidance**.

**Acceptance Criteria:**

**Given** diagnostics have identified issues
**When** recommendations are generated
**Then** each recommendation includes:
- Clear title and description
- The problem it addresses
- Expected impact (estimated uplift %)
- Risk level (low/medium/high)
- Implementation method (feature flag, config change)
**And** recommendations are prioritized by impact/effort
**And** maximum 5 active recommendations at a time

### Story 8.8: Recommendation Review Interface

As a **Merchant (Sophie)**,
I want **to review Profit Engine recommendations**,
So that **I can decide which optimizations to try**.

**Acceptance Criteria:**

**Given** recommendations exist
**When** Merchant views Profit Engine section
**Then** they see recommendation cards with:
- What, Why, Expected Impact
- Safety info and rollback promise
- Approve / Reject / Learn More actions
**And** single-click approval starts the experiment (UX-9)
**And** rejected recommendations are archived
**And** "Learn More" expands detailed explanation

### Story 8.9: Feature Flag System

As a **System**,
I want **to execute optimizations via feature flags**,
So that **changes can be controlled and measured**.

**Acceptance Criteria:**

**Given** a recommendation is approved
**When** the experiment starts
**Then** a feature flag is created/activated
**And** flag controls the specific optimization
**And** traffic is split for A/B comparison (configurable %)
**And** flags are stored in Redis for fast lookup (ARCH-15)
**And** flag state is tenant-scoped

### Story 8.10: Statistical Measurement Engine

As a **System**,
I want **to measure optimization impact with statistical rigor**,
So that **results are trustworthy**.

**Acceptance Criteria:**

**Given** an experiment is running
**When** sufficient data is collected
**Then** the system calculates:
- Conversion rate for control vs variant
- Statistical significance (p-value)
- Confidence interval for uplift
- Sample size and power analysis
**And** minimum runtime before conclusion (7 days default)
**And** results are presented with confidence meter visualization

### Story 8.11: Automatic Rollback

As a **System**,
I want **to automatically rollback degrading experiments**,
So that **merchants are protected from harm**.

**Acceptance Criteria:**

**Given** an experiment shows negative results
**When** degradation exceeds threshold
**Then** the system automatically:
- Disables the feature flag
- Reverts to control behavior
- Notifies merchant of rollback
- Logs the rollback with reason
**And** rollback triggers if metrics drop >5% with significance
**And** rollback promise is visible before approval

### Story 8.12: Experiment Results and Proof

As a **Merchant (Sophie)**,
I want **to see proven results of experiments**,
So that **I trust the system's recommendations**.

**Acceptance Criteria:**

**Given** an experiment completes
**When** Merchant views results
**Then** they see:
- Clear outcome (Winner/Loser/Inconclusive)
- Uplift percentage with confidence interval
- Revenue impact estimation
- Visual comparison chart
**And** successful experiments can be made permanent
**And** results are stored for historical reference

### Story 8.13: Profit Guardrails Configuration

As a **Merchant (Sophie)**,
I want **to set margin and stock thresholds**,
So that **the system protects my profitability**.

**Acceptance Criteria:**

**Given** a Merchant accesses Profit Engine settings
**When** they configure guardrails
**Then** they can set:
- Minimum margin threshold per product/category
- Maximum discount limits
- Stock level protections
- Categories excluded from automation
**And** guardrails are checked before recommendation execution
**And** blocked recommendations explain why

### Story 8.14: Guardrails Enforcement

As a **System**,
I want **to block recommendations that violate guardrails**,
So that **merchant profitability is protected**.

**Acceptance Criteria:**

**Given** guardrails are configured
**When** a recommendation would violate them
**Then** the recommendation is blocked
**And** Merchant sees warning: "This would reduce margin on SKU-X below threshold"
**And** blocked recommendations can be force-approved (with confirmation)
**And** guardrail violations are logged

### Story 8.15: Profit Attribution Dashboard

As a **Merchant (Sophie)**,
I want **to see the ROI of Profit Engine optimizations**,
So that **I know the value it provides**.

**Acceptance Criteria:**

**Given** experiments have completed
**When** Merchant views Profit Engine dashboard
**Then** they see:
- Total attributed revenue uplift
- Number of successful experiments
- Cumulative conversion improvement
- ROI of Profit Engine subscription
**And** attribution is calculated conservatively
**And** time-based trends show improvement over time

---

## Epic 9: Profit Engine - Cart Recovery

Systeme envoie des emails de recuperation de panier abandonne avec restauration one-click.

### Story 9.1: Abandoned Cart Detection

As a **System**,
I want **to detect abandoned carts**,
So that **recovery emails can be triggered**.

**Acceptance Criteria:**

**Given** a buyer has items in cart and provided email
**When** they leave without completing checkout
**Then** the cart is marked as abandoned after 30 minutes of inactivity
**And** abandonment is detected via:
- Checkout started but not completed
- Browser close during checkout
- Session timeout
**And** carts without email are tracked but not emailable
**And** completed orders clear the abandonment flag

### Story 9.2: Recovery Email Sequence Configuration

As a **Merchant**,
I want **to configure cart recovery email timing**,
So that **I can optimize for my audience**.

**Acceptance Criteria:**

**Given** a Merchant accesses Recovery Settings
**When** they configure the sequence
**Then** they can set:
- Email 1 delay (default: 37 minutes)
- Email 2 delay (default: 24 hours)
- Email 3 delay (default: 48 hours)
- Enable/disable each email
- Maximum emails per abandoned cart
**And** defaults follow UX-12 best practices
**And** sequence can be disabled entirely

### Story 9.3: Recovery Email Templates

As a **Merchant**,
I want **to customize recovery email content**,
So that **emails match my brand voice**.

**Acceptance Criteria:**

**Given** a Merchant accesses Email Templates
**When** they edit recovery emails
**Then** they can customize:
- Subject line (with merge tags)
- Email body with product image placeholder
- Call-to-action button text
- Optional discount code for Email 2/3
**And** preview shows rendered email with sample data
**And** templates use store branding (logo, colors)

### Story 9.4: Recovery Email Job Scheduling

As a **System**,
I want **to schedule and send recovery emails**,
So that **abandoned carts are recovered automatically**.

**Acceptance Criteria:**

**Given** a cart is marked as abandoned
**When** the configured delay passes
**Then** a job is queued to send the recovery email
**And** email includes:
- Product images from the cart
- Cart total and item count
- One-click recovery link
**And** subsequent emails are cancelled if cart is recovered
**And** jobs use exponential backoff on failure (FR86)

### Story 9.5: Magic Link Cart Restoration

As a **Buyer (Emma)**,
I want **to restore my cart with one click**,
So that **I can easily complete my purchase**.

**Acceptance Criteria:**

**Given** a buyer receives a recovery email
**When** they click the recovery link
**Then** they are taken to the storefront
**And** their cart is automatically restored with all items
**And** checkout page is pre-loaded (ready to pay)
**And** link is valid for 7 days
**And** link is single-use or tied to session for security
**And** expired links show friendly message with store link

### Story 9.6: Recovery Attribution Tracking

As a **System**,
I want **to track cart recovery attribution**,
So that **merchants see the value of recovery emails**.

**Acceptance Criteria:**

**Given** a cart is recovered via email link
**When** the order is completed
**Then** the order is attributed to:
- Cart recovery (vs organic)
- Specific email in sequence (1, 2, or 3)
- Time to recovery
**And** attribution is visible in order details
**And** aggregate stats show in Profit Engine dashboard

### Story 9.7: Recovery Analytics Dashboard

As a **Merchant (Sophie)**,
I want **to see cart recovery performance**,
So that **I know if recovery emails are working**.

**Acceptance Criteria:**

**Given** recovery emails have been sent
**When** Merchant views Recovery Analytics
**Then** they see:
- Total abandoned carts in period
- Emails sent per sequence step
- Open rates and click rates
- Recovered carts count and rate
- Revenue recovered
**And** metrics are filterable by date range
**And** comparison to previous period is shown

### Story 9.8: Recovery Email Unsubscribe

As a **Buyer (Emma)**,
I want **to unsubscribe from recovery emails**,
So that **I control my email preferences**.

**Acceptance Criteria:**

**Given** a buyer receives a recovery email
**When** they click unsubscribe
**Then** they are removed from recovery sequences
**And** unsubscribe is immediate and confirmed
**And** preference is stored per email address
**And** unsubscribe does not affect transactional emails
**And** compliance with email regulations (CAN-SPAM, GDPR)

---

## Epic 10: Privacy & Compliance

DPO peut gerer les demandes GDPR (recherche, export, suppression) avec audit trail complet et consent tracking.

### Story 10.1: Privacy Manager Role

As an **Owner/Admin**,
I want **to assign Privacy Manager permissions**,
So that **designated staff can handle data requests**.

**Acceptance Criteria:**

**Given** the RBAC system exists
**When** Privacy Manager role is assigned
**Then** the user can:
- Access Privacy Center in dashboard
- Search customer data
- Process export and erasure requests
- View privacy audit logs
**And** role is separate from other admin functions
**And** Privacy Manager actions are logged with actor ID

### Story 10.2: Customer Data Search

As a **Privacy Manager**,
I want **to search and view customer data by email**,
So that **I can respond to data access requests**.

**Acceptance Criteria:**

**Given** a Privacy Manager accesses Privacy Center
**When** they search by email address
**Then** they see all data associated with that email:
- Customer profile information
- Order history
- Addresses
- Wishlist items
- Consent records
- Cart data (if exists)
**And** search is logged in audit trail
**And** partial matches are not shown (exact email only)

### Story 10.3: GDPR Data Export

As a **Privacy Manager**,
I want **to export customer data in GDPR-compliant format**,
So that **I can fulfill Subject Access Requests (SAR)**.

**Acceptance Criteria:**

**Given** a customer's data is found
**When** Privacy Manager initiates export
**Then** the system generates:
- JSON file with all personal data
- Human-readable PDF summary
- Data categories clearly labeled
- Timestamp of export
**And** export is generated asynchronously (job)
**And** download link is sent to Privacy Manager
**And** export request is logged in audit trail

### Story 10.4: Data Erasure Request Processing

As a **Privacy Manager**,
I want **to process erasure requests**,
So that **I can comply with GDPR right to be forgotten**.

**Acceptance Criteria:**

**Given** an erasure request is received
**When** Privacy Manager initiates deletion
**Then** the system:
- Deletes/anonymizes personal data
- Retains legally required data (invoices, tax records)
- Marks customer record as "erased"
- Documents what was deleted vs retained
**And** legal retention periods are enforced (configurable)
**And** erasure is irreversible with confirmation required
**And** erasure is logged with reason and legal basis

### Story 10.5: Consent Tracking System

As a **System**,
I want **to track consent status per data category**,
So that **data processing is lawful**.

**Acceptance Criteria:**

**Given** consent categories are defined
**When** a customer provides or withdraws consent
**Then** the system records:
- Consent category (marketing, analytics, etc.)
- Status (granted/withdrawn)
- Timestamp
- Method (checkbox, banner, etc.)
- Version of privacy policy accepted
**And** consent can be queried before processing
**And** consent changes are immutable (append-only log)

### Story 10.6: Customer Consent Management

As a **Buyer (Emma)**,
I want **to manage my consent preferences**,
So that **I control how my data is used**.

**Acceptance Criteria:**

**Given** a logged-in customer
**When** they access Privacy Settings
**Then** they can:
- View current consent status per category
- Grant or withdraw consent
- See what each category means
- Download their consent history
**And** changes take effect immediately
**And** withdrawal doesn't affect past lawful processing

### Story 10.7: Cookie Consent Banner

As a **Buyer (Emma)**,
I want **to control cookie preferences**,
So that **I decide what tracking is allowed**.

**Acceptance Criteria:**

**Given** a new visitor arrives at the storefront
**When** the page loads
**Then** a cookie consent banner appears with:
- Clear explanation of cookie categories
- Accept All / Reject All / Customize options
- Link to privacy policy
**And** essential cookies don't require consent
**And** choice is remembered for future visits
**And** banner meets GDPR/ePrivacy requirements

### Story 10.8: Cookie Consent Configuration

As a **Merchant**,
I want **to configure cookie consent settings**,
So that **the banner matches my compliance needs**.

**Acceptance Criteria:**

**Given** a Merchant accesses Privacy Settings
**When** they configure cookie consent
**Then** they can:
- Customize banner text and styling
- Define cookie categories
- Set default state (opt-in vs opt-out by region)
- Configure consent expiration period
**And** preview shows banner appearance
**And** configuration is region-aware (GDPR vs CCPA)

### Story 10.9: Data Operation Audit Log

As a **System**,
I want **to log all data operations**,
So that **there's a complete audit trail**.

**Acceptance Criteria:**

**Given** any operation on personal data occurs
**When** the operation completes
**Then** an audit entry is created with:
- Timestamp (ISO 8601)
- Actor (user ID, system, or API key)
- Operation type (read, export, delete, update)
- Affected data categories
- Legal basis (consent, legitimate interest, etc.)
- Request reference (SAR number if applicable)
**And** audit logs are immutable
**And** logs are retained per legal requirements
**And** logs are searchable by Privacy Manager

---

## Epic 11: Platform Operations & Jobs

Ops peuvent monitorer la sante systeme, gerer les jobs asynchrones BullMQ, et diagnostiquer les problemes.

### Story 11.1: BullMQ Job Queue Setup

As a **System**,
I want **a reliable job queue for async operations**,
So that **emails, webhooks, and long tasks don't block requests**.

**Acceptance Criteria:**

**Given** the platform needs async processing
**When** BullMQ is configured
**Then** the system has:
- Redis-backed queue with named queues per job type
- Worker processes for job execution
- Job serialization with tenant context
- Configurable concurrency per queue
**And** queues are tenant-isolated where needed
**And** connection pooling prevents Redis exhaustion

### Story 11.2: Job Retry with Exponential Backoff

As a **System**,
I want **failed jobs to retry automatically**,
So that **transient failures are handled gracefully**.

**Acceptance Criteria:**

**Given** a job fails during execution
**When** retry logic is triggered
**Then** the job retries with:
- Exponential backoff (1s, 2s, 4s, 8s, etc.)
- Maximum retry attempts (configurable, default 5)
- Jitter to prevent thundering herd
**And** each attempt is logged with error details
**And** final failure moves job to dead-letter queue
**And** retry count is visible in job metadata

### Story 11.3: Dead-Letter Queue Management

As an **Ops**,
I want **to manage jobs that have permanently failed**,
So that **I can investigate and retry or dismiss them**.

**Acceptance Criteria:**

**Given** jobs have exhausted retries
**When** Ops views the dead-letter queue
**Then** they can:
- See all failed jobs with error messages
- View job payload and metadata
- Retry individual jobs
- Bulk retry or delete jobs
- Filter by job type, date, error
**And** DLQ is monitored for alerting
**And** old DLQ entries auto-expire (configurable retention)

### Story 11.4: Queue Status Dashboard

As an **Ops**,
I want **to view queue health in real-time**,
So that **I can identify processing bottlenecks**.

**Acceptance Criteria:**

**Given** jobs are being processed
**When** Ops views Queue Dashboard
**Then** they see per queue:
- Waiting jobs count
- Active jobs count
- Completed (recent) count
- Failed count
- Processing rate (jobs/minute)
**And** charts show trends over time
**And** alerts highlight unhealthy queues

### Story 11.5: System Health Dashboard

As an **Ops**,
I want **a real-time system health overview**,
So that **I can monitor platform status at a glance**.

**Acceptance Criteria:**

**Given** the platform is running
**When** Ops accesses Health Dashboard
**Then** they see:
- Service status (API, Dashboard, Workers)
- Database connection health
- Redis connection health
- Overall error rate (last hour)
- Request latency percentiles (p50, p95, p99)
**And** status indicators are color-coded (green/yellow/red)
**And** dashboard auto-refreshes (configurable interval)

### Story 11.6: Per-Tenant Metrics

As an **Ops**,
I want **to view metrics broken down by tenant**,
So that **I can identify tenant-specific issues**.

**Acceptance Criteria:**

**Given** multiple tenants are active
**When** Ops views Tenant Metrics
**Then** they see per tenant:
- Request count and error rate
- API latency (p95)
- Active jobs and queue depth
- Database query performance
- Storage usage
**And** tenants can be sorted by any metric
**And** problematic tenants are highlighted

### Story 11.7: Event Flow Health Indicator

As an **Ops**,
I want **to see per-store instrumentation health**,
So that **I know if Profit Engine data is flowing**.

**Acceptance Criteria:**

**Given** stores have event instrumentation
**When** Ops views Event Health
**Then** they see per store:
- Events received (last hour/day)
- Event types distribution
- Gap detection (missing expected events)
- Data freshness indicator
**And** unhealthy stores are flagged
**And** health is prerequisite for Profit Engine (NFR-REL-6)

### Story 11.8: SLO Monitoring and Alerting

As a **System**,
I want **to alert when SLO thresholds are violated**,
So that **issues are caught before customers notice**.

**Acceptance Criteria:**

**Given** SLOs are defined (availability, latency)
**When** metrics breach thresholds
**Then** alerts are triggered via:
- Slack notification
- PagerDuty (for critical)
- Dashboard banner
**And** error budget tracking shows remaining budget
**And** alerts include context (which metric, how severe)
**And** alert fatigue is prevented (deduplication, grouping)

### Story 11.9: Synthetic Monitoring

As a **System**,
I want **synthetic checks for critical paths**,
So that **failures are detected proactively**.

**Acceptance Criteria:**

**Given** critical paths are defined
**When** synthetic monitoring runs
**Then** it executes:
- API health check every 1 minute
- Checkout funnel ping every 5 minutes
- Database connectivity check
- Redis connectivity check
**And** failures trigger immediate alerts
**And** results are logged for trend analysis
**And** checks run from external location (not internal)

### Story 11.10: Support Mode Access

As an **Ops**,
I want **to access tenant stores in read-only mode**,
So that **I can help merchants troubleshoot issues**.

**Acceptance Criteria:**

**Given** a merchant requests support
**When** Ops activates support mode
**Then** they can:
- View tenant dashboard as read-only
- See all data the merchant sees
- Cannot modify any data
- Access is time-limited (auto-expires)
**And** support access is logged with reason
**And** merchant can revoke access anytime
**And** access requires explicit merchant consent

### Story 11.11: Diagnostic Report Generation

As an **Ops**,
I want **to generate diagnostic reports for merchants**,
So that **I can provide detailed support**.

**Acceptance Criteria:**

**Given** a support case exists
**When** Ops generates a diagnostic report
**Then** the report includes:
- Store configuration summary
- Recent error logs (sanitized)
- Performance metrics for period
- Event flow health status
- Recommendations for issues found
**And** report excludes sensitive data (PII, credentials)
**And** report is downloadable PDF

### Story 11.12: Deployment Rollback

As an **Ops**,
I want **to rollback to a previous deployment version**,
So that **I can quickly recover from bad deploys**.

**Acceptance Criteria:**

**Given** a deployment causes issues
**When** Ops initiates rollback
**Then** the system:
- Lists recent deployment versions
- Allows selection of target version
- Executes rollback with zero downtime
- Verifies health after rollback
**And** rollback is logged with reason
**And** database migrations are considered (forward-only warning)
**And** rollback can be scoped (API only, full platform)

---

## Epic 12: SDK & API Experience

Developer dispose d'un SDK type-safe complet avec documentation, templates, et excellent DX.

### Story 12.1: SDK Package Structure

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

### Story 12.2: Storefront SDK Client

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

### Story 12.3: Admin SDK Client

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

### Story 12.4: SDK Safe Defaults

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

### Story 12.5: SDK Error Handling

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

### Story 12.6: Event Instrumentation SDK

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

### Story 12.7: Next.js Storefront Template

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

### Story 12.8: API Documentation Generation

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

### Story 12.9: SDK Code Examples

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

### Story 12.10: SDK Version Management

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

### Story 12.11: API Key Scopes Documentation

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

---

## Epic 13: Module System & Extensibility

Developer peut creer, installer, et gerer des modules custom avec hot-reload et sandboxing.

### Story 13.1: Module Manifest Schema

As a **Developer (Thomas)**,
I want **a clear module manifest format**,
So that **I can define my module's capabilities**.

**Acceptance Criteria:**

**Given** a developer creates a module
**When** they define the manifest
**Then** `trafi-module.json` includes:
- name, version, description
- author and license
- trafi version compatibility
- entry points (backend, dashboard)
- required permissions
- database migrations path
- event subscriptions
**And** manifest is validated with Zod schema
**And** example manifest is documented

### Story 13.2: Module CLI - Install

As a **Developer (Thomas)**,
I want **to install modules via CLI**,
So that **I can add functionality easily**.

**Acceptance Criteria:**

**Given** a developer has a Trafi project
**When** they run `trafi module add <source>`
**Then** they can install from:
- Local path: `trafi module add ./my-module`
- Git URL: `trafi module add github:user/repo`
- NPM: `trafi module add @scope/module-name`
**And** dependencies are resolved
**And** manifest is validated before install
**And** module is registered in `trafi.config.json`

### Story 13.3: Module CLI - List and Status

As a **Developer (Thomas)**,
I want **to see installed modules and their status**,
So that **I know what's active in my project**.

**Acceptance Criteria:**

**Given** modules are installed
**When** running `trafi module list`
**Then** output shows:
- Module name and version
- Status (enabled/disabled)
- Source (path, npm, git)
- Compatibility status
**And** `--json` flag outputs machine-readable format
**And** warnings show for incompatible versions

### Story 13.4: Module Enable/Disable

As a **Developer (Thomas)**,
I want **to enable or disable modules without restart**,
So that **I can toggle functionality dynamically**.

**Acceptance Criteria:**

**Given** a module is installed
**When** running `trafi module enable/disable <name>`
**Then** the module state changes
**And** backend services are loaded/unloaded
**And** dashboard routes are registered/unregistered
**And** event hooks are attached/detached
**And** no full system restart is required
**And** state persists across restarts

### Story 13.5: Module Validation and Safety

As a **System**,
I want **to validate module code for security**,
So that **malicious modules can't harm the platform**.

**Acceptance Criteria:**

**Given** a module is being installed or enabled
**When** validation runs
**Then** checks include:
- No `eval()` or `Function()` usage
- No direct filesystem access outside module dir
- Network ACL compliance (allowed hosts only)
- No environment variable access (except allowed)
- Dependency vulnerability scan
**And** violations block activation
**And** detailed report explains issues

### Story 13.6: Module Discovery and Loading

As a **System**,
I want **to dynamically discover and load modules at runtime**,
So that **modules integrate seamlessly**.

**Acceptance Criteria:**

**Given** enabled modules exist
**When** the system starts
**Then** modules are loaded in dependency order
**And** module entry points are executed
**And** failures in one module don't crash the system
**And** loading time is logged per module
**And** circular dependencies are detected and rejected

### Story 13.7: Module Hot-Reload (Development)

As a **Developer (Thomas)**,
I want **modules to hot-reload on file changes**,
So that **I can develop modules efficiently**.

**Acceptance Criteria:**

**Given** development mode is active
**When** module files change
**Then** the module reloads automatically
**And** backend services are re-registered
**And** dashboard components refresh
**And** state is preserved where possible
**And** reload errors show helpful messages
**And** hot-reload only applies to changed module

### Story 13.8: Backend Extension - Services

As a **Developer (Thomas)**,
I want **modules to register backend services**,
So that **I can add custom business logic**.

**Acceptance Criteria:**

**Given** a module defines backend services
**When** the module is loaded
**Then** services are registered with NestJS DI
**And** services can inject core Trafi services
**And** services are scoped to module namespace
**And** service lifecycle is managed (init, destroy)
**And** example service pattern is documented

### Story 13.9: Backend Extension - API Endpoints

As a **Developer (Thomas)**,
I want **modules to add custom API endpoints**,
So that **I can expose custom functionality**.

**Acceptance Criteria:**

**Given** a module defines controllers
**When** the module is loaded
**Then** endpoints are registered at `/api/modules/<module-name>/...`
**And** endpoints inherit authentication/authorization
**And** endpoints are documented in OpenAPI
**And** rate limiting applies per tenant
**And** endpoints can be versioned

### Story 13.10: Dashboard Extension - Views

As a **Developer (Thomas)**,
I want **modules to add dashboard pages**,
So that **custom UI is integrated seamlessly**.

**Acceptance Criteria:**

**Given** a module defines dashboard components
**When** the module is loaded
**Then** routes are registered in dashboard navigation
**And** components render within dashboard shell
**And** components can use Shadcn UI primitives
**And** module state is isolated (no cross-module leaks)
**And** permissions control access to module views

### Story 13.11: Event Hooks System

As a **Developer (Thomas)**,
I want **modules to subscribe to business events**,
So that **I can react to platform activity**.

**Acceptance Criteria:**

**Given** a module subscribes to events
**When** events occur (e.g., order.created, payment.completed)
**Then** module handlers are invoked
**And** handlers receive typed event payload
**And** handler errors don't block the main flow
**And** async handlers are queued as jobs
**And** available events are documented

### Story 13.12: Database Schema Extension

As a **Developer (Thomas)**,
I want **modules to extend the database schema**,
So that **I can store custom data**.

**Acceptance Criteria:**

**Given** a module defines migrations
**When** module is enabled
**Then** migrations run automatically
**And** tables are prefixed with module name
**And** migrations are reversible (up/down)
**And** migration state is tracked separately
**And** module removal prompts for data cleanup
**And** Prisma schema extension is supported

### Story 13.13: Module Update and Compatibility

As a **Developer (Thomas)**,
I want **to update modules with version checking**,
So that **updates don't break my store**.

**Acceptance Criteria:**

**Given** a module update is available
**When** running `trafi module update <name>`
**Then** the system:
- Checks version compatibility with core
- Runs migration if schema changed
- Validates new code
- Preserves configuration
**And** breaking changes show warning
**And** rollback is available if update fails

### Story 13.14: Module Rollback and Removal

As a **Developer (Thomas)**,
I want **to rollback or remove modules cleanly**,
So that **I can undo changes safely**.

**Acceptance Criteria:**

**Given** a module is installed
**When** running `trafi module remove <name>`
**Then** the system:
- Disables the module first
- Prompts for data cleanup (keep/delete)
- Runs down migrations if requested
- Removes module files
- Updates configuration
**And** removal is logged
**And** force flag skips prompts

### Story 13.15: Module Custom Metrics

As a **Developer (Thomas)**,
I want **modules to register custom metrics**,
So that **module health is observable**.

**Acceptance Criteria:**

**Given** a module wants to expose metrics
**When** metrics are registered
**Then** they are:
- Prefixed with module name
- Exported via Prometheus/OTEL
- Visible in ops dashboard
- Following metric naming conventions
**And** counter, gauge, histogram types supported
**And** example metrics pattern is documented

---

## Epic 14: Cloud & Multi-tenancy

Merchant peut utiliser Trafi Cloud sans gerer l'infrastructure, avec migration Shopify automatisee.

### Story 14.1: Cloud Signup Flow

As a **Merchant (Sophie)**,
I want **to sign up for Trafi Cloud**,
So that **I can have a managed store without DevOps**.

**Acceptance Criteria:**

**Given** a visitor accesses the Cloud signup page
**When** they complete registration
**Then** the flow includes:
- Email and password creation
- Store name and URL selection (subdomain)
- Plan selection (free trial, paid tiers)
- Payment method (Stripe) for paid plans
**And** account is created immediately
**And** store provisioning begins automatically
**And** confirmation email with next steps is sent

### Story 14.2: Tenant Provisioning Orchestration

As a **System**,
I want **to automatically provision new tenants**,
So that **stores are ready quickly**.

**Acceptance Criteria:**

**Given** a new tenant signs up
**When** provisioning is triggered
**Then** the system:
- Creates tenant record in control plane
- Provisions isolated PostgreSQL database
- Runs initial schema migrations
- Seeds default configuration
- Configures DNS/subdomain routing
- Provisions Redis namespace
**And** provisioning completes in < 2 minutes
**And** progress is shown to merchant
**And** failures trigger cleanup and retry

### Story 14.3: Database-Per-Tenant Isolation

As a **System**,
I want **each tenant to have an isolated database**,
So that **data security is guaranteed**.

**Acceptance Criteria:**

**Given** multiple tenants exist
**When** databases are provisioned
**Then** each tenant has:
- Dedicated PostgreSQL database
- Unique connection credentials
- Separate connection pool
- No cross-tenant query possibility
**And** connection strings are encrypted at rest
**And** tenant context is validated on every request
**And** architecture supports 500+ tenants (NFR-SCALE-1)

### Story 14.4: Tenant Database Backups

As a **System**,
I want **to perform tenant-specific backups**,
So that **data can be recovered per-tenant**.

**Acceptance Criteria:**

**Given** tenants have data
**When** backup schedule runs
**Then** backups include:
- Daily automated backups (14-day retention MVP)
- Point-in-time recovery capability
- Per-tenant backup isolation
- Backup encryption at rest
**And** backup status is visible to Ops
**And** backup success/failure is alerted
**And** backups are stored in separate region

### Story 14.5: Tenant Database Restore

As an **Ops**,
I want **to restore a tenant's database**,
So that **I can recover from data issues**.

**Acceptance Criteria:**

**Given** backups exist for a tenant
**When** Ops initiates restore
**Then** they can:
- Select backup point (date/time)
- Choose restore type (full or to new DB)
- Preview affected data range
- Execute with confirmation
**And** restore runs without affecting other tenants
**And** RTO target: 8 hours MVP (NFR-REL-8)
**And** restore is logged with reason

### Story 14.6: Resource Auto-Scaling

As a **System**,
I want **to scale resources based on tenant traffic**,
So that **performance is maintained during spikes**.

**Acceptance Criteria:**

**Given** tenants have varying traffic
**When** traffic increases
**Then** the system:
- Monitors request rates and latency
- Scales API containers horizontally
- Scales worker pool based on queue depth
- Adjusts database connection pools
**And** scaling is automatic (no manual intervention)
**And** 3x traffic spike handling (NFR-PERF-6)
**And** scale-down occurs after traffic normalizes

### Story 14.7: Tenant Resource Limits

As a **System**,
I want **to enforce resource limits per tenant**,
So that **one tenant can't affect others**.

**Acceptance Criteria:**

**Given** multiple tenants share infrastructure
**When** a tenant exceeds limits
**Then** limits are enforced for:
- API rate limiting (requests/minute)
- Storage quota (products, media)
- Database connections
- Queue depth
**And** limits vary by plan tier
**And** approaching limits trigger warnings
**And** exceeded limits return 429 with upgrade CTA

### Story 14.8: Shopify Migration - Data Export

As a **Merchant (Sophie)**,
I want **to export my data from Shopify**,
So that **I can migrate to Trafi**.

**Acceptance Criteria:**

**Given** a Merchant wants to migrate
**When** they access Migration Wizard
**Then** they can:
- Connect Shopify via OAuth or API key
- Select data to migrate (products, customers, orders)
- Preview data volume and estimated time
- Initiate export from Shopify
**And** export handles Shopify API rate limits
**And** progress is visible in dashboard
**And** partial export resumes on failure

### Story 14.9: Shopify Migration - Data Import

As a **System**,
I want **to import Shopify data into Trafi**,
So that **migration is seamless**.

**Acceptance Criteria:**

**Given** Shopify data is exported
**When** import runs
**Then** the system imports:
- Products with variants and images
- Categories/collections mapping
- Customer accounts (with consent)
- Historical orders
**And** IDs are mapped (Shopify -> Trafi)
**And** duplicates are detected and handled
**And** import is idempotent (can retry safely)

### Story 14.10: Shopify Migration - Validation

As a **Merchant (Sophie)**,
I want **to validate my migrated data**,
So that **I know everything transferred correctly**.

**Acceptance Criteria:**

**Given** import is complete
**When** validation runs
**Then** the system checks:
- Product count matches
- Image integrity (no broken links)
- Customer data completeness
- Order totals reconciliation
**And** validation report is generated
**And** discrepancies are highlighted
**And** Merchant can approve or request fixes

### Story 14.11: Custom Domain Configuration

As a **Merchant (Sophie)**,
I want **to use my own domain for my store**,
So that **my brand is prominent**.

**Acceptance Criteria:**

**Given** a Merchant has a custom domain
**When** they configure it in settings
**Then** they can:
- Enter their domain name
- See required DNS records
- Verify DNS propagation
- Enable SSL certificate (auto-provisioned)
**And** SSL uses Let's Encrypt
**And** domain propagation is monitored
**And** fallback to subdomain if domain fails

### Story 14.12: Tenant Offboarding

As a **System**,
I want **to handle tenant cancellation cleanly**,
So that **resources are freed and data handled properly**.

**Acceptance Criteria:**

**Given** a Merchant cancels their subscription
**When** offboarding is triggered
**Then** the system:
- Provides data export option (30 days)
- Deactivates storefront after grace period
- Retains data per legal requirements
- Cleans up resources after retention period
- Releases subdomain/domain
**And** Merchant can reactivate within grace period
**And** final invoice is generated
**And** offboarding is logged
