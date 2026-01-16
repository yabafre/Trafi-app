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
- Database layer isolated in packages/@trafi/db (API-only access)
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
- Prisma package (`@trafi/db`) only imported by API app
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

## Autopilot ChangeSet: Executable Artifact

_Added in revision 2026-01-14 - The standardized artifact that enables autonomous execution_

Every Autopilot action is encapsulated in a **ChangeSet** — a structured, auditable, reversible artifact that transforms recommendations into executable actions.

### ChangeSet Interface

```typescript
// @trafi/types/src/profit-engine/changeset.types.ts
interface AutopilotChangeSet {
  // Identity
  id: string;                          // UUID (cuid)
  version: number;                     // Increments on modification
  createdAt: Date;
  storeId: string;                     // Tenant scope

  // Hypothesis
  hypothesis: {
    problem: string;                   // "42% cart abandonment at shipping step"
    expectedOutcome: string;           // "Reduce abandonment by 15-25%"
    confidenceLevel: 'low' | 'medium' | 'high';
    dataEvidence: DataPoint[];         // Supporting metrics
  };

  // Action Plan
  actionPlan: {
    type: 'feature_flag' | 'workflow' | 'copy_change' | 'timing_change' | 'segment_target';
    targetSegment: SegmentDefinition;  // Who sees this change
    implementation: {
      featureFlagKey?: string;
      workflowId?: string;
      changes: ChangeDetail[];         // Specific modifications
    };
    rolloutStrategy: 'immediate' | 'gradual' | 'holdout';
    rolloutPercentage?: number;        // For gradual rollout
  };

  // Guardrails
  guardrails: {
    profitFloor: number;               // Minimum margin % to maintain
    stockThreshold?: number;           // Don't deplete below X units
    sloRequirements: SLOCheck[];       // System health gates
    riskLevel: 'low' | 'medium' | 'high';
    blockedConditions: string[];       // Conditions that block execution
  };

  // Rollback Plan
  rollbackPlan: {
    autoRollbackTriggers: MetricTrigger[];  // When to auto-revert
    manualRollbackEnabled: boolean;
    rollbackProcedure: string;              // Step-by-step instructions
    estimatedRollbackTime: string;          // "< 5 minutes"
  };

  // Proof Plan
  proofPlan: {
    primaryMetrics: MetricDefinition[];     // What we're optimizing
    secondaryMetrics: MetricDefinition[];   // Guard metrics
    holdoutPercentage: number;              // Control group size (typically 10-20%)
    statisticalMethod: 'cuped' | 'bayesian' | 'frequentist';
    minimumSampleSize: number;
    measurementWindow: string;              // "14 days"
    significanceThreshold: number;          // p < 0.05
  };

  // Approval
  approval: {
    status: 'pending' | 'approved' | 'rejected' | 'expired';
    approvedBy?: string;                    // User ID
    approvedAt?: Date;
    approvalNotes?: string;
    expiresAt?: Date;                       // Auto-expire if not approved
  };

  // Execution State
  execution: {
    status: 'draft' | 'pending_approval' | 'active' | 'measuring' | 'proven' | 'rolled_back' | 'permanent';
    startedAt?: Date;
    endedAt?: Date;
    currentMetrics?: LiveMetrics;
    proofResult?: ProofResult;
  };

  // Audit Trail
  auditTrail: AuditEvent[];                // All state changes logged
}
```

### ChangeSet Lifecycle

```
┌────────────────────────────────────────────────────────────────────────────┐
│                       CHANGESET LIFECYCLE                                  │
│                                                                            │
│  DRAFT → PENDING_APPROVAL → ACTIVE → MEASURING → [PROVEN | ROLLED_BACK]   │
│                                                           ↓               │
│                                                      PERMANENT             │
│                                                                            │
│  At each transition:                                                       │
│  • Guardrails checked (profitFloor, stockThreshold, SLO gates)            │
│  • Audit event logged (actor, timestamp, state change)                    │
│  • Notifications sent (if configured)                                      │
└────────────────────────────────────────────────────────────────────────────┘
```

### ChangeSet Database Schema

```prisma
// In @trafi/db/prisma/schema.prisma
model ChangeSet {
  id              String   @id @default(cuid())
  storeId         String
  version         Int      @default(1)

  // Content stored as JSONB for flexibility
  hypothesis      Json
  actionPlan      Json
  guardrails      Json
  rollbackPlan    Json
  proofPlan       Json

  // Approval tracking
  approvalStatus  ApprovalStatus @default(PENDING)
  approvedBy      String?
  approvedAt      DateTime?
  expiresAt       DateTime?

  // Execution state
  executionStatus ExecutionStatus @default(DRAFT)
  startedAt       DateTime?
  endedAt         DateTime?
  currentMetrics  Json?
  proofResult     Json?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  store           Store    @relation(fields: [storeId], references: [id])
  auditTrail      ChangeSetAudit[]

  @@index([storeId])
  @@index([executionStatus])
}

enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
  EXPIRED
}

enum ExecutionStatus {
  DRAFT
  PENDING_APPROVAL
  ACTIVE
  MEASURING
  PROVEN
  ROLLED_BACK
  PERMANENT
}
```

### ChangeSet Module Structure

