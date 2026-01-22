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

