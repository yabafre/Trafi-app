## 5. Key UX Flows (Aligned to PRD)

### 5.1 Autopilot ChangeSet (The Executable Artifact)

A ChangeSet is not a suggestion. It's an **executable contract**.

#### ChangeSet List View

```
┌─────────────────────────────────────────────────────────────┐
│ AUTOPILOT > RECOMMENDATIONS                                 │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [NEW]  SHOW SHIPPING EARLY                              │ │
│ │ Type: copy_change • Confidence: HIGH                    │ │
│ │ Network: VALIDATED ON 1,240 STORES                      │ │
│ │                                    [VIEW] [APPROVE]     │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [MEASURING]  URGENCY TIMER ON CART                      │ │
│ │ Type: feature_flag • Day 4 of 14                        │ │
│ │ Current: +8.2% conversion                               │ │
│ │                                    [VIEW] [ROLL BACK]   │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### ChangeSet Detail View — Mandatory Blocks

**1. Header Block**
```
┌─────────────────────────────────────────────────────────────┐
│ CHANGESET CS-2024-0142                    [PENDING_APPROVAL]│
│ Version: 3 • Created: 2026-01-14 09:23:41                   │
│ ─────────────────────────────────────────────────────────── │
│ NETWORK CONFIDENCE: ████████████████░░░░ 82%                │
└─────────────────────────────────────────────────────────────┘
```

**2. Hypothesis Block**
```
┌─────────────────────────────────────────────────────────────┐
│ HYPOTHESIS                                                  │
├─────────────────────────────────────────────────────────────┤
│ PROBLEM:                                                    │
│ Customers abandon cart when shipping costs appear late      │
│                                                             │
│ EXPECTED OUTCOME:                                           │
│ +12-18% cart completion when shipping shown on product page │
│                                                             │
│ CONFIDENCE: HIGH                                            │
│ EVIDENCE: 3 data points                                     │
│   • 68% abandon at shipping step                            │
│   • Network avg: 42% when shown early                       │
│   • A/B test on similar stores: +15%                        │
└─────────────────────────────────────────────────────────────┘
```

**3. Action Plan Block**
```
┌─────────────────────────────────────────────────────────────┐
│ ACTION PLAN                                                 │
├─────────────────────────────────────────────────────────────┤
│ TYPE: copy_change                                           │
│ SEGMENT: all_visitors                                       │
│ ROLLOUT: gradual (10% → 50% → 100%)                         │
│ ─────────────────────────────────────────────────────────── │
│ CHANGES:                                                    │
│   1. ProductPage: Add ShippingEstimate component            │
│   2. CartDrawer: Move shipping from step 3 to step 1        │
│   3. Checkout: Remove duplicate shipping display            │
└─────────────────────────────────────────────────────────────┘
```

**4. Guardrails Block**
```
┌─────────────────────────────────────────────────────────────┐
│ GUARDRAILS                                        [ARMED]   │
├─────────────────────────────────────────────────────────────┤
│ ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐ │
│   🛡 PROFIT FLOOR: €2.50/order                              │
│   🛡 STOCK THRESHOLD: none                                  │
│   🛡 SLO: LCP < 2.5s, Error rate < 0.1%                     │
│   🛡 RISK LEVEL: LOW                                        │
│ └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘ │
│                                                             │
│ DEVIATION > 5% = AUTO-KILL                                  │
└─────────────────────────────────────────────────────────────┘
```

**5. Rollback Plan Block**
```
┌─────────────────────────────────────────────────────────────┐
│ ROLLBACK PLAN                                               │
├─────────────────────────────────────────────────────────────┤
│ AUTO TRIGGERS:                                              │
│   • Conversion drops > 5%                                   │
│   • Error rate exceeds 0.5%                                 │
│   • Revenue per visitor drops > 10%                         │
│                                                             │
│ MANUAL ROLLBACK: ENABLED                                    │
│ ESTIMATED ROLLBACK TIME: < 30 seconds                       │
└─────────────────────────────────────────────────────────────┘
```

**6. Proof Plan Block**
```
┌─────────────────────────────────────────────────────────────┐
│ PROOF PLAN                                                  │
├─────────────────────────────────────────────────────────────┤
│ PRIMARY METRICS:                                            │
│   • Cart completion rate (target: +12%)                     │
│   • Revenue per visitor (guard: no decline)                 │
│                                                             │
│ METHOD: CUPED                                               │
│ HOLDOUT: 10%                                                │
│ MIN SAMPLE: 2,000 conversions                               │
│ WINDOW: 14 days                                             │
│ SIGNIFICANCE: p < 0.05                                      │
└─────────────────────────────────────────────────────────────┘
```

**7. Approval Block**
```
┌─────────────────────────────────────────────────────────────┐
│ APPROVAL                                                    │
├─────────────────────────────────────────────────────────────┤
│ STATUS: PENDING_APPROVAL                                    │
│ EXPIRES: 2026-01-21 09:23:41 (7 days)                       │
│                                                             │
│           [APPROVE & DEPLOY]    [REJECT]                    │
└─────────────────────────────────────────────────────────────┘
```

**8. Execution State Block** (when active)
```
┌─────────────────────────────────────────────────────────────┐
│ EXECUTION                                       [MEASURING] │
├─────────────────────────────────────────────────────────────┤
│ STARTED: 2026-01-14 14:32:00                                │
│ DAY: 4 of 14                                                │
│ ─────────────────────────────────────────────────────────── │
│ LIVE METRICS:                                               │
│   Cart completion: 34.2% (+8.2%)  ████████████░░░░░░        │
│   Revenue/visitor: €4.21 (+2.1%)  ████████████████░░        │
│   Error rate: 0.02%               ██░░░░░░░░░░░░░░░░        │
│ ─────────────────────────────────────────────────────────── │
│           [PROMOTE TO PERMANENT]    [ROLL BACK NOW]         │
└─────────────────────────────────────────────────────────────┘
```

**9. Audit Trail Block**
```
┌─────────────────────────────────────────────────────────────┐
│ AUDIT TRAIL                                                 │
├─────────────────────────────────────────────────────────────┤
│ 2026-01-14 14:32:00  STATUS → ACTIVE         system         │
│ 2026-01-14 14:31:58  APPROVED                alex@store.com │
│ 2026-01-14 09:23:41  CREATED                 autopilot      │
│ 2026-01-13 23:00:00  ANALYSIS_COMPLETE       autopilot      │
└─────────────────────────────────────────────────────────────┘
```

#### Cold Start Solver (Network Confidence)

When local data is insufficient:

```
┌─────────────────────────────────────────────────────────────┐
│ CONFIDENCE ANALYSIS                                         │
├───────────────────────────┬─────────────────────────────────┤
│ LOCAL ANALYSIS            │ NETWORK ANALYSIS                │
│ ─────────────────────────┼───────────────────────────────── │
│ [!] INSUFFICIENT DATA     │ ✓ VALIDATED ON 1,240 STORES     │
│                           │                                 │
│ Your traffic: 230/day     │ Network avg uplift: +14.2%      │
│ Min required: 2,000       │ Confidence: 94%                 │
│                           │ Similar stores: 847             │
│ ░░░░░░░░░░░░░░░░░░░░     │ ████████████████████            │
└───────────────────────────┴─────────────────────────────────┘
```

Psychology: "Don't trust yourself (yet), trust the network."

### 5.2 Guardrails & Auto-Rollback (The Safety Fence)

Safety is a fence, not a pillow. The UI communicates certainty, not comfort.

#### Guardrail Widget Variations

**Armed State:**
```
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
  🛡 SURVEILLANCE ACTIVE
  DEVIATION > 5% = AUTO-KILL
  PROFIT FLOOR: €2.50/order
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