```
apps/api/src/modules/profit-engine/
├── changeset/
│   ├── changeset.module.ts
│   ├── changeset.service.ts        # Core CRUD + state machine
│   ├── changeset.controller.ts     # REST API
│   ├── changeset.router.ts         # tRPC router
│   ├── changeset-executor.service.ts  # Executes actions
│   ├── changeset-validator.service.ts # Validates guardrails
│   └── __tests__/
```

## Override Kernel: Runtime Resolution System

_Enhanced in revision 2026-01-14 - Detailed resolution mechanism for @trafi/core distribution_

The Override Kernel is the **deterministic runtime system** that resolves which implementation (core vs override) to use. This enables the @trafi/core distribution model.

### Backend: NestJS DI Resolution

```typescript
// Core service with override token
@Injectable()
export class CoreProductService {
  protected calculatePrice(product: Product): number {
    return product.basePrice;
  }

  getProduct(id: string): Product {
    const product = this.repository.findById(id);
    product.calculatedPrice = this.calculatePrice(product);
    return product;
  }
}

// Override token declaration
export const PRODUCT_SERVICE = Symbol('PRODUCT_SERVICE');

// Core module registers default
@Module({
  providers: [
    {
      provide: PRODUCT_SERVICE,
      useClass: CoreProductService,
    },
  ],
  exports: [PRODUCT_SERVICE],
})
export class CoreProductModule {}

// Override module replaces implementation
@Module({
  providers: [
    {
      provide: PRODUCT_SERVICE,
      useClass: CustomProductService, // Extends CoreProductService
    },
  ],
})
export class CustomProductModule {}
```

**Resolution Order:**
1. Check `trafi.config.ts` for explicit override mapping
2. If override module registered, use override provider
3. Fall back to core provider
4. **Fail fast** if token has no provider (dev error, not runtime surprise)

### Dashboard: Page/Component Wrapping

```typescript
// trafi.config.ts - Dashboard overrides
export default defineTrafiConfig({
  dashboard: {
    pages: {
      '/products': {
        override: './src/pages/products/CustomProductsPage.tsx',
        wrapCore: true, // Wraps core, doesn't replace
      },
      '/products/[id]': {
        override: './src/pages/products/CustomProductDetail.tsx',
        wrapCore: false, // Fully replaces core
      },
    },
    components: {
      'ProductCard': {
        override: './src/components/CustomProductCard.tsx',
        slots: ['header', 'footer', 'actions'], // Available slot overrides
      },
    },
  },
});

// Core page with slot injection
export function CoreProductsPage({ slots }: { slots?: PageSlots }) {
  return (
    <PageLayout>
      {slots?.header ?? <DefaultHeader />}
      <ProductTable />
      {slots?.footer ?? <DefaultFooter />}
    </PageLayout>
  );
}

// Override wrapping core
export function CustomProductsPage() {
  return (
    <CoreProductsPage
      slots={{
        header: <CustomHeader showBulkActions />,
        footer: <CustomFooter showExportButton />,
      }}
    />
  );
}
```

### Config Resolution & Validation

```typescript
// trafi.config.ts structure
interface TrafiConfig {
  version: string;                    // Minimum compatible @trafi/core version

  api: {
    modules: ModuleOverride[];        // Backend module overrides
    services: ServiceOverride[];      // Individual service overrides
    guards: GuardOverride[];          // Auth/permission guard overrides
  };

  dashboard: {
    pages: PageOverride[];            // Page-level overrides
    components: ComponentOverride[];  // Component-level overrides
    theme: ThemeOverride;             // Design token overrides
  };

  sdk: {
    interceptors: Interceptor[];      // Request/response interceptors
    hooks: HookOverride[];            // SDK event hooks
  };
}

// Validation at startup (FAIL FAST)
function validateConfig(config: TrafiConfig): ValidationResult {
  const errors: ValidationError[] = [];

  // Version compatibility check
  if (!semver.satisfies(CORE_VERSION, config.version)) {
    errors.push({
      type: 'version_mismatch',
      message: `Config requires ${config.version}, running ${CORE_VERSION}`,
    });
  }

  // Override file existence check
  for (const override of config.api.modules) {
    if (!fs.existsSync(override.path)) {
      errors.push({ type: 'missing_override', path: override.path });
    }
  }

  // Type compatibility check (via TypeScript compiler API)
  for (const service of config.api.services) {
    if (!extendsCore(service.override, service.core)) {
      errors.push({
        type: 'incompatible_override',
        message: `${service.override} must extend ${service.core}`,
      });
    }
  }

  return { valid: errors.length === 0, errors };
}
```

### Compatibility Guarantees

| Surface | Versioning | Breaking Change Policy |
|---------|------------|------------------------|
| **Public service methods** | SemVer major | 90-day deprecation window |
| **Protected methods** | SemVer minor | Can change in minor versions |
| **Internal methods** | None | Can change anytime |
| **Component props** | SemVer major | 90-day deprecation window |
| **Slot definitions** | SemVer minor | New slots = minor, removed = major |
| **Config schema** | SemVer major | Migration scripts provided |

**Critical Rule:** Customizations must survive upgrades — or fail loudly at startup, not silently at runtime.

## Module Sandbox: Security Architecture

_Added in revision 2026-01-14 - Security enforcement for third-party modules_

