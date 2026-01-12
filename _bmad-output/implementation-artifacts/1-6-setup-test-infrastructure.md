# Story 1.6: Setup Test Infrastructure

Status: done

## Story

As a **Developer (Thomas)**,
I want **test frameworks configured across the monorepo**,
so that **I can write and run tests from day one with consistent patterns and coverage requirements**.

## Acceptance Criteria

1. **AC1**: Given Vitest is configured, When running tests in packages and dashboard, Then unit tests execute with TypeScript support and coverage reporting

2. **AC2**: Given Jest is configured, When running tests in the API app, Then NestJS integration tests execute with proper dependency injection mocking

3. **AC3**: Given Playwright is configured, When running E2E tests, Then browser-based tests execute against running applications

4. **AC4**: Given coverage thresholds are set, When test coverage drops below 70%, Then the test command fails (NFR-MAINT-1)

5. **AC5**: Given the monorepo structure, When running `pnpm test` at root, Then all tests across packages and apps execute via Turborepo

6. **AC6**: Given test utilities are needed, When writing tests, Then shared test utilities and mocks are available from `@trafi/config`

## Tasks / Subtasks

- [x] **Task 1**: Configure Vitest for Dashboard (AC: 1, 4, 5)
  - [x] 1.1: Install `vitest`, `@vitejs/plugin-react`, `@testing-library/react`, `@testing-library/jest-dom` in dashboard
  - [x] 1.2: Create `apps/dashboard/vitest.config.ts` with React support and coverage
  - [x] 1.3: Create `apps/dashboard/vitest.setup.ts` with testing-library matchers
  - [x] 1.4: Add `test` script in `apps/dashboard/package.json`
  - [x] 1.5: Set coverage thresholds to 70% (statements, branches, functions, lines)
  - [x] 1.6: Create sample test `apps/dashboard/src/__tests__/example.test.tsx`

- [x] **Task 2**: Configure Vitest for shared packages (AC: 1, 4, 5)
  - [x] 2.1: Install `vitest` as devDependency in `packages/@trafi/validators`
  - [x] 2.2: Create `packages/@trafi/validators/vitest.config.ts` with coverage
  - [x] 2.3: Add `test` script in `packages/@trafi/validators/package.json`
  - [x] 2.4: Create sample test `packages/@trafi/validators/src/__tests__/example.test.ts`
  - [x] 2.5: Install `vitest` as devDependency in `packages/@trafi/types`
  - [x] 2.6: Create `packages/@trafi/types/vitest.config.ts` with coverage
  - [x] 2.7: Add `test` script in `packages/@trafi/types/package.json`
  - [x] 2.8: Create sample type test `packages/@trafi/types/src/__tests__/example.test.ts`

- [x] **Task 3**: Verify and enhance Jest for NestJS API (AC: 2, 4, 5)
  - [x] 3.1: Verify existing Jest 30 configuration in `apps/api/package.json`
  - [x] 3.2: Update jest config to add coverage thresholds (70%)
  - [x] 3.3: Create `apps/api/test/jest-e2e.json` with proper E2E configuration
  - [x] 3.4: Create `apps/api/test/app.module.spec.ts` sample unit test (moved from src/__tests__)
  - [x] 3.5: Create `apps/api/test/app.e2e-spec.ts` sample E2E test
  - [x] 3.6: Add `test:cov` script that enforces coverage thresholds

- [x] **Task 4**: Configure Playwright for E2E tests (AC: 3, 5)
  - [x] 4.1: Create `e2e/` directory at monorepo root for cross-app E2E tests
  - [x] 4.2: Install `@playwright/test` in `e2e/package.json`
  - [x] 4.3: Create `e2e/playwright.config.ts` with:
    - Projects for chromium, firefox, webkit
    - Base URL pointing to dashboard (localhost:3000)
    - Webserver configuration to start apps before tests
  - [x] 4.4: Create sample E2E test `e2e/tests/health.spec.ts` testing API health endpoint
  - [x] 4.5: Add `test:e2e` script in root package.json
  - [x] 4.6: Add `e2e` to pnpm-workspace.yaml

