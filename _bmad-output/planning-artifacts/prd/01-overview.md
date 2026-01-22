---
stepsCompleted: [1, 2, 3, 4, 6, 7, 8, 9, 10, 11]
status: complete
completedAt: 2026-01-10
revisedAt: 2026-01-14
revisionNotes: |
  Surgical revision v1 (2026-01-14):
  - Trafi Autopilot OS concept (4 roles replaced)
  - 3 Planes Architecture (Data/Decision/Execution)
  - @trafi/core Distribution Model & Override Patterns
  - MVP Game Changer (Reversible Experimentation Engine)
  - Development Rules from Epic 1 retrospective
  - Consolidated Non-Negotiables with enforcement patterns

  Surgical revision v2 (2026-01-14):
  - Autopilot ChangeSet: Executable artifact with full lifecycle
  - Override Kernel: NestJS DI resolution + Dashboard wrapping + Config validation
  - Module Sandbox: Static analysis, FS isolation, Network ACL, Runtime policy
inputDocuments:
  - '_bmad-output/planning-artifacts/product-brief-trafi-app-2026-01-09.md'
  - '_bmad-output/analysis/brainstorming-session-2026-01-08.md'
  - '_bmad-output/planning-artifacts/architecture.md'
  - '_bmad-output/implementation-artifacts/epic-1-retrospective.md'
  - '_bmad-output/project-context.md'
workflowType: 'prd'
lastStep: 11
documentCounts:
  briefs: 1
  research: 0
  brainstorming: 1
  projectDocs: 3
---

# Product Requirements Document - trafi-app

**Author:** Alex
**Date:** 2026-01-09

## Executive Summary

**Trafi** is an open-source e-commerce platform for developers that combines headless commerce flexibility with built-in profit automation. Unlike traditional headless solutions that deliver technical freedom but leave merchants struggling with conversion, Trafi provides a closed-loop system: instrumentation → diagnosis → action → statistical proof → automatic rollback.

### Problem Statement

Building modern headless e-commerce imposes a hidden complexity tax that developers and small teams consistently underestimate. What begins as "technical freedom" becomes an ongoing burden of:

- **Integration sprawl**: Connecting payment providers, email services, analytics, and CMS creates an exponentially complex dependency graph
- **Post-launch maintenance**: Microservices upgrades, fragile checkout flows, and performance/SEO stability demand constant attention
- **Conversion gap**: "Technically modern" stores that convert poorly, making every acquisition euro harder to recoup

Current headless platforms solve the "build" problem while ignoring the "grow" problem. No platform delivers **headless developer experience + closed-loop profit automation** as a unified product.

### Vision

Trafi provides a complete e-commerce platform built on a **monorepo architecture** (NestJS API + Next.js Dashboard) with **forkable storefront templates** and a **type-safe SDK/CLI** that serves as a "productive bridge" between backend and frontend.

**Positioning:** *"The open-source Shopify alternative for developers—with built-in profit automation."*

### What Makes This Special: Trafi Autopilot OS

The core innovation is **Trafi Autopilot OS**—not just an analytics dashboard, but a **complete execution team packaged as software**. While competitors display data and leave merchants to figure out actions, Trafi operates as an autonomous e-commerce operating system:

**The Hidden Cost Problem Trafi Solves:**

Post-launch e-commerce stores face a brutal reality: maintaining and optimizing a store requires specialized roles that small teams can't afford:
- **Growth/CRO specialist** for conversion optimization experiments
- **CRM/Lifecycle manager** for customer retention and recovery
- **Analytics/Data analyst** for diagnosing problems and measuring impact
- **Ops/Safety guardian** for protecting margins and preventing rollback disasters

**Trafi replaces these 4 roles with an intelligent execution pipeline.**