Modules and marketplace extensions represent a significant attack surface. The Module Sandbox enforces strict security boundaries.

### Sandbox Architecture Layers

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       MODULE SANDBOX LAYERS                             │
│                                                                         │
│  ┌─────────────────┐                                                    │
│  │  STATIC CHECKS  │  Pre-install validation (AST analysis)            │
│  └────────┬────────┘                                                    │
│           ↓                                                             │
│  ┌─────────────────┐                                                    │
│  │   FS ISOLATION  │  Module can only access allowed paths              │
│  └────────┬────────┘                                                    │
│           ↓                                                             │
│  ┌─────────────────┐                                                    │
│  │  NETWORK ACL    │  Explicit allowlist for external requests          │
│  └────────┬────────┘                                                    │
│           ↓                                                             │
│  ┌─────────────────┐                                                    │
│  │ RUNTIME POLICY  │  CPU/memory limits, syscall restrictions           │
│  └─────────────────┘                                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Static Analysis Checks (Pre-Install)

| Check | Policy | Fail Action |
|-------|--------|-------------|
| **No `eval()` or `Function()`** | Block dynamic code execution | Reject module |
| **No `require()` with variables** | Block dynamic imports | Reject module |
| **No `child_process`** | Block shell access | Reject module |
| **No `fs` outside sandbox** | Block arbitrary file access | Reject module |
| **No `net` without ACL** | Block arbitrary network | Reject module |
| **No obfuscated code** | Require readable source | Reject module |
| **Dependency audit** | Check deps for known CVEs | Warn + require approval |

```typescript
// Static analysis configuration
// Location: modules/plugins/sandbox/static-analyzer.ts
const staticAnalysisRules: AnalysisRule[] = [
  { pattern: /eval\s*\(/, severity: 'critical', message: 'Dynamic code execution not allowed' },
  { pattern: /new\s+Function\s*\(/, severity: 'critical', message: 'Function constructor not allowed' },
  { pattern: /require\s*\(\s*[^'"']/, severity: 'critical', message: 'Dynamic require not allowed' },
  { pattern: /child_process/, severity: 'critical', message: 'Shell access not allowed' },
];
```

### Filesystem Isolation

```typescript
// Module manifest declares FS permissions
interface ModuleManifest {
  permissions: {
    fs: {
      read: string[];   // Allowed read paths (relative to module root)
      write: string[];  // Allowed write paths
    };
  };
}

// Example: A shipping module
{
  "permissions": {
    "fs": {
      "read": ["./config", "./templates"],
      "write": ["./cache", "./logs"]
    }
  }
}

// Runtime enforcement
class SandboxedFS {
  constructor(private allowedPaths: FSPermissions) {}

  readFile(path: string): Buffer {
    if (!this.isAllowed(path, 'read')) {
      throw new SecurityError(`FS read not allowed: ${path}`);
    }
    return fs.readFileSync(this.resolvePath(path));
  }
}
```

### Network ACL (Allowlist)

```typescript
// Module declares network permissions
interface NetworkPermissions {
  allowlist: {
    domain: string;           // e.g., "api.stripe.com"
    ports: number[];          // e.g., [443]
    protocols: ('https')[];   // HTTP not allowed by default
    reason: string;           // Why this access is needed
  }[];
}

// Example: Payment module network permissions
{
  "network": {
    "allowlist": [
      {
        "domain": "api.stripe.com",
        "ports": [443],
        "protocols": ["https"],
        "reason": "Stripe payment API"
      }
    ]
  }
}
```

### Runtime Policy Enforcement

| Resource | Limit | Enforcement |
|----------|-------|-------------|
| **CPU time per request** | 5 seconds | Kill process, return 503 |
| **Memory per module** | 256MB | OOM kill, restart module |
| **Open file handles** | 100 | Reject new opens |
| **Network connections** | 50 concurrent | Queue or reject |
| **Database queries** | Tenant-scoped only | Reject cross-tenant |

### Security Incident Response

```typescript
interface SecurityIncident {
  moduleId: string;
  storeId: string;
  violationType: 'fs' | 'network' | 'cpu' | 'memory' | 'static';
  details: string;
  timestamp: Date;
  action: 'blocked' | 'terminated' | 'quarantined';
}

function handleSecurityIncident(incident: SecurityIncident): void {
  // 1. Log to security audit trail
  auditLog.security(incident);
  // 2. Quarantine module (disable immediately)
  moduleManager.quarantine(incident.moduleId);
  // 3. Notify store owner
  notifications.send(incident.storeId, { type: 'security_alert', ... });
  // 4. If marketplace module, notify Trafi security team
  if (isMarketplaceModule(incident.moduleId)) {
    securityTeam.alert(incident);
  }
}
```

### Marketplace Module Tiers

| Tier | Review Level | Permissions |
|------|--------------|-------------|
| **Verified** | Full audit + Trafi team review | Full permissions (with ACL) |
| **Community** | Automated checks + community review | Limited permissions |
| **Private** | Owner responsibility | Full permissions (owner risk) |

## Non-Negotiable Security Rules

_Added in revision 2026-01-14 - From PRD consolidated non-negotiables_

These requirements are **ABSOLUTE** — no exceptions, no "we'll add it later":

