## Responsive Design & Accessibility

### Responsive Strategy

Trafi implements a dual-strategy approach based on surface context:

#### Dashboard Strategy (Desktop-First)

The Dashboard is optimized for productivity on larger screens, then made functional on smaller ones:

| Screen Size | Layout | Navigation | Information Density |
|-------------|--------|------------|---------------------|
| **Desktop (1280px+)** | Rail + Sidebar + Main + Optional Panel | Full navigation visible | Maximum - Bento grid, data tables |
| **Large Tablet (1024-1279px)** | Collapsed Rail + Main | Sidebar on demand | High - Simplified bento grid |
| **Small Tablet (768-1023px)** | Bottom nav + Full main | Hamburger menu | Medium - Stacked cards |
| **Mobile (< 768px)** | Full screen main | Bottom navigation bar | Minimal - Single column |

**Desktop-Specific Features:**
- Multi-panel views (list + detail simultaneously)
- Keyboard shortcuts (Cmd/Ctrl + K)
- Hover states with rich tooltips
- Drag-and-drop interactions

**Mobile Adaptations:**
- Touch-optimized targets (48px minimum)
- Swipe gestures for navigation
- Collapsible sections for data density
- Bottom sheet modals

#### Storefront Strategy (Mobile-First)

The Storefront is designed for thumbs first, then enhanced for larger screens:

| Screen Size | Layout | Navigation | Checkout Flow |
|-------------|--------|------------|---------------|
| **Mobile (< 768px)** | Single column | Floating header + hamburger | Full-screen steps |
| **Tablet (768-1023px)** | 2-column grid | Full nav links | Side cart panel |
| **Desktop (1024px+)** | Bento grid (3-4 cols) | Full nav + mega menu | Slide-over cart |

**Mobile-Specific Features:**
- Apple Pay / Google Pay above fold
- Sticky add-to-cart button
- Swipe image galleries
- Bottom sheet filters

**Desktop Enhancements:**
- Product quick-view modals
- Hover zoom on images
- Multi-column checkout form
- Persistent mini-cart

### Breakpoint Strategy

**Tailwind-Aligned Breakpoints:**

| Breakpoint | Width | Target Devices |
|------------|-------|----------------|
| `sm` | 640px | Large phones (landscape) |
| `md` | 768px | Tablets (portrait) |
| `lg` | 1024px | Tablets (landscape), small laptops |
| `xl` | 1280px | Laptops, desktops |
| `2xl` | 1536px | Large monitors |

**Critical Breakpoint Behaviors:**

| Component | Mobile (< 768px) | Tablet (768-1023px) | Desktop (1024px+) |
|-----------|------------------|---------------------|-------------------|
| **Dashboard Navigation** | Bottom bar | Rail only | Rail + Sidebar |
| **Storefront Header** | Hamburger menu | Full nav | Full nav + search |
| **Product Grid** | 1 column | 2 columns | 3-4 columns |
| **Cart** | Full-screen page | Side panel | Slide-over |
| **Checkout Form** | Single column | Single column | Two columns |
| **Bento Grid** | Stacked | 2x2 grid | Full bento layout |

**Container Width Strategy:**
- Max content width: 1280px (xl breakpoint)
- Full-bleed allowed for: hero sections, banners
- Horizontal padding: 16px (mobile) → 24px (tablet) → 32px (desktop)

### Accessibility Strategy

**Target Compliance: WCAG 2.1 Level AA**

This level is required for:
- E-commerce legal compliance in most jurisdictions
- Broad user inclusivity without excessive implementation burden
- Industry-standard accessibility for commercial products

#### Color & Contrast

| Element | Minimum Ratio | Trafi Implementation |
|---------|---------------|---------------------|
| Normal text (< 18px) | 4.5:1 | Verified: #FAFAFA on #0A0A0A = 19.5:1 |
| Large text (18px+) | 3:1 | Verified: #737373 on #0A0A0A = 5.5:1 |
| UI components | 3:1 | Orange accent tested on both modes |
| Focus indicators | 3:1 | 2px orange ring on all backgrounds |

**Color Independence:**
All status indicators include both color AND icon:
- Success: Green + checkmark
- Warning: Yellow + triangle
- Error: Red + X circle
- Info: Blue + info circle

#### Keyboard Navigation

**Dashboard:**
- All interactive elements focusable
- Logical tab order (left-to-right, top-to-bottom)
- Skip link to main content
- Arrow key navigation in menus and data tables
- Escape key closes all modals/overlays

**Storefront:**
- Full checkout completion via keyboard only
- Image galleries navigable with arrow keys
- Focus trapped in modals
- Skip to checkout button available

#### Screen Reader Support

**Semantic HTML:**
- Proper heading hierarchy (h1 → h6)
- Landmarks (header, nav, main, footer)
- Form labels associated with inputs
- Table headers for data tables

