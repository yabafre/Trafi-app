## SaaS B2B Specific Requirements

### Project-Type Overview

Trafi is a **SaaS B2B platform** serving two distinct customer segments through different deployment models:

| Model | Customer | Isolation | Infrastructure |
|-------|----------|-----------|----------------|
| **Self-Host** | Technical developers | Full (own infra) | Customer-managed |
| **Cloud Managed** | Merchants (SMB) | DB per tenant | Trafi-managed |
| **Cloud + Profit Engine** | Merchants (growth) | DB per tenant | Trafi-managed + premium |

### Technical Architecture Considerations

#### Tenant Model

**MVP Strategy: Database-per-Tenant**

| Aspect | Approach | Rationale |
|--------|----------|-----------|
| **Isolation** | Separate PostgreSQL database per store | Strong isolation, independent backups/restores, no cross-tenant leak risk |
| **Connection Management** | Connection pooling per tenant | PgBouncer or similar, pool per database |
| **Migrations** | Per-tenant migration orchestration | Schema versioning tracked per tenant |
| **Backups** | Independent backup schedules | Customer-specific retention, easy point-in-time recovery |

**Scale Path (Future):**
- Consider RLS (Row-Level Security) for high-volume entry-tier plans
- Hybrid approach: DB-per-tenant for Premium/Enterprise, RLS for mass-market SMB
- Decision trigger: When ops overhead of DB-per-tenant exceeds benefit (~thousands of tenants)

**Trade-offs Acknowledged:**
- Infra overhead: More databases = more connections, more ops
- Migration complexity: Must orchestrate across all tenant DBs
- Acceptable for: Hundreds of tenants (MVP through 18 months)

#### RBAC Matrix

**Authorization Model: Tenant-Scoped Roles**

```
User (global)
    |
Membership (user_id, tenant_id)
    |
RoleAssignment (membership_id, role_id)
    |
Permissions (role_id, permission_id)
```

**Key Principles:**
- Every authorization decision is tenant-aware ("admin in which store?")
- Same user can belong to multiple tenants with different roles
- Role assignments are always per-tenant, even with global role templates

**Role Template + Overrides Pattern:**

| Role Template | Default Permissions | Override Allowed |
|---------------|---------------------|------------------|
| **Owner** | Full access + billing + ownership transfer | No (fixed) |
| **Admin** | Store management, orders, catalog, users | Yes (permission-level) |
| **Operator** | Orders, fulfillment, customer service | Yes (permission-level) |
| **Viewer** | Read-only access to dashboard | Yes (scope-level) |
| **Risk Manager** | Fraud rules, chargeback handling | Yes (permission-level) |
| **Privacy Manager** | GDPR console, consent, data export | Yes (permission-level) |

**Audit Requirements:**
- All RBAC changes logged with timestamp, actor, and before/after state
- Role assignment changes require Owner or Admin approval
- Audit log retention: Minimum 2 years for compliance

#### Subscription Tiers

| Tier | Target | Features | Pricing Model |
|------|--------|----------|---------------|
| **Self-Host (Free)** | Developers, agencies | Core commerce + SDK/CLI + templates | Free (OSS) |
| **Cloud Managed** | SMB merchants | Hosting + backups + scaling + monitoring | Flat monthly per store |
| **Cloud + Profit Engine** | Growth merchants | + Conversion Autopilot + First-Party Ledger + uplift reporting | Premium monthly per store |
| **Enterprise** (Future) | Mid-market | + Custom SLAs + SSO + dedicated support + audit logs | Custom contract |

**Tier Transitions:**
- Self-Host -> Cloud Managed: Migration wizard (catalog import, DNS setup)
- Cloud Managed -> Cloud + Profit Engine: Feature unlock (no migration)
- Cloud -> Self-Host: Full data export, no lock-in (First-Party Ledger principle)

**Usage-Based Components:**
- Base subscription (fixed per store)
- GMV-based component (optional, for high-volume stores)
- Add-ons (extra storage, additional users, premium support)

#### Integration List

**Plugin Architecture:**

| Category | MVP Plugins | Extension Pattern |
|----------|-------------|-------------------|
| **Payments** | Stripe (reference) | `PaymentPlugin` interface, provider-agnostic |
| **Shipping** | Manual rates | `ShippingPlugin` interface, carrier SDKs |
| **Email** | SMTP/Resend | `NotificationPlugin` interface |
| **Analytics** | Internal events | `AnalyticsPlugin` interface |