| Non-Negotiable | Why It's Critical | Violation Consequence | Enforcement |
|----------------|-------------------|----------------------|-------------|
| **Tenant Isolation** | Data leakage = catastrophic breach | Security incident, legal liability | Every query includes `storeId` |
| **RBAC on Every Request** | Unauthorized access = data breach | Security incident | Guards on all controllers |
| **Rate Limiting** | No limits = DoS vulnerability | Service outage, abuse | @nestjs/throttler + Redis |
| **Audit Logging** | No audit = no forensics | GDPR violation | All sensitive operations logged |
| **Input Validation** | Unvalidated input = injection | SQL injection, XSS, RCE | Zod schemas on all inputs |

### Enforcement Patterns

```typescript
// ❌ NEVER - Query without tenant scope
const products = await prisma.product.findMany();

// ✅ ALWAYS - Explicit tenant scope
const products = await prisma.product.findMany({
  where: { storeId: ctx.tenant.id }
});

// ❌ NEVER - Controller without guards
@Controller('products')
export class ProductController { ... }

// ✅ ALWAYS - Guards on controller
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('products')
export class ProductController { ... }
```

## Development Rules (Epic 1 Retrospective)

_Added in revision 2026-01-14 - Lessons learned from Epic 1 implementation_

### Context7 MCP Protocol (MANDATORY)

**Before implementing with ANY library, query Context7 MCP:**

```
1. resolve-library-id → Get the library ID
2. query-docs → Get current documentation
3. Implement → Use up-to-date patterns, not outdated knowledge
```

**Why:** LLM training data is stale. Context7 provides current documentation. Failure to query leads to deprecated patterns and bugs.

**Applies to:** NestJS, Next.js, Prisma, React Query, Shadcn, Tailwind, tRPC, BullMQ, Zod, and ALL other libraries.

### Service Implementation Patterns

| Rule | Pattern | Example |
|------|---------|---------|
| **Business logic in protected** | Methods that may need customization | `protected calculatePrice()` |
| **Explicit public API** | Clear interface per service | `class ProductService { getById(), create() }` |
| **Dependency injection** | NEVER instantiate manually | Use `@Injectable()` + constructor injection |
| **Tenant isolation** | EVERY query includes storeId | `findMany({ where: { storeId } })` |

### Pre-Completion Checklist

Before marking any story as complete, verify:

- [ ] `pnpm lint` passes with zero errors
- [ ] `pnpm build` succeeds without warnings
- [ ] `pnpm test` passes all tests
- [ ] New code has appropriate test coverage
- [ ] Context7 was consulted for library usage
- [ ] Services follow override-ready patterns
- [ ] Tenant isolation verified in all queries
- [ ] Swagger decorators on all API endpoints

### Type System Rules

| Rule | Description |
|------|-------------|
| **Types from @trafi/validators** | NEVER define types locally in apps/ |
| **Zod → TypeScript** | `z.infer<typeof Schema>` generates types |
| **import type** | Use `import type { X }` for type-only imports |
| **No implicit any** | All parameters must be explicitly typed |

### Swagger/OpenAPI Documentation (MANDATORY)

Every API endpoint MUST have complete Swagger decorators:

```typescript
@ApiTags('products')
@Controller('products')
export class ProductController {
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiResponse({ status: 200, type: ProductDto })
  @ApiResponse({ status: 404, type: ErrorDto })
  @ApiBearerAuth('JWT-auth')
  @Get(':id')
  getById(@Param('id') id: string) { ... }
}
```

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
└── @trafi/db/                   # Prisma (generates types too)
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
    ├── @trafi/db/                        # Prisma
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

// NEVER import from @trafi/db in dashboard (enforced by ESLint)
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
3. Never import from `@trafi/db` in frontend apps
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

// ❌ Importing Prisma in dashboard
import { prisma } from '@trafi/db';  // ❌ FORBIDDEN in frontend

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

## Project Structure & Boundaries

### Requirements to Module Mapping

#### Commerce Cores (MVP)

| Module | FRs | API Location | Dashboard Location |
|--------|-----|--------------|-------------------|
| **Product** | FR10-FR12 | `modules/product/` | `app/(dashboard)/products/` |
| **Customer** | FR41-FR45 | `modules/customer/` | `app/(dashboard)/customers/` |
| **Cart** | FR13-FR15 | `modules/cart/` | - (storefront only) |
| **Checkout** | FR16-FR18 | `modules/checkout/` | `app/(dashboard)/orders/` |
| **Payment** | FR19-FR20 | `modules/payment/` | `app/(dashboard)/settings/payments/` |
| **Order** | FR21-FR22 | `modules/order/` | `app/(dashboard)/orders/` |
| **Inventory** | FR46-FR50 | `modules/inventory/` | `app/(dashboard)/inventory/` |
| **Tax** | FR63-FR67 | `modules/tax/` | `app/(dashboard)/settings/tax/` |
| **Fulfillment** | FR51-FR56 | `modules/fulfillment/` | `app/(dashboard)/fulfillment/` |

#### Profit Engine (MVP)

| Component | FRs | API Location |
|-----------|-----|--------------|
| **Event Collector** | FR23-FR25 | `modules/profit-engine/collector/` |
| **Checkout Doctor** | FR26-FR28 | `modules/profit-engine/doctor/` |
| **Recovery Engine** | FR29-FR31 | `modules/profit-engine/recovery/` |
| **Guardrails** | FR32-FR34 | `modules/profit-engine/guardrails/` |

