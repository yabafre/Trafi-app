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

## Document Structure

This specification has been split into focused sections for easier navigation:

| Section | Description | File |
|---------|-------------|------|
| 1. Manifesto & Philosophy | Design goals, manifesto, core UX, emotional response | [01-manifesto-philosophy.md](./ux-design/01-manifesto-philosophy.md) |
| 2. Visual System | UX patterns, visual system physics | [02-visual-system.md](./ux-design/02-visual-system.md) |
| 3. Design Foundation | User experience definitions, visual design foundation, design direction | [03-design-foundation.md](./ux-design/03-design-foundation.md) |
| 4. UI Primitives | Core UI primitives and components | [04-ui-primitives.md](./ux-design/04-ui-primitives.md) |
| 5. UX Flows | Product-level UX architecture, key UX flows aligned to PRD | [05-ux-flows.md](./ux-design/05-ux-flows.md) |
| 6. Implementation | Responsive design, accessibility, implementation stack, copy guidelines, DoD | [06-implementation.md](./ux-design/06-implementation.md) |

---

## Quick Reference

### Design Principles
- **Radius-Zero:** Everything is a rectangle
- **High Contrast:** Black background, white text
- **Acid Accents:** Primary Acid Lime #CCFF00
- **Visible Grid:** 1px borders expose structure
- **No Shadows:** Elements sit firmly in the grid

### Color Palette
- Background: #000000
- Borders: #333333
- Text: #FFFFFF
- Primary: #CCFF00 (Acid Lime)
- Success: #00FF94
- Risk: #FF3366

### Typography
- JetBrains Mono for prices/quantities
- System font for body text
