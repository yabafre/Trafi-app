# Epic 8: Profit Engine - Analytics & Recommendations

Merchant voit les metriques de conversion et recoit des recommandations d'optimisation avec rollback automatique.

**FRs covered:** FR23, FR24, FR25, FR26, FR27, FR28, FR29, FR30, FR31, FR32, FR63, FR64, FR65, FR66

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
