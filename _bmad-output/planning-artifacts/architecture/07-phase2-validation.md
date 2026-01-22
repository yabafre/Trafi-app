## Vendor/Marketplace (P2)
**Implementation Trigger:** Business model pivot OR 5+ merchant requests
**Stripe Connect required for payouts**

## B2B Features (P2)
**Implementation Trigger:** 3+ paying customers requesting B2B
**Priority:** Price Lists → Customer Groups → Net Terms → Quotes (P3)

## ERP Integration (P2)
**Implementation Trigger:** Enterprise customer with budget
**Priority:** Webhooks + CSV → Odoo connector → SAP connector
```

### Integration Points

| External Service | Purpose | Module | Connection Type |
|-----------------|---------|--------|-----------------|
| **Stripe** | Payments | `payment/providers/stripe` | SDK |
| **Stripe Connect** | Marketplace payouts (P2) | `_future/vendor` | SDK |
| **Resend** | Transactional email | `notification/providers/resend` | API |
| **S3/R2** | Media storage | `common/storage` | SDK |
| **Redis** | Cache + BullMQ | `common/redis` | Client |
| **PostgreSQL** | Per-tenant data | `apps/api` (Prisma is API-only) | Prisma |

### Data Flow Complete

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Storefront │     │  Dashboard  │     │  External   │
│  (Next.js)  │     │  (Next.js)  │     │  (SDK)      │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │ REST/SDK          │ Zsa→tRPC         │ REST/SDK
       ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────┐
│                     API (NestJS)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ REST Layer  │  │ tRPC Layer  │  │ WS Gateway  │     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
│         └────────────────┼────────────────┘             │
│                          ▼                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Service Layer                        │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐ │  │
│  │  │Commerce │ │ Profit  │ │ Module  │ │  P1:   │ │  │
│  │  │ Cores   │ │ Engine  │ │ System  │ │  Org   │ │  │
│  │  │         │ │         │ │         │ │ i18n   │ │  │
│  │  │         │ │         │ │         │ │Channel │ │  │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └───┬────┘ │  │
│  └───────┼───────────┼───────────┼──────────┼───────┘  │
│          └───────────┼───────────┴──────────┘          │
│                      ▼                                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Data Layer (Prisma)                  │  │
│  │  Tenant Resolution → Per-Tenant DB Connection    │  │
│  └──────────────────────┬───────────────────────────┘  │
└─────────────────────────┼───────────────────────────────┘
                          ▼
┌───────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE                          │
├───────────────────────────────────────────────────────────┤
│  PostgreSQL (per-tenant)  │  Redis (cache + BullMQ)       │
│  PostgreSQL (management)  │  S3/R2 (media)                │
└───────────────────────────────────────────────────────────┘
```

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All technology choices work together without conflicts. NestJS + tRPC + Prisma + Next.js + Zsa form a cohesive stack with native integrations. Version compatibility verified (Prisma 7, Next.js 15, TypeScript 5.x).

**Pattern Consistency:**
Implementation patterns fully support architectural decisions. Naming conventions consistent across database (PascalCase), API (kebab-case), and code (camelCase). Local/global `_` prefix convention provides clear structure.

**Structure Alignment:**
Project structure supports all architectural decisions. Clear API/Internal/Service/Data boundaries. P1 modules properly structured, P2 modules documented in `_future/`.

### Requirements Coverage Validation ✅

**Functional Requirements Coverage:**
All 104 FRs across 9 commerce domains have dedicated modules:
- Commerce Cores (9 modules): Product, Customer, Cart, Checkout, Payment, Order, Inventory, Tax, Fulfillment
- Profit Engine (4 sub-modules): Collector, Doctor, Recovery, Guardrails
- Platform (5 modules): Auth, Tenant, Jobs, Webhooks, Plugins

**Non-Functional Requirements Coverage:**
- Performance: Redis caching, optimized data flow, PostgreSQL indexing
- Availability: Docker-ready, health checks, graceful degradation
- Scalability: DB-per-tenant, connection pooling, horizontal scaling
- Security: JWT auth, RBAC guards, tenant isolation, PCI SAQ-A via Stripe
- Compliance: Audit logging, GDPR support, 2-year retention

**P1 Extensions Planned:**
- Multi-Store: Organization → Store → Channel hierarchy
- i18n: JSONB translation pattern with fallback chain
- Multi-Channel: Web, Mobile, POS base architecture

### Implementation Readiness Validation ✅

**Decision Completeness:**
- All critical decisions documented with specific versions
- Technology rationale clearly explained
- Migration paths defined (MVP → P1 upgrades)

**Structure Completeness:**
- Complete project tree with 50+ directories/files specified
- Every FR mapped to specific module location
- Dashboard routes mapped to API modules

**Pattern Completeness:**
- 12 conflict points standardized
- Comprehensive naming conventions with examples
- Anti-patterns documented to prevent mistakes

### Gap Analysis Results

**Critical Gaps:** None identified