#### Platform & System (MVP)

| Component | FRs | API Location |
|-----------|-----|--------------|
| **User Access** | FR35-FR40 | `modules/auth/` |
| **Tenant Management** | FR68-FR72 | `modules/tenant/` |
| **Jobs Module** | FR79-FR85 | `modules/jobs/` |
| **Webhooks** | FR86-FR90 | `modules/webhooks/` |
| **Plugins** | FR91-FR104 | `modules/plugins/` |

#### P1 Extensions (Post-MVP)

| Module | Purpose | Trigger |
|--------|---------|---------|
| **Organization** | Multi-store management | P1 launch |
| **Store** | Store within organization | P1 launch |
| **Channel** | Multi-channel (Web, Mobile, POS) | P1 launch |
| **i18n** | Translation module (JSONB) | P1 launch |

### Complete Project Structure

```
trafi/
├── apps/
│   ├── api/                                    # NestJS Backend
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── product/                    # FR10-FR12
│   │   │   │   │   ├── product.module.ts
│   │   │   │   │   ├── product.service.ts
│   │   │   │   │   ├── product.controller.ts   # REST
│   │   │   │   │   ├── product.router.ts       # tRPC
│   │   │   │   │   └── __tests__/
│   │   │   │   ├── customer/                   # FR41-FR45
│   │   │   │   ├── cart/                       # FR13-FR15
│   │   │   │   ├── checkout/                   # FR16-FR18
│   │   │   │   ├── payment/                    # FR19-FR20
│   │   │   │   │   └── providers/
│   │   │   │   │       └── stripe/
│   │   │   │   ├── order/                      # FR21-FR22
│   │   │   │   ├── inventory/                  # FR46-FR50
│   │   │   │   ├── fulfillment/                # FR51-FR56
│   │   │   │   ├── tax/                        # FR63-FR67
│   │   │   │   ├── auth/                       # FR35-FR40
│   │   │   │   ├── tenant/                     # FR68-FR72
│   │   │   │   ├── profit-engine/              # FR23-FR34
│   │   │   │   │   ├── collector/
│   │   │   │   │   ├── doctor/
│   │   │   │   │   ├── recovery/
│   │   │   │   │   └── guardrails/
│   │   │   │   ├── jobs/                       # FR79-FR85
│   │   │   │   │   ├── queues/
│   │   │   │   │   ├── processors/
│   │   │   │   │   └── dashboard/
│   │   │   │   ├── webhooks/                   # FR86-FR90
│   │   │   │   ├── plugins/                    # FR91-FR104
│   │   │   │   │   ├── loader/
│   │   │   │   │   ├── registry/
│   │   │   │   │   └── sandbox/
│   │   │   │   ├── notification/
│   │   │   │   │   └── providers/
│   │   │   │   │       └── resend/
│   │   │   │   │
│   │   │   │   │   # P1 MODULES
│   │   │   │   ├── organization/               # P1: Multi-Store
│   │   │   │   │   ├── organization.module.ts
│   │   │   │   │   ├── organization.service.ts
│   │   │   │   │   └── billing/
│   │   │   │   ├── store/                      # P1: Store Management
│   │   │   │   │   ├── store.module.ts
│   │   │   │   │   └── store.service.ts
│   │   │   │   ├── channel/                    # P1: Multi-Channel
│   │   │   │   │   ├── channel.module.ts
│   │   │   │   │   └── channel.service.ts
│   │   │   │   ├── i18n/                       # P1: Translations
│   │   │   │   │   ├── i18n.module.ts
│   │   │   │   │   ├── translation.service.ts
│   │   │   │   │   └── locale.service.ts
│   │   │   │   │
│   │   │   │   └── _future/                    # P2: Not Implemented
│   │   │   │       ├── vendor/                 # Marketplace
│   │   │   │       ├── b2b/                    # B2B Features
│   │   │   │       └── integration/            # ERP
│   │   │   │
│   │   │   ├── common/
│   │   │   │   ├── guards/
│   │   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   │   ├── roles.guard.ts
│   │   │   │   │   ├── permissions.guard.ts
│   │   │   │   │   └── tenant.guard.ts
│   │   │   │   ├── decorators/
│   │   │   │   ├── filters/
│   │   │   │   ├── interceptors/
│   │   │   │   ├── pipes/
│   │   │   │   ├── redis/
│   │   │   │   └── observability/
│   │   │   ├── trpc/
│   │   │   │   ├── trpc.module.ts
│   │   │   │   ├── trpc.router.ts
│   │   │   │   └── context.ts
│   │   │   ├── rest/
│   │   │   │   └── v1/
│   │   │   └── main.ts
│   │   └── test/
│   │
│   └── dashboard/                              # Next.js Dashboard
│       └── src/
│           ├── app/
│           │   ├── (auth)/
│           │   │   ├── login/
│           │   │   │   └── page.tsx
│           │   │   └── layout.tsx
│           │   ├── (dashboard)/
│           │   │   ├── products/
│           │   │   │   ├── page.tsx
│           │   │   │   ├── _components/
│           │   │   │   ├── _hooks/
│           │   │   │   ├── _actions/
│           │   │   │   ├── [id]/
│           │   │   │   └── new/
│           │   │   ├── customers/
│           │   │   ├── orders/
│           │   │   ├── inventory/
│           │   │   ├── fulfillment/
│           │   │   ├── profit-engine/
│           │   │   │   ├── doctor/
│           │   │   │   ├── recovery/
│           │   │   │   └── analytics/
│           │   │   ├── jobs/
│           │   │   ├── webhooks/
│           │   │   ├── plugins/
│           │   │   │
│           │   │   │   # P1 ROUTES
│           │   │   ├── organization/           # P1
│           │   │   │   ├── page.tsx
│           │   │   │   ├── _components/
│           │   │   │   ├── _actions/
│           │   │   │   ├── stores/
│           │   │   │   ├── billing/
│           │   │   │   └── team/
│           │   │   ├── channels/               # P1
│           │   │   │   ├── page.tsx
│           │   │   │   └── [channelId]/
│           │   │   │
│           │   │   ├── settings/
│           │   │   │   ├── payments/
│           │   │   │   ├── tax/
│           │   │   │   ├── team/
│           │   │   │   ├── api-keys/
│           │   │   │   └── locales/            # P1
│           │   │   └── layout.tsx
│           │   └── layout.tsx
│           │
│           ├── components/
│           │   ├── ui/
│           │   └── shared/
│           ├── lib/
│           │   ├── trpc.ts
│           │   └── hooks/
│           ├── actions/
│           └── stores/
│
└── packages/
    ├── @trafi/validators/
    │   └── src/
    │       ├── product/
    │       ├── order/
    │       ├── customer/
    │       ├── i18n/                           # P1
    │       │   ├── translation.schema.ts
    │       │   └── locale.schema.ts
    │       ├── organization/                   # P1
    │       │   └── organization.schema.ts
    │       ├── common/
    │       └── index.ts
    │
    ├── @trafi/types/
    │   └── src/
    │       ├── product.types.ts
    │       ├── order.types.ts
    │       ├── api.types.ts
    │       ├── events.types.ts
    │       ├── i18n.types.ts                   # P1
    │       ├── organization.types.ts           # P1
    │       └── index.ts
    │
    ├── @trafi/db/
    │   ├── prisma/
    │   │   └── schema.prisma
    │   └── src/
    │
    ├── @trafi/config/
    │
    ├── @trafi/sdk/                             # External SDK
    │   └── src/
    │       ├── client.ts
    │       └── resources/
    │
    └── @trafi/plugin-sdk/                      # Plugin Developer SDK
        └── src/
```

