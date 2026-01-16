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

## Success Criteria

### User Success

#### Developer Success (Thomas)

| Moment | Metric | Target | Predicts |
|--------|--------|--------|----------|
| **Aha #1: 5-minute store** | Time from `npx create-trafi-app` to functional demo | 5-10 min | Initial adoption |
| **Aha #2: Upgrade sans casse** | % version upgrades without hotfix | ≥95% | Maintenance reduction, platform trust |
| **Aha #3: Debug en 1 endroit** | MTTD/MTTR for checkout incidents | <15 min | Long-term retention |

**Progression Metrics:**
- Time-to-prod (configured): 1 day
- Time-to-prod (custom): 1-2 weeks
- Project time reduction: 3 months → 3-4 weeks
- Maintenance reduction: -50% monthly post-go-live hours
- SDK reuse rate: 30% of devs on 2nd project
- Module/hook activation: 10-15% of devs

#### Merchant Success (Sophie/Marc/Nadia)

| Moment | Metric | Target | Predicts |
|--------|--------|--------|----------|
| **Aha #1: First diagnostic** | Time to first actionable insight | Day 1 | Value discovery |
| **Aha #2: Proven action** | Action with confidence interval OR auto-rollback | Week 1-Month 1 | Trust in system |
| **Aha #3: Margin protection** | Autopilot refuses margin/stock-destructive action | First occurrence | Differentiation signal |

**Progression Metrics:**
- Conversion lift (MVP): +10-20% relative on targeted segment
- Time-to-value: Diagnostic Day 1, Action Week 1, Proof Month 1
- Actions approved/month: 2-4 per active store
- High-impact acceptance rate: ≥30%
- ROI visibility: Delta € attributed + hours saved

**North Star Metric:** *Profit per visitor* (not conversion alone—avoids margin-destructive optimizations)

### Business Success

#### 6 Months Post-MVP

| Category | Minimum (Survival) | Stretch (Traction) |
|----------|--------------------|--------------------|
| **MRR** | 5k € | 20k € |
| **Active Stores** | 100 | 300 |
| **Stores with Measured Uplift** | 20 | 50 |
| **Cloud Managed Paying** | 10 | 40 |
| **Stores Created (CLI)** | 500 | 1,500 |
| **Cumulative GMV** | 0.5M € | 2M € |

#### 18 Months (Real Business)

| Category | Minimum (Survival) | Stretch (Traction) |
|----------|--------------------|--------------------|
| **MRR** | 50k € | 150k € |
| **Paying Merchants** | 300 | 1,000 |
| **Monthly Churn** | <5% | <3% |
| **LTV:CAC** | 3:1 | 5:1 |
| **Profit Engine Attach Rate** | 30% | 50% |
| **Cumulative GMV** | 25M € | 100M € |

**Validation Signal:** If attach rate stays low at 18 months, the USP isn't resonating—pivot or double down on Profit Engine value.

#### Leading Indicators (Predict Success)

| KPI | Signal |
|-----|--------|
| CLI installs/week | Developer awareness |
| Demo → Active store conversion | Onboarding effectiveness |
| Time to first Profit Engine action | Value discovery speed |
| Suggestion acceptance rate | Autopilot trust |

#### Lagging Indicators (Prove Success)

| KPI | Signal |
|-----|--------|
| Net Revenue Retention (NRR) | Expansion vs churn |
| Profit Engine attach rate | Core value prop validation |
| Developer contribution rate | Ecosystem health |

### Technical Success (SLO/SLI)

#### Tiered Availability SLOs

| Tier | Scope | SLO Target | Rationale |
|------|-------|------------|-----------|
| **Critical Path** | Checkout, Payment, Order creation | 99.95% - 99.99% | Revenue-impacting, merchant trust |
| **Core Commerce** | Cart, Pricing, Inventory checks | 99.9% - 99.95% | Direct UX impact |
| **Browse/Catalog** | Product listings, Search, Categories | 99.9% | Degraded experience acceptable briefly |
| **Dashboard/Admin** | Back-office operations | 99.5% | Internal, less time-sensitive |

#### Latency SLOs (p95)

| Endpoint Category | p95 Target | Notes |
|-------------------|------------|-------|
| Storefront API (critical) | 300-500ms | cart/checkout/pricing |
| Checkout end-to-end | <500ms | API-side only, excludes PSP |
| Dashboard API | <1s | Acceptable for admin ops |
| Batch/Jobs | N/A | Async, measured by completion rate |

#### Error Rate SLOs

| Category | Target | Measurement |
|----------|--------|-------------|
| Checkout success rate | ≥99.9% | Application errors + 5xx |
| Payment webhook processing | ≥99.95% | Critical for order state |
| API error rate (overall) | <1% | 4xx client errors excluded |

#### Error Budget Policy

- **Window:** 28-day rolling
- **Budget:** 100% - SLO (e.g., 99.95% SLO = 0.05% error budget = ~21 min/month)
- **Rule:** If budget consumed >50%, freeze features and focus reliability
- **Escalation:** If budget exhausted, incident review mandatory before new releases

### Measurable Outcomes

#### MVP Validation Gates (Go/No-Go)

| Gate | Metric | Threshold | Status |
|------|--------|-----------|--------|
| Dev Adoption | Stores created via CLI | ≥500 | Required |
| Dev Activation | Active stores (≥1 order/week) | ≥100 | Required |
| Profit Engine Proof | Stores with measured uplift | ≥20 | Required |
| Monetization Signal | Cloud Managed paying customers | ≥10 | Required |
| Time-to-Value | Diagnostic D1, Action W1 | 80% of stores | Required |

#### Validation Signals (Qualitative)

- Devs reuse SDK on 2nd project (≥20%)
- Merchants approve ≥2 Autopilot actions/month
- NPS early adopters ≥40
- Organic referrals from dev community

## Product Scope

### MVP - Minimum Viable Product

**Commerce Cores (9 modules):**
- Product (catalog, variants, categories, media)
- Customer (accounts, addresses, auth B2C)
- Cart (persistent cart, totals calculation, rules)
- Checkout (multi-step flow, guest checkout, validation)
- Payment (Stripe plugin, webhooks, refunds)
- Order (creation, statuses, history, events)
- Inventory + Fulfillment (single location, shipping zones, rates)
- Tax (VAT Europe, zone rules, checkout calculation)
- User Access (admin users, RBAC, API keys, sessions)

**Profit Engine (MVP):**
- Checkout Doctor (funnel instrumentation, drop-off diagnosis)
- Recovery Engine (abandoned cart email sequences)
- Profit Guardrails (margin/stock rules)
- Partial rollback (feature flags, reversible actions only)

**Infrastructure & DX:**
- CLI `create-trafi-app` (init, templates, config wizard, seed data)
- Type-safe SDK (product, cart, checkout, payment, order + events)
- Dashboard (catalog, orders, config, Jobs, Profit Engine basic)
- Next.js storefront template (App Router, TypeScript, Tailwind)
- API: tRPC (internal) + REST (external SDK/integrations)

**Plugin Architecture:**
- Payment plugins (Stripe reference, extensible)
- Shipping plugins (carrier integrations)
- Notification plugins (email providers)

### Growth Features (Post-MVP, P1: 3-6 months)

- First-Party Ledger (consent management, identity unification, activation connectors)
- Trafi Score (gamified e-commerce health score)
- Promotions engine (discounts, coupons, bundles, rules)
- Multi-warehouse (multi-location, fulfillment routing)
- GraphQL API (flexible storefront queries)
- Additional templates (Remix, Astro)

### Vision (Future, P2: 6-12+ months)

- Agentic Checkout Gateway (AI agent-optimized checkout API)
- Viral Demo Mode (simulate impact on existing site before migration)
- Multi-region advanced (multi-currency, multi-tax, full localization)
- Trafi Builder (integrated page builder with live preview)
- Module Marketplace (dev-created modules, 15-30% commission)
- Enterprise features (SSO, audit logs, custom SLAs, dedicated support)

## User Journeys

