# Trafi

**The open-source Shopify alternative for developers with built-in profit automation.**

Trafi is an e-commerce platform that combines headless commerce flexibility with integrated conversion optimization. Unlike traditional headless solutions that deliver technical freedom but leave merchants struggling with conversions, Trafi provides a closed-loop system: instrumentation, diagnosis, action, statistical proof, and automatic rollback.

## Overview

| Component | Technology |
|-----------|------------|
| **API** | NestJS 11, Prisma 7, PostgreSQL 16 |
| **Dashboard** | Next.js 15 (App Router), React 19, Tailwind CSS 4 |
| **Shared Packages** | TypeScript, Zod validators, shared types |
| **Testing** | Vitest, Jest, Playwright |
| **Build** | Turborepo, pnpm, SWC |

## Project Structure

```
trafi-app/
├── apps/
│   ├── api/           # NestJS backend API
│   └── dashboard/     # Next.js admin dashboard
├── packages/
│   └── @trafi/
│       ├── config/    # Shared configuration
│       ├── types/     # TypeScript type definitions
│       └── validators/# Zod validation schemas
├── e2e/               # Playwright E2E tests
└── docker-compose.yml # Local development infrastructure
```

## Prerequisites

- **Node.js** 20 LTS or higher
- **pnpm** 9.x (package manager)
- **Docker** and Docker Compose (for PostgreSQL and Redis)

## Getting Started

### 1. Clone and Install

```bash
git clone <repository-url>
cd trafi-app
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/trafi"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secret-key"
```

### 3. Start Infrastructure

```bash
pnpm docker:up
```

### 4. Initialize Database

```bash
pnpm db:push      # Push schema to database
pnpm db:seed      # Seed initial data
```

### 5. Run Development Servers

```bash
pnpm dev
```

This starts:
- **API** at `http://localhost:3001`
- **Dashboard** at `http://localhost:3000`

## Available Commands

### Development

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all packages and apps |
| `pnpm lint` | Run ESLint across all packages |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm format` | Format code with Prettier |

### Testing

| Command | Description |
|---------|-------------|
| `pnpm test` | Run unit tests |
| `pnpm test:cov` | Run tests with coverage |
| `pnpm test:e2e` | Run Playwright E2E tests |

### Database

| Command | Description |
|---------|-------------|
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:push` | Push schema changes to database |
| `pnpm db:migrate:dev` | Create and apply migrations (development) |
| `pnpm db:migrate:deploy` | Apply migrations (production) |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm db:seed` | Seed database with initial data |

### Docker

| Command | Description |
|---------|-------------|
| `pnpm docker:up` | Start containers |
| `pnpm docker:up:build` | Rebuild and start containers |
| `pnpm docker:down` | Stop containers |
| `pnpm docker:down:volumes` | Stop containers and remove volumes |
| `pnpm docker:logs` | View container logs |

## Architecture

### Data Flow

```
Dashboard (RSC) → Server Action → tRPC → NestJS API → Prisma → PostgreSQL
```

### Key Patterns

- **Type-safe end-to-end**: Zod schemas in `@trafi/validators` are the single source of truth
- **Monorepo**: Turborepo orchestrates builds with caching
- **Server Components**: Next.js App Router with Server Components by default
- **tRPC internal API**: Type-safe API calls between dashboard and backend

### Shared Packages

| Package | Purpose |
|---------|---------|
| `@trafi/validators` | Zod schemas for validation |
| `@trafi/types` | TypeScript types inferred from Zod schemas |
| `@trafi/config` | Shared configuration utilities |

## Core Features

### Commerce Cores

- **Product**: Catalog, variants, categories, media
- **Customer**: Accounts, addresses, B2C authentication
- **Cart**: Persistent cart, totals calculation, rules
- **Checkout**: Multi-step flow, guest checkout
- **Payment**: Stripe integration, webhooks, refunds
- **Order**: Creation, statuses, history, events
- **Inventory**: Stock management, shipping zones
- **Tax**: EU VAT, zone-based rules

### Profit Engine (Conversion Autopilot)

- **Checkout Doctor**: Funnel instrumentation, drop-off diagnosis
- **Recovery Engine**: Abandoned cart email sequences
- **Profit Guardrails**: Margin and stock protection rules
- **Auto-rollback**: Automatic rollback for reversible actions

## Development Guidelines

### Code Organization

```
apps/dashboard/src/app/products/
├── page.tsx           # Server Component page
├── _components/       # Route-local components (underscore prefix)
├── _actions/          # Route-local Server Actions
└── _hooks/            # Route-local hooks
```

### Import Order

1. External packages
2. `@trafi/*` packages
3. Relative imports

### Type-only Imports

```typescript
import type { Product } from '@trafi/types';
```

### Commit Message Format

```
type(scope): description

feat(products): add bulk import functionality
fix(checkout): correct tax calculation for EU
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`

## API Documentation

Swagger UI is available at `/docs` when the API is running.

Every endpoint includes:
- OpenAPI decorators
- Request/response examples
- Authentication requirements
- Error codes

## Contributing

1. Create a feature branch from `main`
2. Follow the commit message format
3. Ensure all tests pass
4. Submit a pull request

## License

Private - All rights reserved.
