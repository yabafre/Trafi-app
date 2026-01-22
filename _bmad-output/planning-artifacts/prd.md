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

---

## Document Structure

This PRD has been split into focused sections for easier navigation:

| Section | Description | File |
|---------|-------------|------|
| 1. Overview | Executive Summary, Project Classification | [01-overview.md](./prd/01-overview.md) |
| 2. Success & Scope | Success Criteria, Product Scope | [02-success-scope.md](./prd/02-success-scope.md) |
| 3. User Journeys | User Journeys, Innovation & Novel Patterns | [03-user-journeys.md](./prd/03-user-journeys.md) |
| 4. SaaS Requirements | SaaS B2B Requirements, Project Scoping & Phased Development | [04-saas-requirements.md](./prd/04-saas-requirements.md) |
| 5. Functional Requirements | All FR specifications | [05-functional-requirements.md](./prd/05-functional-requirements.md) |
| 6. NFR & Standards | Non-Functional Requirements, Development Rules & Standards | [06-nfr-standards.md](./prd/06-nfr-standards.md) |

---

## Quick Reference

### Product Vision
Trafi Autopilot OS - A multi-tenant e-commerce platform with merchant self-service capabilities.

### Key Concepts
- **3 Planes Architecture:** Data / Decision / Execution
- **Autopilot ChangeSet:** Executable artifacts for automated operations
- **Override Kernel:** Runtime resolution for customizations
- **Module Sandbox:** Security architecture for isolated modules

### User Personas
- **Alex (Merchant):** Store owner managing products and orders
- **Emma (Buyer):** End customer shopping and purchasing
- **Admin:** Platform administrator

### Phase 1 Priorities (MVP)
- P0: Mandatory for launch
- P1: Expected for competitive product
- P2: Nice-to-have, post-MVP

### FRs Covered by Epic
| Epic | FRs |
|------|-----|
| Epic 1 | Foundation |
| Epic 2 | Admin Auth |
| Epic 3 | FR10, FR11, FR12, FR20 (Product Catalog) |
| Epic 4 | FR13, FR14, FR15, FR16, FR17, FR21, FR22 (Cart & Checkout) |