### Architectural Boundaries

#### API Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL BOUNDARY                         │
│  REST API (/api/v1/*) + SDK                                 │
│  - Public endpoints (storefront, SDK consumers)             │
│  - Rate limited per tenant                                  │
│  - API key authentication                                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    INTERNAL BOUNDARY                         │
│  tRPC Router                                                │
│  - Dashboard-only endpoints                                 │
│  - JWT session authentication                               │
│  - Full RBAC enforcement                                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    SERVICE BOUNDARY                          │
│  NestJS Services                                            │
│  - Business logic encapsulation                             │
│  - Cross-module communication via DI                        │
│  - Event emission for async processing                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    DATA BOUNDARY                             │
│  Prisma + PostgreSQL                                        │
│  - Tenant-scoped queries (always include storeId)          │
│  - Connection per-tenant database                           │
│  - No direct DB access from outside API                     │
└─────────────────────────────────────────────────────────────┘
```

#### Multi-Store Hierarchy (P1)

```
Organization (Account Level)
├── Billing (Stripe Customer)
├── Team Members (Org-wide roles)
│
├── Store: France B2C (tenant_fr)
│   ├── Database: postgres://tenant_fr
│   ├── Locales: [fr, en]
│   ├── Currency: EUR
│   ├── Channel: Web (default)
│   └── Channel: Mobile App
│
├── Store: Germany B2C (tenant_de)
│   ├── Database: postgres://tenant_de
│   ├── Locales: [de, en]
│   ├── Currency: EUR
│   └── Channel: Web
│
└── Store: B2B Wholesale (tenant_b2b)
    ├── Database: postgres://tenant_b2b
    ├── Locales: [fr, en]
    ├── Currency: EUR
    └── Channel: B2B Portal
```

### i18n Implementation (P1)

#### JSONB Translation Pattern

```typescript
// All translatable entities use JSONB column
// Pattern: translations: { locale: { field: value } }

// Product example
{
  "id": "prod_123",
  "sku": "TSHIRT-001",
  "translations": {
    "fr": {
      "name": "T-Shirt Premium",
      "description": "Un t-shirt de qualité supérieure",
      "shortDescription": "T-shirt premium"
    },
    "en": {
      "name": "Premium T-Shirt",
      "description": "A high-quality t-shirt",
      "shortDescription": "Premium t-shirt"
    },
    "de": {
      "name": "Premium T-Shirt",
      "description": "Ein hochwertiges T-Shirt"
    }
  }
}

// Fallback chain: requested → language base → default → first available
// Example: de-AT → de → en → fr
```

#### Translation Helper

```typescript
// @trafi/types/src/i18n.types.ts
export interface TranslationHelpers {
  /**
   * Get translation with fallback chain
   * @param translations - JSONB translations object
   * @param locale - Requested locale (e.g., "de-AT")
   * @param fallbackChain - Fallback locales (default: ["en"])
   */
  getTranslation<T>(
    translations: Record<string, T>,
    locale: string,
    fallbackChain?: string[]
  ): T | null;

  /**
   * Get all available locales for an entity
   */
  getAvailableLocales(translations: Record<string, unknown>): string[];

  /**
   * Check if translation exists for locale
   */
  hasTranslation(translations: Record<string, unknown>, locale: string): boolean;
}
```

### P2 Future Modules (Documented, Not Implemented)

```markdown
# Future Modules Reference

