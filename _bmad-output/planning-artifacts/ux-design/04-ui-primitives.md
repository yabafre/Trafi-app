## 3. Core UI Primitives

These primitives MUST be used everywhere. Developers never style from scratch.

### 3.1 Frame (The Basic Unit)

A "frame" is the basic layout unit: a rectangle with explicit borders.

```css
.brutal-frame {
  background: var(--surface-1);
  border: 1px solid var(--border);
  border-radius: 0;
  box-shadow: none;
}
```

### 3.2 Buttons

| Variant | Background | Text | Border | Hover |
|---------|------------|------|--------|-------|
| **Primary Action** | White | Black | White | Acid bg + black text |
| **Collective (AI)** | Acid (#CCFF00) | Black | Acid | White bg + black text |
| **Secondary/Ghost** | Transparent | Grey (#888) | Grey (#333) | White border + white text |
| **Destructive** | Neon Red (#FF3366) | White | Neon Red | Darker red |

**Text rules:** Uppercase, bold, wide tracking (0.1em)

**Collective Action buttons** always include icon: `Zap` or `Brain`

### 3.3 Badges

Rectangle badges, compact padding (4px 8px):

| Variant | Background | Text |
|---------|------------|------|
| **Active** | Acid (#CCFF00) | Black |
| **Success** | Success Acid (#00FF94) | Black |
| **Neutral** | Transparent | Grey (#888) + grey border |
| **Risk** | Neon Red (#FF3366) | White |

### 3.4 Inputs

```css
.brutal-input {
  background: var(--surface-0);
  border: 1px solid var(--border);
  border-radius: 0;
  font-family: 'JetBrains Mono', monospace;
  padding: 8px 12px;
}

.brutal-input:focus {
  border-color: var(--primary); /* Acid */
  outline: none;
}
```

### 3.5 Tables (Engineering Style)

```css
.brutal-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid var(--border);
}

.brutal-table th {
  background: var(--surface-1);
  font-family: 'Space Grotesk', sans-serif;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-align: left;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}

.brutal-table td {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}

.brutal-table tr:hover {
  background: var(--surface-2);
}
```

### 3.6 Cards (Brutal Cards)

```css
.brutal-card {
  background: var(--surface-0);
  border: 1px solid var(--border);
  border-radius: 0;
  padding: 0; /* Content handles padding */
}

.brutal-card:hover {
  background: var(--surface-2);
}

.brutal-card-header {
  border-bottom: 1px solid var(--border);
  padding: 16px 20px;
}
```

### 3.7 Guardrail Box

A special component for safety messaging:

```css
.guardrail-box {
  border: 1px dashed var(--border);
  padding: 16px;
  background: var(--surface-1);
}

.guardrail-box .icon {
  color: var(--acid-success); /* Shield icon */
}

.guardrail-box .copy {
  font-family: 'JetBrains Mono', monospace;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

**Copy examples:**
- `SURVEILLANCE ACTIVE`
- `DEVIATION > 5% = AUTO-KILL`
- `AUTO-ROLLBACK: ARMED`

---

## 4. Product-Level UX Architecture

The Back Office navigation is organized around the OS concepts from the PRD.

### Primary Navigation Areas

| Area | Purpose | Key Screens |
|------|---------|-------------|
| **Console** | Overview / current system state | Dashboard, health metrics, active experiments |
| **Autopilot** | ChangeSets + Proof + Guardrails | Recommendations, experiments, proof results |
| **Overrides** | Override Kernel config + resolution | Token registry, config editor, resolution trace |
| **Modules** | Module manager + Sandbox results | Install, enable/disable, sandbox reports |
| **Data Plane** | Events, funnels, attribution | Event explorer, funnel visualization, attribution |
| **Execution Plane** | Feature flags, workflows, jobs | Flag management, workflow editor, job monitor |
| **Audit** | Immutable logs | Timeline, event details, export |

### Navigation Structure

```
TRAFI
├── Console (Dashboard)
├── Autopilot
│   ├── Recommendations
│   ├── Active Experiments
│   ├── Proof Results
│   └── Guardrails Config
├── Overrides
│   ├── Token Registry
│   ├── Config Editor
│   └── Resolution Trace
├── Modules
│   ├── Installed
│   ├── Marketplace
│   └── Sandbox Reports
├── Data Plane
│   ├── Events
│   ├── Funnels
│   └── Attribution
├── Execution Plane
│   ├── Feature Flags
│   ├── Workflows
│   └── Jobs
└── Audit
    └── Timeline
```

---

## Component Strategy

### Design System Components (Shadcn UI + Brutal Wrappers)

Trafi leverages Shadcn UI as the foundation, wrapped in brutal primitives:

**Primitives:** BrutalButton, BrutalInput, BrutalSelect, BrutalCheckbox
**Layout:** BrutalCard, BrutalSheet, BrutalDialog, BrutalFrame
**Navigation:** BrutalTabs, BrutalBreadcrumb, BrutalSidebar
**Data Display:** BrutalTable, BrutalBadge, GuardrailBox
**Feedback:** BrutalToast, BrutalAlert, BrutalTooltip

**Rule:** Devs never use raw Shadcn — always use Brutal wrappers.

### Custom Components

#### Dashboard Components

| Component | Purpose | States | Priority |
|-----------|---------|--------|----------|
| **RecommendationCard** | Profit Engine recommendation with approve/reject | new, viewed, running, completed, rolled-back | Critical |
| **FunnelVisualization** | Checkout funnel with drop-off visualization | loading, empty, normal, highlighted | Critical |
| **ConfidenceMeter** | Statistical significance in visual format | low, medium, high | Critical |
| **MetricCard** | Bento grid metric display | loading, normal, positive, negative, alert | Critical |
| **StatusBadge** | Consistent status indicator | pending, running, success, error, info | Critical |
| **GuardrailsAlert** | Margin protection warning | warning, blocked | High |
| **BentoGrid** | Responsive grid container for metrics | - | Critical |
| **RecoveryTimeline** | Email sequence visualization | pending, sent, opened, clicked, converted | Medium |

#### Storefront Components

| Component | Purpose | States | Priority |
|-----------|---------|--------|----------|
| **CartSlideOver** | Non-blocking cart panel | empty, has-items, updating, error | Critical |
| **ExpressCheckout** | Apple Pay/Google Pay section | available, loading, processing, success, error | Critical |
| **ProductCard** | Product display in grids | default, hover, out-of-stock, on-sale | Critical |
| **ShippingEstimate** | Early shipping cost display | loading, calculated, free, unavailable | High |

#### CLI Components

| Component | Purpose | Library |
|-----------|---------|---------|
| **ProgressIndicator** | Scaffolding progress | ora + cli-progress |
| **WizardPrompt** | Interactive selection | inquirer/prompts |

### Component Implementation Strategy

**Foundation Layer:**
- Use Shadcn UI components directly for all standard UI needs
- Leverage built-in accessibility and keyboard navigation
- Apply Trafi theme tokens via CSS variables

**Composition Layer:**
- Build custom components by composing Shadcn primitives
- Use class-variance-authority (CVA) for variant management
- Follow Shadcn prop conventions (variant, size, disabled, etc.)

**Token Inheritance:**
- All custom components inherit from Tailwind/Shadcn tokens
- Colors: `--primary`, `--background`, `--foreground`, etc.
- Spacing: Tailwind scale (4px base)
- Border radius: `--radius-sm/md/lg/xl`

**Accessibility Standards:**
- All components meet WCAG 2.1 AA
- Keyboard navigation for all interactive elements
- ARIA labels and roles properly implemented
- Focus management for modals and overlays

### Implementation Roadmap

**Phase 1: MVP Core (Sprint 1-2)**
- BrutalButton, BrutalCard, BrutalTable (Foundation)
- BrutalBadge, GuardrailBox (Status + Safety)

**Phase 2: Autopilot (Sprint 3-4)**
- ChangeSetCard, ChangeSetDetail (Recommendation flow)
- ProofMeter, RollbackStatus (Measurement visualization)

**Phase 3: Overrides & Modules (Sprint 5-6)**
- TokenRegistry, ResolutionTrace (Override Kernel)
- SandboxReport, ModuleCard (Module system)

**Phase 4: Enhancement (P1)**
- CommandPalette for power user navigation
- AuditTimeline for immutable logs
- Enhanced BrutalTable with filtering

---

