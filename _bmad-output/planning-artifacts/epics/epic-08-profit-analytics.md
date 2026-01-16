# Epic 8: Profit Engine - Analytics & Recommendations

Merchant voit les metriques de conversion et recoit des recommandations d'optimisation avec rollback automatique via **Autopilot ChangeSets**.

**FRs covered:** FR23, FR24, FR25, FR26, FR27, FR28, FR29, FR30, FR31, FR32, FR63, FR64, FR65, FR66

**Revision:** v2.0 (2026-01-15) - PRD v2 Alignment: 3 Planes Architecture, Autopilot ChangeSet, Brutalist UX

---

## Epic Implementation Guidelines

### 3 Planes Architecture (PRD v2 CRITICAL)

This epic implements the **Profit Engine 3 Planes Architecture**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA PLANE                                  │
│  Stories 8.1-8.3: Instrumentation & Profiling Layer                │
│  • Standardized event instrumentation across storefront             │
│  • Customer journey tracking (page views, cart actions, checkout)   │
│  • Performance metrics and funnel completion rates                  │
│  Location: modules/profit-engine/collector/                         │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       DECISION PLANE                                │
│  Stories 8.4-8.8: AI + Statistical Proof Layer                     │
│  • Diagnosis engine: Identifies conversion bottlenecks              │
│  • Recommendation engine: Proposes evidence-based actions           │
│  • Statistical validation: CUPED, holdout groups, confidence        │
│  Location: modules/profit-engine/doctor/                            │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       EXECUTION PLANE                               │
│  Stories 8.9-8.19: Feature Flags + Background Jobs Layer           │
│  • Autopilot ChangeSet lifecycle management                         │
│  • Feature flags for A/B testing and gradual rollout                │
│  • Automatic rollback when metrics decline                          │
│  Location: modules/profit-engine/guardrails/ + modules/jobs/        │
└─────────────────────────────────────────────────────────────────────┘
```

### Autopilot ChangeSet (PRD v2 CRITICAL)

Every Autopilot action is encapsulated in a **ChangeSet** — a standardized, auditable, reversible artifact with lifecycle:

```
DRAFT → PENDING_APPROVAL → ACTIVE → MEASURING → [PROVEN | ROLLED_BACK] → PERMANENT
```

Stories 8.16-8.19 implement the full ChangeSet contract as specified in PRD v2.

### Retrospective Learnings (MANDATORY)
- **RETRO-1:** Use Context7 MCP before implementing charting libraries, statistics
- **RETRO-2:** DiagnosticsService, RecommendationService, ChangeSetService use `protected` methods
- **RETRO-3:** ProfitEngineModule exports explicit public API for custom diagnostics
- **RETRO-4:** Dashboard Profit Engine components accept customization props
- **RETRO-5:** Recommendation cards use composition pattern (wrappable)
- **RETRO-6:** Code with @trafi/core override patterns (custom metrics possible)
- **RETRO-7:** ChangeSet implements full PRD v2 interface with all mandatory fields

### UX Design Requirements (Dashboard - Digital Brutalism v2) - CRITICAL
This epic is the core differentiator. The UX must follow **Digital Brutalism** exactly.

**Brutalist Manifesto:**
- The interface is a machine. No decoration, only data and action.
- Radius-zero everywhere — everything is a rectangle.
- Visible grid — 1px borders expose structure.
- High contrast — pure black background, pure white text.
- Acid accents — signals for action, stability, risk.

**Layout:**
- **UX-1:** Pure Black (#000000) background — the interface is a machine
- **UX-2:** Rail (64px) + Sidebar (240px) + Main content layout
- **UX-3:** Breadcrumb: Dashboard > Profit Engine > [section]
- **UX-4:** Status badges: DRAFT (muted), PENDING (acid), ACTIVE (green), MEASURING (blue), PROVEN (bright), ROLLED_BACK (red)
- **UX-5:** Visible grid structure with 1px borders (#333333)
- **UX-6:** MetricCard component with monospace numbers (JetBrains Mono)
- **UX-7:** ChangeSetCard with APPROVE/REJECT/INSPECT actions
- **UX-8:** FunnelVisualization with drop-off percentages (monospace)
- **UX-9:** ConfidenceMeter visual bar with percentage (not abstract)
- **UX-10:** GuardrailsAlert: "BLOCKED: MARGIN VIOLATION" in red border
- **UX-11:** "AUTOPILOT PROPOSES → MERCHANT APPROVES" single-click workflow
- **UX-12:** Rollback visibility: "AUTO-ROLLBACK: ARMED • DEVIATION > 5% = AUTO-KILL"

### Visual Design (Brutalist Profit Engine)
- **UX-COLOR-1:** Primary Acid Lime #CCFF00 for action buttons, focus states
- **UX-COLOR-2:** Success #00FF94 for positive metrics, proven experiments
- **UX-COLOR-3:** Warning Acid Lime #CCFF00 for guardrail alerts
- **UX-COLOR-4:** Risk #FF3366 for rollback, negative results, violations
- **UX-COLOR-5:** Background #000000, Card border #333333, text #FFFFFF
- **UX-TYPE-1:** JetBrains Mono for ALL numbers, metrics, data, code
- **UX-TYPE-2:** System font (Inter/SF Pro) for labels, descriptions
- **UX-RADIUS:** 0px everywhere — `border-radius: 0px !important`
- **UX-SHADOW:** None — elements sit firmly in the grid, no floating

### Animation Guidelines (Minimal Brutalist)
- **UX-ANIM-1:** Metric counters: 200ms (instant feedback)
- **UX-ANIM-2:** Chart animations: 300ms max
- **UX-ANIM-3:** Hover: instant inversion (no slow transitions)
- **UX-ANIM-4:** Approval success: border flash green 500ms (no confetti)
- **UX-ANIM-5:** Status badge transitions: instant
- **UX-ANIM-6:** All respect `prefers-reduced-motion`

### Key Components (Local vs Global Pattern)
- **Global:** MetricCard, StatusBadge, ConfidenceMeter, BrutalGrid, BrutalButton
- **Local:** ChangeSetCard (`_components/`), FunnelVisualization, GuardrailsAlert, ChangeSetTimeline

---

## Story 8.1: Event Instrumentation Schema

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

---

## Story 8.2: Storefront Event Capture

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

---

## Story 8.3: Event Aggregation Pipeline

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

---

## Story 8.4: Store Performance Dashboard

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

---

## Story 8.5: Checkout Funnel Visualization

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

---

## Story 8.6: Funnel Diagnostics Engine

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

---

## Story 8.7: Recommendation Generation

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

---

## Story 8.8: Recommendation Review Interface

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

---

## Story 8.9: Feature Flag System

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

---

## Story 8.10: Statistical Measurement Engine

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

---

## Story 8.11: Automatic Rollback

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

---

## Story 8.12: Experiment Results and Proof

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

---

## Story 8.13: Profit Guardrails Configuration

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

---

## Story 8.14: Guardrails Enforcement

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

---

## Story 8.15: Profit Attribution Dashboard

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

## EXECUTION PLANE: Autopilot ChangeSet Implementation

_Stories 8.16-8.19 implement the PRD v2 Autopilot ChangeSet — the executable, auditable, reversible artifact that transforms Autopilot from "AI suggestions" to "autonomous execution with human oversight"._

---

## Story 8.16: ChangeSet Data Model & Service

As a **System**,
I want **a standardized ChangeSet data structure**,
So that **all Autopilot actions are encapsulated as executable artifacts**.

**Acceptance Criteria:**

**Given** the Autopilot needs to execute actions
**When** a ChangeSet is created
**Then** it contains the full PRD v2 contract:
```typescript
interface AutopilotChangeSet {
  id: string;                    // cuid
  version: number;               // Increments on modification
  storeId: string;               // Tenant scope

