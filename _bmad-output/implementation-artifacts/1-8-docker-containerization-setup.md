# Story 1.8: Docker Containerization Setup

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **Developer (Thomas)**,
I want **Docker configuration for local development**,
so that **I can run all services consistently across environments with a single command**.

## Acceptance Criteria

1. **AC1**: Given the monorepo is complete, When `docker-compose.yml` is created at the project root, Then it defines all required services (PostgreSQL, Redis, API, Dashboard) with proper configuration

2. **AC2**: Given PostgreSQL is configured, When the container is running, Then data persists across container restarts via volume mounts and the database is accessible on localhost:5432

3. **AC3**: Given Redis is configured, When the container is running, Then it provides caching capability for BullMQ job queues and is accessible on localhost:6379

4. **AC4**: Given the API container is defined, When Docker Compose builds the API service, Then it uses the NestJS application from `apps/api/` with proper environment variables and health check configuration

5. **AC5**: Given the Dashboard container is defined, When Docker Compose builds the Dashboard service, Then it uses the Next.js application from `apps/dashboard/` with proper environment variables pointing to the API

6. **AC6**: Given health checks are configured, When all services start, Then dependent services wait for their dependencies to be healthy before starting (API waits for PostgreSQL/Redis, Dashboard waits for API)

7. **AC7**: Given the developer runs `docker-compose up`, When all containers start successfully, Then the API is accessible at http://localhost:3001 and Dashboard at http://localhost:3000

## Tasks / Subtasks

- [ ] **Task 1**: Create Docker Compose development configuration (AC: 1, 7)
  - [ ] 1.1: Create `docker-compose.yml` at the monorepo root
  - [ ] 1.2: Define Docker Compose version and basic structure
  - [ ] 1.3: Add documentation comments for each service

- [ ] **Task 2**: Configure PostgreSQL 16 container (AC: 2, 6)
  - [ ] 2.1: Add `postgres` service using `postgres:16-alpine` image
  - [ ] 2.2: Configure environment variables (POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD)
  - [ ] 2.3: Add volume mount for data persistence (`postgres_data:/var/lib/postgresql/data`)
  - [ ] 2.4: Expose port 5432 to host
  - [ ] 2.5: Add health check using `pg_isready` command
  - [ ] 2.6: Set restart policy to `unless-stopped`

- [ ] **Task 3**: Configure Redis 7 container (AC: 3, 6)
  - [ ] 3.1: Add `redis` service using `redis:7-alpine` image
  - [ ] 3.2: Add volume mount for data persistence (`redis_data:/data`)
  - [ ] 3.3: Expose port 6379 to host
  - [ ] 3.4: Add health check using `redis-cli ping` command
  - [ ] 3.5: Set restart policy to `unless-stopped`

- [ ] **Task 4**: Create API Dockerfile with multi-stage build (AC: 4)
  - [ ] 4.1: Create `apps/api/Dockerfile` with multi-stage build pattern
  - [ ] 4.2: Define `development` stage with hot-reload support
  - [ ] 4.3: Define `production` stage with optimized build
  - [ ] 4.4: Configure proper WORKDIR, COPY, and RUN instructions
  - [ ] 4.5: Include proper .dockerignore file at `apps/api/.dockerignore`

- [ ] **Task 5**: Configure API service in Docker Compose (AC: 4, 6, 7)
  - [ ] 5.1: Add `api` service with build context pointing to `./apps/api`
  - [ ] 5.2: Configure target as `development` for local development
  - [ ] 5.3: Add environment variables (DATABASE_URL, REDIS_URL, NODE_ENV, PORT)
  - [ ] 5.4: Expose port 3001 to host
  - [ ] 5.5: Add volume mounts for hot-reload (`./apps/api/src:/app/src:ro`)
  - [ ] 5.6: Configure `depends_on` with health check conditions for postgres and redis
  - [ ] 5.7: Add health check for the API service (`/health` endpoint)

- [ ] **Task 6**: Create Dashboard Dockerfile with multi-stage build (AC: 5)
  - [ ] 6.1: Create `apps/dashboard/Dockerfile` with multi-stage build pattern
  - [ ] 6.2: Define `development` stage with Next.js dev server
  - [ ] 6.3: Define `production` stage with Next.js standalone build
  - [ ] 6.4: Configure proper WORKDIR, COPY, and RUN instructions
  - [ ] 6.5: Include proper .dockerignore file at `apps/dashboard/.dockerignore`

- [ ] **Task 7**: Configure Dashboard service in Docker Compose (AC: 5, 6, 7)
  - [ ] 7.1: Add `dashboard` service with build context pointing to `./apps/dashboard`
  - [ ] 7.2: Configure target as `development` for local development
  - [ ] 7.3: Add environment variables (NEXT_PUBLIC_API_URL, NODE_ENV)
  - [ ] 7.4: Expose port 3000 to host
  - [ ] 7.5: Add volume mounts for hot-reload (`./apps/dashboard/src:/app/src:ro`)
  - [ ] 7.6: Configure `depends_on` with health check condition for API