- [x] **Task 5**: Create shared test utilities (AC: 6)
  - [x] 5.1: Create `packages/@trafi/config/src/testing/` directory
  - [x] 5.2: Create `packages/@trafi/config/src/testing/vitest-shared.config.ts` with common settings
  - [x] 5.3: Create `packages/@trafi/config/src/testing/mocks/index.ts` with common mocks
  - [x] 5.4: Export testing utilities from `packages/@trafi/config/package.json`
  - [x] 5.5: Create `packages/@trafi/config/src/testing/index.ts` barrel export

- [x] **Task 6**: Configure Turborepo test pipeline (AC: 5)
  - [x] 6.1: Verify `turbo.json` has `test` task configured correctly
  - [x] 6.2: Add `test:cov` task to turbo.json for coverage reports
  - [x] 6.3: Run `pnpm test` from root and verify all tests pass
  - [x] 6.4: Verify coverage reports are generated in each app/package

- [x] **Task 7**: Final validation (AC: 1, 2, 3, 4, 5, 6)
  - [x] 7.1: Run `pnpm test` from monorepo root - all tests pass (31 tests across 6 packages)
  - [x] 7.2: Verify coverage thresholds configured at 70% in each package/app
  - [x] 7.3: Playwright E2E tests configured (requires apps running for execution)
  - [x] 7.4: Run `pnpm typecheck` - no type errors
  - [x] 7.5: Run `pnpm lint` - no lint errors

## Dev Notes

### Testing Framework Strategy (Architecture Decision)

Per architecture document section "Testing Framework":
- **Vitest** for unit tests (Vite-native, fast)
- **Playwright** for E2E tests (cross-browser)
- **Jest** for NestJS integration tests (NestJS ecosystem compatibility)

This hybrid approach provides:
1. Fast unit tests with Vitest's native ESM support
2. NestJS-specific testing patterns with Jest
3. Cross-browser E2E testing with Playwright

### Current State (From Story 1-5)

**Already Installed in API (apps/api/package.json):**
- `jest@^30.0.0`
- `ts-jest@^29.2.5`
- `@nestjs/testing@^11.0.1`
- `@types/jest@^30.0.0`
- `supertest@^7.0.0`
- Jest config exists in package.json

**Not Yet Configured:**
- Dashboard has no test framework
- Packages have no test configuration
- E2E directory doesn't exist
- Coverage thresholds not enforced (70% required)

### NFR-MAINT-1 Reference

From PRD Non-Functional Requirements:
> Code coverage: >= 70% unit test coverage for core modules [MVP]

Coverage thresholds must be enforced on:
- Statements: 70%
- Branches: 70%
- Functions: 70%
- Lines: 70%

### Vitest Configuration Example

```typescript
// vitest.config.ts for Dashboard
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },
  },
});
```

### Jest Configuration for NestJS (Update Required)

The existing Jest config in `apps/api/package.json` needs coverage thresholds added:

```json
{
  "jest": {
    "coverageThreshold": {
      "global": {
        "statements": 70,
        "branches": 70,
        "functions": 70,
        "lines": 70
      }
    }
  }
}
```

### Playwright Configuration Example

```typescript
// e2e/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: [
    {
      command: 'pnpm --filter @trafi/api dev',
      url: 'http://localhost:3001/health',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm --filter @trafi/dashboard dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
    },
  ],
});
```

### Project Structure After Completion