**The Autopilot Execution Cycle:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                     TRAFI AUTOPILOT CYCLE                           │
│                                                                     │
│  INSTRUMENT → DIAGNOSE → PROPOSE → PROVE → PROTECT                  │
│                                                                     │
│  1. Instrument: Auto-capture entire customer journey                │
│  2. Diagnose: Identify conversion leaks with statistical context   │
│  3. Propose: Generate actionable recommendations (merchant approves)│
│  4. Prove: Measure impact with confidence intervals                 │
│  5. Protect: Auto-rollback if metrics decline                       │
└─────────────────────────────────────────────────────────────────────┘
```

**Key Principles:**
- **"Autopilot PROPOSES, merchant APPROVES"** — inverted flow that reduces friction while maintaining control
- **Execution, not advice** — Trafi doesn't suggest "you should try X", it executes X reversibly and proves the result
- **Statistical proof, not vibes** — Every action is measured with confidence intervals before becoming permanent
- **Margin protection built-in** — Guardrails actively block revenue optimizations that would destroy margins

### Extensibility Model

Trafi adopts a **plugin architecture** for integrations:

- **Payments**: Stripe as reference implementation, extensible to other providers (PayPal, Mollie, etc.)
- **Shipping**: Multiple carrier integrations via plugin system
- **Other integrations**: Email, analytics, CMS — all follow the same plugin pattern

This ensures flexibility without vendor lock-in while maintaining a cohesive developer experience.

### 3 Planes Architecture

The Autopilot OS operates through three distinct planes that work together to form a complete execution system:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA PLANE                                  │
│  Instrumentation & Profiling Layer                                  │
│  ─────────────────────────────────────────────────────────────────  │
│  • Standardized event instrumentation across storefront             │
│  • Customer journey tracking (page views, cart actions, checkout)   │
│  • Performance metrics and funnel completion rates                  │
│  • SKU-level margin and inventory data                              │
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
└─────────────────────────────────────────────────────────────────────┘
```

**How the Planes Interact:**

1. **Data → Decision:** Events flow from Data Plane to Decision Plane for analysis
2. **Decision → Execution:** Approved recommendations become feature flag toggles or job schedules
3. **Execution → Data:** Actions generate new events that feed back into measurement
4. **Closed Loop:** Statistical proof determines if action becomes permanent or rolls back

**Why 3 Planes Matter:**
- **Separation of concerns:** Each plane can evolve independently
- **Clear boundaries:** Easier to test, debug, and extend
- **Progressive enhancement:** Stores can use Data Plane only (analytics) or full stack (Autopilot)

### Autopilot ChangeSet: The Executable Artifact

To truly replace 4 human roles, Trafi's Autopilot must produce a **standardized, auditable, reversible artifact** — not just "recommendations". This artifact is the **Autopilot ChangeSet**.

#### ChangeSet Contract

Every Autopilot action is encapsulated in a ChangeSet with mandatory fields:

