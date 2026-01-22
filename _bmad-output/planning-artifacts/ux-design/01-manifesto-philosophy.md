---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
status: complete
completedAt: 2026-01-11
revisedAt: 2026-01-14
revision: 2.0
inputDocuments:
  - '_bmad-output/planning-artifacts/product-brief-trafi-app-2026-01-09.md'
  - '_bmad-output/planning-artifacts/prd.md'
additionalContext:
  - 'Visual Directives (user-provided inline)'
  - 'Brutalist Design Overhaul (2026-01-14)'
  - 'PRD v2 Alignment: ChangeSet, Override Kernel, Module Sandbox'
date: 2026-01-10
author: Alex
revisionNotes: |
  v2.0 Brutalist Overhaul (2026-01-14):
  - Design Direction: "Raw Intelligence" Digital Brutalism
  - Radius-Zero, High Contrast, Acid Accents
  - PRD Alignment: Autopilot ChangeSet, Override Kernel, Module Sandbox
  - UX Architecture: Console/Autopilot/Overrides/Modules/Data/Execution/Audit
  - Implementation: Brutal primitives, enforced via wrappers
---

# UX/UI Design Specification — Trafi v2

**Theme:** Raw Intelligence
**Style:** Digital Brutalism / Swiss Utility
**Revision:** 2.0 (Brutalist Overhaul)
**Author:** Alex

---

## 0. Goal

Trafi's UI is not a "pretty dashboard". It is an **execution console** for an e-commerce OS.

This spec hard-aligns the interface with:

- **Autopilot ChangeSet** — auditable, reversible artifact
- **Override Kernel** — deterministic override resolution
- **Module System + Module Sandbox** — runtime extensibility with security boundaries

---

## Executive Summary

### Project Vision

Trafi is an open-source e-commerce platform that bridges the gap between developer flexibility and merchant success. The **Profit Engine** (Autopilot) acts as an intelligent co-pilot that instruments, diagnoses, proposes, proves, and protects — replacing 4 human roles (Growth/CRO, CRM/Lifecycle, Analytics/Data, Ops/Safety).

**UX Philosophy:** "The interface is a machine. No decoration, only data and action."