**Triggered State:**
```
┌─────────────────────────────────────────────────────────────┐
│ 🚨 ROLLBACK TRIGGERED                           [ROLLED_BACK]│
├─────────────────────────────────────────────────────────────┤
│ TRIGGER: Conversion dropped 7.2% (threshold: 5%)            │
│ DETECTED: 2026-01-15 03:42:18                               │
│ ROLLED BACK: 2026-01-15 03:42:19 (< 1 second)               │
│                                                             │
│ Traffic protected: 1,247 visitors                           │
│ Estimated revenue saved: €892                               │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 Override Kernel (Deterministic Resolution)

This is a **system page**, not a settings page. It shows exactly how the runtime resolves overrides.

#### Token Registry View

```
┌─────────────────────────────────────────────────────────────┐
│ OVERRIDES > TOKEN REGISTRY                                  │
├─────────────────────────────────────────────────────────────┤
│ FILTER: [All] [Products] [Orders] [Payments] [Dashboard]    │
├─────────────────────────────────────────────────────────────┤
│ TOKEN               │ PROVIDER          │ SOURCE   │ STATUS │
│ ───────────────────┼───────────────────┼──────────┼─────── │
│ PRODUCT_SERVICE     │ CustomProductSvc  │ override │ ✓      │
│ PRICING_CALCULATOR  │ CorePricingCalc   │ core     │ ✓      │
│ PAYMENT_PROCESSOR   │ StripeProcessor   │ core     │ ✓      │
│ INVENTORY_SERVICE   │ CustomInventorySvc│ override │ ✓      │
└─────────────────────────────────────────────────────────────┘
```

#### Resolution Trace Drawer

When clicking a token, show the resolution trace:

```
┌─────────────────────────────────────────────────────────────┐
│ RESOLUTION TRACE: PRODUCT_SERVICE                           │
├─────────────────────────────────────────────────────────────┤
│ STEP 1: Check trafi.config.ts                               │
│         Found: PRODUCT_SERVICE → CustomProductService       │
│         ✓ OVERRIDE REGISTERED                               │
│                                                             │
│ STEP 2: Validate override class                             │
│         Extends: CoreProductService ✓                       │
│         Implements: IProductService ✓                       │
│         ✓ VALIDATION PASSED                                 │
│                                                             │
│ STEP 3: Register in DI container                            │
│         Token: PRODUCT_SERVICE                              │
│         Provider: CustomProductService                      │
│         Scope: REQUEST                                      │
│         ✓ REGISTERED                                        │
│                                                             │
│ RESULT: CustomProductService                                │
└─────────────────────────────────────────────────────────────┘
```

#### Config Editor

Monospace editor for `trafi.config.ts`:

```
┌─────────────────────────────────────────────────────────────┐
│ OVERRIDES > CONFIG EDITOR                      [VALIDATE]   │
├─────────────────────────────────────────────────────────────┤
│ 1  import { defineConfig } from '@trafi/core';              │
│ 2                                                           │
│ 3  export default defineConfig({                            │
│ 4    overrides: {                                           │
│ 5      providers: {                                         │
│ 6        PRODUCT_SERVICE: CustomProductService,             │
│ 7        INVENTORY_SERVICE: CustomInventoryService,         │
│ 8      },                                                   │
│ 9      dashboard: {                                         │
│10        slots: {                                           │
│11          'product-detail-sidebar': CustomSidebar,         │
│12        },                                                 │
│13      },                                                   │
│14    },                                                     │
│15  });                                                      │
├─────────────────────────────────────────────────────────────┤
│ VALIDATION: ✓ PASSED                                        │
│ • 2 provider overrides registered                           │
│ • 1 dashboard slot override registered                      │
│ • No type errors                                            │
│ • No semver conflicts                                       │
└─────────────────────────────────────────────────────────────┘
```

### 5.4 Modules + Module Sandbox (Security Enforcement)

Treat modules as untrusted input. The UI shows exactly what security checks passed or failed.

#### Modules Home

```
┌─────────────────────────────────────────────────────────────┐
│ MODULES > INSTALLED                                         │
├─────────────────────────────────────────────────────────────┤
│ MODULE              │ VERSION │ COMPAT    │ STATUS │        │
│ ───────────────────┼─────────┼───────────┼────────┼─────── │
│ @trafi/wishlist     │ 1.2.0   │ ^1.0.0 ✓  │ ACTIVE │[CONFIG]│
│ @trafi/reviews      │ 2.0.1   │ ^1.0.0 ✓  │ ACTIVE │[CONFIG]│
│ @trafi/promotions   │ 1.0.0   │ ^1.0.0 ✓  │ ACTIVE │[CONFIG]│
│ custom/loyalty      │ 0.5.0   │ ^1.0.0 ✓  │ ACTIVE │[CONFIG]│
├─────────────────────────────────────────────────────────────┤
│                                    [INSTALL MODULE]         │
└─────────────────────────────────────────────────────────────┘
```

#### Module Install Flow (Step-based)

```
┌─────────────────────────────────────────────────────────────┐
│ INSTALL MODULE                              STEP 3 of 5     │
├─────────────────────────────────────────────────────────────┤
│ SOURCE: npm:@trafi/advanced-promotions@1.0.0                │
│ ─────────────────────────────────────────────────────────── │
│                                                             │
│ SANDBOX ANALYSIS COMPLETE                                   │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ AST CHECKS                                    [PASSED]  │ │
│ │ • No eval() usage                                  ✓    │ │
│ │ • No new Function()                                ✓    │ │
│ │ • No dynamic require()                             ✓    │ │
│ │ • No child_process                                 ✓    │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ FS ISOLATION                                  [PASSED]  │ │
│ │ • Read access: /modules/promotions/*               ✓    │ │
│ │ • Write access: /modules/promotions/data/*         ✓    │ │
│ │ • No access outside module directory               ✓    │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ NETWORK ACL                                   [PASSED]  │ │
│ │ • Allowed: api.stripe.com                          ✓    │ │
│ │ • Allowed: analytics.trafi.dev                     ✓    │ │
│ │ • No other outbound requests                       ✓    │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ RUNTIME POLICY                                [PASSED]  │ │
│ │ • Side-effect free                                 ✓    │ │
│ │ • Observability hooks                              ✓    │ │
│ │ • Deterministic behavior                           ✓    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│                           [BACK]    [CONTINUE TO STEP 4]    │
└─────────────────────────────────────────────────────────────┘
```

#### Sandbox Report (Failure Case)

```
┌─────────────────────────────────────────────────────────────┐
│ SANDBOX REPORT                                   [FAILED]   │
├─────────────────────────────────────────────────────────────┤
│ MODULE: sketchy-module@0.1.0                                │
│ ─────────────────────────────────────────────────────────── │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ AST CHECKS                                    [FAILED]  │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ ✗ CRITICAL: Dynamic code execution detected             │ │
│ │   File: src/utils/exec.ts:42                            │ │
│ │   Pattern: eval(userInput)                              │ │
│ │   Fix: Remove eval() usage, use validated alternatives  │ │
│ │                                                         │ │
│ │ ✗ CRITICAL: Shell access attempted                      │ │
│ │   File: src/helpers/run.ts:15                           │ │
│ │   Pattern: require('child_process')                     │ │
│ │   Fix: Remove child_process import                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ INSTALLATION BLOCKED                                        │
│ This module violates security policies and cannot be        │
│ installed. Contact the module author for a compliant        │
│ version.                                                    │
│                                                             │
│                                              [DISMISS]      │
└─────────────────────────────────────────────────────────────┘
```

## UX Consistency Patterns

### Button Hierarchy

Trafi uses a 6-variant button system to establish clear visual hierarchy across all surfaces:

| Variant | Usage | Visual Treatment |
|---------|-------|------------------|
| **Primary** | Main CTA per screen (Approve, Checkout, Save) | Solid orange (#F97316), white text |
| **Secondary** | Supporting actions (Cancel, Learn More) | Ghost with orange border, orange text |
| **Ghost** | Tertiary actions | Transparent, muted text, hover reveals background |
| **Destructive** | Delete, remove, irreversible actions | Red background, white text |
| **Outline** | Alternative to secondary, list contexts | 1px border, transparent background |
| **Link** | Inline text actions | Underline on hover, no background |

**Hierarchy Rules:**
- Maximum 1 Primary button visible per viewport
- Primary always positioned rightmost in button groups
- Destructive actions require confirmation modal
- Button sizes: `sm` (32px), `md` (40px - default), `lg` (48px)

### Feedback Patterns

#### Toast Notifications

| Type | Duration | Icon | Usage |
|------|----------|------|-------|
| **Success** | 4s auto-dismiss | Checkmark | Action completed successfully |
| **Error** | Manual dismiss | X circle | Action failed, user intervention needed |
| **Warning** | 6s auto-dismiss | Triangle | Caution, non-blocking |
| **Info** | 4s auto-dismiss | Info circle | Neutral information |

**Position:** Top-right for Dashboard, bottom-center for Storefront
**Stacking:** Maximum 3 visible, older dismissed automatically

#### Inline Validation

- **Real-time:** Validate on blur + 800ms debounce on type
- **Success State:** Green checkmark icon right-aligned in field
- **Error State:** Red border + error message below field
- **Neutral State:** Default border, no icon

#### Celebration Moments

- **Profit Engine Success:** Confetti burst (subtle, 2s duration) + success toast
- **First Sale:** Celebration animation on dashboard
- **Goal Completion:** Progress bar fills + pulse animation
- **These use GSAP with `prefers-reduced-motion` respect**

### Form Patterns

#### Field States

| State | Visual Treatment |
|-------|------------------|
| **Default** | Border: `--border`, no background |
| **Focus** | Border: `--primary`, subtle ring shadow |
| **Error** | Border: `--error`, error icon, message below |
| **Disabled** | Background: `--muted`, reduced opacity (0.5) |
| **Read-only** | Background: `--muted`, full opacity, no interactions |

#### Form Layout

- **Single Column:** Default for all forms (proven higher completion rates)
- **Field Spacing:** 24px vertical gap between fields
- **Label Position:** Above field, 8px gap
- **Help Text:** Below field, muted color, 12px font
- **Required Indicator:** Red asterisk after label (sparingly used)

#### Validation Timing

| Context | When to Validate |
|---------|------------------|
| **Checkout forms** | On blur + before submit |
| **Dashboard forms** | Real-time with debounce |
| **Search inputs** | No validation, instant results |

### Navigation Patterns

#### Dashboard Navigation

**Structure:** Rail (64px) + Sidebar (240px) + Main Content

| Element | Behavior |
|---------|----------|
| **Rail** | Fixed, icon-only, always visible, main sections |
| **Sidebar** | Collapsible, text labels, sub-navigation |
| **Breadcrumb** | Top of main content, shows hierarchy |
| **Topbar** | Search, notifications, user menu |

**Keyboard Shortcuts:**
- `Cmd/Ctrl + K`: Command palette (P1)
- `Cmd/Ctrl + /`: Toggle sidebar
- `Escape`: Close any modal/overlay

#### Storefront Navigation

**Structure:** Floating Header (frosted glass) + Minimal Footer

| Element | Behavior |
|---------|----------|
| **Header** | Fixed, transparent → frosted on scroll |
| **Logo** | Left-aligned, links to home |
| **Nav Links** | Center, primary categories |
| **Actions** | Right (search, account, cart) |
| **Mobile** | Hamburger menu (slide-from-left) |

### Modal & Overlay Patterns

#### Modal Sizes

| Size | Width | Usage |
|------|-------|-------|
| **Small** | 400px | Confirmation dialogs |
| **Medium** | 560px | Forms, settings |
| **Large** | 720px | Complex content |
| **Full** | 90vw (max 1200px) | Rich editors, previews |

#### Modal Behaviors

- **Backdrop:** Click to dismiss (low-risk), no-click (forms with data)
- **Animation:** 200ms fade + scale (0.95 → 1)
- **Focus Trap:** Tab cycles within modal
- **Escape Key:** Always closes modal
- **Mobile:** Full-screen takeover below 640px

#### Sheet (Slide-Over)

- **Cart:** Right side, 400px width
- **Quick View:** Right side, 560px width
- **Mobile Filters:** Bottom sheet, swipe to dismiss
- **Animation:** 250ms slide from edge

### Empty & Loading States

#### Empty States

| Context | Content | CTA |
|---------|---------|-----|
| **No recommendations** | Illustration + "Profit Engine is analyzing..." | View documentation |
| **No orders** | Illustration + "No orders yet" | Share store link |
| **No products** | Illustration + "Add your first product" | Create product |
| **Search no results** | "No results for [query]" | Clear filters |

**Design:**
- Use Clash Display for headline
- Subtle illustration (line art style)
- Single primary CTA
- Secondary link for help

#### Loading States

| Duration | Treatment |
|----------|-----------|
| **< 200ms** | No indicator (instant feel) |
| **200ms - 1s** | Skeleton loading |
| **1s - 5s** | Skeleton + progress indicator |
| **> 5s** | Progress bar with message |

**Skeleton Rules:**
- Match component dimensions exactly
- Subtle pulse animation (opacity 0.5 → 1)
- Gray placeholder (#262626 dark, #E5E5E5 light)

### Search & Filter Patterns

#### Command Palette (P1)

- **Trigger:** `Cmd/Ctrl + K`
- **Layout:** Centered modal, 560px width
- **Sections:** Recent, Actions, Navigation, Products
- **Keyboard:** Arrow keys navigate, Enter selects

#### Search Input

- **Dashboard:** Global search in topbar, all entities
- **Storefront:** Icon-triggered, slide-down input
- **Results:** Instant as-you-type (300ms debounce)
- **Mobile:** Full-screen search overlay

#### Filters

- **Dashboard Tables:** Filter row above table, chips for active filters
- **Storefront Products:** Sidebar on desktop, bottom sheet on mobile
- **Apply:** Instant (no "Apply" button needed)
- **Clear:** "Clear all" link when filters active

### Data Display Patterns

#### Tables (Dashboard)

- **Row Height:** 48px (compact), 56px (default)
- **Hover:** Background highlight (--muted)
- **Selection:** Checkbox column, bulk actions bar appears
- **Sorting:** Click column header, indicator arrow
- **Pagination:** Bottom right, showing "1-10 of 100"

#### Cards (Bento Grid)

- **Border Radius:** 12px
- **Padding:** 24px
- **Hover:** Border color → --primary, subtle lift (translateY -2px)
- **Status:** Badge in top-right corner
- **Metric Display:** Large number + small label + trend indicator

