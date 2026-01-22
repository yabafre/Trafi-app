---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - '_bmad-output/planning-artifacts/product-brief-trafi-app-2026-01-09.md'
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
  - '_bmad-output/project-context.md'
workflowType: 'architecture'
project_name: 'trafi-app'
user_name: 'Alex'
date: '2026-01-11'
lastStep: 8
status: 'complete'
completedAt: '2026-01-11'
revisedAt: '2026-01-14'
revisionNotes: |
  Update v1 (2026-01-14) - PRD v2 Alignment:
  - Added 3 Planes Architecture (Data/Decision/Execution)
  - Added Autopilot ChangeSet executable artifact specification
  - Enhanced Override Kernel with runtime resolution details
  - Added Module Sandbox security architecture
  - Added Development Rules from Epic 1 retrospective
  - Added Non-Negotiables enforcement patterns
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

---

## Document Structure

This architecture document has been split into focused sections:

| Section | Description | File |
|---------|-------------|------|
| 1. Context & Foundation | Project context, template evaluation, fundamental rules, 3 Planes intro | [01-context-foundation.md](./architecture/01-context-foundation.md) |
| 2. ChangeSet & Data Model | Autopilot ChangeSet specification, Data Model reference | [02-changeset-datamodel.md](./architecture/02-changeset-datamodel.md) |
| 3. Kernel & Sandbox | Override Kernel runtime resolution, Module Sandbox security | [03-kernel-sandbox.md](./architecture/03-kernel-sandbox.md) |
| 4. Dev Rules & Decisions | Development rules (Epic 1 retrospective), Core architectural decisions | [04-dev-rules-decisions.md](./architecture/04-dev-rules-decisions.md) |
| 5. Implementation Patterns | Implementation patterns, consistency rules, UX Design System | [05-implementation-patterns.md](./architecture/05-implementation-patterns.md) |
| 6. Structure & Boundaries | Project structure, module boundaries | [06-structure-boundaries.md](./architecture/06-structure-boundaries.md) |
| 7. Phase 2 & Validation | P2 features (Vendor, B2B, ERP), Architecture validation | [07-phase2-validation.md](./architecture/07-phase2-validation.md) |

---

## Quick Reference

### 3 Planes Architecture
- **Data Plane:** Prisma models, tenant isolation, soft-delete
- **Decision Plane:** Business logic, Override Kernel, Module Sandbox
- **Execution Plane:** API endpoints, WebSocket, background jobs

### Key Concepts
- **Autopilot ChangeSet:** Executable artifacts for automated operations
- **Override Kernel:** Runtime resolution system for customizations
- **Module Sandbox:** Security architecture for isolated modules
- **Non-Negotiables:** Enforced security and consistency patterns

### Technology Stack
- **Backend:** NestJS + Prisma + PostgreSQL (Neon)
- **Frontend:** Next.js 15 + Tailwind + Shadcn/UI
- **Monorepo:** Turborepo + pnpm workspaces