## Vendor/Marketplace (P2)
**Implementation Trigger:** Business model pivot OR 5+ merchant requests
**Stripe Connect required for payouts**

## B2B Features (P2)
**Implementation Trigger:** 3+ paying customers requesting B2B
**Priority:** Price Lists → Customer Groups → Net Terms → Quotes (P3)

## ERP Integration (P2)
**Implementation Trigger:** Enterprise customer with budget
**Priority:** Webhooks + CSV → Odoo connector → SAP connector
```

### Integration Points

| External Service | Purpose | Module | Connection Type |
|-----------------|---------|--------|-----------------|
| **Stripe** | Payments | `payment/providers/stripe` | SDK |
| **Stripe Connect** | Marketplace payouts (P2) | `_future/vendor` | SDK |
| **Resend** | Transactional email | `notification/providers/resend` | API |
| **S3/R2** | Media storage | `common/storage` | SDK |
| **Redis** | Cache + BullMQ | `common/redis` | Client |
| **PostgreSQL** | Per-tenant data | `@trafi/db` | Prisma |

### Data Flow Complete

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Storefront │     │  Dashboard  │     │  External   │
│  (Next.js)  │     │  (Next.js)  │     │  (SDK)      │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │ REST/SDK          │ Zsa→tRPC         │ REST/SDK
       ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────┐
│                     API (NestJS)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ REST Layer  │  │ tRPC Layer  │  │ WS Gateway  │     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
│         └────────────────┼────────────────┘             │
│                          ▼                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Service Layer                        │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐ │  │
│  │  │Commerce │ │ Profit  │ │ Module  │ │  P1:   │ │  │
│  │  │ Cores   │ │ Engine  │ │ System  │ │  Org   │ │  │
│  │  │         │ │         │ │         │ │ i18n   │ │  │
│  │  │         │ │         │ │         │ │Channel │ │  │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └───┬────┘ │  │
│  └───────┼───────────┼───────────┼──────────┼───────┘  │
│          └───────────┼───────────┴──────────┘          │
│                      ▼                                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Data Layer (Prisma)                  │  │
│  │  Tenant Resolution → Per-Tenant DB Connection    │  │
│  └──────────────────────┬───────────────────────────┘  │
└─────────────────────────┼───────────────────────────────┘
                          ▼
┌───────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE                          │
├───────────────────────────────────────────────────────────┤
│  PostgreSQL (per-tenant)  │  Redis (cache + BullMQ)       │
│  PostgreSQL (management)  │  S3/R2 (media)                │
└───────────────────────────────────────────────────────────┘
```

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All technology choices work together without conflicts. NestJS + tRPC + Prisma + Next.js + Zsa form a cohesive stack with native integrations. Version compatibility verified (Prisma 7, Next.js 15, TypeScript 5.x).

**Pattern Consistency:**
Implementation patterns fully support architectural decisions. Naming conventions consistent across database (PascalCase), API (kebab-case), and code (camelCase). Local/global `_` prefix convention provides clear structure.

**Structure Alignment:**
Project structure supports all architectural decisions. Clear API/Internal/Service/Data boundaries. P1 modules properly structured, P2 modules documented in `_future/`.

### Requirements Coverage Validation ✅

**Functional Requirements Coverage:**
All 104 FRs across 9 commerce domains have dedicated modules:
- Commerce Cores (9 modules): Product, Customer, Cart, Checkout, Payment, Order, Inventory, Tax, Fulfillment
- Profit Engine (4 sub-modules): Collector, Doctor, Recovery, Guardrails
- Platform (5 modules): Auth, Tenant, Jobs, Webhooks, Plugins

**Non-Functional Requirements Coverage:**
- Performance: Redis caching, optimized data flow, PostgreSQL indexing
- Availability: Docker-ready, health checks, graceful degradation
- Scalability: DB-per-tenant, connection pooling, horizontal scaling
- Security: JWT auth, RBAC guards, tenant isolation, PCI SAQ-A via Stripe
- Compliance: Audit logging, GDPR support, 2-year retention

**P1 Extensions Planned:**
- Multi-Store: Organization → Store → Channel hierarchy
- i18n: JSONB translation pattern with fallback chain
- Multi-Channel: Web, Mobile, POS base architecture

### Implementation Readiness Validation ✅

**Decision Completeness:**
- All critical decisions documented with specific versions
- Technology rationale clearly explained
- Migration paths defined (MVP → P1 upgrades)

**Structure Completeness:**
- Complete project tree with 50+ directories/files specified
- Every FR mapped to specific module location
- Dashboard routes mapped to API modules