- [ ] **Task 8**: Create .env.docker template (AC: 1, 4, 5)
  - [ ] 8.1: Create `.env.docker.example` with all required environment variables
  - [ ] 8.2: Document each variable with comments
  - [ ] 8.3: Add `.env.docker` to `.gitignore` if not already present
  - [ ] 8.4: Update README.md with Docker setup instructions

- [ ] **Task 9**: Add Docker-related npm scripts (AC: 7)
  - [ ] 9.1: Add `docker:up` script in root `package.json`: `"docker:up": "docker-compose up"`
  - [ ] 9.2: Add `docker:down` script: `"docker:down": "docker-compose down"`
  - [ ] 9.3: Add `docker:build` script: `"docker:build": "docker-compose build"`
  - [ ] 9.4: Add `docker:logs` script: `"docker:logs": "docker-compose logs -f"`

- [ ] **Task 10**: Test and validate (AC: 1, 2, 3, 4, 5, 6, 7)
  - [ ] 10.1: Run `docker-compose build` - verify all images build successfully
  - [ ] 10.2: Run `docker-compose up` - verify all services start
  - [ ] 10.3: Verify PostgreSQL is accessible and persistent
  - [ ] 10.4: Verify Redis is accessible
  - [ ] 10.5: Verify API responds at http://localhost:3001/health
  - [ ] 10.6: Verify Dashboard is accessible at http://localhost:3000
  - [ ] 10.7: Run `docker-compose down && docker-compose up` - verify data persistence
  - [ ] 10.8: Run `pnpm typecheck` - no TypeScript errors
  - [ ] 10.9: Run `pnpm lint` - no ESLint errors

## Dev Notes

### Relevant Architecture Patterns and Constraints

**From Architecture Document (Section: Infrastructure & Deployment):**

1. **Hosting Strategy**: Cloud-Agnostic (Docker)
   - PRD requires "Self-Host Free" tier
   - Docker enables consistent dev/prod environments
   - Kubernetes-ready for scale

2. **Container Services Required**:
   - PostgreSQL (per-tenant data)
   - Redis (BullMQ cache + queues)
   - API (NestJS)
   - Dashboard (Next.js)

3. **Architecture Example from Document**:
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

### Current Monorepo Structure (From Stories 1.1-1.7)

```
trafi/
├── apps/
│   ├── api/                    # NestJS 11 (port 3001)
│   │   ├── src/
│   │   ├── prisma/
│   │   │   ├── schema/
│   │   │   └── seed.ts
│   │   └── package.json
│   │
│   └── dashboard/              # Next.js 15 (port 3000)
│       ├── src/
│       └── package.json
│
├── packages/
│   ├── @trafi/validators/
│   ├── @trafi/types/
│   ├── @trafi/config/
│   └── @trafi/db/
│
├── e2e/                        # Playwright E2E tests
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── .env                        # Root environment file
```

### Docker Best Practices to Follow (2026)

Based on Context7 Docker documentation:

1. **Multi-Stage Builds**: Use separate stages for development and production to optimize image size
2. **Alpine Images**: Use `-alpine` variants for smaller image size (e.g., `postgres:16-alpine`, `redis:7-alpine`)
3. **Health Checks**: All services must have health checks with proper `interval`, `timeout`, `retries`, and `start_period`
4. **Named Volumes**: Use named volumes for data persistence
5. **Depends On with Condition**: Use `depends_on` with `condition: service_healthy` for proper startup ordering
6. **Environment Variables**: Use `.env` file for sensitive configuration
7. **Volume Mounts for Development**: Mount source directories as read-only for hot-reload

### Dockerfile Pattern for Node.js (NestJS)

```dockerfile
# syntax=docker/dockerfile:1

# ============================================
# Base stage - shared dependencies
# ============================================
FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable pnpm

# ============================================
# Development stage
# ============================================
FROM base AS development
ENV NODE_ENV=development

# Copy package files for dependency installation
COPY package.json pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/ ./packages/

# Install all dependencies (including devDependencies)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/api/ ./apps/api/

# Generate Prisma client
RUN pnpm --filter @trafi/api db:generate

EXPOSE 3001

CMD ["pnpm", "--filter", "@trafi/api", "dev"]

# ============================================
# Production build stage
# ============================================
FROM base AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/ ./packages/

RUN pnpm install --frozen-lockfile

COPY apps/api/ ./apps/api/

RUN pnpm --filter @trafi/api build

# ============================================
# Production stage
# ============================================
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3001

CMD ["node", "dist/main.js"]
```

### Dockerfile Pattern for Next.js (Dashboard)