**ARIA Implementation:**
- `aria-label` for icon-only buttons
- `aria-expanded` for collapsible sections
- `aria-live` for dynamic content (toasts, status updates)
- `aria-describedby` for form validation errors
- `role="status"` for Profit Engine updates

#### Touch & Motor Accessibility

| Requirement | Minimum | Trafi Standard |
|-------------|---------|----------------|
| Touch target size | 44x44px | 48x48px (12px padding) |
| Touch target spacing | 8px | 12px minimum |
| Gesture alternatives | Required | All swipes have tap alternatives |
| Timeout extensions | 20 seconds | Auto-save, no timeouts |

#### Motion & Animation

- All animations respect `prefers-reduced-motion`
- Reduced motion alternative: instant state changes, no movement
- No auto-playing video with sound
- No flashing content (seizure prevention)
- Carousel auto-scroll disabled by default

### Testing Strategy

#### Automated Testing

| Tool | Purpose | When |
|------|---------|------|
| **axe-core** | Accessibility violations | CI/CD on every PR |
| **Lighthouse** | Performance + a11y scoring | Weekly audits |
| **pa11y** | WCAG compliance checks | Pre-release |
| **eslint-plugin-jsx-a11y** | Code-time a11y linting | Development |

#### Manual Testing Checklist

**Responsive Testing:**
- [ ] Chrome DevTools device emulation
- [ ] Real iPhone (Safari) testing
- [ ] Real Android (Chrome) testing
- [ ] iPad portrait and landscape
- [ ] Desktop at 100%, 125%, 150% zoom

**Accessibility Testing:**
- [ ] Keyboard-only navigation (all flows)
- [ ] VoiceOver on macOS/iOS
- [ ] NVDA on Windows
- [ ] High contrast mode
- [ ] Color blindness simulation (Colorblindly extension)
- [ ] Screen magnification (200%)

#### User Testing

**Include in testing pool:**
- Users who rely on screen readers
- Users with motor impairments
- Users with color vision deficiency
- Users on low-bandwidth connections
- Users on older devices

### Implementation Guidelines

#### Responsive Development

**CSS Best Practices:**
- Mobile-first media queries: `@media (min-width: 768px)`
- Use Tailwind responsive prefixes: `md:`, `lg:`, `xl:`
- Relative units: `rem` for typography, `%` or `vw` for widths
- Fluid typography: `clamp(1rem, 2.5vw, 1.5rem)`

**Image Optimization:**
- Responsive images with `srcset` and `sizes`
- WebP format with JPEG fallback
- Lazy loading for below-fold images
- Skeleton placeholders during load

**Touch Optimization:**
- `touch-action: manipulation` to remove 300ms delay
- Larger hit areas with padding, not just visible element
- Swipe gesture handlers with touch libraries

#### Accessibility Development

**HTML Requirements:**
- Semantic elements: `<nav>`, `<main>`, `<article>`, `<aside>`
- Heading hierarchy without skipping levels
- `<button>` for actions, `<a>` for navigation
- Form inputs with associated `<label>`

**Focus Management:**
- Visible focus ring on all interactive elements
- Focus order matches visual order
- Modal focus trapping with `inert` attribute
- Return focus to trigger on modal close

**Dynamic Content:**
- `aria-live="polite"` for non-urgent updates
- `aria-live="assertive"` for errors only
- Announce page title changes to screen readers
- Provide loading states for async content

**Testing Hooks:**
- `data-testid` attributes for automated testing
- Consistent naming convention: `data-testid="component-action"`

---

## 8. Implementation Stack & Guidelines

### Reference Implementation

**CSS Theme File:** `_bmad-output/planning-artifacts/ux-design-vision.tsx`

This file contains the complete Tailwind CSS 4.x configuration with:
- CSS variables for all colors (light + dark mode)
- Brutalist utility classes (`.brutal-border`, `.text-mono`, `.bg-acid`, etc.)
- Typography base styles (Space Grotesk + JetBrains Mono)
- Component base styles (buttons, badges, cards, tables, inputs)
- Grid layout patterns (`.brutalist-grid`)

**Import this file in your global CSS to apply the brutalist theme.**

### Core Libraries (Mandatory)

| Library | Purpose | Usage |
|---------|---------|-------|
| **Shadcn UI** | Component primitives | Wrapped in Brutal* components, radius-zero enforced |
| **Tailwind CSS 4.x** | Styling | With brutalist utility classes from `ux-design-vision.tsx` |
| **GSAP** | Micro-interactions | Instant feedback, panel slides, data updates |
| **Framer Motion** | Page transitions | Layout animations, presence animations |
| **Lenis JS** | Smooth scroll | Storefront scroll experience |

### Brutalist Tailwind Configuration

```css
@layer base {
  * {
    @apply border-border;
    border-radius: 0 !important; /* Enforce radius-zero */
  }

  /* Remove all transitions by default */
  * {
    transition: none !important;
  }

  /* Allow only color transitions for specific elements */
  button,
  [role="button"],
  .hover-transition {
    transition: background-color 0s linear, color 0s linear, border-color 0s linear !important;
  }
}
```