```typescript
interface AutopilotChangeSet {
  // Identity
  id: string;                          // UUID
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
    holdoutPercentage: number;              // Control group size
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

#### ChangeSet Lifecycle

```
┌────────────────────────────────────────────────────────────────────────────┐
│                       CHANGESET LIFECYCLE                                  │
│                                                                            │
│  DRAFT → PENDING_APPROVAL → ACTIVE → MEASURING → [PROVEN | ROLLED_BACK]   │
│                                                           ↓               │
│                                                      PERMANENT             │
│                                                                            │
│  At each transition:                                                       │
│  • Guardrails checked                                                      │
│  • Audit event logged                                                      │
│  • Notifications sent (if configured)                                      │
└────────────────────────────────────────────────────────────────────────────┘
```

#### Why ChangeSet Makes Trafi an "OS" (Not Just a CRO Tool)

| Without ChangeSet | With ChangeSet |
|-------------------|----------------|
| "Try showing shipping earlier" | Executable action with feature flag, segment, metrics |
| "Monitor conversion" | Automated measurement with holdout and CUPED |
| "Roll back if it fails" | Auto-rollback triggers with defined thresholds |
| "Someone approved this" | Cryptographically signed approval with audit trail |
| "What happened?" | Complete audit log of every state change |

**This transforms Autopilot from "AI suggestions" to "autonomous execution with human oversight".**

### Distribution Model: @trafi/core & Override Patterns

**Future Vision: NPM Package Distribution**

Trafi is designed for eventual distribution as `@trafi/core` — an NPM package that developers install and extend, similar to Medusa or Strapi. This influences how code is structured from Day 1.

**Current Strategy: Option 3 "Progressive Preparation"**

For MVP, we maintain the monorepo architecture but code "override-ready":

| Layer | Override Pattern | Example |
|-------|------------------|---------|
| **Backend Services** | `protected` methods, explicit public API per module | `class ProductService { protected calculatePrice() }` |
| **Dashboard Components** | Composable components with props/slots | `<ProductCard slots={{ actions: CustomActions }} />` |
| **Hooks & Events** | EventEmitter patterns for extensibility | `emitter.on('order.created', customHandler)` |
| **SDK** | Factory functions for customization | `createTrafiClient({ interceptors: [...] })` |

**Override Principles:**

1. **Core stays protected:** Business logic in `protected` methods — extenders override, don't modify
2. **Explicit public API:** Each module exposes a clear interface — internal implementation can change
3. **Composable by default:** Dashboard components accept customization via props, slots, children
4. **Event-driven extensibility:** Critical business events emit for custom handlers

**Why This Matters:**

```typescript
// ❌ BAD: Tight coupling, impossible to override
export function calculateTotal(items) { /* hardcoded logic */ }

// ✅ GOOD: Override-ready pattern
export class CartService {
  protected calculateTotal(items: CartItem[]): number {
    return items.reduce((sum, item) => sum + this.getItemPrice(item), 0);
  }

  protected getItemPrice(item: CartItem): number {
    // Default implementation — can be overridden for custom pricing
    return item.price * item.quantity;
  }
}
```

**Migration Path to @trafi/core:**

```
Phase 1 (Now): Monorepo, override-ready code patterns
Phase 2 (P2):  Extract @trafi/core package, internal distribution
Phase 3 (P3):  Public NPM package with versioning
```

### Override Kernel: Runtime Resolution System

The Override Kernel is the runtime system that resolves which implementation (core vs override) to use. This is not just "patterns" — it's a **deterministic resolution mechanism**.

#### Backend: NestJS DI Resolution

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
4. Fail fast if token has no provider (dev error)

#### Dashboard: Page/Component Wrapping

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

#### Config Resolution & Validation

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

// Validation at startup
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
      errors.push({
        type: 'missing_override',
        path: override.path,
      });
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

#### Compatibility Guarantees

| Surface | Versioning | Breaking Change Policy |
|---------|------------|------------------------|
| **Public service methods** | SemVer major | 90-day deprecation window |
| **Protected methods** | SemVer minor | Can change in minor versions |
| **Internal methods** | None | Can change anytime |
| **Component props** | SemVer major | 90-day deprecation window |
| **Slot definitions** | SemVer minor | New slots = minor, removed = major |
| **Config schema** | SemVer major | Migration scripts provided |

**The Override Kernel ensures that customizations survive upgrades — or fail loudly at startup, not silently at runtime.**

## Project Classification

**Technical Type:** SaaS B2B Platform (with Developer Tool characteristics)
**Domain:** E-commerce / General
**Complexity:** Medium
**Project Context:** Greenfield - new project

**Architecture Characteristics:**
- Multi-tenant support (Cloud Managed tier)
- RBAC permission model for admin users
- Subscription tiers: Self-Host (Free) → Cloud Managed → Cloud + Profit Engine
- Plugin-based integrations (payments, shipping, email, analytics)
- GDPR-ready with First-Party Ledger and consent management