**Design Direction:**
- **Dashboard:** Digital Brutalism — radius-zero, visible grid structure, high contrast, acid accents
- **Storefront:** Same brutal aesthetic — the machine serves buyers too
- **System:** Pure Black (#000) + Pure White (#FFF) + Acid Lime (#CCFF00)

### Target Users

#### Primary: Thomas (Technical Builder)
- **Profile:** Fullstack developer/freelancer, 3-10 years experience, React/Node.js specialist
- **Goal:** Deliver complete e-commerce projects in 3-4 weeks instead of 3 months
- **UX Need:** Type-safe SDK, excellent documentation, clear customization paths, stable upgrade experience
- **Success moment:** "I can deliver a store with Profit Engine included — that's my new selling point"

#### Primary: Sophie (Business Operator - Indie/SMB)
- **Profile:** D2C brand creator, manages store alone or with 1-2 people, 100K-2M€ revenue
- **Goal:** Increase checkout conversion 15-30% without hiring a growth team
- **UX Need:** Clear recommendations, trustworthy proof, one-click approvals, no technical complexity
- **Success moment:** "The system told me what to do, I clicked approve, and my conversion went up"

#### Secondary: Emma (Final Buyer)
- **Profile:** Mobile-first consumer, values speed and transparency
- **Goal:** Complete purchase quickly without surprises
- **UX Need:** Fast checkout, visible shipping costs early, guest checkout, preferred payment methods prominent
- **Success moment:** "That was easy — I didn't even need to create an account"

### Key Design Challenges

#### 1. Dual Audience Complexity
The Dashboard serves both technical power users (Thomas configuring everything) and non-technical merchants (Sophie approving recommendations). The UX must implement **progressive disclosure** — showing complexity only when needed, keeping the default experience simple.

#### 2. Trust Through Transparency (Profit Engine)
Sophie must understand WHY a recommendation is made and trust the system enough to approve actions affecting her business. Statistical concepts (confidence intervals, significance, rollback triggers) must be visualized accessibly without dumbing down the intelligence.

#### 3. Performance vs Creative Expression (Storefront)
The storefront aims for bold, memorable design with rich GSAP animations and potential 3D elements, while maintaining strict Core Web Vitals compliance (LCP < 2.5s, CLS < 0.1, INP < 200ms). Animation budget must be carefully managed.

#### 4. Dual Onboarding Tracks
- **Developer track:** CLI-first, 5 minutes to functional store, documentation-driven
- **Merchant track:** Cloud signup, Shopify migration wizard, immediate value demonstration
Both must feel cohesive while serving different mental models.

#### 5. Mobile-First Checkout Optimization
With 60%+ e-commerce traffic on mobile, the checkout flow must be ruthlessly optimized: guest checkout default, Apple Pay/Google Pay prominent, shipping costs visible early, minimal form fields.

### Design Opportunities

#### Inverted CRO Workflow
Traditional CRO tools show data and expect merchants to figure out actions. Trafi inverts this: the system does the analysis and proposes specific actions via **Autopilot ChangeSets**. The UX opportunity is making "proposal → approval → proof → permanent" flow feel empowering.

#### Visual Profit Guardrails
Before any action executes, showing the merchant "this would reduce your margin on SKU-X below threshold" creates a differentiated trust moment. Guardrails are **fences, not pillows** — robotic, precise, reassuring through competence.

#### Confidence Through Rollback Visibility
Explicitly showing "AUTO-ROLLBACK: ARMED • DEVIATION > 5% = AUTO-KILL" reduces approval anxiety. The rollback isn't a failure state — it's a safety feature that enables experimentation.

#### The Collective Brain
When local traffic is insufficient for statistical significance, the UI substitutes "Local Uncertainty" with "Network Certainty" — showing "VALIDATED ON 1,240 STORES" when the merchant's own data is inconclusive.

#### Brutalist Identity
The interface is a machine. No decoration, only data and action. This signals to both developers and merchants: "This is a serious tool that respects your intelligence."

---

## 1. Design Manifesto

### The Interface is a Machine

- **No decoration** — only data, structure, and action
- **Radius-zero** everywhere — everything is a rectangle
- **Visible grid** — 1px borders expose structure
- **High contrast** — pure black background, pure white text
- **Acid accents** — signals for action (#CCFF00), stability (#00FF94), risk (#FF3366)
- **Monospace for data** — it should look like terminal output

### UX Philosophy — "The Collective Brain"

The UI must bridge:

| State | Visualization |
|-------|---------------|
| **Local Uncertainty** | Low traffic → inconclusive tests → "INSUFFICIENT DATA" (muted) |
| **Network Certainty** | Federated learning → "VALIDATED ON N STORES" (bright acid) |

**Tone shift:**
- Before: "Try this?"
- Now: "Network confirms this works on 850 stores."

### Brutalist Design Pillars

| Pillar | Implementation |
|--------|----------------|
| **Strict Radius Zero** | `border-radius: 0px !important` enforced globally |
| **Visible Grids** | Borders (1px solid #333) separate every element |
| **High Contrast** | Pure Black (#000) background, Pure White (#FFF) text |
| **Acid Accents** | #CCFF00 for action, #00FF94 for success, #FF3366 for risk |
| **Monospace Data** | JetBrains Mono for all numbers, metrics, code |
| **No Shadows** | Elements sit firmly in the grid, no floating |
| **No Gradients** | Colors are solid and flat |
| **Instant Feedback** | Hover = instant inversion, no slow transitions |

## Core User Experience

### Defining Experience

Trafi delivers three distinct but interconnected user experiences, each with a clear core action:

**Dashboard (Merchant Back-Office)**
- **Core Action:** "See diagnostic → Understand → Approve in 1 click"
- **Primary User:** Sophie (Business Operator) for daily decisions, Thomas (Developer) for configuration
- **Experience Goal:** Transform complex e-commerce analytics into simple approve/reject decisions

**Storefront (Buyer Frontend)**
- **Core Action:** "Add to cart → Checkout → Payment in < 90 seconds"
- **Primary User:** Emma (Final Buyer), mobile-first consumer
- **Experience Goal:** Fastest path from intent to purchase with zero friction

**Developer Experience (CLI/SDK)**
- **Core Action:** "5 minutes from zero to functional store with Profit Engine"
- **Primary User:** Thomas (Technical Builder)
- **Experience Goal:** Immediate productivity, type-safe confidence, stable long-term relationship

### Developer Experience (Detailed)

#### CLI: The Dev Workflow Orchestrator

The Trafi CLI (`trafi` or `npx @trafi/cli`) is not a simple scaffolder — it's the primary interface for all critical developer operations.

#### Key Commands & Interactions

**1. `trafi init` (or `create-trafi-app`)**

Interactive wizard that configures the project based on dev choices:

```bash
$ npx create-trafi-app my-store

✨ Welcome to Trafi! Let's set up your store.

? Choose your setup:
  ❯ Full-stack (API + Storefront)
    API only (headless backend)
    Storefront only (connect to existing API)

? Select storefront framework:
  ❯ Next.js (App Router)
    Remix (soon)
    Nuxt (soon)
    None (API only)

? Choose your database:
  ❯ PostgreSQL (recommended)
    MySQL

? Select modules to enable:
  ☑ Jobs
  ☑ Builder
  ☑ Payment (Stripe)
  ☑ Review
  ☐ Wishlist
  ☐ Advanced Promotions

? Connect to Trafi Cloud?
  ❯ Yes (managed hosting)
    No (self-host)

🚀 Creating your store...
✅ Project created! Run `cd my-store && pnpm run dev`
```

**Expected Experience:**
- Clear questions with smart defaults
- Inline explanations for complex choices
- Total time: 2–3 minutes
- Result: functional project with seed data included

**2. `trafi module`**

Module management (enable, disable, create templates):

```bash
# List available modules
$ trafi module list
Available modules:
  wishlist       ✗ (disabled)
  promotions-adv ✗ (disabled)

# Enable a module
$ trafi module add wishlist
✅ Wishlist module enabled
📝 Run migrations: pnpm run migrate

# Create custom module from template
$ trafi module create my-custom-module
? Module type:
  ❯ Commerce (extends core)
    Integration (3rd party)
    Custom logic

✅ Module scaffolded in /modules/my-custom-module
```

**3. `trafi upgrade`**

Intelligent upgrade with breaking change detection:

```bash
$ trafi upgrade

🔍 Checking for updates...
Current: v1.2.0
Latest: v1.5.0

⚠️  Breaking changes detected in v1.5.0:
  - Payment API: `createPayment()` signature changed
  - Migration required for Order schema

? Upgrade strategy:
  ❯ Guided (show changes + migration steps)
    Automatic (run migrations automatically)
    Cancel

✅ Upgraded to v1.5.0
📖 Migration guide: https://docs.trafi.dev/migrate/1.5.0
```

**4. `trafi cloud`**

Connection/deployment to Trafi Cloud:

```bash
# Initial connection
$ trafi cloud login
🔐 Opening browser for authentication...
✅ Logged in as alex@example.com

# Deployment
$ trafi cloud deploy
🚀 Deploying to Trafi Cloud...
✅ Deployed! https://my-store.trafi.app
📊 View dashboard: https://admin.trafi.app/stores/my-store
```

### Platform Strategy

| Surface | Platform | Input Priority | Responsive Strategy |
|---------|----------|----------------|---------------------|
| Dashboard | Web | Keyboard + Mouse | Desktop-optimized, tablet-friendly, mobile-functional |
| Storefront | Web | Touch-first | Mobile-first, desktop-enhanced |
| CLI | Terminal | Keyboard | N/A |
| SDK | IDE | Keyboard | N/A |

**Key Platform Decisions:**
- Dashboard assumes desktop as primary context (data-dense interfaces work better with larger screens)
- Storefront assumes mobile as primary context (60%+ e-commerce traffic)
- Dark mode is native identity for Dashboard, not an afterthought
- No native mobile apps in MVP — web-first strategy
- PWA capabilities for Storefront considered for P1 (offline catalog browsing)

### Effortless Interactions

These interactions must feel completely natural and require zero cognitive load:

| Interaction | Target Experience | Design Implication |
|-------------|-------------------|-------------------|
| **Approve recommendation** | Single click, no forms, no confirmation dialogs for low-risk actions | Large, clear CTA with inline context |
| **Guest checkout** | Zero account creation, zero password, just email for receipt | Email field only, no "create account" prompts during flow |
| **View shipping cost** | Visible immediately when item added to cart | Shipping estimate component on cart, not hidden until checkout |
| **Restore abandoned cart** | One click from email, cart intact, ready to pay | Deep link directly to checkout with cart state preserved |
| **Rollback action** | Automatic when metrics decline, visible status in dashboard | Rollback status badge on every active experiment |
| **SDK integration** | Type hints guide implementation, errors caught at compile time | Comprehensive TypeScript definitions, IDE autocomplete |
| **Change brand color** | Zero code, instant preview, persists across sessions | Color picker in settings, live preview mode |

### Critical Success Moments

These moments determine whether users succeed or fail with Trafi:

| Moment | Persona | Success Indicator | Failure Mode |
|--------|---------|-------------------|--------------|
| **First functional store** | Thomas | Working checkout in 5-10 minutes | Setup errors, unclear documentation, missing dependencies |
| **First diagnostic insight** | Sophie | Day 1 sees actionable recommendation | Empty dashboard, no data, unclear next steps |
| **First proven uplift** | Sophie | Statistical proof within 30 days | No significance, confusing metrics, distrust |
| **First completed purchase** | Emma | < 90 seconds, no friction | Hidden fees, forced account, slow performance |
| **First painless upgrade** | Thomas | Zero breaking changes, clear migration | Breaking API, lost data, unclear changelog |
| **First margin protection** | Sophie | System blocks harmful action | Margin erosion unnoticed, profit destruction |
| **First brand customization** | Owner | Store reflects brand identity in < 2 minutes | Complex config, no preview, broken theme |

### Experience Principles

Five guiding principles for all UX decisions:

**1. Action Over Information**
The system proposes specific actions, not just data visualizations. Every dashboard view leads to a clear next step. Metrics exist to inform decisions, not to be admired.

**2. Trust Through Transparency**
Every recommendation explains its reasoning. Every action shows its safety net. Statistical concepts are visualized accessibly. "Here's why, here's the proof, here's the undo."

**3. Mobile-First, Desktop-Rich**
Storefront is designed for thumbs first, then enhanced for cursors. Dashboard is designed for productivity on large screens, then made functional on smaller ones. Never the reverse.

**4. Five-Minute Magic**
First value must appear in minutes. `create-trafi-app` to working store: 5 minutes. Signup to first diagnostic: same session. The "aha moment" cannot wait for configuration.

**5. Zero Friction by Default**
Default settings eliminate obstacles. Guest checkout is default. Shipping shows early by default. Approval is one click by default. Complexity is opt-in, not opt-out.

## Desired Emotional Response

### Primary Emotional Goals

Each persona has a distinct emotional objective that drives their satisfaction with Trafi:

| Persona | Primary Emotion | Supporting Emotions |
|---------|-----------------|---------------------|
| **Thomas (Developer)** | Confidence & Control | Pride, Trust, Relief |
| **Sophie (Merchant)** | Security & Empowerment | Hope, Validation, Gratitude |
| **Emma (Buyer)** | Ease & Transparency | Satisfaction, Trust, Delight |

**Core Emotional Promise:**
- **To Developers:** "You're in control. The tools work. Upgrades don't break things."
- **To Merchants:** "You're protected. The system helps you win without risk."
- **To Buyers:** "No surprises. Fast. Easy. Done."

### Emotional Journey Mapping

#### Developer Emotional Journey (Thomas)

| Stage | Target Emotion | Design Response |
|-------|----------------|-----------------|
| **Discovery** | Curiosity → Intrigue | Bold positioning, clear differentiation from Medusa/Shopify |
| **First CLI Run** | Surprise → Excitement | 5-minute magic, working store with seed data |
| **First Client Project** | Confidence → Pride | Type-safe SDK, excellent docs, no checkout bugs |
| **Version Upgrade** | Serenity → Gratitude | Semver compliance, clear changelog, guided migration |
| **Long-term Use** | Loyalty → Advocacy | Stable platform, community engagement, contribution path |

**Emotions to Avoid:** Frustration (setup failures), Anxiety (breaking changes), Embarrassment (client-facing bugs)

#### Merchant Emotional Journey (Sophie)

| Stage | Target Emotion | Design Response |
|-------|----------------|-----------------|
| **Discovery** | Hope → Relief | "Finally, something I can use without a dev team" |
| **Onboarding** | Clarity → Excitement | Simple wizard, Shopify import, immediate value |
| **First Diagnostic** | Curiosity → Trust | Clear explanation, actionable insight, no jargon |
| **First Approval** | Courage → Empowerment | Low-risk first action, visible safety net |
| **First Proven Uplift** | Validation → Joy | Clear visualization, confidence intervals explained simply |
| **Guardrails Activation** | Security → Gratitude | "The system protected my margin" moment |

**Emotions to Avoid:** Overwhelm (too much data), Anxiety (fear of breaking store), Distrust (opaque recommendations)

#### Buyer Emotional Journey (Emma)

| Stage | Target Emotion | Design Response |
|-------|----------------|-----------------|
| **Browse** | Pleasure → Discovery | Beautiful storefront, smooth animations, fast loading |
| **Add to Cart** | Satisfaction → Anticipation | Clear feedback, visible shipping estimate |
| **Checkout** | Flow → Confidence | Guest checkout, minimal fields, trusted payment icons |
| **Payment** | Security → Serenity | Apple Pay prominent, 3DS when needed, clear confirmation |
| **Post-Purchase** | Accomplishment → Contentment | Instant confirmation email, tracking promise |

**Emotions to Avoid:** Surprise (hidden fees), Frustration (forced account), Anxiety (unclear order status)

### Micro-Emotions

Critical subtle emotional states that determine user satisfaction:

| Micro-Emotion Pair | Critical For | Design Approach |
|--------------------|--------------|-----------------|
| **Confidence vs Skepticism** | Profit Engine adoption | Show reasoning, show proof, show rollback option |
| **Control vs Helplessness** | Dashboard experience | Clear navigation, undo everywhere, no dead ends |
| **Security vs Anxiety** | Checkout conversion | Trust signals, payment icons, SSL indicators |
| **Accomplishment vs Frustration** | Developer onboarding | Working code immediately, clear error messages |
| **Delight vs Indifference** | Storefront differentiation | Thoughtful animations, attention to detail |
| **Trust vs Doubt** | Long-term retention | Consistent behavior, honest communication |

### Emotion-to-Design Implications

| Desired Emotion | UX Design Approach |
|-----------------|-------------------|
| **Confidence** | Transparency in every recommendation — show the data, the logic, the expected outcome |
| **Control** | Visible rollback on every experiment, "undo" as first-class citizen, no hidden automations |
| **Security** | Guardrails shown BEFORE action executes, confirmation dialogs for high-risk only |
| **Empowerment** | Positive language ("You can...", "Ready to..."), no technical jargon in merchant-facing UI |
| **Accomplishment** | Immediate feedback on every action, success states with micro-celebrations |
| **Delight** | Smooth GSAP transitions, thoughtful loading states, easter eggs in CLI |
| **Trust** | Consistent behavior, honest error messages, no dark patterns |

### Emotional Design Principles

**1. Safety First, Speed Second**
Users must feel safe before they can feel fast. Every risky action shows its safety net. Rollback is visible. Guardrails are proactive, not reactive.

**2. Explain, Don't Mystify**
The Profit Engine is intelligent, not magical. Every recommendation explains its reasoning in plain language. Statistical concepts are visualized, not hidden behind jargon.

**3. Celebrate Success, Soften Failure**
Success moments get micro-animations and positive feedback. Failures are handled gracefully with clear recovery paths. No dead ends, no blame.

**4. Progressive Confidence**
Start with low-risk actions to build trust. First recommendation should be obviously safe. Confidence grows through small wins before big decisions.

**5. Respect User Intelligence**
Don't dumb down — make complex things accessible. Merchants aren't stupid; they just don't have time. Developers aren't impatient; they just value their time.