**Important Gaps (Minor):**
1. Trafi Builder module implicit in Dashboard - will be defined in Epic
2. SDK development workflow - to be detailed in SDK stories
3. Plugin sandbox runtime details - to be specified in Plugins epic

**Nice-to-Have (Deferred):**
- Cross-tenant data migration tooling
- Advanced debugging workflow documentation

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed (104 FRs, NFRs documented)
- [x] Scale and complexity assessed (High - 15-20 services)
- [x] Technical constraints identified (7 major constraints)
- [x] Cross-cutting concerns mapped (7 concerns addressed)

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined (tRPC internal, REST external)
- [x] Performance considerations addressed (caching, pooling)

**✅ Implementation Patterns**
- [x] Naming conventions established (12 categories)
- [x] Structure patterns defined (local/global, shared types)
- [x] Communication patterns specified (events, tRPC, actions)
- [x] Process patterns documented (errors, loading, mutations)

**✅ Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established (4 layers)
- [x] Integration points mapped (6 external services)
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION ✅

**Confidence Level:** HIGH

**Key Strengths:**
- Complete technology stack alignment with PRD requirements
- Clear type sharing strategy prevents duplication
- Local/global convention prevents AI agent conflicts
- Multi-store architecture future-proofed for P1
- Frontend-DB isolation rule enforced architecturally

**Areas for Future Enhancement:**
- Plugin sandbox isolation details (P1)
- SDK developer experience improvements (P1)
- Advanced monitoring dashboards (P1)

### Implementation Handoff

**AI Agent Guidelines:**
1. Follow all architectural decisions exactly as documented
2. Use implementation patterns consistently across all components
3. Respect project structure and boundaries
4. Import types from `@trafi/validators` and `@trafi/types` only
5. Never import `apps/api` (Prisma is API-only) in frontend apps
6. Query Context7 MCP before implementing with any library
7. Use `_` prefix for route-local components, hooks, actions

**First Implementation Priority:**
```bash
# 1. Initialize Turborepo structure
npx create-turbo@latest trafi --package-manager pnpm

# 2. Add NestJS API
cd apps && npx @nestjs/cli@latest new api --strict --skip-git

# 3. Add Next.js Dashboard with Shadcn
npx create-next-app@latest dashboard --typescript --tailwind --app --src-dir
cd dashboard && npx shadcn@latest init

# 4. Initialize shared packages
mkdir -p packages/@trafi/{validators,types,db,config}
```

## Architecture Completion Summary

### Workflow Completion

**Architecture Decision Workflow:** COMPLETED ✅
**Total Steps Completed:** 8
**Date Completed:** 2026-01-11
**Document Location:** `_bmad-output/planning-artifacts/architecture.md`

### Final Architecture Deliverables

**Complete Architecture Document**
- All architectural decisions documented with specific versions
- Implementation patterns ensuring AI agent consistency
- Complete project structure with all files and directories
- Requirements to architecture mapping
- Validation confirming coherence and completeness

**Implementation Ready Foundation**
- 25+ architectural decisions made
- 12 implementation pattern categories defined
- 20+ architectural components specified
- 104 functional requirements fully supported

**AI Agent Implementation Guide**
- Technology stack with verified versions
- Consistency rules that prevent implementation conflicts
- Project structure with clear boundaries
- Integration patterns and communication standards

### Implementation Handoff

**For AI Agents:**
This architecture document is your complete guide for implementing trafi-app. Follow all decisions, patterns, and structures exactly as documented.

**Development Sequence:**
1. Initialize project using documented starter template commands
2. Set up development environment per architecture
3. Implement core architectural foundations (Prisma schema, NestJS modules, tRPC routers)
4. Build features following established patterns
5. Maintain consistency with documented rules

### Quality Assurance Checklist

**✅ Architecture Coherence**
- [x] All decisions work together without conflicts
- [x] Technology choices are compatible
- [x] Patterns support the architectural decisions
- [x] Structure aligns with all choices

**✅ Requirements Coverage**
- [x] All 104 functional requirements are supported
- [x] All non-functional requirements are addressed
- [x] Cross-cutting concerns are handled
- [x] Integration points are defined

**✅ Implementation Readiness**
- [x] Decisions are specific and actionable
- [x] Patterns prevent agent conflicts
- [x] Structure is complete and unambiguous
- [x] Examples are provided for clarity

### Project Success Factors

**Clear Decision Framework**
Every technology choice was made collaboratively with clear rationale, ensuring all stakeholders understand the architectural direction.

**Consistency Guarantee**
Implementation patterns and rules ensure that multiple AI agents will produce compatible, consistent code that works together seamlessly.

**Complete Coverage**
All project requirements are architecturally supported, with clear mapping from business needs to technical implementation.

**Solid Foundation**
The chosen Turborepo + NestJS + Next.js architecture provides a production-ready foundation following current best practices.

---

**Architecture Status:** READY FOR IMPLEMENTATION ✅

**Next Phase:** Begin implementation using the architectural decisions and patterns documented herein.

**Document Maintenance:** Update this architecture when major technical decisions are made during implementation.