### Journey 1: Thomas - From Zero to Production in One Week

Thomas is a freelance fullstack developer based in Lyon, known among local agencies for delivering polished e-commerce projects. He's just landed a contract with a sustainable fashion brand that needs a modern online store. His usual approach—a custom Next.js frontend with Medusa backend—typically takes 2-3 months. The client wants to launch in 6 weeks.

Late one evening, scrolling through dev Twitter, Thomas discovers Trafi. The tagline catches his eye: "The open-source Shopify alternative for developers—with built-in profit automation." Skeptical but curious, he runs `npx create-trafi-app eco-fashion-store`.

Seven minutes later, Thomas is staring at a fully functional store with seed products, a working checkout sandbox, and—surprisingly—a Profit Engine dashboard already showing funnel instrumentation. He spends the next hour exploring: the SDK is properly typed, the dashboard feels polished (not the usual open-source rough edges), and the plugin architecture means he can swap Stripe for Mollie later when the client expands to Germany.

By Friday, Thomas has the client's catalog imported, Stripe connected, and shipping zones configured. The client is amazed—"I thought this would take months." Thomas delivers the custom storefront in 3 weeks, keeps a week for polish, and launches on time. His invoice includes a line item he's never charged before: "Profit Engine setup and training."

Six months later, the client calls—not with a bug report, but to share that their checkout conversion increased 18% after Thomas helped them approve a few Autopilot recommendations. Thomas has since used Trafi on four more projects. He contributes a Colissimo shipping plugin to the ecosystem and quietly becomes one of the top Trafi advocates in the French dev community.

**Requirements Revealed:**
- CLI onboarding with seed data and sandbox mode
- Type-safe SDK with excellent IDE integration
- Plugin architecture for payments/shipping
- Dashboard UX comparable to commercial products
- Profit Engine accessible from day one
- Upgrade path that doesn't break existing stores

---

### Journey 2: Thomas - The Upgrade That Didn't Break

It's Tuesday morning, and Thomas receives a Trafi release notification: v2.3.0 includes performance improvements for high-traffic stores and new Profit Engine playbooks. His largest client, now processing 500 orders/week, is the perfect candidate.

Thomas follows his usual upgrade ritual: read the changelog, check for breaking changes (none—Trafi follows semver religiously), run `pnpm update @trafi/*` in the monorepo. The type checker catches a deprecated method he was using—the SDK helpfully suggests the replacement with a code action.

He runs the test suite. Green. He deploys to staging, runs a synthetic checkout flow, verifies the Profit Engine dashboard still shows data. Everything works. The whole process takes 23 minutes.

Thomas pushes to production during the client's low-traffic window. No incidents. The client never even knows an upgrade happened—exactly how it should be. Later that week, when another dev asks him about "headless commerce maintenance nightmares," Thomas just smiles and says, "Not with Trafi."

**Requirements Revealed:**
- Semantic versioning with clear changelog
- Deprecation warnings with migration guidance
- SDK type safety as upgrade safety net
- Staging environment support
- Non-breaking upgrade path as core promise

---

### Journey 3: Sophie - From Shopify Frustration to Profit Engine Believer

Sophie runs Maison Cleo, a small D2C brand selling handcrafted ceramics from her atelier in Provence. After three years on Shopify, she's done the math: between transaction fees, app subscriptions, and the Shopify Payments cut, she's losing almost 5% on every sale. For a business running on 35% margins, that's the difference between growth and stagnation.

Her developer cousin mentions Trafi during a family dinner. "It's like Shopify but open-source, and there's this profit engine thing that supposedly helps with conversion." Sophie is skeptical—she's not technical—but the Cloud Managed option means she doesn't need to manage servers.

The next weekend, Sophie signs up for Trafi Cloud. The migration assistant helps her import products from Shopify. By Sunday evening, her store is live on a custom domain with the same Stripe account she was already using. Total cost: a flat monthly fee with no transaction percentage.

The real surprise comes Monday morning. Sophie opens her dashboard to find a "Profit Engine Diagnostic" notification: "Checkout drop-off detected at shipping step—42% of carts abandoned when shipping costs appear. Recommended action: Show shipping estimate earlier in the journey." There's a toggle to enable this, marked "Low risk / High impact."

Sophie hesitates—she doesn't want to break anything. But the interface shows this is reversible, with automatic rollback if conversion drops. She approves. Over the next week, she watches the dashboard nervously. The chart shows a clear trend: cart-to-checkout conversion up 12%. The Profit Engine displays it with confidence intervals and a reassuring message: "Statistically significant improvement detected. Change retained."

Three months in, Sophie has approved six Autopilot recommendations. Her overall conversion rate has improved 23%. She tells everyone at the local artisan market about "this AI thing that actually works." She doesn't know she's become exactly the case study Trafi needs to prove the Profit Engine value prop.

**Requirements Revealed:**
- Cloud Managed with no-code migration
- Shopify import wizard
- Profit Engine onboarding for non-technical users
- Clear risk/impact labeling on recommendations
- Automatic rollback with statistical validation
- Progress visualization that builds trust

---

### Journey 4: Sophie - When the System Protects Her Margin

It's Black Friday week, and Sophie has prepared a 20% discount on her best-selling collection. The Profit Engine suggests an additional optimization: "Bundle frequently co-purchased items with a 15% discount." The projected uplift looks attractive.

But Sophie notices something: the suggested bundle includes her signature piece—the one with the thinnest margin. If she discounts it further while shipping costs spike during holiday season, she might actually lose money on each sale.

Before she can calculate the impact, a notification appears: "Profit Guardrails Alert: This action would reduce margin on SKU-4521 below your configured threshold (25%). Recommendation blocked. Consider: exclude high-margin items from bundle, or adjust bundle discount to 10%."

Sophie exhales. The system caught what she almost missed. She adjusts the bundle, approves the modified recommendation, and watches it drive a 8% revenue increase without destroying her margins. When her accountant reviews the holiday numbers in January, he comments: "This is the first Black Friday where your percentage margin actually improved."

**Requirements Revealed:**
- Profit Guardrails with configurable margin thresholds
- Pre-action margin impact simulation
- Smart blocking with alternative suggestions
- SKU-level profitability awareness
- Holiday/peak period considerations

---

### Journey 5: Final Buyer - Smooth Checkout, Happy Customer

Emma is browsing Maison Cleo's store on her phone during her lunch break. She's been eyeing a ceramic vase for her sister's birthday. The product page loads fast, images are crisp, and she adds the vase to her cart.

At checkout, Emma appreciates the small touches: shipping cost appears immediately (8.50€ to Paris), no forced account creation, and her preferred payment method (Apple Pay) is front and center. She completes the purchase in under 90 seconds.

The order confirmation email arrives instantly with a clean summary and expected delivery date. Two days later, a shipping notification with Colissimo tracking. The vase arrives beautifully packaged. Emma leaves a 5-star review and bookmarks the store for future gifts.

She never knows that behind the scenes, Trafi's instrumentation tracked her entire journey, that the early shipping display was an Autopilot optimization, and that her smooth experience contributed to Sophie's 23% conversion improvement.

**Requirements Revealed:**
- Mobile-optimized storefront performance
- Guest checkout with minimal friction
- Multiple payment methods (Stripe, Apple Pay, etc.)
- Real-time shipping cost calculation
- Transactional emails with tracking integration
- Event instrumentation (invisible to buyer)

---

### Journey 6: Final Buyer - Abandoned Cart Recovery

The next week, Emma returns to browse a ceramic lamp. She adds it to cart but gets distracted by a work call and closes the browser.

Thirty-seven minutes later, an email arrives: "Still thinking about it?" with a clean image of the lamp and a one-click return-to-cart link. Emma had forgotten about it, but the email reminds her it would be perfect for her home office.

She clicks through, cart intact, and completes the purchase. The entire recovery sequence—timing, copy, single-item focus—was generated by Trafi's Recovery Engine based on Sophie's approved playbook. Emma just thinks: "Nice reminder, not too pushy."