```dockerfile
# syntax=docker/dockerfile:1

# ============================================
# Base stage
# ============================================
FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable pnpm

# ============================================
# Development stage
# ============================================
FROM base AS development
ENV NODE_ENV=development

COPY package.json pnpm-lock.yaml ./
COPY apps/dashboard/package.json ./apps/dashboard/
COPY packages/ ./packages/

RUN pnpm install --frozen-lockfile

COPY apps/dashboard/ ./apps/dashboard/

EXPOSE 3000

CMD ["pnpm", "--filter", "@trafi/dashboard", "dev"]

# ============================================
# Production stage
# ============================================
FROM base AS production
ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml ./
COPY apps/dashboard/package.json ./apps/dashboard/
COPY packages/ ./packages/

RUN pnpm install --frozen-lockfile --prod

COPY apps/dashboard/ ./apps/dashboard/

RUN pnpm --filter @trafi/dashboard build

EXPOSE 3000

CMD ["pnpm", "--filter", "@trafi/dashboard", "start"]
```

### Docker Compose Health Checks

```yaml
# PostgreSQL health check
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-trafi} -d ${POSTGRES_DB:-trafi}"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 10s

# Redis health check
healthcheck:
  test: ["CMD", "redis-cli", "ping"]
  interval: 10s
  timeout: 5s
  retries: 5

# API health check (NestJS)
healthcheck:
  test: ["CMD-SHELL", "curl -f http://localhost:3001/health || exit 1"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 30s
```

### Environment Variables Required

**PostgreSQL:**
- `POSTGRES_DB`: Database name (default: `trafi`)
- `POSTGRES_USER`: Database user (default: `trafi`)
- `POSTGRES_PASSWORD`: Database password (required, from secrets)

**Redis:**
- No special configuration needed for development

**API (NestJS):**
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `NODE_ENV`: `development` or `production`
- `PORT`: `3001`

**Dashboard (Next.js):**
- `NEXT_PUBLIC_API_URL`: API URL (e.g., `http://localhost:3001` or `http://api:3001` in Docker network)
- `NODE_ENV`: `development` or `production`

### Previous Story Learnings (1.6, 1.7)

From Story 1-6 (Test Infrastructure):
1. **dotenv-cli**: Used for loading environment variables in npm scripts
2. **Prisma 7**: Generated client location is `src/generated/prisma`
3. **pnpm workspaces**: Use `pnpm --filter @trafi/api` pattern for running package-specific commands

From Story 1-7 (Seed Data):
1. **Prisma 7 Adapter Pattern**: Uses `@prisma/adapter-pg` with `PrismaPg` for PostgreSQL connection
2. **DATABASE_URL validation**: Always validate environment variables before use
3. **tsx for TypeScript**: Preferred over ts-node for ESM compatibility

### Git Commit Pattern (from recent commits)

```
feat(epic-1): docker containerization setup

- Add docker-compose.yml with PostgreSQL, Redis, API, and Dashboard services
- Create multi-stage Dockerfiles for API and Dashboard apps
- Configure health checks and proper startup ordering
- Add Docker-related npm scripts
```

### Potential Challenges & Solutions

1. **pnpm Workspaces in Docker**:
   - Challenge: pnpm uses symlinks which don't work well in Docker
   - Solution: Copy package files and use `--frozen-lockfile` for consistent installs

2. **Prisma Client Generation**:
   - Challenge: Prisma client must be generated inside container
   - Solution: Add `RUN pnpm db:generate` step in Dockerfile

3. **Hot Reload in Docker**:
   - Challenge: File watching may not work with volume mounts
   - Solution: Use polling-based watching or Docker Compose `develop.watch` feature

4. **Network Communication**:
   - Challenge: Services need to communicate within Docker network
   - Solution: Use service names as hostnames (e.g., `http://api:3001`)

5. **Volume Permissions**:
   - Challenge: Volume permissions may differ between host and container
   - Solution: Use appropriate user/group settings or run as root in dev

### Project Structure After Completion

```
trafi/
├── apps/
│   ├── api/
│   │   ├── Dockerfile              # NEW
│   │   ├── .dockerignore           # NEW
│   │   └── ...
│   │
│   └── dashboard/
│       ├── Dockerfile              # NEW
│       ├── .dockerignore           # NEW
│       └── ...
│
├── docker-compose.yml              # NEW
├── .env.docker.example             # NEW
├── .gitignore                      # MODIFIED (add .env.docker)
├── package.json                    # MODIFIED (add docker scripts)
└── README.md                       # MODIFIED (Docker instructions)
```

### Context7 MCP Reminder

Before implementing, query Context7 for latest documentation:
- `docker` - Docker Compose v2 syntax and features
- `nestjs` - NestJS Dockerfile best practices
- `nextjs` - Next.js Docker deployment patterns
- `prisma` - Prisma in Docker containers

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story-1.8]
- [Source: _bmad-output/planning-artifacts/architecture.md#Hosting-Strategy]
- [Source: _bmad-output/planning-artifacts/architecture.md#Container-Strategy]
- [Source: _bmad-output/implementation-artifacts/1-6-setup-test-infrastructure.md] Previous learnings
- [Source: _bmad-output/implementation-artifacts/1-7-seed-demo-data-for-development.md] Previous learnings
- [Source: CLAUDE.md#Development-Commands] Monorepo commands
- [Source: _bmad-output/project-context.md] Project context and rules

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

