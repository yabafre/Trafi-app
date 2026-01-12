# Epic 1: Foundation & Developer Bootstrap

Thomas peut creer un projet Trafi fonctionnel en 5 minutes avec CLI, monorepo configure, et seed data.

**FRs covered:** FR1, FR2, FR8 + ARCH-1 to ARCH-26

---

## Story 1.1: Initialize Turborepo Monorepo Structure

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

---

## Story 1.2: Setup NestJS API Application

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

---

## Story 1.3: Setup Next.js Dashboard Application

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

---

## Story 1.4: Create Shared Packages Structure

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

---

## Story 1.5: Configure Prisma with PostgreSQL

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

---

## Story 1.6: Setup Test Infrastructure

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

---

## Story 1.7: Seed Demo Data for Development

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

---

## Story 1.8: Docker Containerization Setup

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