**Requirements Revealed:**
- Cart persistence across sessions
- Abandoned cart detection with configurable timing
- Email sequence automation
- One-click cart restoration
- Balance between recovery and spam

---

### Journey 7: Owner/Billing Admin - Scaling to Multi-Store

Marc runs e-commerce for a growing lifestyle brand. What started as one Trafi store has expanded: they now need separate storefronts for France, Germany, and a B2B wholesale portal. Marc's finance director, Claire, manages the Trafi relationship.

Claire logs into the Trafi billing dashboard—a separate view from store operations, accessible only to users with Owner role. She sees the current plan, usage metrics, and a clear upgrade path. She clicks "Add Store," selects the Germany region, and the system walks her through: new subdomain, currency settings, tax configuration for German VAT.

The billing automatically adjusts: base subscription + per-store fee + Profit Engine add-on. Claire downloads a consolidated invoice that her accounting software can parse. When the CFO asks about the e-commerce platform costs, Claire pulls a year-to-date report showing cost per store, GMV processed, and—crucially—attributed revenue from Profit Engine optimizations.

Six months later, when Marc leaves the company, Claire handles the ownership transfer: she removes Marc's admin access, assigns a new technical admin, and maintains continuity without any data access issues. The separation between billing/ownership and operational access proves essential.

**Requirements Revealed:**
- Distinct Owner/Billing Admin role
- Multi-store management in single account
- Per-store billing with consolidated invoicing
- Usage-based pricing visibility
- Ownership transfer workflow
- Role separation (billing vs. operations)

---

### Journey 8: Fraud/Risk Operator - Chargeback Investigation

Antoine is the risk analyst for a mid-market fashion retailer using Trafi. A Stripe notification alerts him: 2,400€ in chargebacks filed overnight, all from orders placed in the last 48 hours with similar patterns.

Antoine opens Trafi's Risk Dashboard (a Profit Engine module). The system has already flagged the suspicious orders: same shipping address variations, BIN from high-risk region, velocity pattern (4 orders in 12 minutes). The Recovery Engine had sent abandoned cart emails to these "customers"—but the Risk module notes they all converted within 60 seconds of email send, a known fraud signal.

Antoine reviews the evidence, marks the orders as confirmed fraud, and adjusts the risk rules: orders over 500€ from new accounts now require 3DS challenge. He also adds the shipping address pattern to a block list. The system estimates these rules would have caught 3 of the 4 fraudulent orders without blocking legitimate customers.

He exports the fraud report for the chargeback response and notifies the fulfillment partner to intercept any unshipped orders. The next morning, Stripe confirms two chargebacks reversed based on the evidence package Trafi helped compile.

**Requirements Revealed:**
- Risk Dashboard with pattern detection
- Order velocity and BIN analysis
- Rule configuration interface
- Fraud signal correlation with Recovery Engine
- Evidence export for chargeback response
- Integration with fulfillment for interception
- Block list management

---

### Journey 9: Privacy/Consent Manager - GDPR Data Request

Lea is the DPO (Data Protection Officer) for a retailer using Trafi Cloud + Profit Engine. She receives a GDPR access request: a customer wants all data the company holds about them.

Lea opens Trafi's Privacy Console—part of the First-Party Ledger module. She searches by email and finds the customer profile: order history, consent records, Profit Engine behavioral data (pages viewed, checkout attempts), and email engagement metrics.

The interface shows consent status for each data category: the customer opted into marketing but declined analytics cookies. Lea clicks "Generate Data Export" and receives a structured JSON file plus a human-readable PDF summary—exactly what GDPR requires.

Two weeks later, the same customer requests deletion. Lea returns to the Privacy Console, initiates "Right to Erasure," and the system walks through the implications: order records will be anonymized (legal retention requirement), marketing preferences deleted, Profit Engine behavioral data purged. An audit log entry records Lea's action with timestamp and legal basis.

The entire process takes 15 minutes instead of the multi-day scramble she experienced at her previous company. When the annual GDPR audit happens, she pulls the complete audit trail with one click.

**Requirements Revealed:**
- Privacy Console for customer data lookup
- Consent status tracking per data category
- Data export in multiple formats (JSON + PDF)
- Right to Erasure with legal retention handling
- Audit log with timestamps and legal basis
- First-Party Ledger as compliance foundation

---

### Journey 10: Fulfillment Partner - 3PL Integration

LogiPro is a 3PL (third-party logistics) provider handling fulfillment for several Trafi merchants. Their operations manager, Karim, needs to receive orders, print shipping labels, and sync tracking numbers back to stores.

Karim's technical team integrates via Trafi's Fulfillment API. Orders flow automatically: when a Trafi store marks an order as "Ready for Fulfillment," a webhook fires to LogiPro's WMS. The payload includes itemized picking lists, customer shipping address (formatted for label printing), and any special instructions.

When Karim's team ships an order, they POST the tracking number back. Trafi automatically updates the order status, triggers the shipping notification email to the customer, and logs the fulfillment event for the merchant's dashboard.

Returns work similarly: when a customer initiates a return in the storefront, LogiPro receives a return authorization with expected items. Once they receive and inspect the package, they update the status, and Trafi handles the refund flow.

The integration runs smoothly for months—until a Trafi API update changes a field format. But because Trafi follows semantic versioning and provides a 90-day deprecation window, Karim's team has time to update their integration before the old format sunsets.

**Requirements Revealed:**
- Fulfillment API with webhook events
- Standardized order payload for WMS integration
- Bi-directional sync (orders out, tracking in)
- Return authorization workflow
- API versioning with deprecation policy
- Multi-merchant support for 3PLs

---

### Journey 11: Ops Trafi - Incident Response and Rollback

It's 2 AM when Julien, on-call for Trafi Cloud operations, receives a PagerDuty alert: checkout error rate spiked to 3% across multiple stores—way above the 0.1% SLO threshold.

Julien opens the Trafi ops dashboard. The error budget visualization shows they've burned 40% of the monthly budget in the last 20 minutes. He drills into traces: the errors cluster around payment webhook processing. A recent deployment (v2.3.1) included a Stripe webhook handler change.

He initiates a rollback: one click to revert to v2.3.0. The system automatically drains existing requests, swaps the deployment, and resumes traffic. Error rate drops to baseline within 4 minutes. Julien creates an incident ticket with the trace links and notifies the on-call engineer for post-mortem.

The next morning, the team reviews: a edge case in the webhook signature validation caused failures for a specific Stripe API version. The fix is merged with a regression test, and the post-mortem adds a new synthetic checkout test to the deployment pipeline.

**Requirements Revealed:**
- Real-time error rate monitoring
- Error budget visualization
- Distributed tracing for incident investigation
- One-click rollback capability
- Deployment traffic management (drain/resume)
- Incident documentation workflow
- Post-mortem integration with testing pipeline

---

### Journey 12: Ops Trafi - Merchant Support Escalation

A Cloud Managed merchant, frustrated that their Profit Engine recommendations "stopped working," contacts Trafi support. The first-line support agent, Maya, escalates to Julien after basic troubleshooting fails.

Julien accesses the merchant's store in read-only support mode (no PII visible, but system state accessible). He sees the issue immediately: the merchant's storefront integration stopped sending events two weeks ago—probably after a theme update that broke the SDK initialization.

He generates a diagnostic report showing the event gap and sends it to Maya with suggested remediation steps. Maya calls the merchant, explains the issue in non-technical terms, and offers to schedule a call with a solutions engineer to fix the integration.

The merchant appreciates the proactive diagnosis—they hadn't even realized their analytics were broken. The solutions engineer fixes the SDK initialization in 20 minutes, events resume flowing, and the Profit Engine starts generating recommendations again within 24 hours.

**Requirements Revealed:**
- Support mode with privacy-preserving access
- Event flow health monitoring per store
- Diagnostic report generation
- Escalation workflow between support tiers
- SDK health check tooling
- Non-technical explanation templates

---

### Journey Requirements Summary