**API Integration Patterns:**

| Interface | Protocol | Use Case |
|-----------|----------|----------|
| **REST API** | HTTP/JSON | External: SDK, partners, 3PLs |
| **tRPC** | TypeScript RPC | Internal: Dashboard <-> API |
| **Webhooks** | HTTP callbacks | Events: order.created, payment.completed |
| **GraphQL** | Query language | Future (P1): Flexible storefront queries |

**Versioning Strategy:**

| Surface | Strategy | Example |
|---------|----------|---------|
| **Public REST API** | URL path versioning | `/v1/orders`, `/v2/orders` |
| **SDK** | SemVer | `@trafi/client@2.3.0` |
| **Compatibility** | Explicit mapping | "SDK v2.x supports API v1" |
| **Deprecation** | 90-day window | Breaking changes announced, migration guide provided |

**Webhook Delivery:**
- At-least-once delivery with retry (exponential backoff)
- Signature verification (HMAC-SHA256)
- Event log with replay capability
- Configurable per tenant (endpoints, events subscribed)

#### Compliance Requirements

**GDPR Compliance:**

| Requirement | Implementation |
|-------------|----------------|
| **Data Access (Art. 15)** | Privacy Console: search by email, export JSON + PDF |
| **Data Portability (Art. 20)** | Machine-readable export of all customer data |
| **Right to Erasure (Art. 17)** | Anonymization workflow with legal retention exceptions |
| **Consent Management** | First-Party Ledger: per-category consent tracking |
| **Audit Trail** | All data operations logged with timestamp and actor |

**PCI DSS:**
- Delegated to Stripe (SAQ-A eligible)
- No card data touches Trafi servers
- Stripe.js for client-side tokenization

**Data Residency:**
- Cloud Managed: EU region by default (GDPR alignment)
- Future: Region selection (EU, US, APAC) for compliance needs

### Implementation Considerations

#### Multi-Store Management

**Account Hierarchy:**
```
Organization (billing entity)
    |
Store 1 (tenant, own DB)
Store 2 (tenant, own DB)
Store 3 (tenant, own DB)
```

**Cross-Store Features:**
- Consolidated billing at Organization level
- User can have roles in multiple stores
- Store-level data isolation (no cross-store queries by default)
- Org-level reports (aggregate GMV, revenue, usage)

#### Onboarding Flows

| User Type | Onboarding Path |
|-----------|-----------------|
| **Developer (Self-Host)** | `npx create-trafi-app` -> local dev -> deploy to own infra |
| **Developer (Client Project)** | CLI -> configure -> Cloud Managed signup for client |
| **Merchant (Direct)** | Cloud signup -> migration wizard -> Stripe connect -> live |
| **Agency (Multi-Client)** | Organization setup -> add stores -> assign client access |

#### Security Considerations

| Layer | Measure |
|-------|---------|
| **Authentication** | Session-based (dashboard), API keys (SDK), JWT (mobile future) |
| **Authorization** | Tenant-scoped RBAC, permission checks on every request |
| **Data Isolation** | DB-per-tenant, no shared tables for customer data |
| **Secrets Management** | Environment variables, encrypted at rest, rotatable |
| **Audit Logging** | All sensitive operations logged, tamper-evident |

#### Operational Requirements

| Aspect | Requirement |
|--------|-------------|
| **Monitoring** | Per-tenant metrics, SLO dashboards, alerting |
| **Logging** | Centralized logs, tenant-tagged, 30-day retention |
| **Backups** | Per-tenant daily backups, 30-day retention, tested restores |
| **Scaling** | Horizontal scaling for API, vertical for individual tenant DBs |
| **Disaster Recovery** | RTO: 4 hours, RPO: 1 hour for Cloud Managed |

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Platform MVP + Revenue MVP hybride
- Build the core platform foundation while generating early revenue via Cloud Managed
- The Profit Engine is the differentiator, but the commerce platform is the baseline value

**MVP Essence:**
- The minimum for Thomas to say "I can deliver a client project with this"
- The minimum for Sophie to say "My store works and I see recommendations"

**The MVP Game Changer: Reversible Experimentation Engine**