### Brutalist Utility Classes

```css
@layer utilities {
  .brutal-border {
    border: 1px solid var(--border);
  }

  .text-mono {
    font-family: 'JetBrains Mono', monospace;
  }

  .bg-acid {
    background-color: #CCFF00;
  }

  .text-acid {
    color: #CCFF00;
  }

  .bg-success-acid {
    background-color: #00FF94;
  }

  .bg-warning-neon {
    background-color: #FF3366;
  }

  .radius-0 {
    border-radius: 0px !important;
  }

  .grid-brutalist {
    display: grid;
    gap: 0;
  }

  .grid-brutalist > * {
    border-right: 1px solid #333;
    border-bottom: 1px solid #333;
  }

  .tracking-widest-plus {
    letter-spacing: 0.1em;
  }

  .tracking-tight-plus {
    letter-spacing: -0.02em;
  }
}
```

### Component Wrapper Strategy

Create thin wrappers that hard-lock the spec:

```typescript
// components/brutal/BrutalButton.tsx
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BrutalButton({ className, ...props }) {
  return (
    <Button
      className={cn(
        "rounded-none uppercase font-bold tracking-widest",
        "border border-white bg-white text-black",
        "hover:bg-acid hover:text-black hover:border-acid",
        "transition-none",
        className
      )}
      {...props}
    />
  );
}
```

**Rule:** Devs never style from scratch on product pages. Always use Brutal* wrappers.

---

## 9. Copy & Tone Guidelines

### Voice Characteristics

- **Robotic** — Precise, not warm
- **Confident** — Certain, not tentative
- **Technical** — Data-driven, not emotional

### Language Rules

| Instead of... | Write... |
|---------------|----------|
| "Try this optimization" | `DEPLOY OPTIMIZATION` |
| "This might help" | `NETWORK CONFIRMED` |
| "Would you like to..." | `APPROVE & DEPLOY` |
| "We think..." | `ANALYSIS COMPLETE` |
| "It looks like..." | `DETECTED:` |
| "Something went wrong" | `ERROR: [specific error]` |

### Copy Examples

**Status Messages:**
- `SURVEILLANCE ACTIVE`
- `PROOF WINDOW: 14D`
- `HOLDOUT: 10%`
- `AUTO-ROLLBACK: ARMED`
- `DEVIATION > 5% = AUTO-KILL`

**Action Labels:**
- `APPROVE & DEPLOY`
- `ROLL BACK NOW`
- `PROMOTE TO PERMANENT`
- `VALIDATE`
- `DISMISS`

**Metrics:**
- `+12.4% CONVERSION`
- `€4,231 REVENUE IMPACT`
- `1,247 VISITORS PROTECTED`
- `< 30s ROLLBACK TIME`

### Forbidden Words

Never use in UI copy:
- "Maybe", "might", "perhaps"
- "Try", "attempt"
- "We think", "we believe"
- "Sorry", "oops"
- Emojis (except status icons: 🛡, 🚨, ✓, ✗)

---

## 10. Definition of Done (UX)

A feature is "done" only if:

### Visual Compliance

- [ ] Uses brutal primitives (radius-zero, borders, no shadows)
- [ ] Has visible grid structure
- [ ] Uses monospace for all numbers and data
- [ ] Follows color palette (void + acid signals)
- [ ] Typography matches spec (Space Grotesk + JetBrains Mono)

### Interaction Compliance

- [ ] Hover states are instant (no slow transitions)
- [ ] Focus states use acid outline (2px)
- [ ] Touch targets are minimum 48px

### Data Compliance

- [ ] All numbers are monospace
- [ ] All dates are ISO format or relative ("4 days ago")
- [ ] All metrics show trend indicators

### State Management

- [ ] Has explicit status badge if it changes system state
- [ ] Has guardrails displayed if it can affect profit/checkout
- [ ] Has audit trail if action is recorded

### Accessibility

- [ ] Keyboard navigable
- [ ] ARIA labels on interactive elements
- [ ] Color-independent status indicators (icon + color)

---

## Appendix A — Status Glossary

| Status | Definition | Badge Color |
|--------|------------|-------------|
| `DRAFT` | Exists, not ready for review | Neutral (grey) |
| `PENDING_APPROVAL` | Waiting human sign-off | Acid (lime) |
| `ACTIVE` | Deployed to live traffic | Acid (lime) |
| `MEASURING` | Collecting proof window data | Acid (lime) |
| `PROVEN` | Meets proof plan threshold | Success (green) |
| `ROLLED_BACK` | Reverted (auto or manual) | Risk (neon red) |
| `PERMANENT` | Promoted to default behavior | Success (green) |
| `REJECTED` | Human declined | Neutral (grey) |
| `EXPIRED` | Approval window closed | Neutral (grey) |
| `BLOCKED` | Guardrails prevented execution | Risk (neon red) |