| Journey | Primary Capabilities Required |
|---------|------------------------------|
| **Thomas: Zero to Prod** | CLI onboarding, SDK type-safety, plugin architecture, dashboard UX |
| **Thomas: Upgrade** | Semver, deprecation warnings, staging support |
| **Sophie: Onboarding** | Cloud Managed, migration wizard, Profit Engine UX |
| **Sophie: Margin Protection** | Profit Guardrails, margin simulation, smart blocking |
| **Buyer: Checkout** | Mobile performance, guest checkout, payment methods, instrumentation |
| **Buyer: Recovery** | Cart persistence, email automation, one-click restore |
| **Owner/Billing** | Role separation, multi-store, consolidated billing, ownership transfer |
| **Fraud/Risk** | Risk dashboard, pattern detection, rule config, evidence export |
| **Privacy/Consent** | Privacy console, consent tracking, data export, audit logs |
| **Fulfillment Partner** | Fulfillment API, webhooks, returns workflow, API versioning |
| **Ops: Incident** | Error monitoring, tracing, rollback, post-mortem |
| **Ops: Support** | Support mode, diagnostics, escalation workflow |

### Critical Path Dependencies

The journeys reveal these capability clusters that must work together:

1. **Developer Experience**: CLI → SDK → Dashboard → Upgrade path
2. **Merchant Value**: Onboarding → Profit Engine → Guardrails → ROI proof
3. **Buyer Conversion**: Performance → Checkout → Recovery → Instrumentation
4. **Operations**: Billing → Risk → Privacy → Fulfillment → Support
5. **Platform Reliability**: Monitoring → Tracing → Rollback → Post-mortem

## Innovation & Novel Patterns

### Detected Innovation Areas

#### Innovation #1: Closed-Loop Profit Automation (The "Prove It Month 1" Promise)

Unlike traditional analytics dashboards that show data and leave merchants to figure out actions, Trafi's Profit Engine implements a complete feedback loop that delivers **provable value within the first month**:

```
INSTRUMENT → DIAGNOSE → PROPOSE → PROVE → PROTECT
    Day 1      Day 2-7    Week 1    Month 1   Ongoing
```

**The "Month 1" Value Timeline:**
- **Day 1:** First diagnostic appears — merchant sees their conversion funnel with drop-off points identified
- **Week 1:** First actionable recommendation proposed — merchant can approve with one click
- **Month 1:** Statistical proof of impact — confidence interval showing the action worked (or auto-rollback if not)

**What makes it novel:**
- Not just data visualization—actionable recommendations with one-click approval
- Statistical significance testing built into the measurement phase
- Automatic rollback if metrics decline, reducing merchant risk
- "Autopilot PROPOSES, merchant APPROVES" inverts the traditional CRO workflow
- **Time-to-value guaranteed:** If a merchant doesn't see provable impact in Month 1, the Autopilot isn't working

#### Innovation #2: Profit Guardrails as Differentiation

Most CRO tools optimize for a single metric (conversion rate) without understanding the business context. Trafi's Profit Guardrails actively refuse actions that would:
- Reduce margin below configured thresholds
- Deplete stock on high-margin items
- Optimize revenue at the expense of profit

**The insight:** Conversion optimization without margin awareness can destroy businesses. Trafi optimizes for *profit per visitor*, not just conversion.

#### Innovation #3: Standardized Action-Outcome Dataset

Each Autopilot recommendation, approval, and result generates a rare dataset:
- Action taken (specific playbook, feature flag, timing)
- Context (store type, traffic volume, product category)
- Outcome (measured uplift with confidence interval, or rollback trigger)

This "action → outcome" corpus becomes increasingly valuable as it scales across stores.

### Validation Approach

#### Proving Causality (Not Just Correlation)

**The Challenge:** Merchants need to trust that Profit Engine actually caused the improvement, not that it just correlated with an existing trend.

**Methodology:**

| Technique | Purpose | Implementation |
|-----------|---------|----------------|
| **Randomization + Holdout** | Clean causal proof | Split traffic/stores: treatment vs control group |
| **CUPED (Variance Reduction)** | Faster significance | Use pre-experiment period to increase statistical power |
| **Uplift Modeling** | Identify persuadables | Distinguish "would have converted anyway" from "converted because of action" |
| **Confirmatory Segments** | Validate policies | Test on specific segments before broad rollout |

**MVP Validation Design:**
- 1 "safe" Autopilot playbook (e.g., early shipping display)
- Holdout experiment design per store (not just per session)
- CUPED implementation for faster significance with limited traffic
- Target: Investor-grade proof within 6 months

### Market Context & Competitive Landscape

#### If Shopify/Medusa Copy the Concept

The idea alone is not defensible. The moat must be built on:

**Moat Layer 1: Proprietary Feedback Loop**
```
More stores using Autopilot
    ↓
More action → outcome data
    ↓
Better recommendations
    ↓
Higher uplift
    ↓
More stores attracted
    ↓
(increasing returns cycle)
```

This moat only works if:
- Instrumentation is standardized (same events, same definitions across stores)
- Playbooks are standardized (same actions measured consistently)
- Data is aggregated meaningfully (not too heterogeneous to learn from)

**Moat Layer 2: Native Reliability/Risk Governance**
- Guardrails + rollback + audit as first-class citizens
- Open-source + cloud designed for devs and SMBs
- Big players can build this, but won't prioritize it for the indie/SMB segment

**Moat Layer 3: Developer Ecosystem Lock-in**
- SDK becomes the standard way to instrument headless stores
- Playbook contributions from community
- Plugin marketplace creates switching costs

### Risk Mitigation

#### Fallback if Profit Engine Doesn't Resonate

**Core Value Proposition Survives:**

The DX headless + time-to-prod value stands alone:
- CLI + templates + type-safe SDK + stable back-office
- "5-minute store" remains compelling without Autopilot
- Useful platform even if AI features are delayed

**Repositioning Path:**

If Profit Engine adoption lags:
1. Position Trafi as "platform core" (composable commerce modules)
2. Monetize via Cloud Managed (hosting, ops, SLA)
3. Keep Autopilot as optional premium module while it matures
4. Revisit Profit Engine when more data/learnings accumulated

**Architecture Supports This:**
- Monorepo + templates architecture doesn't depend on Profit Engine
- MVP delivers usable platform regardless of AI adoption
- Risk is contained: worst case = good DX platform without the differentiator

### Innovation Dependencies

| Innovation | Dependency | Risk Level |
|------------|------------|------------|
| Closed-loop automation | Statistical engine + feature flags | Medium (proven techniques) |
| Profit Guardrails | SKU-level margin data | Low (standard e-commerce data) |
| Action-outcome dataset | Standardized instrumentation | High (requires discipline) |
| Causal proof | Holdout methodology | Medium (requires traffic) |

### Validation Milestones

| Milestone | Timeline | Success Criteria |
|-----------|----------|------------------|
| First holdout experiment | Month 2 | Clean A/B infrastructure working |
| First statistically significant uplift | Month 3-4 | p<0.05 on at least 1 playbook |
| Investor-grade proof | Month 6 | 20+ stores with measured, causal uplift |
| Feedback loop evidence | Month 9 | Recommendation quality improves with data volume |

## SaaS B2B Specific Requirements

### Project-Type Overview

Trafi is a **SaaS B2B platform** serving two distinct customer segments through different deployment models:

| Model | Customer | Isolation | Infrastructure |
|-------|----------|-----------|----------------|
| **Self-Host** | Technical developers | Full (own infra) | Customer-managed |
| **Cloud Managed** | Merchants (SMB) | DB per tenant | Trafi-managed |
| **Cloud + Profit Engine** | Merchants (growth) | DB per tenant | Trafi-managed + premium |

### Technical Architecture Considerations

#### Tenant Model

**MVP Strategy: Database-per-Tenant**

