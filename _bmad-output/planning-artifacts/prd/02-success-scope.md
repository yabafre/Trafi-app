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