```
trafi/
├── apps/
│   ├── api/
│   │   ├── package.json              # Jest 30 + coverage thresholds
│   │   ├── src/
│   │   │   └── __tests__/
│   │   │       └── app.controller.spec.ts
│   │   └── test/
│   │       ├── jest-e2e.json
│   │       └── app.e2e-spec.ts
│   │
│   └── dashboard/
│       ├── package.json              # Vitest + testing-library
│       ├── vitest.config.ts
│       ├── vitest.setup.ts
│       └── src/
│           └── __tests__/
│               └── example.test.tsx
│
├── packages/
│   ├── validators/
│   │   ├── package.json              # Vitest
│   │   ├── vitest.config.ts
│   │   └── src/
│   │       └── __tests__/
│   │           └── example.test.ts
│   │
│   ├── types/
│   │   ├── package.json              # Vitest
│   │   ├── vitest.config.ts
│   │   └── src/
│   │       └── __tests__/
│   │           └── example.test.ts
│   │
│   └── config/
│       └── src/
│           └── testing/
│               ├── vitest-shared.config.ts
│               └── mocks/
│                   └── index.ts
│
├── e2e/
│   ├── package.json                  # @playwright/test
│   ├── playwright.config.ts
│   └── tests/
│       └── health.spec.ts
│
├── turbo.json                        # test task configured
└── package.json                      # root test script
```

### Package Dependencies to Install

**Dashboard (apps/dashboard/package.json):**
```json
{
  "devDependencies": {
    "vitest": "^3.0.0",
    "@vitejs/plugin-react": "^4.3.4",
    "@testing-library/react": "^16.2.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/user-event": "^14.6.1",
    "jsdom": "^26.0.0",
    "@vitest/coverage-v8": "^3.0.0"
  }
}
```

**Packages validators/types (devDependencies):**
```json
{
  "devDependencies": {
    "vitest": "^3.0.0",
    "@vitest/coverage-v8": "^3.0.0"
  }
}
```

**E2E (e2e/package.json):**
```json
{
  "name": "@trafi/e2e",
  "private": true,
  "devDependencies": {
    "@playwright/test": "^1.50.0"
  },
  "scripts": {
    "test": "playwright test",
    "test:ui": "playwright test --ui"
  }
}
```

### Previous Story Learnings (1-5)

From Story 1-5 implementation:
1. Use `dotenv-cli` prefix for scripts that need environment variables
2. Prisma 7 generates client to `src/generated/` - exclude from coverage
3. Node.js 22 has compatibility issues - may need pnpm overrides
4. Jest is already at v30 in API - use that version

### Critical Patterns to Follow

1. **Coverage exclusions**: Exclude generated files (`src/generated/`, `*.d.ts`)
2. **Test file naming**: `*.spec.ts` for Jest, `*.test.ts` for Vitest
3. **E2E file naming**: `*.spec.ts` for Playwright
4. **Turborepo caching**: Test outputs should include `coverage/**`

### Context7 MCP Reminder

Before implementing, query Context7 for latest documentation:
- `vitest` - Configuration and coverage setup
- `playwright` - Multi-browser configuration
- `testing-library/react` - React 19 compatibility
- `jest` - NestJS testing patterns

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

1. **Vitest for Dashboard**: Configured with jsdom environment, React plugin, Testing Library matchers, and V8 coverage provider. Coverage thresholds set to 70% for all metrics.

2. **Vitest for Shared Packages**: Both `@trafi/validators` and `@trafi/types` configured with Vitest and 70% coverage thresholds. Tests validate Zod schema parsing and type inference.

3. **Jest for NestJS API**: Updated existing Jest 30 configuration with 70% coverage thresholds. Excluded generated Prisma files from coverage. Created AppModule unit test and health endpoint E2E test. Moved unit tests to `test/` directory per NestJS convention.

4. **Playwright E2E**: Created separate `e2e/` package with multi-browser configuration (chromium, firefox, webkit). Configured webserver to start API and dashboard before tests. E2E tests are run separately via `pnpm test:e2e` to avoid running in Turborepo pipeline.

5. **Shared Test Utilities**: Created `@trafi/config/src/testing/` with shared Vitest config helper and mock factories for common types (Money, Pagination, API responses).

6. **Turborepo Pipeline**: Verified `test` task configuration and added `test:cov` task for coverage reports.

7. **Final Validation**: All 31 tests pass across 6 packages. TypeScript and ESLint pass with no errors.

### File List