| Aspect | Approach | Rationale |
|--------|----------|-----------|
| **Isolation** | Separate PostgreSQL database per store | Strong isolation, independent backups/restores, no cross-tenant leak risk |
| **Connection Management** | Connection pooling per tenant | PgBouncer or similar, pool per database |
| **Migrations** | Per-tenant migration orchestration | Schema versioning tracked per tenant |
| **Backups** | Independent backup schedules | Customer-specific retention, easy point-in-time recovery |

**Scale Path (Future):**
- Consider RLS (Row-Level Security) for high-volume entry-tier plans
- Hybrid approach: DB-per-tenant for Premium/Enterprise, RLS for mass-market SMB
- Decision trigger: When ops overhead of DB-per-tenant exceeds benefit (~thousands of tenants)

**Trade-offs Acknowledged:**
- Infra overhead: More databases = more connections, more ops
- Migration complexity: Must orchestrate across all tenant DBs
- Acceptable for: Hundreds of tenants (MVP through 18 months)

#### RBAC Matrix

**Authorization Model: Tenant-Scoped Roles**

```
User (global)
    |
Membership (user_id, tenant_id)
    |
RoleAssignment (membership_id, role_id)
    |
Permissions (role_id, permission_id)
```

**Key Principles:**
- Every authorization decision is tenant-aware ("admin in which store?")
- Same user can belong to multiple tenants with different roles
- Role assignments are always per-tenant, even with global role templates

**Role Template + Overrides Pattern:**

| Role Template | Default Permissions | Override Allowed |
|---------------|---------------------|------------------|
| **Owner** | Full access + billing + ownership transfer | No (fixed) |
| **Admin** | Store management, orders, catalog, users | Yes (permission-level) |
| **Operator** | Orders, fulfillment, customer service | Yes (permission-level) |
| **Viewer** | Read-only access to dashboard | Yes (scope-level) |
| **Risk Manager** | Fraud rules, chargeback handling | Yes (permission-level) |
| **Privacy Manager** | GDPR console, consent, data export | Yes (permission-level) |

**Audit Requirements:**
- All RBAC changes logged with timestamp, actor, and before/after state
- Role assignment changes require Owner or Admin approval
- Audit log retention: Minimum 2 years for compliance

#### Subscription Tiers

| Tier | Target | Features | Pricing Model |
|------|--------|----------|---------------|
| **Self-Host (Free)** | Developers, agencies | Core commerce + SDK/CLI + templates | Free (OSS) |
| **Cloud Managed** | SMB merchants | Hosting + backups + scaling + monitoring | Flat monthly per store |
| **Cloud + Profit Engine** | Growth merchants | + Conversion Autopilot + First-Party Ledger + uplift reporting | Premium monthly per store |
| **Enterprise** (Future) | Mid-market | + Custom SLAs + SSO + dedicated support + audit logs | Custom contract |

**Tier Transitions:**
- Self-Host -> Cloud Managed: Migration wizard (catalog import, DNS setup)
- Cloud Managed -> Cloud + Profit Engine: Feature unlock (no migration)
- Cloud -> Self-Host: Full data export, no lock-in (First-Party Ledger principle)

**Usage-Based Components:**
- Base subscription (fixed per store)
- GMV-based component (optional, for high-volume stores)
- Add-ons (extra storage, additional users, premium support)

#### Integration List

**Plugin Architecture:**

| Category | MVP Plugins | Extension Pattern |
|----------|-------------|-------------------|
| **Payments** | Stripe (reference) | `PaymentPlugin` interface, provider-agnostic |
| **Shipping** | Manual rates | `ShippingPlugin` interface, carrier SDKs |
| **Email** | SMTP/Resend | `NotificationPlugin` interface |
| **Analytics** | Internal events | `AnalyticsPlugin` interface |

**API Integration Patterns:**

| Interface | Protocol | Use Case |
|-----------|----------|----------|
| **REST API** | HTTP/JSON | External: SDK, partners, 3PLs |
| **tRPC** | TypeScript RPC | Internal: Dashboard <-> API |
| **Webhooks** | HTTP callbacks | Events: order.created, payment.completed |
| **GraphQL** | Query language | Future (P1): Flexible storefront queries |

**Versioning Strategy:**

| Surface | Strategy | Example |
|---------|----------|---------|
| **Public REST API** | URL path versioning | `/v1/orders`, `/v2/orders` |
| **SDK** | SemVer | `@trafi/client@2.3.0` |
| **Compatibility** | Explicit mapping | "SDK v2.x supports API v1" |
| **Deprecation** | 90-day window | Breaking changes announced, migration guide provided |

**Webhook Delivery:**
- At-least-once delivery with retry (exponential backoff)
- Signature verification (HMAC-SHA256)
- Event log with replay capability
- Configurable per tenant (endpoints, events subscribed)

#### Compliance Requirements

**GDPR Compliance:**

| Requirement | Implementation |
|-------------|----------------|
| **Data Access (Art. 15)** | Privacy Console: search by email, export JSON + PDF |
| **Data Portability (Art. 20)** | Machine-readable export of all customer data |
| **Right to Erasure (Art. 17)** | Anonymization workflow with legal retention exceptions |
| **Consent Management** | First-Party Ledger: per-category consent tracking |
| **Audit Trail** | All data operations logged with timestamp and actor |

**PCI DSS:**
- Delegated to Stripe (SAQ-A eligible)
- No card data touches Trafi servers
- Stripe.js for client-side tokenization

**Data Residency:**
- Cloud Managed: EU region by default (GDPR alignment)
- Future: Region selection (EU, US, APAC) for compliance needs

### Implementation Considerations

#### Multi-Store Management

**Account Hierarchy:**
```
Organization (billing entity)
    |
Store 1 (tenant, own DB)
Store 2 (tenant, own DB)
Store 3 (tenant, own DB)
```

**Cross-Store Features:**
- Consolidated billing at Organization level
- User can have roles in multiple stores
- Store-level data isolation (no cross-store queries by default)
- Org-level reports (aggregate GMV, revenue, usage)

#### Onboarding Flows

| User Type | Onboarding Path |
|-----------|-----------------|
| **Developer (Self-Host)** | `npx create-trafi-app` -> local dev -> deploy to own infra |
| **Developer (Client Project)** | CLI -> configure -> Cloud Managed signup for client |
| **Merchant (Direct)** | Cloud signup -> migration wizard -> Stripe connect -> live |
| **Agency (Multi-Client)** | Organization setup -> add stores -> assign client access |

#### Security Considerations

| Layer | Measure |
|-------|---------|
| **Authentication** | Session-based (dashboard), API keys (SDK), JWT (mobile future) |
| **Authorization** | Tenant-scoped RBAC, permission checks on every request |
| **Data Isolation** | DB-per-tenant, no shared tables for customer data |
| **Secrets Management** | Environment variables, encrypted at rest, rotatable |
| **Audit Logging** | All sensitive operations logged, tamper-evident |

#### Operational Requirements

| Aspect | Requirement |
|--------|-------------|
| **Monitoring** | Per-tenant metrics, SLO dashboards, alerting |
| **Logging** | Centralized logs, tenant-tagged, 30-day retention |
| **Backups** | Per-tenant daily backups, 30-day retention, tested restores |
| **Scaling** | Horizontal scaling for API, vertical for individual tenant DBs |
| **Disaster Recovery** | RTO: 4 hours, RPO: 1 hour for Cloud Managed |

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Platform MVP + Revenue MVP hybride
- Build the core platform foundation while generating early revenue via Cloud Managed
- The Profit Engine is the differentiator, but the commerce platform is the baseline value

**MVP Essence:**
- The minimum for Thomas to say "I can deliver a client project with this"
- The minimum for Sophie to say "My store works and I see recommendations"

**The MVP Game Changer: Reversible Experimentation Engine**

The true differentiator in MVP is not just "abandoned cart recovery" — it's the **reversible experimentation pipeline** that makes optimization safe for small teams:

| Component | What It Does | Why It's the Game Changer |
|-----------|--------------|---------------------------|
| **Feature Flags** | Toggle optimizations on/off per cohort | Safe A/B testing without code deploys |
| **Holdout Groups** | Control groups for statistical comparison | Proves causation, not just correlation |
| **Auto-Rollback** | Revert changes when metrics decline | Removes risk from experimentation |
| **Confidence Intervals** | Statistical significance measurement | Data-driven decisions, not gut feelings |