The true differentiator in MVP is not just "abandoned cart recovery" — it's the **reversible experimentation pipeline** that makes optimization safe for small teams:

| Component | What It Does | Why It's the Game Changer |
|-----------|--------------|---------------------------|
| **Feature Flags** | Toggle optimizations on/off per cohort | Safe A/B testing without code deploys |
| **Holdout Groups** | Control groups for statistical comparison | Proves causation, not just correlation |
| **Auto-Rollback** | Revert changes when metrics decline | Removes risk from experimentation |
| **Confidence Intervals** | Statistical significance measurement | Data-driven decisions, not gut feelings |

**Without this, Trafi is just another e-commerce platform. With this, it's an Autopilot OS.**

**Resource Requirements:**
- Core team capable of delivering monorepo architecture
- Focus on 9 commerce modules + Profit Engine basics

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**

| Journey | MVP Coverage | Notes |
|---------|--------------|-------|
| Thomas: Zero to Prod | Full | Core dev value proposition |
| Thomas: Upgrade | Deferred (v1.1) | Important but not Day 1 |
| Sophie: Onboarding | Full | Core merchant value proposition |
| Sophie: Margin Protection | Partial | Simple guardrails MVP, advanced P1 |
| Buyer: Checkout | Full | Without this, no business |
| Buyer: Recovery | Full | Profit Engine differentiator |
| Owner/Billing | Partial | Single-store MVP, multi-store P1 |
| Fraud/Risk | Deferred (P1) | Stripe Radar sufficient for MVP |
| Privacy/Consent | Partial | Basic GDPR MVP, full console P1 |
| Fulfillment Partner | Partial | Basic webhooks MVP |
| Ops: Incident | Full | Cloud Managed SLOs |
| Ops: Support | Partial | Basic support MVP |

**Must-Have Capabilities:**

| Category | MVP Scope |
|----------|-----------|
| Commerce Cores | 9 modules: Product, Customer, Cart, Checkout, Payment, Order, Inventory, Tax, User Access |
| Profit Engine | Checkout Doctor + Recovery Engine + Profit Guardrails (simple) + Partial rollback |
| DX | CLI create-trafi-app + Type-safe SDK + Dashboard + Next.js template |
| Cloud | Single-store, DB-per-tenant, basic monitoring |
| Plugins | Stripe (payment), Manual rates (shipping), SMTP (email) |

### Post-MVP Features

**Phase 2: Growth (P1, 3-6 months)**

| Feature | Value |
|---------|-------|
| First-Party Ledger | Consent management, identity unification, activation connectors |
| Multi-store | Organization + multi-store billing |
| Promotions | Discounts, coupons, bundles |
| Risk Dashboard | Pattern detection, rule configuration |
| GraphQL API | Flexible storefront queries |
| Additional templates | Remix, Astro |

**Phase 3: Expansion (P2, 6-12 months)**

| Feature | Value |
|---------|-------|
| Agentic Checkout Gateway | AI agent-optimized checkout API |
| Viral Demo Mode | Simulate impact on existing site before migration |
| Multi-region advanced | Multi-currency, multi-tax |
| Multi-warehouse | Fulfillment routing |

**Phase 4: Platform (v2, 12+ months)**

| Feature | Value |
|---------|-------|
| Trafi Builder | Integrated page builder |
| Module Marketplace | Dev-created modules, 15-30% commission |
| Enterprise | SSO, audit logs, custom SLAs |

### Risk Mitigation Strategy

**Technical Risks:**

| Risk | Mitigation |
|------|------------|
| Profit Engine doesn't prove uplift | CUPED + holdout design from Month 2, fallback to DX-only positioning |
| DB-per-tenant scaling | RLS ready as backup, trigger at ~1000 tenants |
| Checkout performance | Tiered SLOs, synthetic tests |

**Market Risks:**

| Risk | Mitigation |
|------|------------|
| Shopify copies the concept | Moat = proprietary data + OSS community |
| Medusa catches up on DX | Differentiator = integrated Profit Engine |
| SMBs don't understand value | Case studies Sophie/Marc, visible ROI in dashboard |

**Resource Risks:**

| Risk | Mitigation |
|------|------------|
| Team too small | Minimal MVP = commerce platform only, Profit Engine v1.1 |
| Timeline exceeded | Cut multi-store to P1, keep single-store MVP |