  hypothesis: {
    problem: string;             // "42% cart abandonment at shipping"
    expectedOutcome: string;     // "Reduce abandonment by 15-25%"
    confidenceLevel: 'low' | 'medium' | 'high';
    dataEvidence: DataPoint[];
  };

  actionPlan: {
    type: 'feature_flag' | 'workflow' | 'copy_change' | 'timing_change' | 'segment_target';
    targetSegment: SegmentDefinition;
    implementation: { featureFlagKey?: string; changes: ChangeDetail[] };
    rolloutStrategy: 'immediate' | 'gradual' | 'holdout';
    rolloutPercentage?: number;
  };

  guardrails: {
    profitFloor: number;
    stockThreshold?: number;
    sloRequirements: SLOCheck[];
    riskLevel: 'low' | 'medium' | 'high';
    blockedConditions: string[];
  };

  rollbackPlan: {
    autoRollbackTriggers: MetricTrigger[];
    manualRollbackEnabled: boolean;
    rollbackProcedure: string;
    estimatedRollbackTime: string;
  };

  proofPlan: {
    primaryMetrics: MetricDefinition[];
    secondaryMetrics: MetricDefinition[];
    holdoutPercentage: number;
    statisticalMethod: 'cuped' | 'bayesian' | 'frequentist';
    minimumSampleSize: number;
    measurementWindow: string;
    significanceThreshold: number;
  };