**Without this, Trafi is just another e-commerce platform. With this, it's an Autopilot OS.**

**Resource Requirements:**
- Core team capable of delivering monorepo architecture
- Focus on 9 commerce modules + Profit Engine basics

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**

| Journey | MVP Coverage | Notes |
|---------|--------------|-------|
| Thomas: Zero to Prod | Full | Core dev value proposition |
| Thomas: Upgrade | Deferred (v1.1) | Important but not Day 1 |
| Sophie: Onboarding | Full | Core merchant value proposition |
| Sophie: Margin Protection | Partial | Simple guardrails MVP, advanced P1 |
| Buyer: Checkout | Full | Without this, no business |
| Buyer: Recovery | Full | Profit Engine differentiator |
| Owner/Billing | Partial | Single-store MVP, multi-store P1 |
| Fraud/Risk | Deferred (P1) | Stripe Radar sufficient for MVP |
| Privacy/Consent | Partial | Basic GDPR MVP, full console P1 |
| Fulfillment Partner | Partial | Basic webhooks MVP |
| Ops: Incident | Full | Cloud Managed SLOs |
| Ops: Support | Partial | Basic support MVP |

**Must-Have Capabilities:**

| Category | MVP Scope |
|----------|-----------|
| Commerce Cores | 9 modules: Product, Customer, Cart, Checkout, Payment, Order, Inventory, Tax, User Access |
| Profit Engine | Checkout Doctor + Recovery Engine + Profit Guardrails (simple) + Partial rollback |
| DX | CLI create-trafi-app + Type-safe SDK + Dashboard + Next.js template |
| Cloud | Single-store, DB-per-tenant, basic monitoring |
| Plugins | Stripe (payment), Manual rates (shipping), SMTP (email) |

### Post-MVP Features

**Phase 2: Growth (P1, 3-6 months)**

| Feature | Value |
|---------|-------|
| First-Party Ledger | Consent management, identity unification, activation connectors |
| Multi-store | Organization + multi-store billing |
| Promotions | Discounts, coupons, bundles |
| Risk Dashboard | Pattern detection, rule configuration |
| GraphQL API | Flexible storefront queries |
| Additional templates | Remix, Astro |

**Phase 3: Expansion (P2, 6-12 months)**

| Feature | Value |
|---------|-------|
| Agentic Checkout Gateway | AI agent-optimized checkout API |
| Viral Demo Mode | Simulate impact on existing site before migration |
| Multi-region advanced | Multi-currency, multi-tax |
| Multi-warehouse | Fulfillment routing |

**Phase 4: Platform (v2, 12+ months)**

| Feature | Value |
|---------|-------|
| Trafi Builder | Integrated page builder |
| Module Marketplace | Dev-created modules, 15-30% commission |
| Enterprise | SSO, audit logs, custom SLAs |

### Risk Mitigation Strategy

**Technical Risks:**

| Risk | Mitigation |
|------|------------|
| Profit Engine doesn't prove uplift | CUPED + holdout design from Month 2, fallback to DX-only positioning |
| DB-per-tenant scaling | RLS ready as backup, trigger at ~1000 tenants |
| Checkout performance | Tiered SLOs, synthetic tests |

**Market Risks:**

| Risk | Mitigation |
|------|------------|
| Shopify copies the concept | Moat = proprietary data + OSS community |
| Medusa catches up on DX | Differentiator = integrated Profit Engine |
| SMBs don't understand value | Case studies Sophie/Marc, visible ROI in dashboard |

**Resource Risks:**

| Risk | Mitigation |
|------|------------|
| Team too small | Minimal MVP = commerce platform only, Profit Engine v1.1 |
| Timeline exceeded | Cut multi-store to P1, keep single-store MVP |

## Functional Requirements

### Developer Experience

- FR1: Developer can scaffold a new Trafi store project via CLI with configurable options
- FR2: Developer can seed demo data for local development and testing
- FR3: Developer can interact with all commerce modules via type-safe SDK
- FR4: Developer can customize storefront using provided templates (Next.js)
- FR5: Developer can extend platform functionality through plugin architecture
- FR6: Developer can access comprehensive API documentation and code examples
- FR7: Developer can upgrade SDK/API versions with clear deprecation warnings
- FR8: Developer can connect their store to Trafi Cloud via CLI commands
- FR9: Developer can generate and manage API keys for store access

### Commerce Core

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

### Profit Engine

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

### User & Access Management

- FR35: Admin can create and manage admin user accounts
- FR36: Admin can assign roles and permissions to users (RBAC)
- FR37: Admin can manage API keys with scoped permissions
- FR38: System can enforce tenant-scoped authorization on all requests
- FR39: Owner can transfer store ownership to another user
- FR40: Owner can access billing and subscription management

### Customer Management

- FR41: Buyer can create customer account with email and password
- FR42: Buyer can manage saved addresses for faster checkout
- FR43: Buyer can view order history and track shipments
- FR44: Buyer can reset password via email
- FR45: System can identify returning customers across sessions

### Payments & Transactions

- FR46: Merchant can connect Stripe account for payment processing
- FR47: System can process payments with 3DS authentication when required
- FR48: System can handle payment webhooks for order status updates
- FR49: Merchant can issue full or partial refunds
- FR50: System can log all payment events for audit trail

### Fulfillment & Logistics

- FR51: Merchant can mark orders as fulfilled and add tracking numbers
- FR52: System can send shipping notification emails with tracking links
- FR53: System can expose fulfillment webhooks for 3PL integration
- FR54: 3PL Partner can receive order payloads for fulfillment
- FR55: 3PL Partner can update tracking information via API
- FR56: Merchant can configure return authorization workflow

### Privacy & Compliance

- FR57: Privacy Manager can search and view customer data by email
- FR58: Privacy Manager can export customer data in GDPR-compliant formats
- FR59: Privacy Manager can process erasure requests with legal retention handling
- FR60: System can track consent status per data category
- FR61: System can log all data operations with timestamp and actor
- FR62: Merchant can configure cookie consent preferences

### Analytics & Insights

- FR63: Merchant can view store performance dashboard with key metrics
- FR64: Merchant can view checkout funnel visualization with drop-off points
- FR65: Merchant can view Profit Engine recommendations and their status
- FR66: System can aggregate events for statistical analysis
- FR67: Ops can view per-store event flow health status

### Platform Operations

- FR68: Ops can monitor system health with real-time dashboards
- FR69: Ops can view error rates and latency metrics per tenant
- FR70: Ops can initiate rollback to previous deployment version
- FR71: Ops can access tenant stores in read-only support mode
- FR72: Ops can generate diagnostic reports for merchant support
- FR73: System can alert on SLO threshold violations

### Cloud & Multi-tenancy

- FR74: Merchant can sign up for Trafi Cloud managed hosting
- FR75: System can provision isolated database per tenant
- FR76: System can handle tenant-specific backups and restores
- FR77: System can scale resources based on tenant traffic
- FR78: Merchant can migrate store data from Shopify

### Buyer Authentication (Extended)

- FR79: Buyer can create account with email/password, login/logout, and reset password
- FR80: Buyer can authenticate via OAuth Google
- FR81: Buyer can authenticate via "Sign in with Apple" (web flow) with configurable Services ID and redirect URLs

### Wishlist & Favorites

- FR82: Buyer can add/remove products to a persistent wishlist and view it
- FR83: Buyer can edit, sort, and move wishlist items to cart
- FR84: System provides one-click wishlist add and simple move-to-cart UX

### Background Jobs & Queue Management

- FR85: System can execute asynchronous jobs for emails, webhooks, and long-running tasks via queue
- FR86: System can automatically retry failed jobs with exponential backoff and track failures in dead-letter queue
- FR87: Ops can view queue status (waiting/active/failed) and inspect job payload and errors