**Dashboard (apps/dashboard/):**
- `vitest.config.ts` - Vitest configuration with React and coverage
- `vitest.setup.ts` - Testing Library matchers setup
- `src/__tests__/example.test.tsx` - Sample React component tests
- `package.json` - Updated with test dependencies and scripts

**API (apps/api/):**
- `package.json` - Updated with Jest coverage thresholds
- `test/jest-e2e.json` - E2E test configuration
- `test/app.module.spec.ts` - AppModule unit test
- `test/app.e2e-spec.ts` - Health endpoint E2E test

**Validators (@trafi/validators):**
- `vitest.config.ts` - Vitest configuration
- `src/__tests__/example.test.ts` - Zod schema validation tests
- `package.json` - Updated with test dependencies and scripts

**Types (@trafi/types):**
- `vitest.config.ts` - Vitest configuration
- `src/__tests__/example.test.ts` - Type inference tests
- `package.json` - Updated with test dependencies and scripts

**Config (@trafi/config):**
- `src/testing/vitest-shared.config.ts` - Shared Vitest configuration helper
- `src/testing/mocks/index.ts` - Mock factories
- `src/testing/index.ts` - Barrel export
- `package.json` - Updated with testing exports

**E2E (e2e/):**
- `package.json` - Playwright package
- `playwright.config.ts` - Multi-browser E2E configuration
- `tsconfig.json` - TypeScript configuration
- `tests/health.spec.ts` - API and dashboard health tests

**Root:**
- `turbo.json` - Added test:cov task
- `pnpm-workspace.yaml` - Added e2e package
- `package.json` - Added test:e2e script
- `pnpm-lock.yaml` - Updated with new dependencies

## Senior Developer Review (AI)

**Reviewer:** Claude Opus 4.5 (Adversarial Review)
**Date:** 2026-01-12

### Review Summary

| Severity | Count | Fixed |
|----------|-------|-------|
| CRITICAL | 0 | N/A |
| HIGH | 0 | N/A |
| MEDIUM | 3 | 2 (1 deferred) |
| LOW | 3 | 3 |

### Issues Found & Resolutions

**M1: Shared config not used by packages** (DEFERRED)
- Packages have inline configs instead of importing from `@trafi/config/testing`
- Root cause: `@trafi/config` exports raw `.ts` files without build step
- Resolution: Added documentation comments to vitest configs explaining the limitation
- Deferred to: Future story when build step is added to @trafi/config

**M2: Coverage thresholds vs project-context.md** (NOT A BUG)
- Story AC4 specifies 70%, project-context.md mentions 80%/90%
- Resolution: Story requirements take precedence; 70% is correct for MVP

**M3: Test file organization** (DOCUMENTED)
- Sample tests in `src/__tests__/` vs documented `_components/__tests__/` pattern
- Resolution: Added comment noting proper location for actual component tests

**L1: pnpm-lock.yaml not in File List** (FIXED)
- Added to File List above

**L2: Missing user-event example** (FIXED)
- Added `userEvent` example test in `apps/dashboard/src/__tests__/example.test.tsx`
- Demonstrates button click and text input interactions

**L3: Hardcoded URLs in E2E tests** (FIXED)
- Updated `e2e/tests/health.spec.ts` to use configurable `API_URL` environment variable
- Default still works for local development

### Verification

- All 32 tests pass (6 packages)
- `pnpm typecheck` passes
- `pnpm lint` passes

### Verdict: APPROVED

All acceptance criteria implemented. Issues addressed. Story ready for done status.

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-12 | Story created with comprehensive test infrastructure context | SM |
| 2026-01-12 | Implemented all 7 tasks: Vitest for dashboard/packages, Jest for API, Playwright E2E, shared utilities, Turborepo pipeline | Dev Agent |
| 2026-01-12 | All tests passing (31 tests), typecheck and lint clean. Story ready for review | Dev Agent |
| 2026-01-12 | Code review: Fixed L2 (user-event example), L3 (E2E hardcoded URLs), L1 (file list). M1 deferred (shared config needs @trafi/config build step) | Reviewer |
| 2026-01-12 | Story approved and marked done. 32 tests passing | Reviewer |