  approval: {
    status: 'pending' | 'approved' | 'rejected' | 'expired';
    approvedBy?: string;
    approvedAt?: Date;
    expiresAt?: Date;
  };

  execution: {
    status: ExecutionStatus;  // DRAFT → PENDING_APPROVAL → ACTIVE → MEASURING → PROVEN/ROLLED_BACK → PERMANENT
    startedAt?: Date;
    endedAt?: Date;
    currentMetrics?: LiveMetrics;
    proofResult?: ProofResult;
  };

  auditTrail: AuditEvent[];
}
```
**And** Prisma schema includes ChangeSet model with JSONB fields
**And** ChangeSetService has `protected` methods for extensibility
**And** Zod schemas validate all ChangeSet fields

---

## Story 8.17: ChangeSet Lifecycle State Machine

As a **System**,
I want **a deterministic state machine for ChangeSet lifecycle**,
So that **state transitions are predictable and auditable**.

**Acceptance Criteria:**

**Given** a ChangeSet exists
**When** state transitions occur
**Then** the lifecycle follows:
```
DRAFT → PENDING_APPROVAL → ACTIVE → MEASURING → [PROVEN | ROLLED_BACK]
                                                         ↓
                                                    PERMANENT
```
**And** each transition:
- Validates guardrails (profitFloor, stockThreshold, SLO gates)
- Creates audit event (actor, timestamp, state change, reason)
- Sends notifications (if configured)
- Updates execution timestamps
**And** invalid transitions throw errors with clear messages
**And** PENDING_APPROVAL expires after configurable timeout (default 7 days)
**And** ROLLED_BACK can only transition to PERMANENT (with explicit merchant confirmation)

---

## Story 8.18: ChangeSet Dashboard UI

As a **Merchant (Sophie)**,
I want **to view and manage ChangeSets in a Brutalist interface**,
So that **I can approve, monitor, and understand Autopilot actions**.

**Acceptance Criteria:**

**Given** ChangeSets exist in various states
**When** Merchant views Profit Engine > Autopilot section
**Then** they see:
- **ChangeSet List:** Cards showing hypothesis, status badge, risk level
- **Status Badges:** Brutalist style (DRAFT=gray, PENDING=#CCFF00, ACTIVE=#00FF94, MEASURING=blue, PROVEN=bright, ROLLED_BACK=#FF3366)
- **ChangeSet Detail:** Full hypothesis, guardrails, rollback plan, proof plan
- **Timeline View:** State transitions with timestamps and actors
- **Approve Action:** Single click → confirmation → state transition
- **Rollback Alert:** "AUTO-ROLLBACK: ARMED • DEVIATION > 5% = AUTO-KILL"
**And** all numbers in JetBrains Mono
**And** cards have 1px #333 borders, 0px radius
**And** hover states are instant inversions

---

## Story 8.19: ChangeSet Audit Trail & Compliance

As a **System**,
I want **a complete audit trail for every ChangeSet action**,
So that **all Autopilot activity is traceable and compliant**.

**Acceptance Criteria:**

**Given** ChangeSet operations occur
**When** any state change or action happens
**Then** audit events are logged with:
- `changesetId`, `storeId`, `timestamp`
- `actor`: { type: 'system' | 'user' | 'autopilot', id: string }
- `action`: 'created' | 'approved' | 'rejected' | 'activated' | 'measured' | 'proven' | 'rolled_back' | 'made_permanent'
- `previousState`, `newState`
- `reason`: human-readable explanation
- `metadata`: contextual data (metrics at time of action, guardrail checks)
**And** audit trail is immutable (append-only)
**And** audit data retained for 2 years (compliance)
**And** dashboard shows timeline view of audit events per ChangeSet
**And** export to CSV/JSON for compliance reporting