### SDK (Extended Capabilities)

- FR88: Developer can consume API via SDK with distinct clients (Storefront vs Admin) and scoped API keys
- FR89: Developer can instrument checkout funnel via SDK standardized events to feed Profit Engine
- FR90: SDK provides safe defaults (idempotency keys, client-side retries, error mapping)

### Module System & Extensibility

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

### Module Sandbox: Security Enforcement System

Modules and marketplace extensions represent a significant attack surface. Without proper sandboxing, a malicious module can compromise the entire platform. The Module Sandbox enforces strict security boundaries.

#### Sandbox Architecture

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

#### Static Analysis Checks (Pre-Install)

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
const staticAnalysisRules: AnalysisRule[] = [
  {
    pattern: /eval\s*\(/,
    severity: 'critical',
    message: 'Dynamic code execution not allowed',
  },
  {
    pattern: /new\s+Function\s*\(/,
    severity: 'critical',
    message: 'Function constructor not allowed',
  },
  {
    pattern: /require\s*\(\s*[^'"]/,
    severity: 'critical',
    message: 'Dynamic require not allowed',
  },
  {
    pattern: /child_process/,
    severity: 'critical',
    message: 'Shell access not allowed',
  },
];
```

#### Filesystem Isolation

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

  writeFile(path: string, data: Buffer): void {
    if (!this.isAllowed(path, 'write')) {
      throw new SecurityError(`FS write not allowed: ${path}`);
    }
    fs.writeFileSync(this.resolvePath(path), data);
  }
}
```

#### Network ACL (Allowlist)

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
      },
      {
        "domain": "hooks.stripe.com",
        "ports": [443],
        "protocols": ["https"],
        "reason": "Stripe webhooks"
      }
    ]
  }
}

// Runtime enforcement (proxy all HTTP requests)
class NetworkProxy {
  async fetch(url: string, options: RequestInit): Promise<Response> {
    const parsedUrl = new URL(url);

    if (!this.isAllowed(parsedUrl)) {
      throw new SecurityError(
        `Network access denied: ${parsedUrl.hostname} not in allowlist`
      );
    }

    return originalFetch(url, options);
  }
}
```

#### Runtime Policy Enforcement

| Resource | Limit | Enforcement |
|----------|-------|-------------|
| **CPU time per request** | 5 seconds | Kill process, return 503 |
| **Memory per module** | 256MB | OOM kill, restart module |
| **Open file handles** | 100 | Reject new opens |
| **Network connections** | 50 concurrent | Queue or reject |
| **Database queries** | Tenant-scoped only | Reject cross-tenant |

#### Marketplace Module Tiers

| Tier | Review Level | Permissions |
|------|--------------|-------------|
| **Verified** | Full audit + Trafi team review | Full permissions (with ACL) |
| **Community** | Automated checks + community review | Limited permissions |
| **Private** | Owner responsibility | Full permissions (owner risk) |

#### Security Incident Response

```typescript
// When a sandbox violation is detected
interface SecurityIncident {
  moduleId: string;
  storeId: string;
  violationType: 'fs' | 'network' | 'cpu' | 'memory' | 'static';
  details: string;
  timestamp: Date;
  action: 'blocked' | 'terminated' | 'quarantined';
}

// Automatic response
function handleSecurityIncident(incident: SecurityIncident): void {
  // 1. Log to security audit trail
  auditLog.security(incident);

  // 2. Quarantine module (disable immediately)
  moduleManager.quarantine(incident.moduleId);

  // 3. Notify store owner
  notifications.send(incident.storeId, {
    type: 'security_alert',
    message: `Module ${incident.moduleId} was disabled due to security violation`,
  });

  // 4. If marketplace module, notify Trafi security team
  if (isMarketplaceModule(incident.moduleId)) {
    securityTeam.alert(incident);
  }
}
```

**The Module Sandbox ensures that third-party code cannot compromise platform security — or fails with full audit trail.**

## Non-Functional Requirements

**Tier Legend:**
- **[MVP]** = Required for launch
- **[Premium]** = Cloud + Profit Engine tier or stretch goal

### Performance

#### Response Times

| Metric | Target | Tier | Context |
|--------|--------|------|---------|
| Storefront API (critical paths) | p95 < 500ms | [MVP] | Cart, checkout, pricing |
| Checkout end-to-end | p95 < 500ms | [MVP] | API-side only, excludes PSP |
| Dashboard API | p95 < 1s | [MVP] | Admin operations |
| TTFB (Time to First Byte) | < 500ms | [MVP] | Baseline for all regions |
| TTFB (Time to First Byte) | < 200ms | [Premium] | With CDN + edge caching |

#### Core Web Vitals

| Metric | Target | Tier | Measurement Scope |
|--------|--------|------|-------------------|
| LCP (Largest Contentful Paint) | < 2.5s | [MVP] | 75th percentile of visits |
| CLS (Cumulative Layout Shift) | < 0.1 | [MVP] | 75th percentile of visits |
| INP (Interaction to Next Paint) | < 200ms | [MVP] | 75th percentile of visits |

**Scope:** Core Web Vitals targets apply to the **official Trafi Next.js storefront template only**. Custom storefronts are the responsibility of the implementing developer.

#### Load Capacity

| Scenario | Target | Tier |
|----------|--------|------|
| Concurrent checkouts per store | 100 | [MVP] |
| Traffic spike handling | 3x baseline | [MVP] |
| Traffic spike handling (Black Friday) | 10x baseline | [Premium] |

### Security

#### Non-Negotiable Security Requirements 🔒

These requirements are ABSOLUTE — no exceptions, no "we'll add it later", no cutting corners:

| Non-Negotiable | Why It's Critical | Violation Consequence |
|----------------|-------------------|----------------------|
| **Tenant Isolation** | Data leakage between stores = catastrophic breach | Security incident, legal liability |
| **RBAC on Every Request** | Unauthorized access = data breach | Security incident |
| **Rate Limiting** | No limits = DoS vulnerability | Service outage, abuse |
| **Audit Logging** | No audit = no forensics, no compliance | GDPR violation, incident blindness |
| **Input Validation** | Unvalidated input = injection attacks | SQL injection, XSS, RCE |

**Implementation Pattern for Tenant Isolation:**

```typescript
// ❌ NEVER - Query without tenant scope
const products = await prisma.product.findMany();