**Pattern Completeness:**
- 12 conflict points standardized
- Comprehensive naming conventions with examples
- Anti-patterns documented to prevent mistakes

### Gap Analysis Results

**Critical Gaps:** None identified

**Important Gaps (Minor):**
1. Trafi Builder module implicit in Dashboard - will be defined in Epic
2. SDK development workflow - to be detailed in SDK stories
3. Plugin sandbox runtime details - to be specified in Plugins epic

**Nice-to-Have (Deferred):**
- Cross-tenant data migration tooling
- Advanced debugging workflow documentation

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed (104 FRs, NFRs documented)
- [x] Scale and complexity assessed (High - 15-20 services)
- [x] Technical constraints identified (7 major constraints)
- [x] Cross-cutting concerns mapped (7 concerns addressed)

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined (tRPC internal, REST external)
- [x] Performance considerations addressed (caching, pooling)

**✅ Implementation Patterns**
- [x] Naming conventions established (12 categories)
- [x] Structure patterns defined (local/global, shared types)
- [x] Communication patterns specified (events, tRPC, actions)
- [x] Process patterns documented (errors, loading, mutations)

**✅ Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established (4 layers)
- [x] Integration points mapped (6 external services)
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION ✅

**Confidence Level:** HIGH

**Key Strengths:**
- Complete technology stack alignment with PRD requirements
- Clear type sharing strategy prevents duplication
- Local/global convention prevents AI agent conflicts
- Multi-store architecture future-proofed for P1
- Frontend-DB isolation rule enforced architecturally

**Areas for Future Enhancement:**
- Plugin sandbox isolation details (P1)
- SDK developer experience improvements (P1)
- Advanced monitoring dashboards (P1)

### Implementation Handoff

**AI Agent Guidelines:**
1. Follow all architectural decisions exactly as documented
2. Use implementation patterns consistently across all components
3. Respect project structure and boundaries
4. Import types from `@trafi/validators` and `@trafi/types` only
5. Never import `@trafi/db` in frontend apps
6. Query Context7 MCP before implementing with any library
7. Use `_` prefix for route-local components, hooks, actions

**First Implementation Priority:**
```bash
# 1. Initialize Turborepo structure
npx create-turbo@latest trafi --package-manager pnpm

# 2. Add NestJS API
cd apps && npx @nestjs/cli@latest new api --strict --skip-git

# 3. Add Next.js Dashboard with Shadcn
npx create-next-app@latest dashboard --typescript --tailwind --app --src-dir
cd dashboard && npx shadcn@latest init

# 4. Initialize shared packages
mkdir -p packages/@trafi/{validators,types,db,config}
```

## Architecture Completion Summary

### Workflow Completion

**Architecture Decision Workflow:** COMPLETED ✅
**Total Steps Completed:** 8
**Date Completed:** 2026-01-11
**Document Location:** `_bmad-output/planning-artifacts/architecture.md`

### Final Architecture Deliverables

**Complete Architecture Document**
- All architectural decisions documented with specific versions
- Implementation patterns ensuring AI agent consistency
- Complete project structure with all files and directories
- Requirements to architecture mapping
- Validation confirming coherence and completeness

**Implementation Ready Foundation**
- 25+ architectural decisions made
- 12 implementation pattern categories defined
- 20+ architectural components specified
- 104 functional requirements fully supported

**AI Agent Implementation Guide**
- Technology stack with verified versions
- Consistency rules that prevent implementation conflicts
- Project structure with clear boundaries
- Integration patterns and communication standards

### Implementation Handoff

**For AI Agents:**
This architecture document is your complete guide for implementing trafi-app. Follow all decisions, patterns, and structures exactly as documented.

**Development Sequence:**
1. Initialize project using documented starter template commands
2. Set up development environment per architecture
3. Implement core architectural foundations (Prisma schema, NestJS modules, tRPC routers)
4. Build features following established patterns
5. Maintain consistency with documented rules

### Quality Assurance Checklist

**✅ Architecture Coherence**
- [x] All decisions work together without conflicts
- [x] Technology choices are compatible
- [x] Patterns support the architectural decisions
- [x] Structure aligns with all choices

**✅ Requirements Coverage**
- [x] All 104 functional requirements are supported
- [x] All non-functional requirements are addressed
- [x] Cross-cutting concerns are handled
- [x] Integration points are defined

**✅ Implementation Readiness**
- [x] Decisions are specific and actionable
- [x] Patterns prevent agent conflicts
- [x] Structure is complete and unambiguous
- [x] Examples are provided for clarity

### Project Success Factors

**Clear Decision Framework**
Every technology choice was made collaboratively with clear rationale, ensuring all stakeholders understand the architectural direction.

**Consistency Guarantee**
Implementation patterns and rules ensure that multiple AI agents will produce compatible, consistent code that works together seamlessly.

**Complete Coverage**
All project requirements are architecturally supported, with clear mapping from business needs to technical implementation.

**Solid Foundation**
The chosen Turborepo + NestJS + Next.js architecture provides a production-ready foundation following current best practices.

---

**Architecture Status:** READY FOR IMPLEMENTATION ✅

**Next Phase:** Begin implementation using the architectural decisions and patterns documented herein.

**Document Maintenance:** Update this architecture when major technical decisions are made during implementation.