// ✅ ALWAYS - Explicit tenant scope
const products = await prisma.product.findMany({
  where: { storeId: ctx.tenant.id }
});
```

#### Full Security Specification

| Requirement | Specification | Tier |
|-------------|---------------|------|
| Data encryption at rest | AES-256 for all PII and sensitive data | [MVP] |
| Data encryption in transit | TLS 1.3 for all connections | [MVP] |
| Authentication | Session-based (dashboard), API keys (SDK), OAuth 2.0 (buyers) | [MVP] |
| Authorization | Tenant-scoped RBAC on every request | [MVP] |
| Payment data | PCI DSS SAQ-A compliance via Stripe tokenization | [MVP] |
| Secrets management | Environment variables, encrypted at rest, rotatable | [MVP] |
| Audit logging | All sensitive operations logged with timestamp, actor, action | [MVP] |
| Tenant isolation | DB-per-tenant, no cross-tenant data access | [MVP] |
| Input validation | All user inputs sanitized, parameterized queries only | [MVP] |
| Rate limiting | Per-tenant API rate limits with configurable thresholds | [MVP] |
| CSRF protection | Token-based CSRF protection on all state-changing operations | [MVP] |

### Scalability

| Scenario | Requirement | Tier |
|----------|-------------|------|
| Tenant capacity | System supports 500+ tenants on DB-per-tenant | [MVP] |
| Tenant capacity | System supports 1,000+ tenants with RLS evaluation trigger | [Premium] |
| Horizontal scaling | API layer scales via container orchestration | [MVP] |
| Database scaling | Vertical scaling per tenant DB | [MVP] |
| Database scaling | Read replicas for high-traffic stores | [Premium] |
| Queue scaling | Worker pool auto-scales based on queue depth | [MVP] |
| Multi-region | Single region (EU) | [MVP] |
| Multi-region | Multi-region deployment with geo-routing | [Premium] |

### Reliability

#### Availability SLOs

| Tier | Scope | MVP Target | Premium Target |
|------|-------|------------|----------------|
| Critical Path | Checkout, Payment, Order creation | 99.9% | 99.95% - 99.99% |
| Core Commerce | Cart, Pricing, Inventory | 99.5% | 99.9% |
| Browse/Catalog | Product listings, Search | 99.5% | 99.9% |
| Dashboard/Admin | Back-office operations | 99.0% | 99.5% |

#### Error Budget Policy

- **Window:** 28-day rolling
- **Budget:** 100% - SLO (e.g., 99.9% SLO = 43 min/month downtime)
- **Rule:** If budget >50% consumed, freeze features and focus reliability
- **Escalation:** If budget exhausted, incident review mandatory before new releases

#### Profit Engine Execution Gate [MVP]

**Critical:** Autopilot can ONLY execute and measure experiments when:
- Event instrumentation is within SLO (≥99.5% event delivery)
- Webhook/job processing is within SLO (≥99.9% success rate)
- No active incidents on checkout critical path

If these conditions are not met, Autopilot enters "observation-only" mode to prevent false positives/negatives.

#### Synthetic Monitoring [MVP]

| Check | Frequency | Scope |
|-------|-----------|-------|
| Checkout funnel ping | Every 5 minutes | Full funnel: cart → checkout → payment intent (sandbox) |
| API health endpoints | Every 1 minute | All critical services |
| Webhook delivery test | Every 15 minutes | Test webhook to internal receiver |

**Purpose:** Detect regressions before merchants report them.

#### Disaster Recovery

| Metric | MVP Target | Premium Target |
|--------|------------|----------------|
| RTO (Recovery Time Objective) | 8 hours | 4 hours |
| RPO (Recovery Point Objective) | 4 hours | 1 hour |
| Backup frequency | Daily | Hourly for high-tier stores |
| Backup retention | 14 days | 30 days |

### Accessibility

| Requirement | Specification | Tier |
|-------------|---------------|------|
| WCAG compliance | Storefront template meets WCAG 2.1 Level AA | [MVP] |
| Color contrast (normal text) | Minimum 4.5:1 ratio | [MVP] |
| Color contrast (large text) | Minimum 3:1 ratio | [MVP] |
| Keyboard navigation | All interactive elements accessible via keyboard | [MVP] |
| Screen reader support | Semantic HTML, ARIA labels where needed | [MVP] |
| Focus indicators | Visible focus states on all interactive elements | [MVP] |
| Alt text | All images have descriptive alt text | [MVP] |

#### Accessibility Testing [MVP]

| Tool | Threshold | Frequency |
|------|-----------|-----------|
| Lighthouse Accessibility | ≥ 90 score | Every release |
| axe-core automated audit | 0 critical/serious violations | Every release |
| Manual keyboard navigation | Pass all interactive flows | Quarterly |

**Scope:** Accessibility requirements apply to the **official Trafi storefront template** and **Trafi Dashboard**. Custom storefronts are the responsibility of the implementing developer.

### Integration

#### API Contracts [MVP]

| Requirement | Specification |
|-------------|---------------|
| API versioning | URL path versioning (e.g., /v1/, /v2/) |
| SDK versioning | SemVer with explicit API compatibility mapping |
| Deprecation policy | 90-day window for breaking changes with migration guides |
| Rate limiting | Per-tenant rate limits documented in API reference |

#### Webhook Reliability [MVP]

| Requirement | Specification |
|-------------|---------------|
| Delivery guarantee | At-least-once with exponential backoff (max 5 retries over 24h) |
| Signature security | HMAC-SHA256 with shared secret |
| Replay protection | Timestamp in signature (reject if >5 min drift) |
| Receiver validation | Timing-safe compare for signature verification |
| Event log | All webhook attempts logged with response status |
| Replay capability | Manual replay from dashboard for failed deliveries |

#### Webhook Processing (Receiver Side) [MVP]

| Requirement | Specification |
|-------------|---------------|
| Idempotency | All webhook handlers idempotent based on `event_id` |
| Deduplication window | 24 hours minimum |
| Processing timeout | Acknowledge within 30s, process async if longer |

#### Idempotency (API) [MVP]

| Requirement | Specification |
|-------------|---------------|
| Idempotency keys | Supported on all mutating checkout/payment operations |
| Key format | Client-provided UUID, stored for 24h |
| Collision handling | Return cached response on duplicate key |

### Maintainability

| Requirement | Specification | Tier |
|-------------|---------------|------|
| Code coverage | ≥ 70% unit test coverage for core modules | [MVP] |
| Code coverage | ≥ 80% unit test coverage for core modules | [Premium] |
| Documentation | API reference auto-generated from code | [MVP] |
| Upgrade path | Non-breaking upgrades, deprecation warnings in SDK | [MVP] |
| Module isolation | Modules updateable independently | [MVP] |
| Database migrations | Per-tenant migration orchestration with rollback | [MVP] |
| Feature flags | All new features behind flags for gradual rollout | [MVP] |

### Observability

| Requirement | Specification | Tier |
|-------------|---------------|------|
| Metrics | Per-tenant metrics exported (Prometheus/OTEL) | [MVP] |
| Logging | Centralized logs, tenant-tagged, 30-day retention | [MVP] |
| Tracing | Distributed tracing for request correlation | [MVP] |
| Alerting | PagerDuty/Slack on SLO threshold violations | [MVP] |
| Dashboards | Real-time ops dashboards for system health | [MVP] |
| Health checks | Endpoint health checks for all services | [MVP] |
| Job monitoring | Queue status visibility (waiting/active/failed) | [MVP] |
| Event flow health | Per-store instrumentation health indicator | [MVP] |

## Development Rules & Implementation Standards

_Lessons learned from Epic 1 retrospective and project-context.md — these rules are mandatory for all development work._

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
| **Business logic in protected** | Methods that may need customization are `protected` | `protected calculatePrice()` |
| **Explicit public API** | Each service has clear public interface | `class ProductService { getById(), create(), update() }` |
| **Dependency injection** | NEVER instantiate services manually | Use `@Injectable()` + constructor injection |
| **Tenant isolation** | EVERY query includes storeId/tenantId | `findMany({ where: { storeId } })` |

### Pre-Completion Checklist

Before marking any story as complete, verify:

- [ ] `pnpm lint` passes with zero errors
- [ ] `pnpm build` succeeds without warnings
- [ ] `pnpm test` passes all tests
- [ ] New code has appropriate test coverage
- [ ] Context7 was consulted for library usage
- [ ] Services follow override-ready patterns
- [ ] Tenant isolation verified in all queries

### Type System Rules

| Rule | Description |
|------|-------------|
| **Types from @trafi/validators** | NEVER define types locally in apps/ |
| **Zod → TypeScript** | `z.infer<typeof Schema>` generates types |
| **import type** | Use `import type { X }` for type-only imports |
| **No implicit any** | All parameters must be explicitly typed |

### Dashboard Component Patterns

| Pattern | Description | Example |
|---------|-------------|---------|
| **Composable slots** | Components accept customization | `<Card slots={{ header: CustomHeader }} />` |
| **Local components** | Route-specific in `_components/` | `app/products/_components/ProductTable.tsx` |
| **Global components** | Shared in `components/` | `components/ui/Button.tsx` |
| **Data flow** | Page(RSC) → Client → Hook → Server Action → tRPC | Never skip levels |

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

### Module Development Guidelines

When creating new modules:

1. **One module per domain** — `product.module.ts`, `order.module.ts`
2. **Services for logic, Controllers for HTTP** — Clear separation
3. **Guards at controller level** — `@UseGuards(JwtAuthGuard, RolesGuard)`
4. **Event emission for extensibility** — Emit events for business operations
5. **Isolated migrations** — Module-specific schema changes

